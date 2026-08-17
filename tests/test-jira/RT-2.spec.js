const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'TODO_LOGIN_PAGE_URL';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'TODO_DASHBOARD_PAGE_URL';

test('TC-1 Successful Login with Valid Credentials', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Enter 'testuser' into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Enter 'password123' into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // User is successfully redirected to the appropriate post-login page (e.g., /dashboard).
  await expect(page).toHaveURL(DASHBOARD_URL);
  // No error messages are displayed on the login page or after redirection.
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).not.toBeVisible();
});

test('TC-2 Login Attempt with Invalid Username', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Enter 'invaliduser' into the username field.
  await page.getByLabel('Username').fill('invaliduser');
  // Enter 'password123' into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An appropriate error message is displayed (e.g., 'Invalid username or password').
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toHaveText('TODO_INVALID_CREDENTIALS_ERROR_TEXT');
  // User remains on the login page.
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-3 Login Attempt with Invalid Password', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Enter 'testuser' into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Enter 'wrongpassword' into the password field.
  await page.getByLabel('Password').fill('wrongpassword');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An appropriate error message is displayed (e.g., 'Invalid username or password').
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toHaveText('TODO_INVALID_CREDENTIALS_ERROR_TEXT');
  // User remains on the login page.
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-4 Login Attempt with Empty Username', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Leave the username field empty.
  // Enter 'password123' into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An appropriate error message is displayed (e.g., 'Username is required' or 'Invalid username or password').
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toHaveText('TODO_USERNAME_REQUIRED_ERROR_TEXT');
  // User remains on the login page.
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-5 Login Attempt with Empty Password', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Enter 'testuser' into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Leave the password field empty.
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An appropriate error message is displayed (e.g., 'Password is required' or 'Invalid username or password').
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toHaveText('TODO_PASSWORD_REQUIRED_ERROR_TEXT');
  // User remains on the login page.
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-6 Login Attempt with Locked Account', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(BASE_URL);

  // Steps:
  // Enter 'lockeduser' into the username field.
  await page.getByLabel('Username').fill('lockeduser');
  // Enter 'lockedpass' into the password field.
  await page.getByLabel('Password').fill('lockedpass');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // An appropriate error message is displayed indicating the account is locked (e.g., 'Your account is locked. Please contact support.').
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_ERROR_MESSAGE_SELECTOR')).toHaveText('TODO_ACCOUNT_LOCKED_ERROR_TEXT');
  // User remains on the login page.
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-7 Login Page Load Performance', async ({ page }) => {
  // Preconditions: User has a stable network connection
  // Steps:
  // Navigate to the login page URL.
  const startTime = Date.now();
  await page.goto(BASE_URL);
  const endTime = Date.now();
  // Measure the time taken for the page to fully load and become interactive.
  const loadTime = endTime - startTime;

  // Expected Result:
  // The login page loads and becomes interactive within an acceptable timeframe (e.g., less than 3 seconds).
  const acceptableLoadTimeMs = 3000; // 3 seconds
  expect(loadTime).toBeLessThan(acceptableLoadTimeMs);
  // Optionally, check for specific elements to ensure interactivity
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
