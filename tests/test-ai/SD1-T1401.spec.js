const { test, expect } = require('@playwright/test');

// Helper function for login, derived from TC-001's detailed steps.
// This function assumes the login page is at the BASE_URL and expects specific labels/roles for elements.
async function login(page, username, password) {
    await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    // Assert redirection and dashboard visibility after successful login
    await expect(page.url()).not.toContain('/login');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test('TC-001: Successful Login with Valid Credentials', async ({ page }) => {
    // Preconditions: User account 'testuser' exists with password 'Password123!', System is accessible via the login page
    await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible(); // Expected: The login page with Username and Password fields is displayed.

    await page.getByLabel('Username').fill('testuser');
    await expect(page.getByLabel('Username')).toHaveValue('testuser'); // Expected: The 'Username' field is populated with 'testuser'.

    await page.getByLabel('Password').fill('Password123!');
    await expect(page.getByLabel('Password')).toHaveValue('Password123!'); // Expected: The 'Password' field is populated with 'Password123!'.

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.url()).not.toContain('/login'); // Expected: User is successfully authenticated and redirected to the application's Dashboard or Home page.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); // Further verification of successful login.
});

test('TC-002: Login with Invalid Password', async ({ page }) => {
    // Preconditions: User account 'testuser' exists with password 'Password123!', System is accessible via the login page
    await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible(); // Expected: The login page with Username and Password fields is displayed.

    await page.getByLabel('Username').fill('testuser');
    await expect(page.getByLabel('Username')).toHaveValue('testuser'); // Expected: The 'Username' field is populated with 'testuser'.

    await page.getByLabel('Password').fill('InvalidPassword!');
    await expect(page.getByLabel('Password')).toHaveValue('InvalidPassword!'); // Expected: The 'Password' field is populated with 'InvalidPassword!'.

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid username or password')).toBeVisible(); // Expected: An error message 'Invalid username or password' is displayed on the login page.
    await expect(page.url()).toContain('/login'); // Expected: the user remains on the login page.
});

test('TC-003: Navigate to Templates Section', async ({ page }) => {
    // Preconditions: User is successfully logged in and on the Dashboard/Home page, The system has a 'Templates' section accessible via the navigation menu
    await login(page, 'testuser', 'Password123!');

    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible(); // Expected: The 'Templates' section page is displayed.
});

test('TC-004: Initiate CI/CD Template Generation Process', async ({ page }) => {
    // Preconditions: User is on the 'Templates' section page
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible(); // Expected: The 'Generate CI/CD Template' wizard or form is displayed.
});

test('TC-005: Select \'Java\' as Programming Language for Template', async ({ page }) => {
    // Preconditions: User is on the 'Generate CI/CD Template' wizard, at the programming language selection step, Java is an available programming language option
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await expect(page.getByRole('heading', { name: 'Generate CI/CD Template' })).toBeVisible();

    await page.getByRole('radio', { name: 'Java' }).click();
    await expect(page.getByRole('radio', { name: 'Java' })).toBeChecked(); // Expected: 'Java' is highlighted or marked as selected.

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'CI/CD Provider Selection' })).toBeVisible(); // Expected: The wizard proceeds to the next step, typically CI/CD provider selection.
});

test('TC-006: Select a Supported CI/CD Provider for Template', async ({ page }) => {
    // Preconditions: User is on the 'Generate CI/CD Template' wizard, at the CI/CD provider selection step, Java has been selected as the programming language, At least one supported CI/CD provider (e.g., GitLab CI) is available for selection
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await page.getByRole('radio', { name: 'Java' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'CI/CD Provider Selection' })).toBeVisible();

    await page.getByRole('radio', { name: 'GitLab CI' }).click();
    await expect(page.getByRole('radio', { name: 'GitLab CI' })).toBeChecked(); // Expected: 'GitLab CI' is highlighted or marked as selected.

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Configure Template' })).toBeVisible(); // Expected: The wizard proceeds to the configuration fields step.
});

test('TC-007: Successfully Complete All Required Configuration Fields for Java/GitLab CI', async ({ page }) => {
    // Preconditions: User is on the 'Generate CI/CD Template' wizard, at the configuration fields step, Java is selected as the language and GitLab CI as the provider, The system has defined required configuration fields for generating a Java CI/CD template
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await page.getByRole('radio', { name: 'Java' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('radio', { name: 'GitLab CI' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Configure Template' })).toBeVisible();

    await page.getByLabel('Project Name').fill('MyJavaApp');
    await expect(page.getByLabel('Project Name')).toHaveValue('MyJavaApp'); // Expected: The 'Project Name' field is populated.

    await page.getByLabel('Repository URL').fill('https://gitlab.com/user/myjavaapp.git');
    await expect(page.getByLabel('Repository URL')).toHaveValue('https://gitlab.com/user/myjavaapp.git'); // Expected: The 'Repository URL' field is populated.

    await page.getByLabel('Branch').fill('main');
    await expect(page.getByLabel('Branch')).toHaveValue('main'); // Expected: The 'Branch' field is populated.

    await page.getByLabel('Build Tool').selectOption('Maven');
    await expect(page.getByLabel('Build Tool')).toHaveValue('Maven'); // Expected: 'Maven' is selected in the 'Build Tool' dropdown.

    await page.getByLabel('Java Version').selectOption('11');
    await expect(page.getByLabel('Java Version')).toHaveValue('11'); // Expected: '11' is selected in the 'Java Version' dropdown.

    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByText('CI/CD Template generated successfully')).toBeVisible(); // Expected: All configuration fields are accepted, and the system proceeds to initiate template generation.
});

test('TC-008: Attempt Template Generation with Incomplete Configuration (Missing Repository URL)', async ({ page }) => {
    // Preconditions: User is on the 'Generate CI/CD Template' wizard, at the configuration fields step, Java is selected as the language and GitLab CI as the provider
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await page.getByRole('radio', { name: 'Java' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('radio', { name: 'GitLab CI' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Configure Template' })).toBeVisible();

    await page.getByLabel('Project Name').fill('MyJavaApp');
    await expect(page.getByLabel('Project Name')).toHaveValue('MyJavaApp'); // Expected: The 'Project Name' field is populated.

    // Leave 'Repository URL' field empty
    await expect(page.getByLabel('Repository URL')).toHaveValue(''); // Expected: The 'Repository URL' field remains empty.

    await page.getByLabel('Branch').fill('main');
    await expect(page.getByLabel('Branch')).toHaveValue('main'); // Expected: The 'Branch' field is populated.

    await page.getByLabel('Build Tool').selectOption('Maven');
    await expect(page.getByLabel('Build Tool')).toHaveValue('Maven'); // Expected: 'Maven' is selected in the 'Build Tool' dropdown.

    await page.getByLabel('Java Version').selectOption('11');
    await expect(page.getByLabel('Java Version')).toHaveValue('11'); // Expected: '11' is selected in the 'Java Version' dropdown.

    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByText('Repository URL is a required field')).toBeVisible(); // Expected: An error message 'Repository URL is a required field' is displayed.
    await expect(page.getByRole('heading', { name: 'Configure Template' })).toBeVisible(); // Expected: The template generation does not proceed, user remains on the configuration page.
});

test('TC-009: Verify Successful CI/CD Pipeline Template Generation', async ({ page }) => {
    // Preconditions: User has successfully completed all configuration fields for Java and GitLab CI, The template generation process has been initiated
    // Re-run the full template generation flow to reach the precondition state
    await login(page, 'testuser', 'Password123!');
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('button', { name: 'Generate New Template' }).click();
    await page.getByRole('radio', { name: 'Java' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('radio', { name: 'GitLab CI' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Project Name').fill('MyJavaApp');
    await page.getByLabel('Repository URL').fill('https://gitlab.com/user/myjavaapp.git');
    await page.getByLabel('Branch').fill('main');
    await page.getByLabel('Build Tool').selectOption('Maven');
    await page.getByLabel('Java Version').selectOption('11');
    await page.getByRole('button', { name: 'Generate' }).click();

    await expect(page.getByText('CI/CD Template generated successfully')).toBeVisible(); // Expected: A success message is displayed.

    await page.getByRole('link', { name: 'Generated Templates' }).click(); // Assuming a navigation link to generated templates
    await expect(page.getByRole('heading', { name: 'Generated Templates' })).toBeVisible(); // Expected: The section listing generated templates is displayed.

    await expect(page.getByText('MyJavaApp-GitLabCI-Pipeline')).toBeVisible(); // Expected: A new CI/CD pipeline template is listed and available.
    // Optional: View content of generated template - requires specific UI for viewing, skipping for now.
});
