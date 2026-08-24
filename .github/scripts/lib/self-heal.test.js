// Uses Node's built-in test runner (node:test) -- no new dependency added
// to package.json, consistent with this repo not having a test framework
// installed before now. Run with: node --test .github/scripts/lib/*.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeFingerprint,
  extractLocatorFromError,
  applyLocatorFix,
  healScriptFile,
  shouldAttemptHealing,
} = require('./self-heal');

function makeFailure(overrides = {}) {
  return {
    test_case_id: 'TC-1: Login',
    error: "Test timeout of 30000ms exceeded.\nError: locator.fill: Test timeout of 30000ms exceeded.\nCall log:\n  - waiting for getByLabel('Username')",
    stack: '',
    currentUrl: 'https://dev.example.com/login',
    pageTitle: '',
    attachments: [],
    ...overrides,
  };
}

function baseIo(overrides = {}) {
  let fileContent = "page.getByLabel('Username').fill(username);";
  return {
    getFileContent: () => fileContent,
    setFileContent: (content) => { fileContent = content; },
    readPageSnapshot: async () => 'textbox "Enter your email"',
    readScreenshotBase64: async () => null,
    lookupKb: async () => ({ found: false }),
    analyze: async () => ({ success: false }),
    runTests: async () => ({ tests: [] }),
    ...overrides,
  };
}

// --- Scenario 1 & 2 gating -------------------------------------------------

test('shouldAttemptHealing: off when disabled, even with failures', () => {
  assert.equal(shouldAttemptHealing(false, 5), false);
});

test('shouldAttemptHealing: off when nothing failed, even if enabled', () => {
  assert.equal(shouldAttemptHealing(true, 0), false);
});

test('shouldAttemptHealing: on only when enabled AND something failed', () => {
  assert.equal(shouldAttemptHealing(true, 1), true);
});

// --- Fingerprinting ---------------------------------------------------------

test('computeFingerprint is stable across whitespace/case differences', () => {
  const a = computeFingerprint('Login Step', "getByLabel('Username')");
  const b = computeFingerprint('  login   step  ', "GETBYLABEL('USERNAME')".toLowerCase());
  assert.equal(a, b);
});

test('computeFingerprint differs for genuinely different failures', () => {
  const a = computeFingerprint('login step', "getByLabel('Username')");
  const b = computeFingerprint('checkout step', "getByLabel('Card Number')");
  assert.notEqual(a, b);
});

// --- Locator extraction ------------------------------------------------------

test('extractLocatorFromError pulls the locator out of a real Playwright timeout message', () => {
  const err = "Error: locator.fill: Test timeout of 30000ms exceeded.\nCall log:\n  - waiting for getByLabel('Username')";
  assert.equal(extractLocatorFromError(err), "getByLabel('Username')");
});

test('extractLocatorFromError returns null when nothing recognizable is present', () => {
  assert.equal(extractLocatorFromError('some unrelated error'), null);
});

// --- applyLocatorFix ---------------------------------------------------------

test('applyLocatorFix replaces every occurrence of the original locator', () => {
  const content = "a = page.getByLabel('Username');\nb = page.getByLabel('Username');";
  const result = applyLocatorFix(content, "getByLabel('Username')", "getByPlaceholder('Enter your email')");
  assert.equal(result.occurrences, 2);
  assert.ok(!result.content.includes("getByLabel('Username')"));
  assert.equal(result.content.match(/getByPlaceholder/g).length, 2);
});

test('applyLocatorFix returns null when the original locator is not present', () => {
  const result = applyLocatorFix('nothing to see here', "getByLabel('Username')", "getByPlaceholder('x')");
  assert.equal(result, null);
});

// --- healScriptFile: the full decision loop ---------------------------------

test('scenario: KB has a matching solution -> reused, AI never called', async () => {
  let analyzeCalls = 0;
  const io = baseIo({
    lookupKb: async () => ({
      found: true,
      solution: {
        root_cause: 'label changed', failure_category: 'element_locator_changed',
        fix_description: 'use placeholder', original_locator: "getByLabel('Username')",
        new_locator: "getByPlaceholder('Enter your email')", confidence: 0.95,
      },
    }),
    analyze: async () => { analyzeCalls += 1; return { success: false }; },
    runTests: async () => ({ tests: [] }), // representative no longer in failures -> healed
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(analyzeCalls, 0);
  assert.equal(result.attempts[0].source, 'kb_reuse');
  assert.equal(result.finalOutcome, 'healed');
});

test('scenario: no KB match -> AI analysis triggered', async () => {
  let analyzeCalls = 0;
  const io = baseIo({
    lookupKb: async () => ({ found: false }),
    analyze: async () => {
      analyzeCalls += 1;
      return {
        success: true, root_cause: 'x', failure_category: 'element_locator_changed',
        recommended_fix: 'x', original_locator: "getByLabel('Username')",
        new_locator: "getByPlaceholder('Enter your email')", confidence: 0.9,
      };
    },
    runTests: async () => ({ tests: [] }),
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(analyzeCalls, 1);
  assert.equal(result.attempts[0].source, 'ai_analysis');
});

test('scenario: valid fix that actually passes on re-run -> healed, screenshot was captured', async () => {
  let screenshotCaptured = false;
  const io = baseIo({
    readScreenshotBase64: async () => { screenshotCaptured = true; return 'BASE64DATA'; },
    analyze: async () => ({
      success: true, root_cause: 'label changed', failure_category: 'element_locator_changed',
      recommended_fix: 'use placeholder', original_locator: "getByLabel('Username')",
      new_locator: "getByPlaceholder('Enter your email')", confidence: 0.95,
    }),
    runTests: async () => ({ tests: [] }), // representative test_case_id no longer among failures
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(screenshotCaptured, true);
  assert.equal(result.finalOutcome, 'healed');
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].outcome, 'healed');
  assert.ok(result.correctedContent.includes('getByPlaceholder'));
});

test('scenario: fix applied but re-run still fails the same test -> still_failing, not silently marked healed', async () => {
  const io = baseIo({
    analyze: async () => ({
      success: true, root_cause: 'x', failure_category: 'element_locator_changed',
      recommended_fix: 'x', original_locator: "getByLabel('Username')",
      new_locator: "getByPlaceholder('wrong guess')", confidence: 0.9,
    }),
    // Representative test is STILL in the failing set after the "fix".
    runTests: async () => ({ tests: [{ test_case_id: 'TC-1: Login', status: 'failed' }] }),
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  // Loop keeps going up to maxAttempts since it's still failing (2nd attempt
  // will re-analyze); confirm the FIRST attempt was correctly marked
  // still_failing rather than healed.
  assert.equal(result.attempts[0].outcome, 'still_failing');
});

test('scenario: low-confidence analysis is never applied (no blind modification)', async () => {
  let setContentCalls = 0;
  const io = baseIo({
    analyze: async () => ({
      success: true, root_cause: 'unclear', failure_category: 'other',
      recommended_fix: 'maybe this?', original_locator: "getByLabel('Username')",
      new_locator: "getByPlaceholder('guess')", confidence: 0.2, // below MIN_CONFIDENCE_TO_APPLY
    }),
    setFileContent: () => { setContentCalls += 1; },
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(setContentCalls, 0);
  assert.equal(result.finalOutcome, 'still_failing');
  assert.equal(result.correctedContent, null);
});

test('scenario: maximum healing attempts enforced -- no infinite loop', async () => {
  let analyzeCalls = 0;
  let runTestsCalls = 0;
  const io = baseIo({
    // Every attempt "succeeds" in getting a confident fix, but the fix
    // never actually resolves the failure -- a worst-case, never-converges
    // scenario that would loop forever without a hard cap.
    // Chains original_locator to whatever the PREVIOUS guess left in the
    // file, same as a real re-analysis would (it inspects the file as it
    // currently stands, not the very first error message forever) -- each
    // guess is confidently wrong in a new way, so the loop must still stop
    // at maxAttempts rather than continuing indefinitely.
    analyze: async () => {
      analyzeCalls += 1;
      const from = analyzeCalls === 1 ? "getByLabel('Username')" : `getByPlaceholder('guess-${analyzeCalls - 1}')`;
      return {
        success: true, root_cause: 'x', failure_category: 'element_locator_changed',
        recommended_fix: 'x', original_locator: from,
        new_locator: `getByPlaceholder('guess-${analyzeCalls}')`, confidence: 0.9,
      };
    },
    runTests: async () => {
      runTestsCalls += 1;
      return { tests: [{ test_case_id: 'TC-1: Login', status: 'failed' }] }; // never heals
    },
  });

  const result = await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(analyzeCalls, 2, 'must stop calling the AI after maxAttempts, not loop forever');
  assert.equal(runTestsCalls, 2);
  assert.equal(result.attempts.length, 2);
  assert.equal(result.finalOutcome, 'max_attempts_reached');
});

test('scenario: unmatched-solutions context is passed to the next AI analysis call so it does not repeat a failed guess', async () => {
  const seenUnmatched = [];
  let call = 0;
  const io = baseIo({
    analyze: async (payload) => {
      call += 1;
      seenUnmatched.push(payload.unmatched_known_solutions);
      return {
        success: true, root_cause: 'x', failure_category: 'element_locator_changed',
        recommended_fix: 'x', original_locator: "getByLabel('Username')",
        new_locator: `getByPlaceholder('attempt-${call}')`, confidence: 0.9,
      };
    },
    runTests: async () => ({ tests: [{ test_case_id: 'TC-1: Login', status: 'failed' }] }),
  });

  await healScriptFile(io, {
    clientId: 'test-ai', maxAttempts: 2, initialFailures: [makeFailure()],
    ticketContext: 'x', browserInfo: 'chromium',
  });

  assert.equal(seenUnmatched[0], ''); // nothing tried yet on the first call
  assert.match(seenUnmatched[1], /attempt-1/); // second call knows attempt 1 didn't work
});
