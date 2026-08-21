const { test, expect } = require('@playwright/test');

test('TC-1 Verify successful login with valid credentials and redirection to dashboard', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter valid username 'testuser' into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Enter valid password 'password123' into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: User is successfully logged in, redirected to the User Dashboard/Home Page, and a valid user session is established.
  await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
  await expect(page.getByText('Welcome, testuser!')).toBeVisible();
});

test('TC-2 Verify login failure and error message with incorrect username', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter an incorrect username (e.g., 'wronguser') into the username field.
  await page.getByLabel('Username').fill('wronguser');
  // Enter a valid password (e.g., 'password123') into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login page remains displayed, and an error message 'Invalid username or password.' is shown.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
});

test('TC-3 Verify login failure and error message with incorrect password', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username (e.g., 'testuser') into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Enter an incorrect password (e.g., 'wrongpass') into the password field.
  await page.getByLabel('Password').fill('wrongpass');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login page remains displayed, and an error message 'Invalid username or password.' is shown.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
});

test('TC-4 Verify login failure and error message with empty username field', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Leave the username field empty.
  await page.getByLabel('Username').fill('');
  // Enter a valid password (e.g., 'password123') into the password field.
  await page.getByLabel('Password').fill('password123');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login page remains displayed, and an error message 'Invalid username or password.' is shown.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
});

test('TC-5 Verify login failure and error message with empty password field', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username (e.g., 'testuser') into the username field.
  await page.getByLabel('Username').fill('testuser');
  // Leave the password field empty.
  await page.getByLabel('Password').fill('');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login page remains displayed, and an error message 'Invalid username or password.' is shown.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
});

test('TC-6 Verify login failure and error message with non-existent user', async ({ page }) => {
  // Preconditions: A login interface is available
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a username that does not exist in the system (e.g., 'nonexistentuser') into the username field.
  await page.getByLabel('Username').fill('nonexistentuser');
  // Enter any password (e.g., 'anypassword') into the password field.
  await page.getByLabel('Password').fill('anypassword');
  // Click the 'Login' button.
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: The login page remains displayed, and an error message 'Invalid username or password.' is shown.
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
});

test('TC-7 Verify system behavior after multiple failed login attempts', async ({ page }) => {
  // Preconditions: A login interface is available, A valid user account exists
  
  // Steps:
  // Attempt to log in 5 consecutive times using a valid username (e.g., 'testuser') and an incorrect password (e.g., 'wrongpass').
  for (let i = 0; i < 5; i++) {
    await page.goto(process.env.BASE_URL + '/login');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();

    // Observe the behavior after each attempt.
    // Expected Result: After each attempt, the login page remains displayed, and an error message 'Invalid username or password.' is shown.
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
    await expect(page.getByText('Invalid username or password.')).toBeVisible();
  }
  // The system should not lock the account or introduce rate limiting within these 5 attempts (as no specific rule is defined).
  // No additional assertions needed for this part, as the previous assertions confirm the expected behavior for each attempt.
});
