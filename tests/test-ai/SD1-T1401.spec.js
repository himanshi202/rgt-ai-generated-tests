const { test, expect } = require('@playwright/test');

// --- Helper Functions ---

/**
 * Logs in a user with valid credentials.
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
  await page.goto(process.env.BASE_URL + '/login');
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard|home/);
}

/**
 * Navigates to the Templates section after logging in.
 * @param {import('@playwright/test').Page} page
 */
async function navigateToTemplates(page) {
  await login(page);
  await page.getByRole('link', { name: 'Templates' }).click();
  await expect(page.getByRole('heading', { name: 'Templates', level: 1 })).toBeVisible();
}

/**
 * Initiates the template generation process after navigating to Templates.
 * @param {import('@playwright/test').Page} page
 */
async function initiateTemplateGeneration(page) {
  await navigateToTemplates(page);
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template', level: 1 })).toBeVisible();
}

/**
 * Selects Java as the language and Jenkins as the provider in the template generation form.
 * @param {import('@playwright/test').Page} page
 */
async function selectJavaAndJenkins(page) {
  await initiateTemplateGeneration(page);
  await page.getByLabel('Programming Language').selectOption('Java');
  await expect(page.getByLabel('Programming Language')).toHaveValue('Java');
  await page.getByLabel('CI/CD Provider').selectOption('Jenkins');
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('Jenkins');
}

// --- Test Cases ---

test('Verify successful user login with valid credentials', async ({ page }) => {
  // Preconditions: User has valid credentials to log in
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username in the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter a valid password in the 'Password' field
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // The user is successfully logged in and redirected to the application's dashboard or home page.
  await expect(page).toHaveURL(/dashboard|home/);
  await expect(page.getByText('Welcome, ' + process.env.VALID_USERNAME)).toBeVisible(); // Assuming a welcome message
});

test('Verify navigation to the \'Templates\' section', async ({ page }) => {
  // Preconditions: User is successfully logged in
  await login(page);

  // Steps:
  // From the application's dashboard/home page, locate and click the 'Templates' navigation link or button
  await page.getByRole('link', { name: 'Templates' }).click();

  // Expected Result:
  // The 'Templates' section of the application is displayed, showing available template options.
  await expect(page).toHaveURL(//templates/);
  await expect(page.getByRole('heading', { name: 'Templates', level: 1 })).toBeVisible();
  await expect(page.getByText('Available Template Options')).toBeVisible(); // Assuming this text indicates template options
});

test('Verify initiation of the \'Generate Template\' process', async ({ page }) => {
  // Preconditions: User is on the 'Templates' section
  await navigateToTemplates(page);

  // Steps:
  // Locate and click the 'Generate Template' button or link within the 'Templates' section
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // The template generation wizard or form is displayed, prompting for language and provider selection.
  await expect(page).toHaveURL(//templates/generate/);
  await expect(page.getByRole('heading', { name: 'Generate CI/CD Template', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Programming Language')).toBeVisible();
  await expect(page.getByLabel('CI/CD Provider')).toBeVisible();
});

test('Verify selection of \'Java\' as the programming language', async ({ page }) => {
  // Preconditions: User is on the template generation form
  await initiateTemplateGeneration(page);

  // Steps:
  // In the programming language selection dropdown or list, select 'Java'
  await page.getByLabel('Programming Language').selectOption('Java');

  // Expected Result:
  // 'Java' is successfully selected, and the UI updates to show relevant options or configuration fields for Java-based templates.
  await expect(page.getByLabel('Programming Language')).toHaveValue('Java');
  await expect(page.getByText('Java-specific configuration options')).toBeVisible(); // Assuming UI updates with this text
});

test('Verify selection of a supported CI/CD provider (e.g., Jenkins)', async ({ page }) => {
  // Preconditions: User is on the template generation form, 'Java' has been selected as the programming language
  await initiateTemplateGeneration(page);
  await page.getByLabel('Programming Language').selectOption('Java');
  await expect(page.getByLabel('Programming Language')).toHaveValue('Java');

  // Steps:
  // In the CI/CD provider selection dropdown or list, select 'Jenkins'
  await page.getByLabel('CI/CD Provider').selectOption('Jenkins');

  // Expected Result:
  // 'Jenkins' is successfully selected, and the UI updates to show relevant configuration fields specific to Java and Jenkins.
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('Jenkins');
  await expect(page.getByText('Jenkins-specific configuration fields')).toBeVisible(); // Assuming UI updates with this text
});

test('Verify successful completion of all required configuration fields for Java + Jenkins', async ({ page }) => {
  // Preconditions: User is on the template generation form, 'Java' has been selected as the programming language, 'Jenkins' has been selected as the CI/CD provider
  await selectJavaAndJenkins(page);

  // Steps:
  // Enter a valid 'Project Name' (e.g., 'MyJavaApp')
  await page.getByLabel('Project Name').fill('MyJavaApp');
  // Enter a valid 'Repository URL' (e.g., 'https://github.com/myorg/myjavaapp.git')
  await page.getByLabel('Repository URL').fill('https://github.com/myorg/myjavaapp.git');
  // Enter a valid 'Branch Name' (e.g., 'main')
  await page.getByLabel('Branch Name').fill('main');
  // Fill in any other required configuration fields with valid data
  await page.getByLabel('Build Command', { exact: true }).fill('mvn clean install'); // Example of another field

  // Expected Result:
  // All required configuration fields accept the input without displaying any validation errors.
  await expect(page.getByText('Project Name is required')).not.toBeVisible();
  await expect(page.getByText('Repository URL is required')).not.toBeVisible();
  await expect(page.getByText('Branch Name is required')).not.toBeVisible();
  await expect(page.getByText('Build Command is required')).not.toBeVisible();
});

test('Verify successful generation of a CI/CD pipeline template for Java + Jenkins', async ({ page }) => {
  // Preconditions: User is on the template generation form, 'Java' has been selected as the programming language, 'Jenkins' has been selected as the CI/CD provider, All required configuration fields have been successfully completed with valid data
  await selectJavaAndJenkins(page);
  await page.getByLabel('Project Name').fill('MyJavaApp');
  await page.getByLabel('Repository URL').fill('https://github.com/myorg/myjavaapp.git');
  await page.getByLabel('Branch Name').fill('main');
  await page.getByLabel('Build Command', { exact: true }).fill('mvn clean install');

  // Steps:
  // Click the 'Generate Template' or 'Submit' button to finalize the process
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // The system successfully generates a CI/CD pipeline template based on the selected Java language and Jenkins provider. The template content is displayed in the UI or offered as a downloadable file, reflecting the provided configuration.
  await expect(page.getByRole('heading', { name: 'Generated Template', level: 2 })).toBeVisible();
  await expect(page.getByText('pipeline {')).toBeVisible(); // Assuming template content starts with 'pipeline {'
  await expect(page.getByText('language: Java')).toBeVisible();
  await expect(page.getByText('provider: Jenkins')).toBeVisible();
});

test('Verify error handling for invalid login credentials', async ({ page }) => {
  // Preconditions: None
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter an invalid username (e.g., 'wronguser')
  await page.getByLabel('Username').fill(process.env.INVALID_USERNAME);
  // Enter an invalid password (e.g., 'wrongpass')
  await page.getByLabel('Password').fill(process.env.INVALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An error message indicating 'Invalid credentials' or similar is displayed on the login page, and the user remains unauthenticated.
  await expect(page.getByText('Invalid credentials')).toBeVisible();
  await expect(page).toHaveURL(//login/); // User remains on the login page
});

test('Verify error handling when required configuration fields are left empty during template generation', async ({ page }) => {
  // Preconditions: User is on the template generation form, 'Java' has been selected as the programming language, 'Jenkins' has been selected as the CI/CD provider
  await selectJavaAndJenkins(page);

  // Steps:
  // Enter valid data for some required fields (e.g., 'Repository URL', 'Branch Name')
  await page.getByLabel('Repository URL').fill('https://github.com/myorg/myjavaapp.git');
  await page.getByLabel('Branch Name').fill('main');
  // Leave one or more required fields empty (e.g., 'Project Name')
  // Project Name field is intentionally left empty
  // Click the 'Generate Template' or 'Submit' button
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result:
  // An error message is displayed next to the empty required field(s) (e.g., 'Project Name is required'), and the template generation process does not proceed.
  await expect(page.getByText('Project Name is required')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Generated Template', level: 2 })).not.toBeVisible(); // Ensure template generation did not proceed
});
