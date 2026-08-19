// Flattens Playwright's JSON reporter output (nested suites/specs/tests)
// into the simple {tests: [...]} shape n8n's Automation Execution Result
// Handler expects, and adds the GitHub run metadata that only this job
// itself knows (Playwright's own JSON has no concept of a GitHub Actions
// run id). Written as a plain script (not a config change) so it works
// the same locally as in CI, and so playwright.config.js doesn't need a
// custom reporter.
const fs = require('fs');

const RAW_RESULTS_PATH = process.env.RAW_RESULTS_PATH || 'raw-results.json';
const OUT_PATH = process.env.OUT_PATH || 'results.json';

// Playwright's own statuses are passed/failed/timedOut/skipped/interrupted;
// normalize to this project's DB CHECK constraint values up front so n8n
// doesn't need to know Playwright's naming at all.
function normalizeStatus(s) {
  if (s === 'timedOut') return 'timed_out';
  if (s === 'passed' || s === 'failed' || s === 'skipped') return s;
  return 'failed'; // 'interrupted' or anything unexpected -- fail loud, not silently skip
}

function walkSuites(suites, out) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const lastResult = (test.results || [])[test.results.length - 1] || {};
        // Playwright's own JSON already gives file paths relative to the
        // repo root, e.g. "tests/healthplex/HE1-T3630.spec.js" -- this
        // repo's generation convention is tests/<client_id>/<zoho_task_id>.spec.js.
        const scriptPath = spec.file;
        const match = /^tests\/([^/]+)\/([^/]+)\.spec\.js$/.exec(scriptPath);
        out.push({
          test_case_id: spec.title,
          script: scriptPath,
          client_id: match ? match[1] : null,
          zoho_task_id: match ? match[2] : null,
          status: normalizeStatus(lastResult.status || test.status),
          duration_ms: lastResult.duration || 0,
          error: lastResult.error ? (lastResult.error.message || String(lastResult.error)) : null,
          stack: lastResult.error ? (lastResult.error.stack || null) : null,
        });
      }
    }
    if (suite.suites && suite.suites.length) walkSuites(suite.suites, out);
  }
}

let raw = null;
try {
  raw = JSON.parse(fs.readFileSync(RAW_RESULTS_PATH, 'utf8'));
} catch (e) {
  // The test step produced no JSON at all -- browser launch failure,
  // dependency failure, etc. This IS the infrastructure-failure case the
  // spec calls out; still emit a valid payload rather than losing the run.
}

const tests = [];
if (raw) walkSuites(raw.suites, tests);

const summary = {
  total: tests.length,
  passed: tests.filter((t) => t.status === 'passed').length,
  failed: tests.filter((t) => t.status === 'failed' || t.status === 'timed_out').length,
  skipped: tests.filter((t) => t.status === 'skipped').length,
};

const status = !raw
  ? 'infrastructure_failure'
  : summary.failed > 0
    ? (summary.passed > 0 ? 'partial' : 'failed')
    : 'passed';

const payload = {
  workflow_run_id: Number(process.env.GITHUB_RUN_ID),
  repository: process.env.GITHUB_REPOSITORY,
  commit_sha: process.env.GITHUB_SHA,
  run_html_url: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  client_id: process.env.INPUT_CLIENT_ID || null,
  trigger_type: process.env.INPUT_TRIGGER_TYPE || 'pr_merge',
  started_at: process.env.JOB_STARTED_AT || null,
  completed_at: new Date().toISOString(),
  status,
  summary,
  tests,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
console.log(`Wrote ${OUT_PATH}: ${summary.total} tests (${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped), status=${status}`);
