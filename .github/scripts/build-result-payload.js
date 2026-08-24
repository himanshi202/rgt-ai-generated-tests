// Builds the final results.json posted to n8n's Automation Execution
// Result Handler webhook. Two sources feed in:
//  - raw-results.json: Playwright's own JSON reporter output (always).
//  - healing-report.json: written by self-heal.js ONLY when self-healing
//    was actually attempted for this run (client opted in AND at least one
//    test failed) -- absent entirely for every other run, so this script's
//    behavior/output is byte-for-byte unchanged for any run that never
//    touches self-healing. See self-heal.js for that report's shape.
const fs = require('fs');
const { parseResultsFile } = require('./lib/playwright-results');

const RAW_RESULTS_PATH = process.env.RAW_RESULTS_PATH || 'raw-results.json';
const OUT_PATH = process.env.OUT_PATH || 'results.json';
const HEALING_REPORT_PATH = process.env.HEALING_REPORT_PATH || 'healing-report.json';

const { tests, parsedOk } = parseResultsFile(RAW_RESULTS_PATH);

let healingByTestCase = new Map();
if (fs.existsSync(HEALING_REPORT_PATH)) {
  try {
    const report = JSON.parse(fs.readFileSync(HEALING_REPORT_PATH, 'utf8'));
    // Covers BOTH outcomes -- a test that healed successfully AND one that
    // was attempted but is still failing after MAX_SELF_HEAL_ATTEMPTS.
    // Section 5 of the self-healing spec: an unresolved test must still be
    // marked failed with all its diagnostics preserved, not silently
    // dropped just because healing was attempted.
    for (const entry of report.attempted_test_cases || []) {
      healingByTestCase.set(entry.test_case_id, entry);
    }
  } catch (e) {
    console.warn(`::warning::Could not parse ${HEALING_REPORT_PATH}: ${e.message}`);
  }
}

for (const t of tests) {
  const healing = healingByTestCase.get(t.test_case_id);
  delete t._attachments; // internal-only, not part of the n8n contract
  if (!healing) continue;
  t.healing = healing.healing;
  if (healing.healing.final_outcome === 'healed') {
    // Passed on its final re-run -- reflect that as the test's real,
    // current status (self_healed carries the "used to fail" signal
    // separately via t.healing) rather than reporting a status that's no
    // longer true of the code as it stands after healing.
    t.status = 'passed';
    t.error = null;
    t.stack = null;
  }
  // still_failing / max_attempts_reached: leave status/error/stack exactly
  // as Playwright's own final re-run already reported them -- the
  // diagnostics from every healing attempt are preserved separately in
  // t.healing.attempts, not in place of the real failure info.
}

const summary = {
  total: tests.length,
  passed: tests.filter((t) => t.status === 'passed').length,
  failed: tests.filter((t) => t.status === 'failed' || t.status === 'timed_out').length,
  skipped: tests.filter((t) => t.status === 'skipped').length,
};

const status = !parsedOk
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
const healedCount = [...healingByTestCase.values()].filter((h) => h.healing.final_outcome === 'healed').length;
console.log(`Wrote ${OUT_PATH}: ${summary.total} tests (${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped), status=${status}${healingByTestCase.size ? `, ${healedCount}/${healingByTestCase.size} self-healed` : ''}`);
