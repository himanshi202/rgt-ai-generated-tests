const { test, expect } = require('@playwright/test');

test('TC-1 Successful Login with Valid Credentials', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter the valid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter the valid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: User is successfully logged in and redirected to the Dashboard/Home Page.
  await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
});

test('TC-2 Login Fails with Invalid Username (Valid Password)', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter an invalid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.INVALID_USERNAME);
  // Enter the valid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Invalid username or password' is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-3 Login Fails with Valid Username (Invalid Password)', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter the valid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter an invalid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.INVALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Invalid username or password' is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-4 Login Fails with Invalid Username and Invalid Password', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter an invalid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.INVALID_USERNAME);
  // Enter an invalid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.INVALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Invalid username or password' is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-5 Login Fails with Empty Username Field', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Leave the 'Username' field empty (no fill action needed)
  // Enter a valid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Username is required' (or similar) is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Username is required')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-6 Login Fails with Empty Password Field', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Leave the 'Password' field empty (no fill action needed)
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Password is required' (or similar) is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Password is required')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-7 Login Fails with Empty Username and Password Fields', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Leave the 'Username' field empty
  // Leave the 'Password' field empty
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Username and password are required' (or similar) is displayed on the login page. User remains on the login page.
  await expect(page.getByText('Username and password are required')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-8 Login Fails with Extremely Long Username', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter an extremely long string (e.g., 256 characters) into the 'Username' field
  await page.getByLabel('Username').fill(process.env.LONG_USERNAME);
  // Enter a valid password into the 'Password' field
  await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An appropriate error message (e.g., 'Username too long' or 'Invalid username format') is displayed, or the system handles the input gracefully without error. User remains on the login page.
  await expect(page.getByText(/Username too long|Invalid username format|Invalid username or password/)).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-9 Login Fails with Extremely Long Password', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username into the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter an extremely long string (e.g., 256 characters) into the 'Password' field
  await page.getByLabel('Password').fill(process.env.LONG_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An appropriate error message (e.g., 'Password too long' or 'Invalid password format') is displayed, or the system handles the input gracefully without error. User remains on the login page.
  await expect(page.getByText(/Password too long|Invalid password format|Invalid username or password/)).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-10 Login Fails with SQL Injection Attempt in Username', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter "' OR '1'='1" into the 'Username' field
  await page.getByLabel('Username').fill(process.env.SQL_INJECTION_USERNAME);
  // Enter any password (e.g., 'password123') into the 'Password' field
  await page.getByLabel('Password').fill(process.env.ANY_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Invalid username or password' is displayed. User remains on the login page, and no unauthorized access or database errors occur.
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-11 Login Fails with SQL Injection Attempt in Password', async ({ page }) => {
  // Preconditions: User is on the login page
  await page.goto(process.env.BASE_URL + '/login');

  // Steps:
  // Enter a valid username (e.g., 'testuser') into the 'Username' field
  await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
  // Enter "' OR '1'='1" into the 'Password' field
  await page.getByLabel('Password').fill(process.env.SQL_INJECTION_PASSWORD);
  // Click the 'Login' button
  await page.getByRole('button', { name: 'Login' }).click();

  // Expected Result: Login fails. An error message 'Invalid username or password' is displayed. User remains on the login page, and no unauthorized access or database errors occur.
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});
