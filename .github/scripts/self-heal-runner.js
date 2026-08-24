// CI entry point for self-healing test execution. Replaces the old
// one-line `npx playwright test ... > raw-results.json || true` step in
// execute-tests.yml. When self-healing is OFF for this client (the
// default -- see SELF_HEALING_ENABLED below), this script's behavior is
// byte-for-byte the same as that old line: run once, write
// raw-results.json, exit. No healing-report.json is ever written in that
// case, so build-result-payload.js's output is unaffected too -- Section
// 1's "do not break the existing successful execution flow" requirement.
//
// All real decision logic (fingerprinting, when to apply a fix, when to
// give up) lives in lib/self-heal.js as injectable-IO pure functions --
// this file only wires those to the real filesystem/network/Playwright
// CLI. See lib/self-heal.test.js for the actual behavior coverage.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseResultsFile } = require('./lib/playwright-results');
const { healScriptFile, shouldAttemptHealing } = require('./lib/self-heal');

const CLIENT_ID = process.env.INPUT_CLIENT_ID || '';
const TARGET_PATH = process.env.TEST_TARGET_PATH; // e.g. tests/test-ai/SD1-T1366.spec.js, or tests/test-ai for a folder
const SELF_HEALING_ENABLED = String(process.env.SELF_HEALING_ENABLED || 'false').toLowerCase() === 'true';
const MAX_ATTEMPTS = Number(process.env.SELF_HEALING_MAX_ATTEMPTS || 2);
const KB_LOOKUP_URL = process.env.HEALING_KB_LOOKUP_URL;
const ANALYZE_URL = process.env.HEALING_ANALYZE_URL;
const RAW_RESULTS_PATH = process.env.RAW_RESULTS_PATH || 'raw-results.json';
const HEALING_REPORT_PATH = process.env.HEALING_REPORT_PATH || 'healing-report.json';

function log(msg) {
  console.log(msg);
}

function runPlaywright(target, outPath) {
  execSync(`npx playwright test "${target}" --reporter=json > "${outPath}" 2>playwright-stderr.log || true`, {
    stdio: 'inherit',
    shell: true,
  });
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

function findAttachment(attachments, predicate) {
  return (attachments || []).find(predicate);
}

function readPageSnapshotFromAttachments(attachments) {
  const md = findAttachment(
    attachments,
    (a) => /error.?context/i.test(a.name || '') || a.contentType === 'text/markdown',
  );
  if (!md || !md.path || !fs.existsSync(md.path)) return '';
  try {
    const content = fs.readFileSync(md.path, 'utf8');
    const match = /```yaml\n([\s\S]*?)\n```/.exec(content);
    return match ? match[1] : content.slice(0, 4000);
  } catch (e) {
    return '';
  }
}

function readScreenshotBase64FromAttachments(attachments) {
  const shot = findAttachment(attachments, (a) => a.name === 'screenshot' || /^image\//.test(a.contentType || ''));
  if (!shot || !shot.path || !fs.existsSync(shot.path)) return null;
  try {
    return fs.readFileSync(shot.path).toString('base64');
  } catch (e) {
    return null;
  }
}

// Best-effort: Playwright's JSON reporter does not include the page's URL
// or title at time of failure (that would need a custom fixture capturing
// them via an afterEach hook across every generated script -- a larger,
// separate change to the script-generation template, not part of wiring
// up self-healing itself). Extracted from the error/stack text when
// present (assertion failures like toHaveURL embed both sides of the
// comparison); '' otherwise. The AI analysis step has already been
// confirmed live to produce a correct, high-confidence diagnosis from
// page_snapshot + error text alone even when this is empty.
function guessCurrentUrl(errorText) {
  const text = String(errorText || '');
  const received = /Received:\s*"?(https?:\/\/[^\s"]+)"?/.exec(text);
  if (received) return received[1];
  const goto = /page\.goto\(['"](https?:\/\/[^'")]+)['"]\)/.exec(text);
  if (goto) return goto[1];
  return '';
}

async function main() {
  if (!TARGET_PATH) throw new Error('TEST_TARGET_PATH is required');

  runPlaywright(TARGET_PATH, RAW_RESULTS_PATH);
  const { tests } = parseResultsFile(RAW_RESULTS_PATH);
  const failing = tests.filter((t) => t.status === 'failed' || t.status === 'timed_out');

  if (!shouldAttemptHealing(SELF_HEALING_ENABLED, failing.length)) {
    log(`[TEST] Executing test case(s): ${TARGET_PATH}`);
    log(failing.length === 0 ? '[TEST] All tests passed -- no healing needed.' : '[TEST] Test(s) failed, but self-healing is not enabled for this client.');
    return; // No healing-report.json written -- build-result-payload.js runs unaffected, same as before this feature existed.
  }

  log(`[TEST] Executing ${TARGET_PATH}`);
  log(`[TEST] ${failing.length} test(s) failed -- self-healing enabled (max ${MAX_ATTEMPTS} attempts per file)`);

  const failuresByScript = new Map();
  for (const t of failing) {
    if (!failuresByScript.has(t.script)) failuresByScript.set(t.script, []);
    failuresByScript.get(t.script).push(t);
  }

  const attemptedTestCases = [];

  for (const [scriptPath, scriptFailures] of failuresByScript) {
    log(`[HEAL] ${scriptPath}: capturing diagnostics for ${scriptFailures.length} failing test(s)`);
    const initialFailures = scriptFailures.map((t) => ({
      test_case_id: t.test_case_id,
      error: t.error,
      stack: t.stack,
      currentUrl: guessCurrentUrl(t.error) || guessCurrentUrl(t.stack),
      pageTitle: '',
      attachments: t._attachments,
    }));
    const originalTestCaseIds = new Set(initialFailures.map((f) => f.test_case_id));

    const io = {
      getFileContent: () => fs.readFileSync(scriptPath, 'utf8'),
      setFileContent: (content) => fs.writeFileSync(scriptPath, content, 'utf8'),
      readPageSnapshot: async (t) => {
        log('[HEAL] Reading page snapshot from failure trace');
        return readPageSnapshotFromAttachments(t.attachments);
      },
      readScreenshotBase64: async (t) => {
        log('[HEAL] Capturing screenshot reference');
        return readScreenshotBase64FromAttachments(t.attachments);
      },
      lookupKb: async ({ clientId, fingerprint }) => {
        log('[HEAL] Searching Knowledge Base');
        if (!KB_LOOKUP_URL) return { found: false };
        try {
          const result = await postJson(KB_LOOKUP_URL, { client_id: clientId, failure_fingerprint: fingerprint });
          log(result.found ? '[HEAL] Known solution found' : '[HEAL] No known solution found');
          return result;
        } catch (e) {
          log(`[HEAL] KB lookup failed (${e.message}) -- proceeding to fresh analysis`);
          return { found: false };
        }
      },
      analyze: async (payload) => {
        log('[HEAL] Sending failure information to AI');
        if (!ANALYZE_URL) return { success: false, message: 'HEALING_ANALYZE_URL not configured' };
        try {
          const result = await postJson(ANALYZE_URL, payload);
          if (result.success) log(`[HEAL] Root cause identified: ${result.failure_category}`);
          return result;
        } catch (e) {
          log(`[HEAL] AI analysis call failed: ${e.message}`);
          return { success: false, message: e.message };
        }
      },
      runTests: async () => {
        log('[HEAL] Re-running test');
        const attemptPath = `raw-results-heal-${Date.now()}.json`;
        runPlaywright(scriptPath, attemptPath);
        const parsed = parseResultsFile(attemptPath);
        try { fs.unlinkSync(attemptPath); } catch (e) { /* best-effort cleanup */ }
        return parsed;
      },
    };

    const result = await healScriptFile(io, {
      clientId: CLIENT_ID,
      maxAttempts: MAX_ATTEMPTS,
      initialFailures,
      ticketContext: `Ticket ${path.basename(scriptPath, '.spec.js')} for client ${CLIENT_ID}`,
      browserInfo: 'chromium',
    });

    if (result.finalOutcome === 'healed') log('[HEAL] Test passed');
    if (result.correctedContent) log('[KB] Saving validated solution / updating Knowledge Base');

    const remainingIds = new Set(result.remainingFailures.map((f) => f.test_case_id));
    for (const testCaseId of originalTestCaseIds) {
      const stillFailing = remainingIds.has(testCaseId);
      attemptedTestCases.push({
        test_case_id: testCaseId,
        healing: {
          attempted: true,
          attempts: result.attempts,
          final_outcome: stillFailing ? (result.finalOutcome === 'max_attempts_reached' ? 'max_attempts_reached' : 'still_failing') : 'healed',
          corrected_script_content: result.correctedContent,
        },
      });
    }
  }

  fs.writeFileSync(HEALING_REPORT_PATH, JSON.stringify({ attempted_test_cases: attemptedTestCases }, null, 2));

  // Definitive final state for the WHOLE target (not just the healed
  // files) -- re-run once more so raw-results.json (which
  // build-result-payload.js reads next) reflects reality after every
  // applied fix, including any test outside the originally-failing set
  // that a shared-helper edit might have incidentally touched.
  log('[TEST] Re-running full target for final results after healing');
  runPlaywright(TARGET_PATH, RAW_RESULTS_PATH);
}

main().catch((e) => {
  console.error('[HEAL] self-heal-runner failed:', e);
  // Never let a healing-side bug take down the whole CI job silently --
  // but also never swallow it: a real raw-results.json from the FIRST
  // (pre-healing) run already exists on disk at this point, so
  // build-result-payload.js still has something honest to report even if
  // the healing layer itself crashed mid-way.
  process.exitCode = 0;
});
