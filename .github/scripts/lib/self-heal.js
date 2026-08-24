// Core self-healing logic: pure/injectable-IO functions only (no direct
// fs/child_process/network calls in this file) so the whole healing
// decision loop is unit-testable without a real browser, a real n8n
// instance, or a real Dify call. self-heal-runner.js wires these up to
// the real world (reads files, shells out to `npx playwright test`, calls
// n8n's Healing KB Lookup / Healing Analyze webhooks).
'use strict';

const crypto = require('crypto');

function normalizeForFingerprint(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Scoped by client, not by ticket/script -- confirmed live (SD1-T1366 /
// SD1-T1375) that the same broken locator recurs across different
// tickets' scripts for the same app, so the fingerprint deliberately
// excludes test_case_id/script_path.
function computeFingerprint(failedStep, originalLocator) {
  const key = `${normalizeForFingerprint(failedStep)}|${normalizeForFingerprint(originalLocator)}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Playwright's own timeout error text embeds the exact locator it was
// waiting on, e.g.:
//   "Error: locator.fill: Test timeout of 30000ms exceeded.
//    Call log:
//      - waiting for getByLabel('Username')"
// This is a real, observed shape (confirmed against the actual
// SD1-T1366 failure trace) -- extracting it directly means the KB
// fingerprint/lookup can happen BEFORE ever calling the AI, using
// evidence Playwright already gives us for free.
function extractLocatorFromError(errorText) {
  const text = String(errorText || '');
  const waitingFor = /waiting for (.+?)(?:\r?\n|$)/.exec(text);
  if (waitingFor) return waitingFor[1].trim();
  const locatorCall = /(?:locator|page)\.(?:fill|click|check|selectOption):\s*.*?\n?/i.exec(text);
  if (locatorCall) return null; // shape recognized but no explicit locator in this variant -- let AI analysis handle it
  return null;
}

// Applies a fix as a literal string replacement across the WHOLE file --
// deliberate, not scoped to one test's block. Confirmed live: several
// test cases share one `login()` helper, so fixing that one shared
// locator string resolves every test that calls it, not just the
// original failing one. Returns null (no-op) if the original locator
// string isn't actually present, so callers can distinguish "nothing to
// replace" from "replaced but content unchanged" (a no-op replacement
// would otherwise look identical to success).
function applyLocatorFix(fileContent, originalLocator, newLocator) {
  if (!originalLocator || !newLocator) return null;
  if (!fileContent.includes(originalLocator)) return null;
  const occurrences = fileContent.split(originalLocator).length - 1;
  const content = fileContent.split(originalLocator).join(newLocator);
  return { content, occurrences };
}

function buildAttemptRecord({ attemptNumber, source, failedStep, errorMessage, stackTrace, currentUrl, pageTitle, screenshotRef, browserInfo, failureCategory, rootCause, proposedFix, originalLocator, newLocator, confidence, outcome, fingerprint }) {
  return {
    attempt_number: attemptNumber,
    source,
    failed_step: failedStep || null,
    error_message: errorMessage || null,
    stack_trace: stackTrace || null,
    current_url: currentUrl || null,
    page_title: pageTitle || null,
    screenshot_ref: screenshotRef || null,
    browser_info: browserInfo || null,
    failure_category: failureCategory || null,
    root_cause: rootCause || null,
    proposed_fix: proposedFix || null,
    original_locator: originalLocator || null,
    new_locator: newLocator || null,
    confidence: confidence != null ? confidence : null,
    outcome,
    failure_fingerprint: fingerprint || null,
  };
}

const MIN_CONFIDENCE_TO_APPLY = 0.5;

/**
 * Runs the bounded heal -> re-run -> heal-again loop for ONE script file.
 *
 * @param {object} io - all real-world effects, injected for testability:
 *   getFileContent(): string
 *   setFileContent(content): void
 *   runTests(): Promise<{ tests: Array<{test_case_id,status,error,stack,_attachments}> }>
 *     -- re-runs Playwright against this same file and returns freshly
 *     parsed results (same shape as playwright-results.js emits).
 *   readPageSnapshot(test): Promise<string> -- accessibility-tree text for
 *     the given failing test, or '' if unavailable.
 *   readScreenshotBase64(test): Promise<string|null>
 *   lookupKb({ clientId, fingerprint }): Promise<{found, solution}>
 *   analyze(payload): Promise<{success, root_cause, failure_category,
 *     recommended_fix, original_locator, new_locator, updated_test_step,
 *     confidence}>
 * @param {object} params
 *   clientId, maxAttempts, initialFailures (tests already known to have
 *   failed on the FIRST run of this file), ticketContext, browserInfo,
 *   unmatchedSolutionsSoFar (mutated in place across calls if the caller
 *   wants cross-file memory; a fresh [] is fine for one file)
 */
async function healScriptFile(io, params) {
  const { clientId, maxAttempts, ticketContext, browserInfo } = params;
  const attempts = [];
  const unmatched = [];
  let currentFailures = params.initialFailures;
  let attemptNumber = 0;
  let outcome = 'still_failing';

  while (currentFailures.length > 0 && attemptNumber < maxAttempts) {
    attemptNumber += 1;
    const representative = currentFailures[0];
    const failedStep = `${representative.test_case_id}: ${representative.error || ''}`.slice(0, 500);
    const originalLocatorGuess = extractLocatorFromError(representative.error) || extractLocatorFromError(representative.stack);
    const fingerprint = computeFingerprint(failedStep, originalLocatorGuess || representative.error || '');

    const pageSnapshot = await io.readPageSnapshot(representative);
    const screenshotBase64 = await io.readScreenshotBase64(representative);

    let source;
    let diagnosis;
    const kbResult = await io.lookupKb({ clientId, fingerprint });
    if (kbResult && kbResult.found) {
      source = 'kb_reuse';
      diagnosis = {
        success: true,
        root_cause: kbResult.solution.root_cause,
        failure_category: kbResult.solution.failure_category,
        recommended_fix: kbResult.solution.fix_description,
        original_locator: kbResult.solution.original_locator,
        new_locator: kbResult.solution.new_locator,
        confidence: kbResult.solution.confidence,
      };
    } else {
      source = 'ai_analysis';
      diagnosis = await io.analyze({
        test_case_id: representative.test_case_id,
        ticket_context: ticketContext,
        failed_step: failedStep,
        error_message: representative.error,
        stack_trace: representative.stack,
        current_url: representative.currentUrl,
        page_title: representative.pageTitle,
        page_snapshot: pageSnapshot,
        browser_info: browserInfo,
        unmatched_known_solutions: unmatched.join('\n'),
        screenshot_base64: screenshotBase64,
      });
    }

    if (!diagnosis || !diagnosis.success || !diagnosis.recommended_fix || diagnosis.confidence == null || diagnosis.confidence < MIN_CONFIDENCE_TO_APPLY) {
      attempts.push(buildAttemptRecord({
        attemptNumber, source,
        failedStep, errorMessage: representative.error, stackTrace: representative.stack,
        currentUrl: representative.currentUrl, pageTitle: representative.pageTitle,
        browserInfo, failureCategory: diagnosis && diagnosis.failure_category,
        rootCause: diagnosis && diagnosis.root_cause,
        proposedFix: diagnosis && diagnosis.recommended_fix,
        originalLocator: diagnosis && diagnosis.original_locator,
        newLocator: diagnosis && diagnosis.new_locator,
        confidence: diagnosis && diagnosis.confidence,
        outcome: 'still_failing',
        fingerprint,
      }));
      outcome = 'still_failing';
      break; // insufficient evidence -- don't guess further, per spec "do not blindly modify"
    }

    const fileContent = io.getFileContent();
    const applied = applyLocatorFix(fileContent, diagnosis.original_locator, diagnosis.new_locator);
    if (!applied) {
      // The proposed original_locator doesn't even appear in the file --
      // nothing to apply. Record and stop rather than looping uselessly.
      attempts.push(buildAttemptRecord({
        attemptNumber, source,
        failedStep, errorMessage: representative.error, stackTrace: representative.stack,
        currentUrl: representative.currentUrl, pageTitle: representative.pageTitle,
        browserInfo, failureCategory: diagnosis.failure_category, rootCause: diagnosis.root_cause,
        proposedFix: diagnosis.recommended_fix, originalLocator: diagnosis.original_locator, newLocator: diagnosis.new_locator,
        confidence: diagnosis.confidence, outcome: 'still_failing', fingerprint,
      }));
      unmatched.push(`${diagnosis.original_locator} -> ${diagnosis.new_locator} (original_locator not found verbatim in file)`);
      outcome = 'still_failing';
      break;
    }
    io.setFileContent(applied.content);

    const rerun = await io.runTests();
    const stillFailing = rerun.tests.filter((t) => t.status === 'failed' || t.status === 'timed_out');
    // Success is judged on the REPRESENTATIVE test specifically, not on
    // "fewer failures overall" -- a shared-helper fix (see module header)
    // can legitimately clear several other tests as a side effect while
    // this metric stays scoped to what THIS attempt was actually diagnosing.
    const representativeStillFailing = stillFailing.some((t) => t.test_case_id === representative.test_case_id);
    const thisAttemptHealed = !representativeStillFailing;

    attempts.push(buildAttemptRecord({
      attemptNumber, source,
      failedStep, errorMessage: representative.error, stackTrace: representative.stack,
      currentUrl: representative.currentUrl, pageTitle: representative.pageTitle,
      browserInfo, failureCategory: diagnosis.failure_category, rootCause: diagnosis.root_cause,
      proposedFix: diagnosis.recommended_fix, originalLocator: diagnosis.original_locator, newLocator: diagnosis.new_locator,
      confidence: diagnosis.confidence,
      outcome: thisAttemptHealed ? 'healed' : 'still_failing',
      fingerprint,
    }));

    if (!thisAttemptHealed) {
      // This exact fix made no measurable difference to the failure it was
      // meant to address -- record it as an unmatched attempt so the NEXT
      // ai_analysis call (if any) knows not to propose it again, and (if
      // this came from the KB) let the caller bump that solution's
      // failure_count.
      unmatched.push(`${diagnosis.original_locator} -> ${diagnosis.new_locator} (tried, did not resolve the failure)`);
    }

    currentFailures = stillFailing;
    outcome = currentFailures.length === 0 ? 'healed' : 'still_failing';
  }

  if (currentFailures.length > 0 && attemptNumber >= maxAttempts && attempts.length && attempts[attempts.length - 1].outcome !== 'healed') {
    attempts[attempts.length - 1].outcome = 'max_attempts_reached';
    outcome = 'max_attempts_reached';
  }

  return {
    attempts,
    finalOutcome: outcome,
    remainingFailures: currentFailures,
    correctedContent: outcome === 'healed' || attempts.some((a) => a.outcome === 'healed') ? io.getFileContent() : null,
  };
}

// Gate used by self-heal-runner.js before touching anything healing-related
// -- kept as a pure function so "healing off" / "nothing failed" are both
// directly testable without needing to run the whole CLI.
function shouldAttemptHealing(selfHealingEnabled, failingCount) {
  return Boolean(selfHealingEnabled) && failingCount > 0;
}

module.exports = {
  normalizeForFingerprint,
  computeFingerprint,
  extractLocatorFromError,
  applyLocatorFix,
  buildAttemptRecord,
  healScriptFile,
  shouldAttemptHealing,
  MIN_CONFIDENCE_TO_APPLY,
};
