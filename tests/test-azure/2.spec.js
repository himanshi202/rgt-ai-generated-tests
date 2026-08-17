const { test, expect } = require('@playwright/test');

const LEAD_FORM_URL = process.env.BASE_URL || 'TODO_LEAD_FORM_URL';

test('TC-1: Verify successful lead submission with valid data and backend record creation', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible(); // Assuming a form title

  // Steps:
  // Enter valid data into all assumed required fields (e.g., 'Name': 'John Doe', 'Email': 'john.doe@example.com').
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john.doe@example.com');
  // Enter valid data into any other optional fields.
  await page.getByLabel('Phone (optional)').fill('555-123-4567'); // Assuming an optional phone field
  await page.getByLabel('Company (optional)').fill('Acme Corp'); // Assuming an optional company field
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // A lead record is successfully created in the backend system (CRM), AND the user is redirected to a 'Thank You' page or sees a success message.
  await expect(page).toHaveURL('TODO_THANK_YOU_PAGE_URL'); // Assert redirection
  await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible(); // Assert success message
  await expect(page.getByText('Your submission has been received.')).toBeVisible();
});

test('TC-2: Verify submission is blocked and error displayed when a required field is left blank', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Enter valid data into all required fields EXCEPT the 'Name' field, leaving it blank.
  await page.getByLabel('Email').fill('test@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked, AND an error message indicating that the 'Name' field is required is displayed next to the field or at the top of the form.
  await expect(page.getByText('Name is required', { exact: true })).toBeVisible(); // Assert error message for Name
  await expect(page).toHaveURL(LEAD_FORM_URL); // Assert that the page did not navigate away
});

test('TC-3: Verify submission is blocked and error displayed for invalid email format', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Enter valid data into all required fields EXCEPT the 'Email' field.
  await page.getByLabel('Name').fill('Invalid Email Test');
  // Enter an invalid email format into the 'Email' field (e.g., 'invalid-email').
  await page.getByLabel('Email').fill('invalid-email');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked, AND an error message indicating the invalid email format is displayed next to the 'Email' field.
  await expect(page.getByText('Please enter a valid email address', { exact: true })).toBeVisible(); // Assert error message for Email
  await expect(page).toHaveURL(LEAD_FORM_URL); // Assert that the page did not navigate away
});

test('TC-4: Verify submission behavior with invalid characters in a required field', async ({ page }) => {
  // Preconditions: Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();

  // Steps:
  // Enter potentially malicious or invalid characters into a required field (e.g., 'Name': '<script>alert("XSS")</script>').
  await page.getByLabel('Name').fill('<script>alert("XSS")</script>');
  // Enter valid data into other required fields (e.g., 'Email': 'test@example.com').
  await page.getByLabel('Email').fill('xss-test@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The submission is blocked or the invalid characters are sanitized/escaped, AND an appropriate error message is displayed, AND no lead record is created with the malicious content in the backend system.
  // We'll assert for an error message or that the form didn't submit successfully.
  await expect(page.getByText('Invalid characters detected in Name', { exact: true })).toBeVisible(); // Assuming an error message for invalid characters
  await expect(page).toHaveURL(LEAD_FORM_URL); // Assert that the page did not navigate away
  // Optionally, verify input value was sanitized if that's the expected behavior
  // await expect(page.getByLabel('Name')).toHaveValue('alert("XSS")'); // If sanitization happens client-side
});

test('TC-5: Verify system behavior on duplicate lead submission attempt', async ({ page }) => {
  // Preconditions:
  // Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();
  // A lead with specific identifying information (e.g., email) has already been successfully submitted and exists in the backend system.
  // This precondition needs to be handled outside of Playwright or by a separate setup step (e.g., API call to seed data).
  // For this test, we'll assume the data 'duplicate.john@example.com' already exists.

  // Steps:
  // Enter the exact same identifying valid data (e.g., 'Name': 'John Doe', 'Email': 'john.doe@example.com') as a previously submitted lead.
  await page.getByLabel('Name').fill('Duplicate John');
  await page.getByLabel('Email').fill('duplicate.john@example.com');
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The system either blocks the submission with a message indicating a duplicate entry, or it processes it as an update to the existing lead, or it creates a new lead.
  // (Specific behavior depends on system design, but it should not silently fail or create an unintended duplicate without indication).
  // Assuming the system blocks with a message:
  await expect(page.getByText('A lead with this email already exists.', { exact: true })).toBeVisible(); // Assert duplicate message
  await expect(page).toHaveURL(LEAD_FORM_URL); // Assert that the page did not navigate away
  // If the system updates or creates a new lead, the assertion would be different, e.g., checking for a success message or redirection.
});

test('TC-6: Verify system behavior when backend lead creation fails', async ({ page }) => {
  // Preconditions:
  // Lead generation web form is accessible and loaded
  await page.goto(LEAD_FORM_URL);
  await expect(page.getByRole('heading', { name: 'Lead Generation Form' })).toBeVisible();
  // Backend system (CRM) is configured to simulate a lead creation failure (e.g., database error, CRM API timeout, or specific error code response).
  // This precondition requires specific backend setup or network interception to simulate.
  // For this test, we'll assume a mechanism (e.g., a special email address) triggers a backend failure.
  const FAILING_EMAIL = 'fail@example.com'; // Placeholder for an email that triggers backend failure

  // Steps:
  // Enter valid data into all required fields (e.g., 'Name': 'Jane Doe', 'Email': 'jane.doe@example.com').
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Email').fill(FAILING_EMAIL);
  // Click the 'Submit' button.
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expected Result:
  // The user is presented with a generic error message (e.g., 'An unexpected error occurred. Please try again later.') on the web form, AND no lead record is created in the backend system.
  await expect(page.getByText('An unexpected error occurred. Please try again later.', { exact: true })).toBeVisible(); // Assert generic error message
  await expect(page).toHaveURL(LEAD_FORM_URL); // Assert that the page did not navigate away
});
