const { test, expect } = require('@playwright/test');

// TC-1: Verify successful login with valid credentials
test('TC-1 Verify successful login with valid credentials', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
  // Further assertions for session establishment could be added here, e.g., checking for a logout button or user profile link
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible(); // Example assertion
});

// TC-2: Verify login failure with incorrect password
test('TC-2 Verify login failure with incorrect password', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password')).toBeVisible();
});

// TC-3: Verify login failure with incorrect username
test('TC-3 Verify login failure with incorrect username', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  await page.getByLabel('Username').fill('wronguser');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password')).toBeVisible();
});

// TC-4: Verify login failure with non-existent user
test('TC-4 Verify login failure with non-existent user', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  await page.getByLabel('Username').fill('nonexistentuser');
  await page.getByLabel('Password').fill('anypassword');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password')).toBeVisible();
});

// TC-5: Verify login failure with empty username field
test('TC-5 Verify login failure with empty username field', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  // Leave username field empty
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Username is required')).toBeVisible();
});

// TC-6: Verify login failure with empty password field
test('TC-6 Verify login failure with empty password field', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  await page.getByLabel('Username').fill('testuser');
  // Leave password field empty
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Password is required')).toBeVisible();
});

// TC-7: Verify login failure with both username and password fields empty
test('TC-7 Verify login failure with both username and password fields empty', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  // Leave both fields empty
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Username is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
});

// TC-8: Verify account lockout after multiple failed login attempts (brute-force protection)
test('TC-8 Verify account lockout after multiple failed login attempts (brute-force protection)', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  const N_ATTEMPTS_FOR_LOCKOUT = 3; // TODO: Confirm the exact number of attempts before lockout

  // Steps: Attempt to log in with 'testuser' and an incorrect password for N-1 times
  for (let i = 0; i < N_ATTEMPTS_FOR_LOCKOUT - 1; i++) {
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
    await expect(page.getByText('Invalid username or password')).toBeVisible();
    // Clear fields for next attempt if the page doesn't refresh them
    await page.getByLabel('Username').clear();
    await page.getByLabel('Password').clear();
  }

  // On the Nth attempt, enter 'testuser' and an incorrect password
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page).toHaveURL(process.env.BASE_URL + '/login'); // User remains on login page
  await expect(page.getByText('Account locked due to too many failed attempts')).toBeVisible(); // Or similar message

  // Verify subsequent valid login attempts also fail
  // This might require navigating back to login page if the lockout message replaces the form
  await page.goto(process.env.BASE_URL + '/login'); // Re-navigate to ensure clean state for next attempt
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('password123'); // Correct password
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Account locked due to too many failed attempts')).toBeVisible(); // Still locked
});

// TC-9: Verify concurrent login attempts for the same user
test('TC-9 Verify concurrent login attempts for the same user', async ({ browser }) => {
  // Preconditions: A login interface is available
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  // Steps
  // In Window/Instance 1
  await page1.goto(process.env.BASE_URL + '/login');
  await page1.getByLabel('Username').fill('testuser');
  await page1.getByLabel('Password').fill('password123');
  await page1.getByRole('button', { name: 'Login' }).click();

  // In Window/Instance 2
  await page2.goto(process.env.BASE_URL + '/login');
  await page2.getByLabel('Username').fill('testuser');
  await page2.getByLabel('Password').fill('password123');
  await page2.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page1).toHaveURL(process.env.BASE_URL + '/dashboard');
  await expect(page2).toHaveURL(process.env.BASE_URL + '/dashboard');

  await context1.close();
  await context2.close();
});

// TC-10: Verify concurrent login attempts for different users
test('TC-10 Verify concurrent login attempts for different users', async ({ browser }) => {
  // Preconditions: A login interface is available
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  // Steps
  // In Window/Instance 1
  await page1.goto(process.env.BASE_URL + '/login');
  await page1.getByLabel('Username').fill('userA'); // TODO: Confirm userA credentials
  await page1.getByLabel('Password').fill('passA'); // TODO: Confirm passA credentials
  await page1.getByRole('button', { name: 'Login' }).click();

  // In Window/Instance 2
  await page2.goto(process.env.BASE_URL + '/login');
  await page2.getByLabel('Username').fill('userB'); // TODO: Confirm userB credentials
  await page2.getByLabel('Password').fill('passB'); // TODO: Confirm passB credentials
  await page2.getByRole('button', { name: 'Login' }).click();

  // Expected Result
  await expect(page1).toHaveURL(process.env.BASE_URL + '/dashboard');
  await expect(page2).toHaveURL(process.env.BASE_URL + '/dashboard');

  await context1.close();
  await context2.close();
});

// TC-11: Measure login process response time
test('TC-11 Measure login process response time', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps
  const startTime = performance.now(); // Start a timer

  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for navigation to complete and dashboard to load
  await page.waitForURL(process.env.BASE_URL + '/dashboard');
  await page.waitForLoadState('networkidle'); // Wait for network to be idle

  const endTime = performance.now(); // Stop the timer
  const elapsedTime = endTime - startTime;

  // Record the elapsed time (can be logged or asserted against a threshold)
  console.log(`Login process for TC-11 took: ${elapsedTime.toFixed(2)} ms`);

  // Expected Result
  // Assert that the login process completes within an acceptable time frame
  const ACCEPTABLE_LOGIN_TIME_MS = 2000; // TODO: Confirm acceptable time frame (e.g., 2 seconds)
  expect(elapsedTime).toBeLessThan(ACCEPTABLE_LOGIN_TIME_MS);
});