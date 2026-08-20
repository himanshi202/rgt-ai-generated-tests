const { test, expect } = require('@playwright/test');

test('TC-1 Update Profile with All Valid Data', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update
  await page.goto(process.env.BASE_URL + '/profile/update');

  // Steps:
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Email').fill('jane.doe@example.com');
  await page.getByLabel('Password').fill('NewSecureP@ss1');
  await page.getByLabel('Confirm Password').fill('NewSecureP@ss1');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Expected Result:
  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toHaveText('Profile information updated successfully.');
});

test('TC-2 Attempt Profile Update with Invalid Email Format', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update
  await page.goto(process.env.BASE_URL + '/profile/update');

  // Steps:
  await page.getByLabel('Name').fill('John Smith');
  await page.getByLabel('Email').fill('invalid-email');
  // Password fields are left empty, assuming no change is intended
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Expected Result:
  await expect(page.locator('TODO_EMAIL_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_EMAIL_ERROR_MESSAGE_SELECTOR')).toHaveText('Invalid email format');
});

test('TC-3 Attempt Profile Update with Password Too Short', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update
  await page.goto(process.env.BASE_URL + '/profile/update');

  // Steps:
  await page.getByLabel('Name').fill('John Smith');
  await page.getByLabel('Email').fill('john.smith@example.com');
  await page.getByLabel('Password').fill('short');
  await page.getByLabel('Confirm Password').fill('short');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Expected Result:
  await expect(page.locator('TODO_PASSWORD_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_PASSWORD_ERROR_MESSAGE_SELECTOR')).toHaveText('Password must be at least 8 characters long');
});

test('TC-4 Attempt Profile Update with Missing Required Email', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update
  await page.goto(process.env.BASE_URL + '/profile/update');

  // Steps:
  await page.getByLabel('Email').clear(); // Clear existing email
  await page.getByLabel('Name').fill('John Smith');
  // Password fields are left empty, assuming no change is intended
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Expected Result:
  await expect(page.locator('TODO_EMAIL_ERROR_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_EMAIL_ERROR_MESSAGE_SELECTOR')).toHaveText('Email is required');
});

test('TC-5 Update Profile with Optional Field Left Blank (Name)', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update
  await page.goto(process.env.BASE_URL + '/profile/update');

  // Steps:
  await page.getByLabel('Name').clear(); // Clear existing name
  await page.getByLabel('Email').fill('updated.user@example.com');
  // Password fields are left empty, assuming no change is intended
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Expected Result:
  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toBeVisible();
  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toHaveText('Profile information updated successfully.');
  // Verify no validation error for the Name field
  await expect(page.locator('TODO_NAME_ERROR_MESSAGE_SELECTOR')).not.toBeVisible();
  // Optionally, verify the email field now holds the updated value
  await expect(page.getByLabel('Email')).toHaveValue('updated.user@example.com');
});

test('TC-6 Profile Update Page Responsiveness', async ({ page }) => {
  // Preconditions: User is logged in, User has an existing profile to update

  // Steps:
  // Load the page multiple times under typical network conditions.
  // For performance testing, consider using page.route to simulate network conditions
  // or measuring navigation timing with performance.now() or page.metrics().
  // This example focuses on successful loading and submission within Playwright's default waits.

  const pageLoadStartTime = performance.now();
  await page.goto(process.env.BASE_URL + '/profile/update', { waitUntil: 'networkidle' });
  const pageLoadEndTime = performance.now();
  const pageLoadDuration = pageLoadEndTime - pageLoadStartTime;
  console.log(`Page load duration: ${pageLoadDuration.toFixed(2)} ms`);
  // Expected Result: The profile update page loads within an acceptable timeframe (e.g., under 2 seconds).
  // For a strict assertion, uncomment the following line and adjust threshold:
  // expect(pageLoadDuration).toBeLessThan(2000); // 2 seconds

  // Submit a profile update with valid data.
  await page.getByLabel('Name').fill('Responsive User');
  await page.getByLabel('Email').fill('responsive.user@example.com');
  await page.getByLabel('Password').fill('SecureP@ssword1');
  await page.getByLabel('Confirm Password').fill('SecureP@ssword1');

  const submissionStartTime = performance.now();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toBeVisible();
  const submissionEndTime = performance.now();
  const submissionDuration = submissionEndTime - submissionStartTime;
  console.log(`Profile update submission duration: ${submissionDuration.toFixed(2)} ms`);

  // Expected Result: The profile update submission completes within an acceptable timeframe (e.g., under 3 seconds).
  // For a strict assertion, uncomment the following line and adjust threshold:
  // expect(submissionDuration).toBeLessThan(3000); // 3 seconds

  await expect(page.locator('TODO_SUCCESS_MESSAGE_SELECTOR')).toHaveText('Profile information updated successfully.');
});
