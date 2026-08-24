// Shared Playwright JSON-reporter parsing, used by both
// build-result-payload.js (the always-runs, no-healing path) and
// self-heal.js (which needs the same per-test shape plus attachment
// paths -- screenshot / error-context -- to drive diagnosis). Extracted
// so there's exactly one implementation of "how do we read Playwright's
// raw JSON", not two that could silently drift apart.
'use strict';

// Playwright's own statuses are passed/failed/timedOut/skipped/interrupted;
// normalize to this project's DB CHECK constraint values up front so
// nothing downstream needs to know Playwright's naming at all.
function normalizeStatus(s) {
  if (s === 'timedOut') return 'timed_out';
  if (s === 'passed' || s === 'failed' || s === 'skipped') return s;
  return 'failed'; // 'interrupted' or anything unexpected -- fail loud, not silently skip
}

// Playwright's JSON reporter gives spec.file relative to
// playwright.config.js's testDir ('./tests'), NOT the repo root --
// confirmed live 2026-08-19 (see build-result-payload.js's own history).
function normalizeScriptPath(specFile) {
  return `tests/${specFile}`;
}

function parseClientAndTicket(scriptPath) {
  const match = /^tests\/([^/]+)\/([^/]+)\.spec\.js$/.exec(scriptPath);
  return { clientId: match ? match[1] : null, zohoTaskId: match ? match[2] : null };
}

function findAttachment(attachments, name) {
  return (attachments || []).find((a) => a.name === name);
}

function walkSuites(suites, out) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const lastResult = (test.results || [])[test.results.length - 1] || {};
        const scriptPath = normalizeScriptPath(spec.file);
        const { clientId, zohoTaskId } = parseClientAndTicket(scriptPath);
        out.push({
          test_case_id: spec.title,
          script: scriptPath,
          client_id: clientId,
          zoho_task_id: zohoTaskId,
          status: normalizeStatus(lastResult.status || test.status),
          duration_ms: lastResult.duration || 0,
          error: lastResult.error ? (lastResult.error.message || String(lastResult.error)) : null,
          stack: lastResult.error ? (lastResult.error.stack || null) : null,
          // Kept only for self-heal.js's own use -- build-result-payload.js's
          // n8n contract has no column for these, so they're dropped before
          // that payload is ever sent.
          _attachments: lastResult.attachments || [],
        });
      }
    }
    if (suite.suites && suite.suites.length) walkSuites(suite.suites, out);
  }
}

function parseResultsFile(rawResultsPath, fsModule) {
  const fs = fsModule || require('fs');
  let raw = null;
  try {
    raw = JSON.parse(fs.readFileSync(rawResultsPath, 'utf8'));
  } catch (e) {
    // The test step produced no JSON at all -- browser launch failure,
    // dependency failure, etc. Caller decides how to treat this
    // (build-result-payload.js: infrastructure_failure). parsedOk=false
    // is the signal for that, kept distinct from "parsed fine, zero tests
    // matched" (parsedOk=true, tests=[]) -- those are different situations.
  }
  const tests = [];
  if (raw) walkSuites(raw.suites, tests);
  return { tests, parsedOk: raw !== null };
}

module.exports = {
  normalizeStatus,
  normalizeScriptPath,
  parseClientAndTicket,
  findAttachment,
  walkSuites,
  parseResultsFile,
};
