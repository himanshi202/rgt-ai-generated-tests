const { test, expect } = require('@playwright/test');

// --- Helper Functions (for reusability across tests) ---

/**
 * Logs a user into the application.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} username - The username to use for login.
 * @param {string} password - The password to use for login.
 */
async function login(page, username, password) {
    await page.goto(process.env.BASE_URL + '/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
}

/**
 * Logs a user out of the application.
 * Assumes the logout button is visible after successful login.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
async function logout(page) {
    await page.getByRole('button', { name: 'Logout' }).click();
    // Wait for redirection to the login page
    await page.waitForURL(process.env.BASE_URL + '/login');
}

// --- Test Cases ---

test('TC-1: Verify successful user login with valid credentials', async ({ page }) => {
    // Preconditions: User has an existing account with valid credentials, System is accessible
    await login(page, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);

    // Expected Result: User is successfully logged in and redirected to the main dashboard or home page.
    await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('TC-2: Verify login failure with valid username and invalid password', async ({ page }) => {
    // Preconditions: System is accessible
    await login(page, process.env.VALID_USERNAME, process.env.INVALID_PASSWORD);

    // Expected Result: Login fails, an error message 'Invalid credentials' (or similar) is displayed, and the user remains on the login page.
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-3: Verify login failure with invalid username and valid password', async ({ page }) => {
    // Preconditions: System is accessible
    await login(page, process.env.NON_EXISTENT_USERNAME, process.env.VALID_PASSWORD);

    // Expected Result: Login fails, an error message 'Invalid credentials' (or similar) is displayed, and the user remains on the login page.
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-4: Verify login failure with both invalid username and invalid password', async ({ page }) => {
    // Preconditions: System is accessible
    await login(page, process.env.NON_EXISTENT_USERNAME, process.env.INVALID_PASSWORD);

    // Expected Result: Login fails, an error message 'Invalid credentials' (or similar) is displayed, and the user remains on the login page.
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-5: Verify successful user logout', async ({ page }) => {
    // Preconditions: User is successfully logged in to the system
    await login(page, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);
    await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard'); // Verify login first

    // Steps: Locate and click the 'Logout' button or link
    await logout(page);

    // Expected Result: User is successfully logged out and redirected to the login page or a public home page.
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible(); // Login button should be visible on login page
});

test('TC-6: Verify login failure when username field is empty', async ({ page }) => {
    // Preconditions: System is accessible
    await page.goto(process.env.BASE_URL + '/login');
    await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    // Expected Result: Login fails, an error message 'Username is required' (or similar validation message) is displayed, and the user remains on the login page.
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-7: Verify login failure when password field is empty', async ({ page }) => {
    // Preconditions: System is accessible
    await page.goto(process.env.BASE_URL + '/login');
    await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
    await page.getByRole('button', { name: 'Login' }).click();

    // Expected Result: Login fails, an error message 'Password is required' (or similar validation message) is displayed, and the user remains on the login page.
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-8: Verify login failure when both username and password fields are empty', async ({ page }) => {
    // Preconditions: System is accessible
    await page.goto(process.env.BASE_URL + '/login');
    await page.getByRole('button', { name: 'Login' }).click();

    // Expected Result: Login fails, appropriate error messages for both empty fields are displayed (e.g., 'Username is required', 'Password is required'), and the user remains on the login page.
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-9: Verify brute-force protection mechanism for login attempts', async ({ page }) => {
    // Preconditions: System is accessible, User has an existing account with valid credentials
    await page.goto(process.env.BASE_URL + '/login');

    const MAX_ATTEMPTS = 5; // Placeholder for the number of attempts before lockout
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
        await page.getByLabel('Password').fill(process.env.INVALID_PASSWORD + i); // Use slightly different invalid passwords
        await page.getByRole('button', { name: 'Login' }).click();
        // Optionally, wait for a short period to simulate real user behavior or server response
        await page.waitForTimeout(500);
    }

    // Expected Result: After a predefined number of failed attempts, the system implements a brute-force protection mechanism
    // (e.g., account lockout, CAPTCHA, temporary IP block) preventing further login attempts.
    await expect(page.getByText('Account locked due to too many failed attempts')
        .or(page.getByText('Too many failed login attempts. Please try again later.'))
        .or(page.getByText('Please complete the CAPTCHA'))
    ).toBeVisible();
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
});

test('TC-10: Verify concurrent login from different devices/browsers', async ({ browser }) => {
    // Preconditions: User has an existing account with valid credentials, System is accessible

    // Simulate Device A/Browser A
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await login(page1, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);
    await expect(page1).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page1.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Simulate Device B/Browser B
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await login(page2, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);

    // Expected Result: The login on Device B (or Browser B) is successful, and the user is logged in on both devices/browsers simultaneously.
    await expect(page2).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page2.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Verify Device A/Browser A session is still active
    await page1.reload(); // Reload to ensure session is still valid
    await expect(page1).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page1.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await context1.close();
    await context2.close();
});

test('TC-11: Verify rapid concurrent login attempts from the same session', async ({ page, browser }) => {
    // Preconditions: User has an existing account with valid credentials, System is accessible

    // Open two separate browser tabs/windows (pages within the same browser context)
    const page1 = page; // Use the default page for the first tab
    const page2 = await browser.newPage(); // Create a new page for the second tab

    // Navigate both to the login page
    await page1.goto(process.env.BASE_URL + '/login');
    await page2.goto(process.env.BASE_URL + '/login');

    // Simultaneously (or very rapidly) enter valid credentials and click 'Login' in both tabs
    const loginPromise1 = login(page1, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);
    const loginPromise2 = login(page2, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);

    await Promise.all([loginPromise1, loginPromise2]);

    // Expected Result: Both login attempts are successful, and the user is logged into the system in both tabs/windows without errors or session conflicts.
    await expect(page1).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page1.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await expect(page2).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page2.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page2.close();
});

test('TC-12: Verify immediate re-login after logout', async ({ page }) => {
    // Preconditions: User is successfully logged in to the system
    await login(page, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);
    await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');

    // Steps: Log out of the system.
    await logout(page);
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');

    // Steps: Immediately attempt to log in again using the same valid credentials.
    await login(page, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);

    // Expected Result: User successfully logs in again without any issues or delays.
    await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('TC-13: Verify access to protected resources after logout', async ({ page }) => {
    // Preconditions: User is successfully logged in to the system
    await login(page, process.env.VALID_USERNAME, process.env.VALID_PASSWORD);
    await expect(page).toHaveURL(process.env.BASE_URL + '/dashboard');

    // Steps: Note the URL of a protected page (e.g., dashboard, user profile).
    const protectedPageURL = page.url();

    // Steps: Log out of the system.
    await logout(page);
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');

    // Steps: Attempt to navigate directly to the noted protected page URL.
    await page.goto(protectedPageURL);

    // Expected Result: User is redirected to the login page or receives an 'Unauthorized' / 'Access Denied' error.
    await expect(page).toHaveURL(process.env.BASE_URL + '/login');
    await expect(page.getByText('Unauthorized').or(page.getByText('Access Denied')).or(page.getByRole('button', { name: 'Login' }))).toBeVisible();
});

test('TC-14: Measure login response time', async ({ page }) => {
    // Preconditions: User has an existing account with valid credentials, System is accessible
    await page.goto(process.env.BASE_URL + '/login');

    // Steps: Enter valid username and password.
    await page.getByLabel('Username').fill(process.env.VALID_USERNAME);
    await page.getByLabel('Password').fill(process.env.VALID_PASSWORD);

    // Steps: Start a timer. Click the 'Login' button.
    const startTime = Date.now();
    await page.getByRole('button', { name: 'Login' }).click();

    // Steps: Stop the timer when the user's dashboard/home page is fully loaded.
    await page.waitForURL(process.env.BASE_URL + '/dashboard');
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible' }); // Ensure content is loaded
    const endTime = Date.now();

    const duration = endTime - startTime;
    console.log(`Login response time: ${duration} ms`);

    // Expected Result: The measured login response time is within acceptable performance limits (e.g., less than 2 seconds).
    const MAX_LOGIN_TIME_MS = 2000; // 2 seconds
    expect(duration).toBeLessThan(MAX_LOGIN_TIME_MS);
});
