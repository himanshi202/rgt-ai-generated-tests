const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/login';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000/dashboard';
const PROTECTED_PAGE_URL = process.env.PROTECTED_PAGE_URL || 'http://localhost:3000/profile';

// Valid Credentials
const VALID_USERNAME = process.env.VALID_USERNAME || 'testuser';
const VALID_PASSWORD = process.env.VALID_PASSWORD || 'password123';

// Invalid Credentials
const INVALID_USERNAME = process.env.INVALID_USERNAME || 'invaliduser';
const INVALID_PASSWORD = process.env.INVALID_PASSWORD || 'wrongpass';

// Long Credentials
const LONG_VALID_USERNAME = process.env.LONG_VALID_USERNAME || 'longvalidusername@example.com'; // Max length username
const LONG_VALID_PASSWORD = process.env.LONG_VALID_PASSWORD || 'verylongvalidpassword123!@#$'; // Max length password
const VERY_LONG_INVALID_USERNAME = process.env.VERY_LONG_INVALID_USERNAME || 'thisusernameiswaytoolongandshouldfailvalidationbecauseitexceedsthemaximumallowedlengthforanyreasonableinputfield';
const VERY_LONG_INVALID_PASSWORD = process.env.VERY_LONG_INVALID_PASSWORD || 'thispasswordiswaytoolongandshouldfailvalidationbecauseitexceedsthemaximumallowedlengthforanyreasonableinputfield';

// Error Messages
const ERROR_MESSAGE_INVALID_CREDENTIALS = process.env.ERROR_MESSAGE_INVALID_CREDENTIALS || 'Invalid username or password';
const ERROR_MESSAGE_USERNAME_REQUIRED = process.env.ERROR_MESSAGE_USERNAME_REQUIRED || 'Username is required';
const ERROR_MESSAGE_PASSWORD_REQUIRED = process.env.ERROR_MESSAGE_PASSWORD_REQUIRED || 'Password is required';
const ERROR_MESSAGE_USERNAME_TOO_LONG = process.env.ERROR_MESSAGE_USERNAME_TOO_LONG || 'Username/Email is too long';
const ERROR_MESSAGE_PASSWORD_TOO_LONG = process.env.ERROR_MESSAGE_PASSWORD_TOO_LONG || 'Password is too long';
const ACCOUNT_LOCKOUT_MESSAGE = process.env.ACCOUNT_LOCKOUT_MESSAGE || 'Account locked due to too many failed attempts. Please try again later.';

// Account Lockout Policy
const ACCOUNT_LOCKOUT_ATTEMPTS = parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS || '5', 10);

// Performance Threshold
const PERFORMANCE_THRESHOLD_MS = parseInt(process.env.PERFORMANCE_THRESHOLD_MS || '2000', 10);

test('TC-1 Successful Login with Valid Username and Password', async ({ page }) => {
  // Preconditions: User has an existing account, User has valid credentials (username/email and password)
  await page.goto(BASE_URL);

  // Steps:
  // Enter valid username/email in the username field.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  // Enter valid password in the password field.
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // User is successfully logged in and redirected to the User Dashboard/Home Page.
  await expect(page).toHaveURL(DASHBOARD_URL);
  await expect(page.getByText('Welcome to your Dashboard!')).toBeVisible();
});

test('TC-2 Login Fails with Invalid Username/Email', async ({ page }) => {
  // Preconditions: User has an existing account, User has invalid credentials (incorrect username/email)
  await page.goto(BASE_URL);

  // Steps:
  // Enter an invalid username/email.
  await page.getByLabel('Username').fill(INVALID_USERNAME);
  // Enter a valid password.
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Invalid username or password') is displayed on the login page. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_INVALID_CREDENTIALS)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-3 Login Fails with Invalid Password', async ({ page }) => {
  // Preconditions: User has an existing account, User has invalid credentials (incorrect password)
  await page.goto(BASE_URL);

  // Steps:
  // Enter a valid username/email.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  // Enter an invalid password.
  await page.getByLabel('Password').fill(INVALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Invalid username or password') is displayed on the login page. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_INVALID_CREDENTIALS)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-4 Login Fails with Invalid Username/Email and Invalid Password', async ({ page }) => {
  // Preconditions: User has an existing account, User has invalid credentials (incorrect username/email and password)
  await page.goto(BASE_URL);

  // Steps:
  // Enter an invalid username/email.
  await page.getByLabel('Username').fill(INVALID_USERNAME);
  // Enter an invalid password.
  await page.getByLabel('Password').fill(INVALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Invalid username or password') is displayed on the login page. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_INVALID_CREDENTIALS)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-5 Login Fails with Empty Username/Email', async ({ page }) => {
  // Preconditions: User has an existing account
  await page.goto(BASE_URL);

  // Steps:
  // Leave the username/email field empty.
  // Enter a valid password.
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Username is required' or 'Please fill out this field') is displayed. User remains on the login page.
  // Check for client-side validation message or server-side error message
  await expect(page.getByText(ERROR_MESSAGE_USERNAME_REQUIRED)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-6 Login Fails with Empty Password', async ({ page }) => {
  // Preconditions: User has an existing account
  await page.goto(BASE_URL);

  // Steps:
  // Enter a valid username/email.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  // Leave the password field empty.
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Password is required' or 'Please fill out this field') is displayed. User remains on the login page.
  // Check for client-side validation message or server-side error message
  await expect(page.getByText(ERROR_MESSAGE_PASSWORD_REQUIRED)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-7 Login Fails with Both Username/Email and Password Empty', async ({ page }) => {
  // Preconditions: User has an existing account
  await page.goto(BASE_URL);

  // Steps:
  // Leave both username/email and password fields empty.
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and appropriate error messages (e.g., 'Username is required', 'Password is required') are displayed. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_USERNAME_REQUIRED)).toBeVisible();
  await expect(page.getByText(ERROR_MESSAGE_PASSWORD_REQUIRED)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-8 Login with Very Long Valid Username/Email', async ({ page }) => {
  // Preconditions: User has an existing account with a very long valid username/email (e.g., max allowed length)
  await page.goto(BASE_URL);

  // Steps:
  // Enter the very long valid username/email.
  await page.getByLabel('Username').fill(LONG_VALID_USERNAME);
  // Enter the corresponding valid password.
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // User is successfully logged in and redirected to the User Dashboard/Home Page.
  await expect(page).toHaveURL(DASHBOARD_URL);
  await expect(page.getByText('Welcome to your Dashboard!')).toBeVisible();
});

test('TC-9 Login with Very Long Valid Password', async ({ page }) => {
  // Preconditions: User has an existing account with a very long valid password (e.g., max allowed length)
  await page.goto(BASE_URL);

  // Steps:
  // Enter a valid username/email.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  // Enter the very long valid password.
  await page.getByLabel('Password').fill(LONG_VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // User is successfully logged in and redirected to the User Dashboard/Home Page.
  await expect(page).toHaveURL(DASHBOARD_URL);
  await expect(page.getByText('Welcome to your Dashboard!')).toBeVisible();
});

test('TC-10 Login Fails with Very Long Invalid Username/Email', async ({ page }) => {
  // Preconditions: User has an existing account
  await page.goto(BASE_URL);

  // Steps:
  // Enter a username/email exceeding the maximum allowed length or with invalid characters.
  await page.getByLabel('Username').fill(VERY_LONG_INVALID_USERNAME);
  // Enter a valid password.
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Username/Email is too long' or 'Invalid format') is displayed, or the input is truncated/rejected client-side. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_USERNAME_TOO_LONG)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-11 Login Fails with Very Long Invalid Password', async ({ page }) => {
  // Preconditions: User has an existing account
  await page.goto(BASE_URL);

  // Steps:
  // Enter a valid username/email.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  // Enter a password exceeding the maximum allowed length or with invalid characters.
  await page.getByLabel('Password').fill(VERY_LONG_INVALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // Login fails, and an appropriate error message (e.g., 'Password is too long' or 'Invalid format') is displayed, or the input is truncated/rejected client-side. User remains on the login page.
  await expect(page.getByText(ERROR_MESSAGE_PASSWORD_TOO_LONG)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-12 Account Lockout After Multiple Failed Login Attempts', async ({ page }) => {
  // Preconditions: User has an existing account, System has an account lockout policy (e.g., locks after 3-5 failed attempts)
  await page.goto(BASE_URL);

  // Steps:
  // Repeatedly attempt to log in with a valid username/email and an invalid password (e.g., 5 times).
  for (let i = 0; i < ACCOUNT_LOCKOUT_ATTEMPTS; i++) {
    await page.getByLabel('Username').fill(VALID_USERNAME);
    await page.getByLabel('Password').fill(INVALID_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText(ERROR_MESSAGE_INVALID_CREDENTIALS)).toBeVisible();
    await page.waitForTimeout(500); // Small delay to simulate user interaction and allow server to process
  }

  // On the (ACCOUNT_LOCKOUT_ATTEMPTS + 1)th attempt, try to log in with valid credentials.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result:
  // After the configured number of failed attempts, the account is locked, and a message indicating account lockout or temporary suspension is displayed. The (ACCOUNT_LOCKOUT_ATTEMPTS + 1)th attempt with valid credentials should also fail due to lockout.
  await expect(page.getByText(ACCOUNT_LOCKOUT_MESSAGE)).toBeVisible();
  await expect(page).toHaveURL(BASE_URL);
});

test('TC-13 Concurrent Login Attempts with Valid Credentials', async ({ browser }) => {
  // Preconditions: User has an existing account, User has valid credentials
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  // Steps:
  // Open two browser tabs/windows to the login page.
  await page1.goto(BASE_URL);
  await page2.goto(BASE_URL);

  // In both tabs, enter valid username/email and password.
  await page1.getByLabel('Username').fill(VALID_USERNAME);
  await page1.getByLabel('Password').fill(VALID_PASSWORD);
  await page2.getByLabel('Username').fill(VALID_USERNAME);
  await page2.getByLabel('Password').fill(VALID_PASSWORD);

  // Simultaneously (or very rapidly) click the 'Login' button in both tabs.
  await Promise.all([
    page1.getByRole('button', { name: 'Login' }).click(),
    page2.getByRole('button', { name: 'Login' }).click()
  ]);

  // Expected Result:
  // Both login attempts should result in successful login, or one succeeds and the other is redirected to the post-login page, establishing a valid session without errors or unexpected behavior.
  // We expect at least one to succeed and redirect, and the other to either succeed or be redirected to the same post-login page if session management handles it.
  await expect(page1).toHaveURL(DASHBOARD_URL);
  await expect(page1.getByText('Welcome to your Dashboard!')).toBeVisible();
  await expect(page2).toHaveURL(DASHBOARD_URL);
  await expect(page2.getByText('Welcome to your Dashboard!')).toBeVisible();

  await context.close();
});

test('TC-14 Verify User Session Establishment After Successful Login', async ({ page }) => {
  // Preconditions: User has an existing account, User has valid credentials
  await page.goto(BASE_URL);

  // Steps:
  // Enter valid username/email and password.
  await page.getByLabel('Username').fill(VALID_USERNAME);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // After redirection, attempt to access a protected page (e.g., profile settings) directly via URL or navigate through the application.
  await expect(page).toHaveURL(DASHBOARD_URL); // First verify dashboard redirection
  await page.goto(PROTECTED_PAGE_URL); // Then navigate to a protected page

  // Expected Result:
  // User is successfully logged in, redirected to the User Dashboard/Home Page, and can access protected resources without re-authentication, indicating a valid session has been established.
  await expect(page).toHaveURL(PROTECTED_PAGE_URL);
  await expect(page.getByText('Protected Content')).toBeVisible(); // Assuming a specific text on the protected page
});

test('TC-15 Measure Login Process Performance', async ({ page }) => {
  // Preconditions: User has an existing account, User has valid credentials
  const timings = [];
  const iterations = 5; // Number of times to repeat the test for averaging

  for (let i = 0; i < iterations; i++) {
    // Steps:
    // Start a performance timer.
    const startTime = performance.now();

    // Navigate to the login page.
    await page.goto(BASE_URL);

    // Enter valid username/email and password.
    await page.getByLabel('Username').fill(VALID_USERNAME);
    await page.getByLabel('Password').fill(VALID_PASSWORD);

    // Click the 'Login' button.
    await page.getByRole('button', { name: 'Login' }).click();

    // Stop the timer when the post-login page is fully loaded.
    await page.waitForURL(DASHBOARD_URL); // Wait for navigation to complete
    await page.waitForLoadState('networkidle'); // Wait for network to be idle
    const endTime = performance.now();

    const duration = endTime - startTime;
    timings.push(duration);
    console.log(`Login attempt ${i + 1} took ${duration.toFixed(2)} ms`);

    // Log out or clear session if necessary for next iteration, or use new context for each iteration
    // For simplicity, we'll assume the app allows re-login or context handles it.
    // If logout is needed: await page.getByRole('button', { name: 'Logout' }).click();
  }

  const averageTime = timings.reduce((sum, time) => sum + time, 0) / iterations;
  console.log(`Average login time over ${iterations} iterations: ${averageTime.toFixed(2)} ms`);

  // Expected Result:
  // The login process (from clicking login to page load) completes within an acceptable timeframe (e.g., < 2 seconds for a typical user, specific threshold to be defined).
  expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
});
