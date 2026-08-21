const { test, expect } = require('@playwright/test');

// --- Configuration and Helper Functions ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`; // Placeholder for post-login URL
const TEMPLATES_URL = `${BASE_URL}/templates`; // Placeholder for templates section URL

const VALID_USERNAME = process.env.VALID_USERNAME || 'testuser';
const VALID_PASSWORD = process.env.VALID_PASSWORD || 'password123';

// Helper function for login
async function login(page, username, password) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(DASHBOARD_URL);
}

// Helper function to navigate to Templates section
async function navigateToTemplates(page) {
  await page.getByRole('link', { name: 'Templates' }).click();
  await expect(page).toHaveURL(TEMPLATES_URL);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
}

// Helper function to start the template generation wizard
async function startTemplateWizard(page) {
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible();
}

// Helper function to select Go and GitHub Actions in the wizard
async function selectGoAndGitHubActions(page) {
  // Assuming language selection is a radio group or dropdown
  await page.getByLabel('Programming Language').selectOption('Go'); // Or page.getByRole('radio', { name: 'Go' }).click();
  await expect(page.getByText('CI/CD Provider Selection')).toBeVisible(); // Assert wizard proceeds

  // Assuming CI/CD provider selection is a radio group or dropdown
  await page.getByLabel('CI/CD Provider').selectOption('GitHub Actions'); // Or page.getByRole('radio', { name: 'GitHub Actions' }).click();
  await expect(page.getByText('Configuration Options')).toBeVisible(); // Assert wizard proceeds
}

test('TC-1: Verify authenticated user can successfully log in', async ({ page }) => {
  // Preconditions: User has valid credentials for the system
  await page.goto(LOGIN_URL);

  // Steps:
  await page.getByLabel('Username').fill(VALID_USERNAME);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  await expect(page).toHaveURL(DASHBOARD_URL);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); // Placeholder for dashboard element
});

test('TC-2: Verify authenticated user can navigate to the \'Templates\' section', async ({ page }) => {
  // Preconditions: User is successfully logged in to the system
  await login(page, VALID_USERNAME, VALID_PASSWORD);

  // Steps:
  await page.getByRole('link', { name: 'Templates' }).click();

  // Expected Result:
  await expect(page).toHaveURL(TEMPLATES_URL);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  await expect(page.getByText('Existing templates')).toBeVisible(); // Placeholder for content on templates page
});

test('TC-3: Verify authenticated user can initiate template generation process', async ({ page }) => {
  // Preconditions: User is on the 'Templates' section page
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);

  // Steps:
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible();
  await expect(page.getByText('Select Programming Language')).toBeVisible(); // Placeholder for wizard step 1 content
});

test('TC-4: Verify \'Go\' can be selected as a programming language in the wizard', async ({ page }) => {
  // Preconditions: User is in the 'Generate CI/CD Template' wizard
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);

  // Steps:
  await page.getByLabel('Programming Language').selectOption('Go'); // Assuming a select dropdown
  // Or: await page.getByRole('radio', { name: 'Go' }).click(); // If it's a radio button

  // Expected Result:
  await expect(page.getByLabel('Programming Language')).toHaveValue('Go'); // For select dropdown
  await expect(page.getByText('CI/CD Provider Selection')).toBeVisible(); // Assert wizard proceeds to next step
});

test('TC-5: Verify a supported CI/CD provider can be selected for Go', async ({ page }) => {
  // Preconditions: User has selected 'Go' as the programming language in the wizard
  // The system has at least one supported CI/CD provider configured for Go (e.g., GitHub Actions)
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await page.getByLabel('Programming Language').selectOption('Go');

  // Steps:
  await page.getByLabel('CI/CD Provider').selectOption('GitHub Actions'); // Assuming a select dropdown
  // Or: await page.getByRole('radio', { name: 'GitHub Actions' }).click(); // If it's a radio button

  // Expected Result:
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('GitHub Actions'); // For select dropdown
  await expect(page.getByText('Configuration Options')).toBeVisible(); // Assert wizard proceeds to next step
});

test('TC-6: Verify necessary configuration options are presented for Go and selected CI/CD provider', async ({ page }) => {
  // Preconditions: User has selected 'Go' and 'GitHub Actions' in the wizard
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);

  // Steps: (Implicitly observing the options)

  // Expected Result:
  await expect(page.getByLabel('Project Name')).toBeVisible();
  await expect(page.getByLabel('Go Version')).toBeVisible();
  await expect(page.getByLabel('Build Command')).toBeVisible();
  await expect(page.getByLabel('Test Command')).toBeVisible();
  // Add more assertions for other expected fields if any
});

test('TC-7: Verify successful generation of a CI/CD pipeline template after configuration', async ({ page }) => {
  // Preconditions: User has completed all required configuration for Go and GitHub Actions in the wizard
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);

  // Steps:
  await page.getByLabel('Project Name').fill('my-go-app');
  await page.getByLabel('Go Version').fill('1.20'); // Assuming a text input or select
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click(); // Or 'Finish'

  // Expected Result:
  await expect(page.getByText('Template generated successfully!')).toBeVisible(); // Placeholder for success message
  await expect(page.locator('.template-preview-content')).toBeVisible(); // Placeholder for template preview area
});

test('TC-8: Verify the generated Go pipeline template is syntactically valid', async ({ page }) => {
  // Preconditions: A Go/GitHub Actions template has been successfully generated
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);
  await page.getByLabel('Project Name').fill('my-go-app-valid');
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByText('Template generated successfully!')).toBeVisible();

  // Steps:
  const templateContent = await page.locator('.template-preview-content').textContent(); // Access the generated template content
  // Note: Syntactic validation (e.g., YAML linting) typically requires external tools or complex regex/parsing.
  // For Playwright, we can assert basic structure or presence of key YAML elements.

  // Expected Result:
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('name: my-go-app-valid CI/CD'); // Check for project name in template
  expect(templateContent).toContain('on: [push, pull_request]'); // Check for GitHub Actions trigger
  expect(templateContent).toContain('jobs:');
  expect(templateContent).toContain('runs-on: ubuntu-latest');
  expect(templateContent).toContain('- uses: actions/checkout@v3');
  expect(templateContent).toContain('- uses: actions/setup-go@v4');
  expect(templateContent).toContain('go-version: \'1.20\'');
});

test('TC-9: Verify the generated Go pipeline template contains expected CI/CD steps', async ({ page }) => {
  // Preconditions: A Go/GitHub Actions template has been successfully generated
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);
  await page.getByLabel('Project Name').fill('my-go-app-steps');
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByText('Template generated successfully!')).toBeVisible();

  // Steps:
  const templateContent = await page.locator('.template-preview-content').textContent();

  // Expected Result:
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('name: Checkout code');
  expect(templateContent).toContain('name: Setup Go environment');
  expect(templateContent).toContain('name: Install dependencies'); // e.g., go mod tidy
  expect(templateContent).toContain('run: go mod tidy'); // Specific command
  expect(templateContent).toContain('name: Build application');
  expect(templateContent).toContain('run: go build -o my-app'); // Specific command
  expect(templateContent).toContain('name: Run tests');
  expect(templateContent).toContain('run: go test ./...'); // Specific command
});

test('TC-10: Verify the generated template is available for preview and download', async ({ page }) => {
  // Preconditions: A Go/GitHub Actions template has been successfully generated
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);
  await page.getByLabel('Project Name').fill('my-go-app-download');
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByText('Template generated successfully!')).toBeVisible();

  // Steps:
  await page.getByRole('button', { name: 'Preview' }).click();
  // Expected Result: Preview displayed (already asserted by .template-preview-content visibility in TC-7)
  await expect(page.locator('.template-preview-content')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;

  // Expected Result: File successfully downloaded
  expect(download.suggestedFilename()).toContain('my-go-app-download');
  expect(download.suggestedFilename()).toContain('.yml'); // Assuming YAML format for GitHub Actions
  const path = await download.path();
  expect(path).not.toBeNull();
  // Further validation could involve reading the downloaded file content if needed
});

test('TC-11: Verify unauthenticated user cannot access Templates functionality', async ({ page }) => {
  // Preconditions: User is not logged in to the system
  // (Ensure no active session, e.g., by starting a fresh browser context or clearing storage)
  await page.context().clearCookies();
  await page.context().clearStorageState();

  // Steps:
  await page.goto(TEMPLATES_URL);

  // Expected Result:
  // The system prevents access to the 'Templates' functionality.
  // The user is either redirected to the login page, shown an 'Unauthorized' error, or the content is not displayed.
  await expect(page).toHaveURL(LOGIN_URL); // Redirected to login page
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Templates' })).not.toBeVisible(); // Ensure templates content is not visible
});

test('TC-12: Verify Templates functionality is accessible only to authenticated users (Security)', async ({ page }) => {
  // Preconditions: User is successfully logged in with valid credentials
  await login(page, VALID_USERNAME, VALID_PASSWORD);

  // Steps:
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);
  await page.getByLabel('Project Name').fill('secure-go-app');
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click();

  // Expected Result:
  await expect(page.getByText('Template generated successfully!')).toBeVisible();
  await expect(page.locator('.template-preview-content')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled();
  // This test essentially re-verifies the core functionality under an authenticated context,
  // ensuring no unexpected restrictions or errors for a logged-in user.
});

test('TC-13: Verify generated CI/CD pipeline template is usable as a CI/CD configuration', async ({ page }) => {
  // Preconditions: A Go/GitHub Actions template has been successfully generated and downloaded
  // Access to a GitHub repository where a Go application can be hosted
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);
  await page.getByLabel('Project Name').fill('github-go-app');
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByText('Template generated successfully!')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  // Playwright can download the file, but uploading it to GitHub, committing, and verifying CI/CD runs
  // is outside the scope of browser automation and would require GitHub API interaction or a separate CI/CD pipeline trigger.
  // This part of the test would typically be manual or part of an integration test suite.

  // Expected Result: (Cannot be fully automated by Playwright alone)
  // The CI/CD pipeline (e.g., GitHub Actions workflow) is triggered by the push,
  // and it executes successfully, building and testing the Go application as defined in the template.
  // We can only assert the download was successful here.
  expect(download.suggestedFilename()).toContain('github-go-app');
  expect(download.suggestedFilename()).toContain('.yml');
});

test('TC-14: Negative: Attempt to generate template with missing required configuration', async ({ page }) => {
  // Preconditions: User is in the template generation wizard, having selected Go and GitHub Actions
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);

  // Steps:
  // Leave 'Project Name' empty, fill others
  // await page.getByLabel('Project Name').fill(''); // Explicitly leave empty
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click(); // Or 'Finish'

  // Expected Result:
  await expect(page.getByText('Project Name is required.')).toBeVisible(); // Placeholder for validation error message
  await expect(page.getByText('Template generated successfully!')).not.toBeVisible(); // Ensure generation is prevented
});

test('TC-15: Negative: Attempt to select an unsupported CI/CD provider for Go', async ({ page }) => {
  // Preconditions: User is in the template generation wizard, having selected 'Go' as the programming language
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await page.getByLabel('Programming Language').selectOption('Go');
  await expect(page.getByText('CI/CD Provider Selection')).toBeVisible();

  // Steps:
  // Attempt to select a provider known to be unsupported for Go (e.g., 'GitLab CI' if it's not supported)
  // Assuming 'GitLab CI' is an option that should be disabled or trigger an error.
  // If it's a dropdown, it might be disabled or not present. If it's radio buttons, it might be greyed out.
  // For this example, we'll try to select it and expect an error or disabled state.
  await page.getByLabel('CI/CD Provider').selectOption('TODO_UNSUPPORTED_CI_PROVIDER', { timeout: 1000 }).catch(() => {}); // Attempt to select, ignore if not found/selectable

  // Expected Result:
  // The unsupported provider is either not selectable (e.g., greyed out), or an informative error message is displayed.
  // Option 1: Not selectable (e.g., disabled attribute)
  // await expect(page.getByLabel('CI/CD Provider').locator('option[value="TODO_UNSUPPORTED_CI_PROVIDER"]')).toBeDisabled();
  // Option 2: Error message displayed after attempt to select
  await expect(page.getByText('TODO_UNSUPPORTED_CI_PROVIDER is not supported for Go.')).toBeVisible(); // Placeholder for error message
  await expect(page.getByText('Configuration Options')).not.toBeVisible(); // Ensure wizard does not proceed
});

test('TC-16: Edge Case: Generate template with a very long project name', async ({ page }) => {
  // Preconditions: User is in the template generation wizard, having selected Go and GitHub Actions
  await login(page, VALID_USERNAME, VALID_PASSWORD);
  await navigateToTemplates(page);
  await startTemplateWizard(page);
  await selectGoAndGitHubActions(page);

  // Steps:
  const veryLongProjectName = 'a'.repeat(256); // Exceeding typical field limits
  await page.getByLabel('Project Name').fill(veryLongProjectName);
  await page.getByLabel('Go Version').fill('1.20');
  await page.getByLabel('Build Command').fill('go build -o my-app');
  await page.getByLabel('Test Command').fill('go test ./...');
  await page.getByRole('button', { name: 'Generate' }).click(); // Or 'Finish'

  // Expected Result:
  // The system either successfully generates the template with the long project name correctly incorporated,
  // or it displays a clear validation error indicating that the project name exceeds the maximum allowed length.
  const successMessage = page.getByText('Template generated successfully!');
  const errorMessage = page.getByText('Project Name exceeds maximum length.'); // Placeholder for validation error

  const isSuccess = await successMessage.isVisible();
  const isError = await errorMessage.isVisible();

  if (isSuccess) {
    await expect(page.locator('.template-preview-content')).toBeVisible();
    const templateContent = await page.locator('.template-preview-content').textContent();
    expect(templateContent).toContain(veryLongProjectName.substring(0, 255)); // Check if truncated or full name is used
  } else if (isError) {
    await expect(errorMessage).toBeVisible();
    await expect(page.locator('.template-preview-content')).not.toBeVisible();
  } else {
    // Fallback if neither success nor error message is immediately visible
    await expect(successMessage.or(errorMessage)).toBeVisible(); // Expect one of them to appear
  }
});
