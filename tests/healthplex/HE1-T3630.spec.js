const { test, expect } = require('@playwright/test');

// --- Configuration and Placeholders ---
// These values should be replaced with actual environment variables or specific values
const ADMIN_LOGIN_URL = process.env.ADMIN_LOGIN_URL || 'TODO_ADMIN_LOGIN_URL';
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || 'TODO_ADMIN_DASHBOARD_URL';
const VALID_ADMIN_USERNAME = process.env.VALID_ADMIN_USERNAME || 'admin_user';
const VALID_ADMIN_PASSWORD = process.env.VALID_ADMIN_PASSWORD || 'admin_password';
const INVALID_ADMIN_PASSWORD = 'wrong_password'; // Example invalid password
const NON_EXISTENT_ADMIN_USERNAME = 'non_existent_admin'; // Example non-existent username
const UNKNOWN_USER = 'unknown_user'; // Example unknown user for TC-4
const ANY_PASSWORD = 'some_password'; // Example password for TC-4

// Selectors for common elements
const USERNAME_FIELD_SELECTOR = 'Username'; // Used with getByLabel
const PASSWORD_FIELD_SELECTOR = 'Password'; // Used with getByLabel
const LOGIN_BUTTON_SELECTOR = 'Login'; // Used with getByRole
const ERROR_MESSAGE_SELECTOR = 'TODO_ERROR_MESSAGE_SELECTOR'; // Placeholder for the login error message element
const DASHBOARD_IDENTIFIER_SELECTOR = 'TODO_DASHBOARD_IDENTIFIER'; // Placeholder for an element unique to the dashboard

// --- Test Cases ---

test('TC-1 Verify Admin can successfully log in with valid credentials and is redirected to the dashboard', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Enter a valid Admin username into the username field.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(VALID_ADMIN_USERNAME);
  // 3. Enter the corresponding valid password into the password field.
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // Expected Result: The Admin is successfully logged in and redirected to the Admin dashboard/home page.
  await expect(page).toHaveURL(ADMIN_DASHBOARD_URL);
  await expect(page.locator(DASHBOARD_IDENTIFIER_SELECTOR)).toBeVisible();
});

test('TC-2 Verify login fails when attempting with an invalid username', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Enter an invalid username (e.g., 'non_existent_admin') into the username field.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(NON_EXISTENT_ADMIN_USERNAME);
  // 3. Enter a valid Admin password into the password field.
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // Expected Result: Login fails, and an appropriate error message (e.g., 'Invalid credentials' or 'Login failed') is displayed.
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toBeVisible();
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toHaveText(/Invalid credentials|Login failed/);
  await expect(page).toHaveURL(ADMIN_LOGIN_URL); // Should remain on the login page
});

test('TC-3 Verify login fails when attempting with an invalid password', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Enter a valid Admin username (e.g., 'admin_user') into the username field.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(VALID_ADMIN_USERNAME);
  // 3. Enter an invalid password (e.g., 'wrong_password') into the password field.
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(INVALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // Expected Result: Login fails, and an appropriate error message (e.g., 'Invalid credentials' or 'Login failed') is displayed.
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toBeVisible();
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toHaveText(/Invalid credentials|Login failed/);
  await expect(page).toHaveURL(ADMIN_LOGIN_URL); // Should remain on the login page
});

test('TC-4 Verify login fails when attempting with a non-existent username and any password', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Enter a username that does not exist in the system (e.g., 'unknown_user') into the username field.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(UNKNOWN_USER);
  // 3. Enter any password (e.g., 'some_password') into the password field.
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(ANY_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // Expected Result: Login fails, and an appropriate error message (e.g., 'Invalid credentials' or 'Login failed') is displayed.
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toBeVisible();
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toHaveText(/Invalid credentials|Login failed/);
  await expect(page).toHaveURL(ADMIN_LOGIN_URL); // Should remain on the login page
});

test('TC-5 Verify Admin account locks out after multiple failed login attempts (brute-force protection)', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Attempt to log in with 'admin_user' and an invalid password 3 consecutive times.
  for (let i = 0; i < 3; i++) {
    await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(VALID_ADMIN_USERNAME);
    await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(INVALID_ADMIN_PASSWORD);
    await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();
    await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toBeVisible();
    await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toHaveText(/Invalid credentials|Login failed/);
    await expect(page).toHaveURL(ADMIN_LOGIN_URL); // Ensure still on login page
  }

  // 3. On the 4th attempt, try to log in with 'admin_user' and the correct 'admin_password'.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(VALID_ADMIN_USERNAME);
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(VALID_ADMIN_PASSWORD);
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // Expected Result: After 3 failed attempts, the account 'admin_user' is locked.
  // The 4th attempt (even with correct credentials) should fail with a message indicating the account is locked.
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toBeVisible();
  await expect(page.locator(ERROR_MESSAGE_SELECTOR)).toHaveText(/Account locked|Please contact support/);
  await expect(page).toHaveURL(ADMIN_LOGIN_URL); // Should remain on the login page
});

test('TC-6 Measure Admin login response time for performance baseline', async ({ page }) => {
  // Preconditions: Navigate to the Admin login page.
  await page.goto(ADMIN_LOGIN_URL);

  // Steps:
  // 2. Start a timer.
  const startTime = performance.now();

  // 3. Enter valid Admin username and password.
  await page.getByLabel(USERNAME_FIELD_SELECTOR).fill(VALID_ADMIN_USERNAME);
  await page.getByLabel(PASSWORD_FIELD_SELECTOR).fill(VALID_ADMIN_PASSWORD);
  // 4. Click the 'Login' button.
  await page.getByRole('button', { name: LOGIN_BUTTON_SELECTOR }).click();

  // 5. Stop the timer when the Admin dashboard fully loads and is interactive.
  // Wait for the dashboard to be visible before stopping the timer
  await page.waitForURL(ADMIN_DASHBOARD_URL);
  await page.locator(DASHBOARD_IDENTIFIER_SELECTOR).waitFor({ state: 'visible' });
  const endTime = performance.now();
  const loginTime = endTime - startTime;

  console.log(`Admin login to dashboard load time: ${loginTime.toFixed(2)} ms`);

  // Expected Result: The login process completes and the Admin dashboard loads within an acceptable time frame (e.g., less than 2 seconds).
  // For automation, we assert that the dashboard loads successfully and log the time.
  await expect(page).toHaveURL(ADMIN_DASHBOARD_URL);
  await expect(page.locator(DASHBOARD_IDENTIFIER_SELECTOR)).toBeVisible();
  // Optional: Add a soft assertion for performance if a strict threshold is needed, but logging is primary for baseline.
  // expect(loginTime).toBeLessThan(2000); // Example: less than 2 seconds
});
