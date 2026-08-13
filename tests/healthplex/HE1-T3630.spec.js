const { test, expect } = require('@playwright/test');

// --- Configuration and Constants ---
const ADMIN_BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // TODO: Replace with actual base URL or ensure process.env.BASE_URL is set
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

const VALID_ADMIN_USERNAME = 'adminuser';
const VALID_ADMIN_PASSWORD = 'Password123';

// For TC-6: Account Lockout
const FAILED_ATTEMPTS_THRESHOLD = 3; // N from the test case description
const INVALID_PASSWORD_FOR_LOCKOUT = 'wrongpassword_lockout';
const ACCOUNT_LOCKED_MESSAGE = 'Account locked due to too many failed attempts.'; // TODO: Verify exact error message

// For TC-7: Session Timeout
const SESSION_TIMEOUT_DURATION_MS = 16 * 60 * 1000; // 16 minutes in milliseconds
const ANOTHER_DASHBOARD_PAGE_PATH = '/admin/settings'; // TODO: Replace with an actual protected admin page path

// For TC-8: Performance Measurement
const ACCEPTABLE_LOGIN_TIME_MS = 2000; // 2 seconds

// --- Test Cases ---

test('TC-1: Successful Admin Login with Valid Credentials', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a valid Admin username into the username field.
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  // 3. Enter a valid Admin password into the password field.
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The Admin is successfully logged in and redirected to the Admin dashboard.
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
});

test('TC-2: Admin Login with Invalid Username', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter an invalid username (e.g., 'nonexistentuser') into the username field.
  await page.getByLabel('Username').fill('nonexistentuser');
  // 3. Enter a valid Admin password into the password field.
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: An error message indicating invalid credentials (e.g., 'Invalid username or password') is displayed, and the Admin dashboard is NOT displayed.
  await expect(page.getByText('Invalid username or password')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
});

test('TC-3: Admin Login with Invalid Password', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a valid Admin username into the username field.
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  // 3. Enter an invalid password (e.g., 'wrongpassword') into the password field.
  await page.getByLabel('Password').fill('wrongpassword');
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: An error message indicating invalid credentials (e.g., 'Invalid username or password') is displayed, and the Admin dashboard is NOT displayed.
  await expect(page.getByText('Invalid username or password')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
});

test('TC-4: Admin Login with Empty Username Field', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Leave the username field empty.
  await page.getByLabel('Username').fill('');
  // 3. Enter a valid Admin password into the password field.
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: An error message indicating the username is required (e.g., 'Username is required') is displayed, and the Admin dashboard is NOT displayed.
  await expect(page.getByText('Username is required')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
});

test('TC-5: Admin Login with Empty Password Field', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a valid Admin username into the username field.
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  // 3. Leave the password field empty.
  await page.getByLabel('Password').fill('');
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: An error message indicating the password is required (e.g., 'Password is required') is displayed, and the Admin dashboard is NOT displayed.
  await expect(page.getByText('Password is required')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
});

test('TC-6: Admin Account Lockout after Multiple Failed Attempts', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  // The system has a configured threshold for failed login attempts before lockout (e.g., 3 attempts).
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. For N-1 times (e.g., 2 times), enter a valid username and an invalid password, then click 'Login'.
  for (let i = 0; i < FAILED_ATTEMPTS_THRESHOLD - 1; i++) {
    await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
    await page.getByLabel('Password').fill(INVALID_PASSWORD_FOR_LOCKOUT);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid username or password')).toBeVisible(); // Expect generic error for failed attempts
    await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH); // Re-navigate to clear form/state if needed
  }

  // 3. On the Nth attempt (e.g., 3rd time), enter a valid username and an invalid password, then click 'Login'.
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  await page.getByLabel('Password').fill(INVALID_PASSWORD_FOR_LOCKOUT);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText(ACCOUNT_LOCKED_MESSAGE)).toBeVisible(); // Expect lockout message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);

  // 4. Attempt to log in again with valid credentials (username: 'adminuser', password: 'Password123').
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH); // Re-navigate for a fresh attempt
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: After N failed attempts, the account is locked, and subsequent login attempts (even with valid credentials) result in an 'Account locked' or similar error message. The Admin dashboard is NOT displayed.
  await expect(page.getByText(ACCOUNT_LOCKED_MESSAGE)).toBeVisible();
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
});

test('TC-7: Admin Login Session Timeout Verification', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  // The system has a configured session timeout duration (e.g., 15 minutes).

  // 1. Perform a successful Admin login (refer to TC-1).
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

  // 2. Remain inactive on the Admin dashboard for a period exceeding the configured session timeout duration (e.g., 16 minutes).
  console.log(`Waiting for ${SESSION_TIMEOUT_DURATION_MS / 1000 / 60} minutes to simulate session timeout...`);
  await page.waitForTimeout(SESSION_TIMEOUT_DURATION_MS);
  console.log('Simulated inactivity period ended.');

  // 3. Attempt to navigate to another Admin dashboard page or perform an action.
  await page.goto(ADMIN_BASE_URL + ANOTHER_DASHBOARD_PAGE_PATH); // Attempt to access a protected resource

  // Expected Result: The Admin is automatically logged out and redirected to the login page, requiring re-authentication.
  // Any attempt to access protected resources results in a redirect to the login page.
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH); // Expect redirection to login page
  await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible(); // TODO: Verify login page title/heading
});

test('TC-8: Admin Login Performance Measurement', async ({ page }) => {
  // Preconditions: The Admin login page is accessible. A valid Admin account exists.
  // Performance monitoring tools are in place to measure response times.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a valid Admin username into the username field.
  await page.getByLabel('Username').fill(VALID_ADMIN_USERNAME);
  // 3. Enter a valid Admin password into the password field.
  await page.getByLabel('Password').fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button and measure the time taken from click to dashboard load.
  const startTime = performance.now();
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH); // Wait for navigation to complete
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`TC-8: Admin Login Performance: ${duration.toFixed(2)} ms`);

  // Expected Result: The login process completes within an acceptable response time (e.g., less than 2 seconds).
  // The measured time is recorded for baseline and future comparison.
  expect(duration).toBeLessThan(ACCEPTABLE_LOGIN_TIME_MS);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
});

test('TC-9: Admin Login with SQL Injection Attempt in Username', async ({ page }) => {
  // Preconditions: The Admin login page is accessible.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a known SQL injection string (e.g., "' OR '1'='1 --") into the username field.
  await page.getByLabel('Username').fill("' OR '1'='1 --");
  // 3. Enter any password (e.g., 'password') into the password field.
  await page.getByLabel('Password').fill('password');
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login attempt fails, an error message indicating invalid credentials is displayed, and the Admin dashboard is NOT displayed.
  // No sensitive data is exposed, and no backend errors are visible to the user.
  await expect(page.getByText('Invalid username or password')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
  // Additional checks for security might involve network requests or console logs, but are out of scope for basic UI automation.
});

test('TC-10: Admin Login with XSS Attempt in Username', async ({ page }) => {
  // Preconditions: The Admin login page is accessible.
  await page.goto(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);
  await expect(page).toHaveURL(ADMIN_BASE_URL + ADMIN_LOGIN_PATH);

  // Steps:
  // 1. Navigate to the Admin login page. (Done in preconditions)
  // 2. Enter a known XSS payload (e.g., "<script>alert('XSS')</script>") into the username field.
  await page.getByLabel('Username').fill("<script>alert('XSS')</script>");
  // 3. Enter any password (e.g., 'password') into the password field.
  await page.getByLabel('Password').fill('password');
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login attempt fails, an error message indicating invalid credentials is displayed, and the Admin dashboard is NOT displayed.
  // The XSS payload is sanitized or escaped, and no script executes in the browser.
  await expect(page.getByText('Invalid username or password')).toBeVisible(); // TODO: Verify exact error message
  await expect(page).not.toHaveURL(ADMIN_BASE_URL + ADMIN_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
  // Verifying no script execution (e.g., no alert dialog) is implicitly handled by Playwright not crashing or showing an unexpected dialog.
  // Further checks might involve inspecting page source or console for errors, but are out of scope for basic UI automation.
});
