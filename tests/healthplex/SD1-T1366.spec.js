const { test, expect } = require('@playwright/test');

// Helper function for login
async function login(page) {
  await page.goto(process.env.BASE_URL + '/login');
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
}

test('Verify authenticated user can successfully log in', async ({ page }) => {
  // Preconditions: User has valid login credentials
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter valid username in the username field.
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter valid password in the password field.
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // User is successfully logged in and redirected to the dashboard or home page.
  await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('Verify unauthenticated user cannot access \'Templates\' section (Business Rule Enforcement)', async ({ page }) => {
  // Preconditions: Ensure user is logged out.
  // Clear cookies to ensure logged out state
  await page.context().clearCookies();

  // Steps:
  // Attempt to navigate directly to the '/templates' URL (or equivalent 'Templates' section URL).
  await page.goto(process.env.BASE_URL + '/templates');

  // Expected Result:
  // System redirects to the login page or displays an 'Access Denied' error message.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  // Alternatively, if it shows an error on the same page:
  // await expect(page.getByText('Access Denied')).toBeVisible();
});

test('Verify authenticated user can navigate to the \'Templates\' section', async ({ page }) => {
  // Preconditions: User is successfully logged in
  await login(page);

  // Steps:
  // From the dashboard/home page, locate and click on the 'Templates' navigation link/button.
  await page.getByRole('link', { name: 'Templates' }).click();

  // Expected Result:
  // The 'Templates' section page is displayed.
  await expect(page).toHaveURL(process.env.BASE_URL + '/templates');
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
});

test('Verify authenticated user can click the \'Generate Template\' button', async ({ page }) => {
  // Preconditions: User is on the 'Templates' section page
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

  // Steps:
  // Locate and click the 'Generate Template' button.
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // The template generation wizard or form is displayed, showing options for language and CI/CD provider selection.
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await expect(page.getByLabel('Programming Language')).toBeVisible();
  await expect(page.getByLabel('CI/CD Provider')).toBeVisible();
});

test('Verify \'Go\' is presented as a programming language option', async ({ page }) => {
  // Preconditions: User is on the template generation form/wizard
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();

  // Steps:
  // Locate the programming language selection dropdown or list.
  await page.getByLabel('Programming Language').click(); // Open the dropdown

  // Expected Result:
  // The option 'Go' is visible and selectable in the programming language list.
  await expect(page.getByRole('option', { name: 'Go' })).toBeVisible();
});

test('Verify authenticated user can select \'Go\' as the programming language', async ({ page }) => {
  // Preconditions: User is on the template generation form/wizard, 'Go' is presented as a language option
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();

  // Steps:
  // Select 'Go' from the programming language selection dropdown/list.
  await page.getByLabel('Programming Language').click(); // Open the dropdown
  await page.getByRole('option', { name: 'Go' }).click(); // Select 'Go'

  // Expected Result:
  // The 'Go' language option is highlighted or marked as selected.
  await expect(page.getByLabel('Programming Language')).toHaveValue('Go');
});

test('Verify a list of supported CI/CD providers is presented', async ({ page }) => {
  // Preconditions: User has selected 'Go' as the programming language
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await expect(page.getByLabel('Programming Language')).toHaveValue('Go');

  // Steps:
  // Locate the CI/CD provider selection dropdown or list.
  await page.getByLabel('CI/CD Provider').click(); // Open the dropdown

  // Expected Result:
  // A list of supported CI/CD providers (e.g., 'Provider A', 'Provider B') is displayed.
  await expect(page.getByRole('option', { name: 'Provider A' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Provider B' })).toBeVisible();
});

test('Verify authenticated user can select a supported CI/CD provider', async ({ page }) => {
  // Preconditions: User has selected 'Go' as the programming language, A list of supported CI/CD providers is presented
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await expect(page.getByLabel('Programming Language')).toHaveValue('Go');

  // Steps:
  // Select a supported CI/CD provider (e.g., 'Provider A') from the list.
  await page.getByLabel('CI/CD Provider').click(); // Open the dropdown
  await page.getByRole('option', { name: 'Provider A' }).click(); // Select 'Provider A'

  // Expected Result:
  // The selected CI/CD provider is highlighted or marked as selected.
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('Provider A');
});

test('Verify required configuration fields are displayed for selected Go language and CI/CD provider', async ({ page }) => {
  // Preconditions: User has selected 'Go' as the programming language, User has selected 'Provider A' as the CI/CD provider
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();

  // Steps:
  // Observe the configuration section of the template generation form.

  // Expected Result:
  // Specific configuration fields (e.g., 'Project Name', 'Repository URL', 'Go Version') are displayed and marked as required.
  await expect(page.getByLabel('Project Name', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Repository URL', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Go Version', { exact: true })).toBeVisible();
  // Optional: Verify 'required' attribute if applicable
  // await expect(page.getByLabel('Project Name', { exact: true })).toHaveAttribute('aria-required', 'true');
});

test('Verify authenticated user can complete all required configuration fields', async ({ page }) => {
  // Preconditions: User has selected 'Go' and 'Provider A', Required configuration fields are displayed
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();

  // Steps:
  // Enter valid data into all displayed required configuration fields (e.g., 'Project Name': 'MyGoApp', 'Repository URL': 'https://github.com/user/mygoapp', 'Go Version': '1.18').
  await page.getByLabel('Project Name').fill('MyGoApp');
  await page.getByLabel('Repository URL').fill('https://github.com/user/mygoapp');
  await page.getByLabel('Go Version').fill('1.18');

  // Expected Result:
  // All required configuration fields accept input and are marked as complete/valid.
  await expect(page.getByLabel('Project Name')).toHaveValue('MyGoApp');
  await expect(page.getByLabel('Repository URL')).toHaveValue('https://github.com/user/mygoapp');
  await expect(page.getByLabel('Go Version')).toHaveValue('1.18');
});

test('Verify successful generation of a pipeline template with valid configuration', async ({ page }) => {
  // Preconditions: User has selected 'Go' and 'Provider A', All required configuration fields are completed with valid data
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();
  await page.getByLabel('Project Name').fill('MyGoApp');
  await page.getByLabel('Repository URL').fill('https://github.com/user/mygoapp');
  await page.getByLabel('Go Version').fill('1.18');

  // Steps:
  // Click the 'Generate Template' or 'Submit' button.
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // The system successfully generates and displays/downloads the pipeline template.
  await expect(page.getByText('Template generated successfully')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Generated Template Output' })).toBeVisible();
});

test('Verify the generated pipeline template is valid for a Go project and selected CI/CD provider', async ({ page }) => {
  // Preconditions: A pipeline template has been successfully generated (from TC-11)
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();
  await page.getByLabel('Project Name').fill('MyGoApp');
  await page.getByLabel('Repository URL').fill('https://github.com/user/mygoapp');
  await page.getByLabel('Go Version').fill('1.18');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByText('Template generated successfully')).toBeVisible();

  // Steps:
  // Review the content of the generated template.
  const templateContent = await page.getByRole('textbox', { name: 'Generated Template Output' }).inputValue();
  // Check for Go-specific build commands or configurations.
  // Check for 'Provider A'-specific syntax and structure.

  // Expected Result:
  // The generated template contains valid syntax and configuration relevant to a Go project and 'Provider A' CI/CD system (e.g., includes 'go build', 'go test' commands, and 'Provider A' specific job definitions).
  expect(templateContent).toContain('go build');
  expect(templateContent).toContain('go test');
  expect(templateContent).toContain('providerA_specific_job_definition'); // Placeholder for Provider A specific syntax
});

test('Verify template generation fails if required configuration fields are incomplete (Business Rule Enforcement)', async ({ page }) => {
  // Preconditions: User has selected 'Go' and 'Provider A', Required configuration fields are displayed
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();

  // Steps:
  // Enter valid data into some, but not all, required configuration fields (e.g., leave 'Repository URL' empty).
  await page.getByLabel('Project Name').fill('MyGoApp');
  // await page.getByLabel('Repository URL').fill(''); // Intentionally left empty
  await page.getByLabel('Go Version').fill('1.18');
  // Click the 'Generate Template' or 'Submit' button.
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // System displays an error message indicating that required fields are missing and prevents template generation.
  await expect(page.getByText('Repository URL is required')).toBeVisible();
  await expect(page.getByText('Template generated successfully')).not.toBeVisible();
});

test('Verify template generation fails with invalid input in a required field (Edge Case / Validation)', async ({ page }) => {
  // Preconditions: User has selected 'Go' and 'Provider A', Required configuration fields are displayed
  await login(page);
  await page.goto(process.env.BASE_URL + '/templates');
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Template' })).toBeVisible();
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Go' }).click();
  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'Provider A' }).click();

  // Steps:
  // Enter valid data into all required fields except one.
  await page.getByLabel('Project Name').fill('MyGoApp');
  await page.getByLabel('Repository URL').fill('https://github.com/user/mygoapp');
  // For one required field (e.g., 'Go Version'), enter an invalid format or value (e.g., 'abc' instead of '1.18').
  await page.getByLabel('Go Version').fill('abc');
  // Click the 'Generate Template' or 'Submit' button.
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // System displays an error message specific to the invalid input (e.g., 'Invalid Go Version format') and prevents template generation.
  await expect(page.getByText('Invalid Go Version format')).toBeVisible();
  await expect(page.getByText('Template generated successfully')).not.toBeVisible();
});
