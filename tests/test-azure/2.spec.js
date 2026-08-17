const { test, expect } = require('@playwright/test');

test('TC-1: Verify successful lead submission with valid data and backend record creation', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Navigate to the lead generation web form. (Done in precondition)
  // Enter valid data into all assumed required fields (e.g., 'Name': 'John Doe', 'Email': 'john.doe@example.com').
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john.doe@example.com');
  // Enter valid data into any other optional fields.
  await page.getByLabel('Phone (Optional)').fill('123-456-7890');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // A lead record is successfully created in the backend system (CRM), AND the user is redirected to a 'Thank You' page or sees a success message.
  // Note: Backend record creation is not directly verifiable from the frontend. We assert the UI outcome.
  await expect(page).toHaveURL(/.*thank-you/);
  await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
  await expect(page.getByText('Your lead has been submitted successfully.')).toBeVisible();
});

test('TC-2: Verify submission is blocked and error displayed when a required field is left blank', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Navigate to the lead generation web form. (Done in precondition)
  // Enter valid data into all required fields EXCEPT the 'Name' field, leaving it blank.
  await page.getByLabel('Email').fill('test@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked, AND an error message indicating that the 'Name' field is required is displayed next to the field or at the top of the form.
  await expect(page.getByLabel('Name')).toBeEmpty(); // Ensure field remains empty
  await expect(page.getByText('Name is required.')).toBeVisible();
  await expect(page).not.toHaveURL(/.*thank-you/); // Ensure not redirected
});

test('TC-3: Verify submission is blocked and error displayed for invalid email format', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Navigate to the lead generation web form. (Done in precondition)
  // Enter valid data into all required fields EXCEPT the 'Email' field.
  await page.getByLabel('Name').fill('Invalid Email Test');
  // Enter an invalid email format into the 'Email' field (e.g., 'invalid-email').
  await page.getByLabel('Email').fill('invalid-email');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked, AND an error message indicating the invalid email format is displayed next to the 'Email' field.
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page).not.toHaveURL(/.*thank-you/); // Ensure not redirected
});

test('TC-4: Verify submission behavior with invalid characters in a required field', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Navigate to the lead generation web form. (Done in precondition)
  // Enter potentially malicious or invalid characters into a required field (e.g., 'Name': '<script>alert("XSS")</script>').
  await page.getByLabel('Name').fill('<script>alert("XSS")</script>');
  // Enter valid data into other required fields (e.g., 'Email': 'test@example.com').
  await page.getByLabel('Email').fill('xss-test@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked or the invalid characters are sanitized/escaped, AND an appropriate error message is displayed, AND no lead record is created with the malicious content in the backend system.
  // Note: Backend record creation with malicious content is not directly verifiable from the frontend.
  // Assuming the system blocks submission or sanitizes and shows a generic error.
  await expect(page.getByText('Invalid characters detected in Name field.')).toBeVisible(); // Assuming a specific error for invalid chars
  await expect(page).not.toHaveURL(/.*thank-you/); // Ensure not redirected
});

test('TC-5: Verify system behavior on duplicate lead submission attempt', async ({ page }) => {
  // Preconditions:
  // Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();
  // A lead with specific identifying information (e.g., email) has already been successfully submitted and exists in the backend system.
  // Simulate initial submission to create a duplicate scenario.
  await page.getByLabel('Name').fill('Duplicate John');
  await page.getByLabel('Email').fill('duplicate.john@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/.*thank-you/); // Confirm first submission was successful

  // Steps:
  // Navigate to the lead generation web form. (Again)
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();
  // Enter the exact same identifying valid data (e.g., 'Name': 'John Doe', 'Email': 'john.doe@example.com') as a previously submitted lead.
  await page.getByLabel('Name').fill('Duplicate John');
  await page.getByLabel('Email').fill('duplicate.john@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The system either blocks the submission with a message indicating a duplicate entry, or it processes it as an update to the existing lead, or it creates a new lead.
  // (Specific behavior depends on system design, but it should not silently fail or create an unintended duplicate without indication).
  // Assuming the system blocks with a duplicate message.
  await expect(page.getByText('A lead with this email already exists.')).toBeVisible(); // Assuming a specific error for duplicates
  await expect(page).not.toHaveURL(/.*thank-you/); // Ensure not redirected
});

test('TC-6: Verify system behavior when backend lead creation fails', async ({ page }) => {
  // Preconditions:
  // Lead generation web form is accessible and loaded
  await page.goto(process.env.BASE_URL || 'TODO_BASE_URL');
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();
  // Backend system (CRM) is configured to simulate a lead creation failure (e.g., database error, CRM API timeout, or specific error code response).
  // This precondition requires external setup (e.g., mocking API responses or configuring a test environment).
  // The Playwright test will only verify the UI response given this simulated failure.

  // Steps:
  // Navigate to the lead generation web form. (Done in precondition)
  // Enter valid data into all required fields (e.g., 'Name': 'Jane Doe', 'Email': 'jane.doe@example.com').
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Email').fill('jane.doe@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The user is presented with a generic error message (e.g., 'An unexpected error occurred. Please try again later.') on the web form, AND no lead record is created in the backend system.
  // Note: Backend record creation is not directly verifiable from the frontend.
  await expect(page.getByText('An unexpected error occurred. Please try again later.')).toBeVisible();
  await expect(page).not.toHaveURL(/.*thank-you/); // Ensure not redirected
});
