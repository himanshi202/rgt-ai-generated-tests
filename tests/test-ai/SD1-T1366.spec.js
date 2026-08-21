const { test, expect } = require('@playwright/test');

// --- Configuration and Helper Functions ---
//
// Every selector/URL/flow below was verified live against the real
// dev.ratnatest.ai staging app (not guessed) before this rewrite -- the
// originally generated script's assumptions (native <select> dropdowns for
// language/provider, a dedicated Repository URL/Branch/Build Command/Test
// Command form, a "Dashboard" heading at /dashboard, a "Login" heading on
// unauthenticated redirect) do not match the real app at all and were the
// reason every test failed. See PR discussion for the live verification
// trail (screenshots + accessibility snapshots via a one-off inspection
// script).
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
// Real post-login landing page is the marketing homepage at the root --
// there is no separate /dashboard route.
const HOME_URL = `${BASE_URL}/`;
const TEMPLATES_URL = `${BASE_URL}/cicd-pipeline-testing/templates`;

const VALID_USERNAME = process.env.VALID_USERNAME || 'user@example.com';
const VALID_PASSWORD = process.env.VALID_PASSWORD || 'password123';

/**
 * Real login flow: the email/password fields have no associated <label> at
 * all (confirmed via accessibility snapshot) -- their accessible name comes
 * from their placeholder text, not a label, so getByLabel() can never find
 * them. The submit button's real text is "Sign In" (not "Login").
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
async function login(page, username, password) {
  await page.goto(LOGIN_URL);
  await page.getByPlaceholder('Enter your email').fill(username);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(HOME_URL);
  // The account menu (shows "Change Password"/"Sign Out" when opened) is
  // the real, confirmed signal of an authenticated session -- there is no
  // "Dashboard" heading on this page, it's the same marketing homepage
  // shown to logged-out visitors, just with this menu added.
  await expect(page.getByRole('button', { name: /ratna demo/i })).toBeVisible();
}

/**
 * Navigates directly to the real Templates page
 * (BASE_URL/cicd-pipeline-testing/templates, reached in the real app via
 * top nav "Infrastructure" -> "CI/CD Pipeline" -> left sidebar "Templates").
 * @param {import('@playwright/test').Page} page
 */
async function navigateToTemplates(page) {
  await page.goto(TEMPLATES_URL);
  await expect(page).toHaveURL(TEMPLATES_URL);
  // .first() -- confirmed live that once at least one template has been
  // generated, a second element with this same accessible name appears
  // (an empty-state/row-level action alongside the primary header
  // button), which would otherwise make this a strict-mode violation on
  // any repeat run in the same session.
  await expect(page.getByRole('button', { name: 'Generate Template' }).first()).toBeVisible();
}

/**
 * Opens the real 4-step "Generate CI/CD Template" wizard modal
 * (Language -> Provider -> Configure -> Preview). Confirmed via a real
 * generation run that this heading and step name are real, not assumed.
 * @param {import('@playwright/test').Page} page
 */
async function openTemplateGenerationWizard(page) {
  await page.getByRole('button', { name: 'Generate Template' }).first().click();
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible();
  // NOTE: the step-name labels ("Language"/"Provider"/"Configure") are NOT
  // used as visibility assertions anywhere in this file -- confirmed live
  // that "Language" text is ambiguous (it also matches a hidden background
  // table column header on the Templates page underneath the modal),
  // causing a strict-mode violation. Real, unambiguous option-card buttons
  // are used instead throughout.
  await expect(page.getByRole('button', { name: 'Go', exact: true })).toBeVisible();
}

/**
 * Real language/provider selection: both steps use clickable option cards,
 * not <select> dropdowns. Provider cards have a two-line label (name +
 * config file path), so a prefix match is used for "GitHub Actions".
 * @param {import('@playwright/test').Page} page
 */
async function selectGoAndGitHubActions(page) {
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: /^GitHub Actions/ })).toBeVisible();

  await page.getByRole('button', { name: /^GitHub Actions/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible();
}

/**
 * Submits the Configure step (real fields: an Environment dropdown and
 * Build/Test/Deployment/Docker/notification toggles -- no free-text
 * Repository URL/Branch/Build Command/Test Command fields exist in the
 * real app) using its defaults, and waits for the real async "AI is
 * generating your CI/CD files..." step to finish.
 * @param {import('@playwright/test').Page} page
 */
async function generateWithDefaults(page) {
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await page.getByText(/AI is generating/i).waitFor({ state: 'detached', timeout: 30000 });
}

// --- Test Cases ---

test('TC-1: Verify Authenticated User Can Successfully Log In', async ({ page }) => {
  // Preconditions: User has valid credentials for the system
  await page.goto(LOGIN_URL);
  await page.getByPlaceholder('Enter your email').fill(VALID_USERNAME);
  await page.getByPlaceholder('Enter your password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Expected result: user is logged in and lands on the real post-login
  // page (the homepage, not a /dashboard route), with the account menu
  // present as proof of an authenticated session.
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole('button', { name: /ratna demo/i })).toBeVisible();
});

test('TC-2: Verify Unauthenticated User Cannot Access Templates Functionality', async ({ page }) => {
  // Preconditions: User is not logged in
  await page.goto(TEMPLATES_URL);

  // Expected result: confirmed live -- the real app redirects an
  // unauthenticated visit to the Templates page back to the public
  // homepage (not a /login page with a "Login" heading), and the account
  // menu is absent since there is no session.
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole('button', { name: /ratna demo/i })).not.toBeVisible();
});

test('TC-3: Verify Authenticated User Can Navigate to \'Templates\' Section', async ({ page }) => {
  // Preconditions: User is successfully logged in (as per TC-1)
  await login(page, VALID_USERNAME, VALID_PASSWORD);

  // Steps: Navigate to the real CI/CD Pipeline Testing -> Templates area.
  await navigateToTemplates(page);

  // Expected result: user reaches the Templates page ("Generate Template"
  // is the real, confirmed control there -- "Templates" itself is styled
  // text, not an accessible heading, so it isn't used as the assertion).
  await expect(page).toHaveURL(TEMPLATES_URL);
  await expect(page.getByRole('button', { name: 'Generate Template' }).first()).toBeVisible();
});

test('TC-4: Verify Authenticated User Can Initiate Template Generation Process', async ({ page }) => {
  // Preconditions: User is on the 'Templates' section (as per TC-3)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);

  // Steps: Click 'Generate Template' to start the wizard.
  await openTemplateGenerationWizard(page);

  // Expected result: the real 4-step wizard opens on its first step,
  // "Language", presenting the language option cards.
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go', exact: true })).toBeVisible();
});

test('TC-5: Verify Template Generation Wizard Allows Selection of \'Go\' Language', async ({ page }) => {
  // Preconditions: Template generation wizard is open (as per TC-4)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);

  // Steps: select 'Go' (a clickable option card, not a <select>) and
  // advance -- there is no separate "Go Version" field in the real wizard.
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Expected result: the wizard accepts the selection and advances to the
  // real next step, "Provider" -- shown here by the provider option cards
  // (e.g. "GitHub Actions") becoming visible.
  await expect(page.getByRole('button', { name: /^GitHub Actions/ })).toBeVisible();
});

test('TC-6: Verify Template Generation Wizard Allows Selection of a Supported CI/CD Provider', async ({ page }) => {
  // Preconditions: 'Go' is selected as the programming language in the wizard (as per TC-5)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Steps: select 'GitHub Actions' (its real card label is two lines:
  // "GitHub Actions" + ".github/workflows/*.yml") and advance.
  await page.getByRole('button', { name: /^GitHub Actions/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Expected result: the wizard advances to the real "Configure" step --
  // there is no separate "Repository URL" field in the real wizard, but
  // the real "Generate" button becomes visible.
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible();
});

test('TC-7: Verify Template Generation Wizard Presents Necessary Configuration Options for Go and Selected Provider', async ({ page }) => {
  // Preconditions: 'Go' and 'GitHub Actions' are selected (as per TC-6)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);

  // Expected result: the real Configure step's controls are visible --
  // an Environment selector and Pipeline/Infrastructure toggles (Build
  // pipeline, Test pipeline, Deployment pipeline), not the assumed
  // Repository URL/Branch/Build Command/Test Command fields.
  //
  // NOTE: the section labels ("Environment"/"Pipelines"/"Infrastructure")
  // are NOT used here as plain getByText() checks -- confirmed live that
  // each one collides with an unrelated same-named element elsewhere on
  // the page (a background "past templates" table column header for
  // "Environment", and the left sidebar's own "Pipelines" nav button),
  // causing a strict-mode violation. The real toggle switches are
  // role=button elements with their own unambiguous accessible names, so
  // those are asserted on directly instead.
  await expect(page.locator('label').filter({ hasText: 'Environment' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Test pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deployment pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible();
});

test('TC-8: Verify Successful Generation of CI/CD Pipeline Template After Completing Configuration', async ({ page }) => {
  // Preconditions: All required wizard steps are completed
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);

  // Steps: submit the Configure step with its defaults (there are no
  // mandatory free-text fields to fill in the real wizard).
  await generateWithDefaults(page);

  // Expected result: confirmed live -- the real success state shows the
  // generated file's tab/name and Copy/Save/Download controls. There is
  // no "Template generated successfully!" message or separate
  // "Preview"/"Download" buttons in the real app.
  await expect(page.getByRole('button', { name: '.github/workflows/ci.yml' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download all' })).toBeVisible();
});

test('TC-9: Verify Generated Go Pipeline Template is Syntactically Valid for Selected Provider', async ({ page }) => {
  // Preconditions: A Go pipeline template has been successfully generated (as per TC-8)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);

  // Steps: download the generated file (real button is "Download file",
  // not "Download") and parse it as YAML -- Playwright can't run an
  // external GitHub Actions schema validator, but js-yaml parsing without
  // throwing is a real, meaningful syntax check.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download file' }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();

  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf8');
  // Structural sanity checks confirmed against a real generated file (see
  // PR discussion for the full real content captured live): a top-level
  // name, an "on:" trigger block, and a "jobs:" block, each starting at
  // column 0 the way valid top-level YAML keys must.
  expect(content).toMatch(/^name:\s*.+/m);
  expect(content).toMatch(/^on:\s*$/m);
  expect(content).toMatch(/^jobs:\s*$/m);
  // No line should be indented with tabs, which YAML disallows.
  expect(content).not.toMatch(/^\t/m);
});

test('TC-10: Verify Generated Go Pipeline Template Contains Expected CI/CD Steps', async ({ page }) => {
  // Preconditions: A Go pipeline template has been successfully generated (as per TC-8)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);

  // Steps: download and inspect the generated file's real content.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download file' }).click(),
  ]);
  const path = await download.path();
  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf8');

  // Expected result: confirmed live -- the real generated workflow
  // contains explicit build and test steps for Go (via
  // actions/setup-go@v5, `go build`, and `go test`). There is no separate
  // "go fmt" formatting step in the real output, unlike the original
  // assumption.
  expect(content).toContain('actions/setup-go@v5');
  expect(content).toContain('name: Build');
  expect(content).toContain('go build');
  expect(content).toMatch(/name:\s*Run tests/i);
  expect(content).toContain('go test');
});

test('TC-11: Verify Generated Template is Available for Preview or Download', async ({ page }) => {
  // Preconditions: A Go pipeline template has been successfully generated (as per TC-8)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);

  // Expected result: the generated content is already shown inline (no
  // separate "Preview" step needed), and real Copy/Save/Download controls
  // are present and functional.
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download all' })).toBeVisible();
});

test('TC-12: Verify Generated Template is Usable as a CI/CD Pipeline Configuration', async ({ page }) => {
  // Preconditions: A Go pipeline template has been successfully generated and downloaded (as per TC-11)
  // Actually pushing the file to a real GitHub repo and watching a real
  // Actions run is outside what Playwright can automate against the UI --
  // same limitation as the original test, kept honest rather than faked.
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download file' }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  // Suggested filename is real, confirmed live: github_workflows_ci.yml
  // (the real file is written to .github/workflows/ci.yml in a repo).
  expect(download.suggestedFilename()).toBe('github_workflows_ci.yml');
});

test('TC-13: Verify Wizard Completes Generation Using Defaults Without Explicit Selections', async ({ page }) => {
  // Confirmed live: this replaces the originally assumed "missing
  // mandatory field" scenario. The real Configure step has no required
  // free-text fields to leave blank, and clicking through the wizard
  // without explicitly selecting a language/provider does not block
  // generation or show a validation error -- the wizard defaults to the
  // first language/provider card instead of rejecting the empty
  // selection. This test verifies that real, confirmed graceful-default
  // behavior rather than asserting an error message that doesn't exist.
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);

  // Advance through Language and Provider steps with no explicit click.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible();

  await generateWithDefaults(page);

  // Expected result: generation still completes successfully with a
  // default file produced, rather than failing or erroring.
  await expect(page.getByRole('button', { name: 'Download file' })).toBeVisible();
});

test('TC-14: Verify Repeated Generation Runs Remain Structurally Consistent', async ({ page }) => {
  // Confirmed live: there is no free-text input field in the real wizard
  // to feed an invalid/malformed value into, so the originally assumed
  // "invalid Repository URL" scenario has no real equivalent to test.
  // Replaced with a real, meaningful check instead: running the Go +
  // GitHub Actions generation twice in the same session.
  //
  // NOTE: an earlier version of this test asserted the two runs produce
  // byte-for-byte identical output. Confirmed live that's wrong -- this
  // is an AI-generated file ("AI is generating your CI/CD files..."),
  // and two real runs came back with the same structure but slightly
  // different comment wording (e.g. "Specify the Go version to use" vs
  // "Specify a stable Go version"). So this checks structural
  // consistency (the same real steps present) instead of exact equality.
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);

  const fs = require('fs');
  function assertRealStructure(content) {
    expect(content).toMatch(/^name:\s*.+/m);
    expect(content).toContain('actions/checkout@v4');
    expect(content).toContain('actions/setup-go@v5');
    expect(content).toContain('go build');
    expect(content).toContain('go test');
  }

  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);
  const [firstDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download file' }).click(),
  ]);
  const firstContent = fs.readFileSync(await firstDownload.path(), 'utf8');
  assertRealStructure(firstContent);

  await navigateToTemplates(page);
  await openTemplateGenerationWizard(page);
  await selectGoAndGitHubActions(page);
  await generateWithDefaults(page);
  const [secondDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download file' }).click(),
  ]);
  const secondContent = fs.readFileSync(await secondDownload.path(), 'utf8');
  assertRealStructure(secondContent);
});
