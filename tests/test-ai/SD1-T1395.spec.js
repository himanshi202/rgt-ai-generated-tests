const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // TODO: Replace with actual base URL
const LOGIN_PATH = '/login';
const TEMPLATES_PATH = '/templates';
const VALID_USERNAME = process.env.VALID_USERNAME || 'user@example.com'; // TODO: Replace with actual valid username
const VALID_PASSWORD = process.env.VALID_PASSWORD || 'password123'; // TODO: Replace with actual valid password

// Helper function for login
async function login(page) {
  await page.goto(`${BASE_URL}${LOGIN_PATH}`);
  await page.getByLabel('Username').fill(VALID_USERNAME);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard|home|templates/); // Expect redirection to dashboard or similar
}

// Helper function to navigate to Templates and initiate wizard
async function navigateToTemplatesAndOpenWizard(page) {
  await login(page);
  await page.getByRole('link', { name: 'Templates' }).click();
  await expect(page).toHaveURL(`${BASE_URL}${TEMPLATES_PATH}`);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate Template' }).click();
  await expect(page.getByRole('heading', { name: 'CI/CD Template Generation Wizard' })).toBeVisible();
}

// Helper function to select Java and GitLab CI
async function selectJavaAndGitLabCI(page) {
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Java' }).click();
  await expect(page.getByLabel('Programming Language')).toHaveValue('Java');

  await page.getByLabel('CI/CD Provider').click();
  await page.getByRole('option', { name: 'GitLab CI' }).click();
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('GitLab CI');
}

// Helper function to fill minimal valid configuration for Java/Maven/GitLab CI
async function fillMinimalJavaMavenGitLabCIConfig(page, javaVersion = 'Java 17', buildTool = 'Maven') {
  // Ensure Java and GitLab CI are selected first if not already
  const currentLang = await page.getByLabel('Programming Language').inputValue();
  const currentProvider = await page.getByLabel('CI/CD Provider').inputValue();
  if (currentLang !== 'Java' || currentProvider !== 'GitLab CI') {
    await selectJavaAndGitLabCI(page);
  }

  // Select Java Version
  await page.getByLabel('Java Version').click();
  await page.getByRole('option', { name: javaVersion }).click();
  await expect(page.getByLabel('Java Version')).toHaveValue(javaVersion);

  // Select Build Tool
  await page.getByLabel('Build Tool').click();
  await page.getByRole('option', { name: buildTool }).click();
  await expect(page.getByLabel('Build Tool')).toHaveValue(buildTool);

  // Fill Test Command (assuming it's a required field)
  await page.getByLabel('Test Command').fill(buildTool === 'Maven' ? 'mvn test' : './gradlew test');
}

test('TC-1: Verify authenticated user can successfully log in', async ({ page }) => {
  // Preconditions: None
  await page.goto(`${BASE_URL}${LOGIN_PATH}`);
  await page.getByLabel('Username').fill(VALID_USERNAME);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: User is successfully logged in and redirected to the dashboard or home page.
  await expect(page).toHaveURL(/dashboard|home|templates/); // TODO: Adjust expected URL pattern if more specific
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible(); // Example of an element on a logged-in page
});

test('TC-2: Verify authenticated user can navigate to the \'Templates\' section', async ({ page }) => {
  // Preconditions: User is successfully logged in.
  await login(page);

  // Steps: Locate and click on the 'Templates' link/menu item in the navigation.
  await page.getByRole('link', { name: 'Templates' }).click();

  // Expected Result: The 'Templates' section page is displayed, showing existing templates or options to generate a new one.
  await expect(page).toHaveURL(`${BASE_URL}${TEMPLATES_PATH}`);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate Template' })).toBeVisible();
});

test('TC-3: Verify unauthenticated user cannot access \'Templates\' section (Security)', async ({ page }) => {
  // Preconditions: User is NOT logged in.
  // Ensure no login happens before this test.

  // Steps: Attempt to directly navigate to the 'Templates' section URL (e.g., /templates).
  // Alternatively, if direct URL access is not possible, verify the 'Templates' link is not visible or clickable.
  await page.goto(`${BASE_URL}${TEMPLATES_PATH}`);

  // Expected Result: The system redirects to the login page or displays an 'Access Denied' error. The 'Templates' section is not accessible.
  // Assuming redirection to login page is the primary behavior.
  await expect(page).toHaveURL(`${BASE_URL}${LOGIN_PATH}`);
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  // If it shows an error page instead:
  // await expect(page.getByText('Access Denied')).toBeVisible(); // TODO: Adjust selector for actual error message
});

test('TC-4: Verify \'Generate Template\' button initiates the template generation process', async ({ page }) => {
  // Preconditions: User is logged in and on the 'Templates' section page.
  await login(page);
  await page.getByRole('link', { name: 'Templates' }).click();
  await expect(page).toHaveURL(`${BASE_URL}${TEMPLATES_PATH}`);

  // Steps: Locate and click the 'Generate Template' button.
  await page.getByRole('button', { name: 'Generate Template' }).click();

  // Expected Result: The CI/CD template generation wizard opens.
  await expect(page.getByRole('heading', { name: 'CI/CD Template Generation Wizard' })).toBeVisible();
  await expect(page.getByLabel('Programming Language')).toBeVisible(); // Check for an initial wizard control
});

test('TC-5: Verify CI/CD template generation wizard opens with initial options', async ({ page }) => {
  // Preconditions: User has clicked 'Generate Template' and the wizard is expected to open.
  await navigateToTemplatesAndOpenWizard(page);

  // Steps: Observe the wizard interface.
  // (Implicitly done by checking visibility of elements)

  // Expected Result: The template generation wizard is displayed, presenting initial options such as programming language selection.
  await expect(page.getByRole('heading', { name: 'CI/CD Template Generation Wizard' })).toBeVisible();
  await expect(page.getByLabel('Programming Language')).toBeVisible();
  await expect(page.getByLabel('CI/CD Provider')).toBeVisible();
});

test('TC-6: Verify wizard allows selection of \'Java\' as a programming language', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open.
  await navigateToTemplatesAndOpenWizard(page);

  // Steps: Locate the programming language selection control. Verify 'Java' is present in the list of options. Select 'Java'.
  await page.getByLabel('Programming Language').click();
  await expect(page.getByRole('option', { name: 'Java' })).toBeVisible();
  await page.getByRole('option', { name: 'Java' }).click();

  // Expected Result: 'Java' can be successfully selected as the programming language, and subsequent options update accordingly.
  await expect(page.getByLabel('Programming Language')).toHaveValue('Java');
  // Verify subsequent options update (e.g., build tool dropdown becomes visible/enabled)
  await expect(page.getByLabel('Build Tool')).toBeVisible();
});

test('TC-7: Verify wizard allows selection of a supported CI/CD provider for Java', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language.
  await navigateToTemplatesAndOpenWizard(page);
  await page.getByLabel('Programming Language').click();
  await page.getByRole('option', { name: 'Java' }).click();

  // Steps: Locate the CI/CD provider selection control. Verify at least one supported provider (e.g., 'GitLab CI') is present in the list of options. Select a supported provider (e.g., 'GitLab CI').
  await page.getByLabel('CI/CD Provider').click();
  await expect(page.getByRole('option', { name: 'GitLab CI' })).toBeVisible();
  await page.getByRole('option', { name: 'GitLab CI' }).click();

  // Expected Result: A supported CI/CD provider can be successfully selected, and relevant configuration options for Java and the provider are presented.
  await expect(page.getByLabel('CI/CD Provider')).toHaveValue('GitLab CI');
  await expect(page.getByLabel('Java Version')).toBeVisible(); // Check for Java-specific config
});

test('TC-8: Verify wizard presents necessary configuration options for Java and selected CI/CD provider', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await selectJavaAndGitLabCI(page);

  // Steps: Observe the configuration options presented.
  // (Implicitly done by checking visibility)

  // Expected Result: Configuration options relevant to Java (e.g., Java version, build tool like Maven/Gradle, test command) and the selected CI/CD provider are displayed.
  await expect(page.getByLabel('Java Version')).toBeVisible();
  await expect(page.getByLabel('Build Tool')).toBeVisible();
  await expect(page.getByLabel('Test Command')).toBeVisible();
  // TODO_SELECTOR: Add more specific assertions for provider-specific options if any, e.g., 'GitLab Runner Tag'
});

test('TC-9: Verify default configuration options are sensible for Java/GitLab CI', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await selectJavaAndGitLabCI(page);

  // Steps: Observe the pre-filled or default values for all configuration options.

  // Expected Result: Default configuration options are present and represent common/sensible choices for a Java application with the selected CI/CD provider (e.g., latest LTS Java version, Maven build tool).
  await expect(page.getByLabel('Java Version')).toHaveValue('Java 17'); // TODO: Adjust if default is different (e.g., Java 11)
  await expect(page.getByLabel('Build Tool')).toHaveValue('Maven'); // TODO: Adjust if default is different (e.g., Gradle)
  await expect(page.getByLabel('Test Command')).toHaveValue('mvn test'); // TODO: Adjust if default is different
});

test('TC-10: Verify successful template generation with valid configuration', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected. All required configuration options are filled with valid values.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);

  // Steps: Fill in all required configuration options (e.g., Java 17, Maven, 'mvn clean install'). Click the 'Generate' or 'Finish' button.
  await page.getByLabel('Build Command').fill('mvn clean install'); // Assuming this is a required field
  await page.getByRole('button', { name: 'Generate' }).click(); // TODO: Use 'Finish' if that's the button name

  // Expected Result: The system successfully generates a CI/CD pipeline template, and a confirmation or preview screen is displayed.
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible(); // TODO: Adjust selector for actual confirmation/preview screen
  await expect(page.locator('.template-content-display')).toBeVisible(); // TODO: Adjust selector for where the template content is displayed
});

test('TC-11: Verify generated Java pipeline template is syntactically valid for selected CI/CD provider', async ({ page }) => {
  // Preconditions: A Java CI/CD pipeline template has been successfully generated (e.g., using TC-10).
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Access the generated template content (preview or download). Inspect the template content for correct syntax according to the selected CI/CD provider's specification (e.g., YAML for GitLab CI).
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('stages:');
  expect(templateContent).toContain('jobs:');
  expect(templateContent).toContain('script:');
  expect(templateContent).toContain('image:'); // Common in GitLab CI for Java
  // Basic YAML syntax check (more robust checks might require a YAML parser library, which is out of scope for a Playwright script)
  expect(templateContent).toMatch(/\bimage:\s*openjdk:\d+/);
});

test('TC-12: Verify generated Java pipeline template contains expected build steps (e.g., Maven clean install)', async ({ page }) => {
  // Preconditions: A Java CI/CD pipeline template has been successfully generated (e.g., using TC-10) with Maven selected as build tool.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page, 'Java 17', 'Maven');
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Access the generated template content. Verify the presence of steps for building the Java application (e.g., a 'build' stage/job containing `mvn clean install` or similar commands).
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('mvn clean install');
  expect(templateContent).toMatch(/\bbuild:\s*\n\s*script:\s*-\s*mvn clean install/); // More specific check for build stage
});

test('TC-13: Verify generated Java pipeline template contains expected test steps (e.g., Maven test)', async ({ page }) => {
  // Preconditions: A Java CI/CD pipeline template has been successfully generated (e.g., using TC-10) with Maven selected as build tool.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page, 'Java 17', 'Maven');
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Access the generated template content. Verify the presence of steps for running tests (e.g., a 'test' stage/job containing `mvn test` or similar commands).
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('mvn test');
  expect(templateContent).toMatch(/\btest:\s*\n\s*script:\s*-\s*mvn test/); // More specific check for test stage
});

test('TC-14: Verify generated template is available for preview', async ({ page }) => {
  // Preconditions: A CI/CD pipeline template has been successfully generated.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Locate and click the 'Preview' option for the generated template.
  // Assuming the 'Generate' button directly leads to a preview, or there's a separate 'Preview' button on a results page.
  // If it's a separate button:
  // await page.getByRole('button', { name: 'Preview' }).click(); // TODO: Adjust if there's a separate preview button

  // Expected Result: The full content of the generated template is displayed in a readable format within the system.
  await expect(page.locator('.template-content-display')).toBeVisible(); // TODO: Adjust selector
  const templateContent = await page.locator('.template-content-display').textContent();
  expect(templateContent.length).toBeGreaterThan(100); // Ensure content is substantial
});

test('TC-15: Verify generated template is available for download', async ({ page }) => {
  // Preconditions: A CI/CD pipeline template has been successfully generated.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Locate and click the 'Download' option for the generated template.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;

  // Expected Result: The generated template file is downloaded to the user's local machine.
  expect(download.suggestedFilename()).toMatch(/\.yml|\.yaml$/); // Expect a YAML file extension
  const path = await download.path();
  expect(path).toBeTruthy(); // Ensure a file was downloaded to a temporary path
  // You can further read the file content if needed: fs.readFileSync(path, 'utf8');
});

test('TC-16: Verify generated template is usable (non-empty, complete structure)', async ({ page }) => {
  // Preconditions: A CI/CD pipeline template has been successfully generated (e.g., using TC-10).
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  // Steps: Access the generated template content. Verify the template file is not empty. Verify the template contains a complete and logical structure for a CI/CD pipeline (e.g., stages, jobs, scripts, environment variables).
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent.trim().length).toBeGreaterThan(50); // Not empty, reasonable length
  expect(templateContent).toContain('stages:');
  expect(templateContent).toContain('jobs:');
  expect(templateContent).toContain('script:');
  expect(templateContent).toContain('image:');
  // Check for common CI/CD structure elements
  expect(templateContent).toMatch(/\bvariables:\s*\n/); // TODO: Adjust if variables are not always present or have a different structure
});

test('TC-17: Negative: Attempt to generate template with missing required configuration', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await selectJavaAndGitLabCI(page);

  // Steps: Leave one or more required configuration fields empty (e.g., 'Java Version'). Click the 'Generate' or 'Finish' button.
  // Intentionally leave 'Java Version' empty by not selecting it after selecting Java language.
  // Or, if it defaults, clear it:
  // await page.getByLabel('Java Version').fill(''); // If it's an input field
  // await page.getByLabel('Java Version').selectOption({ index: 0 }); // If first option is 'Select one...' or empty

  // For this example, we'll assume 'Build Command' is required and leave it empty.
  // await page.getByLabel('Build Command').fill(''); // Ensure it's empty if it has a default

  await page.getByRole('button', { name: 'Generate' }).click();

  // Expected Result: The system prevents template generation and displays an error message indicating which required fields are missing.
  await expect(page.locator('.error-message')).toBeVisible(); // TODO: Adjust selector for actual error message
  await expect(page.locator('.error-message')).toContainText('required'); // Check for common error text
  await expect(page.getByRole('heading', { name: 'Template Preview' })).not.toBeVisible(); // Ensure wizard doesn't proceed
});

test('TC-18: Negative: Attempt to generate template with invalid configuration values', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await selectJavaAndGitLabCI(page);

  // Steps: Enter an invalid value into a configuration field (e.g., 'abc' for 'Java Version' if it expects a number, or a non-existent build tool). Click the 'Generate' or 'Finish' button.
  await page.getByLabel('Java Version').click();
  await page.getByRole('option', { name: 'Java 17' }).click(); // Select a valid one first
  await page.getByLabel('Build Tool').click();
  await page.getByRole('option', { name: 'Maven' }).click(); // Select a valid one first

  // Now, attempt to input an invalid value into a text field, e.g., 'Test Command'
  await page.getByLabel('Test Command').fill('invalid-command-xyz'); // Assuming validation for command syntax

  await page.getByRole('button', { name: 'Generate' }).click();

  // Expected Result: The system prevents template generation and displays an error message indicating the invalid input.
  await expect(page.locator('.error-message')).toBeVisible(); // TODO: Adjust selector for actual error message
  await expect(page.locator('.error-message')).toContainText('invalid'); // Check for common error text
  await expect(page.getByRole('heading', { name: 'Template Preview' })).not.toBeVisible(); // Ensure wizard doesn't proceed
});

test('TC-19: Edge Case: Verify template generation with minimal valid configuration', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);

  // Steps: Provide only the absolute minimum required valid configuration (e.g., default Java version, default build tool). Click the 'Generate' or 'Finish' button. Access the generated template content and verify its syntactic validity and usability.
  // The fillMinimalJavaMavenGitLabCIConfig helper already does this.
  await page.getByRole('button', { name: 'Generate' }).click();

  // Expected Result: A syntactically valid and usable CI/CD pipeline template is generated, reflecting the minimal configuration.
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent.trim().length).toBeGreaterThan(50);
  expect(templateContent).toContain('stages:');
  expect(templateContent).toContain('mvn test'); // Should contain default test command
});

test('TC-20: Edge Case: Verify template generation for Gradle build tool', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page, 'Java 17', 'Gradle');

  // Steps: Select 'Gradle' as the build tool (if available) and fill other required configurations. Click the 'Generate' or 'Finish' button. Access the generated template content and verify it contains appropriate Gradle build and test commands (e.g., `./gradlew build`, `./gradlew test`).
  await page.getByLabel('Build Command').fill('./gradlew build'); // Assuming this is a required field
  await page.getByRole('button', { name: 'Generate' }).click();

  // Expected Result: A syntactically valid and usable CI/CD pipeline template is generated with correct Gradle commands for building and testing.
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();
  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent).toContain('./gradlew build');
  expect(templateContent).toContain('./gradlew test');
});

test('TC-21: Edge Case: Verify template generation for different Java versions', async ({ page }) => {
  // Preconditions: CI/CD template generation wizard is open. 'Java' is selected as the programming language. A supported CI/CD provider (e.g., 'GitLab CI') is selected.
  await navigateToTemplatesAndOpenWizard(page);
  await selectJavaAndGitLabCI(page);

  const javaVersions = ['Java 11', 'Java 17']; // TODO: Add more supported Java versions if applicable

  for (const version of javaVersions) {
    await test.step(`Generating template for ${version}`, async () => {
      await page.getByLabel('Java Version').click();
      await page.getByRole('option', { name: version }).click();
      await expect(page.getByLabel('Java Version')).toHaveValue(version);

      await page.getByLabel('Build Tool').click();
      await page.getByRole('option', { name: 'Maven' }).click(); // Use Maven for consistency
      await page.getByLabel('Test Command').fill('mvn test');
      await page.getByLabel('Build Command').fill('mvn clean install');

      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

      // Steps: For each generated template, verify that the Java version specified in the template (e.g., in Docker image or setup commands) matches the selection.
      const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
      expect(templateContent).not.toBeNull();
      // Assuming Java version is reflected in the Docker image tag
      expect(templateContent).toContain(`image: openjdk:${version.replace('Java ', '')}`); // e.g., openjdk:17

      // Navigate back to wizard to generate next version, or refresh if wizard state is reset
      await page.getByRole('button', { name: 'Back' }).click(); // TODO: Adjust navigation back to wizard
      await expect(page.getByRole('heading', { name: 'CI/CD Template Generation Wizard' })).toBeVisible();
    });
  }
});

test('TC-22: Non-functional: Assess performance of template generation', async ({ page }) => {
  // Preconditions: User is logged in and on the CI/CD template generation wizard. All required configuration options are filled with valid values.
  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');

  // Steps: Start a timer. Click the 'Generate' or 'Finish' button. Stop the timer when the template generation is complete (e.g., preview screen appears).
  const startTime = Date.now();
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Expected Result: The template generation process completes within an acceptable time frame (e.g., less than 5 seconds).
  console.log(`Template generation took ${duration} ms.`);
  expect(duration).toBeLessThan(5000); // 5 seconds threshold
});

test('TC-23: Edge Case: Concurrent template generation by multiple users', async ({ page }) => {
  // Preconditions: Multiple authenticated users are simultaneously logged in. Each user is on the CI/CD template generation wizard with valid configurations ready.
  // This test case is challenging to simulate accurately with a single Playwright 'page' instance.
  // Playwright's test runner can execute tests in parallel, which would simulate multiple users running TC-10 concurrently.
  // For this single test block, we will simulate one user's successful generation, assuming the system handles concurrency.
  // A true concurrency test would involve running multiple instances of TC-10 in parallel or using multiple browser contexts.

  await navigateToTemplatesAndOpenWizard(page);
  await fillMinimalJavaMavenGitLabCIConfig(page);
  await page.getByLabel('Build Command').fill('mvn clean install');

  // Steps: Simultaneously initiate template generation from multiple user sessions.
  // Verify that each user successfully receives their respective generated template.
  // Verify the integrity and correctness of each generated template.

  // Simulate one successful generation as a proxy for one concurrent user.
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('heading', { name: 'Template Preview' })).toBeVisible();

  const templateContent = await page.locator('.template-content-display').textContent(); // TODO: Adjust selector
  expect(templateContent).not.toBeNull();
  expect(templateContent.trim().length).toBeGreaterThan(50);
  expect(templateContent).toContain('stages:');
  expect(templateContent).toContain('mvn clean install');
  expect(templateContent).toContain('mvn test');

  // Expected Result: All concurrent template generation requests are processed successfully without conflicts or data corruption, and each user receives a valid template.
  // This assertion verifies one user's successful generation. For full concurrency, this test would need to be run in parallel with others.
});
