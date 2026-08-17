const { test, expect } = require('@playwright/test');

// --- Configuration and Helper Functions ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // Placeholder for base URL
const LOGIN_URL = `${BASE_URL}/login`; // Placeholder for login URL
const PATIENT_A_ID = 'patient-a-123'; // Placeholder for Patient A's ID
const PATIENT_B_ID = 'patient-b-456'; // Placeholder for Patient B's ID

// Helper function for login (assuming a simple form login)
async function login(page, username, password) {
    await page.goto(LOGIN_URL);
    await page.getByLabel('Username').fill(username); // Placeholder locator
    await page.getByLabel('Password').fill(password); // Placeholder locator
    await page.getByRole('button', { name: 'Login' }).click(); // Placeholder locator
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`); // Placeholder for post-login URL
}

// Helper function to navigate to a patient's medical history
async function navigateToPatientMedicalHistory(page, patientId) {
    await page.goto(`${BASE_URL}/patients/${patientId}/medical-history`); // Placeholder URL structure
    await expect(page.getByRole('heading', { name: `Medical History for Patient ${patientId}` })).toBeVisible(); // Placeholder heading
}

// Helper function to simulate saving medical history data
async function saveMedicalHistory(page) {
    await page.getByRole('button', { name: 'Save' }).click();
}

// --- Test Cases ---

test('TC-1: Successfully Save Valid Medical History Data', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access
    await login(page, 'testuser', 'password123'); // Placeholder credentials
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Enter valid medical history data
    await page.getByRole('textbox', { name: 'Allergies' }).fill('Pollen'); // Placeholder locator
    await page.getByRole('textbox', { name: 'Past Conditions' }).fill('Asthma'); // Placeholder locator
    // Click the 'Save' button
    await saveMedicalHistory(page);

    // Expected Result: The system successfully saves the medical history data for Patient A.
    await expect(page.getByText('Medical history saved successfully.')).toBeVisible(); // Placeholder success message
    await expect(page.getByRole('textbox', { name: 'Allergies' })).toHaveValue('Pollen');
    await expect(page.getByRole('textbox', { name: 'Past Conditions' })).toHaveValue('Asthma');
});

test('TC-2: Verify No Error Message on Successful Save', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Enter valid medical history data
    await page.getByRole('textbox', { name: 'Medications' }).fill('Ibuprofen 200mg'); // Placeholder locator
    // Click the 'Save' button
    await saveMedicalHistory(page);

    // Expected Result: No error message related to saving is displayed after the save operation.
    await expect(page.locator('.error-message')).not.toBeVisible(); // Placeholder error message locator
    await expect(page.getByText('Medical history saved successfully.')).toBeVisible(); // Confirm success
});

test('TC-3: Verify Accuracy of Saved Medical History Data in Patient Record', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access, Medical history data has been successfully saved
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Setup: Ensure data is saved first for verification
    await page.getByRole('textbox', { name: 'Family History' }).fill('Diabetes'); // Placeholder locator
    await saveMedicalHistory(page);
    await expect(page.getByText('Medical history saved successfully.')).toBeVisible();
    await page.reload(); // Reload to ensure data is fetched fresh

    // Steps:
    // Observe the displayed medical history data.
    // (Navigation already done in setup)

    // Expected Result: The displayed medical history data accurately reflects the data that was previously saved.
    await expect(page.getByRole('textbox', { name: 'Family History' })).toHaveValue('Diabetes');
});

test('TC-4: Attempt to Save Medical History with Missing Required Fields', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access, 'Date of Diagnosis' is mandatory
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Attempt to add a new 'Past Condition'
    await page.getByRole('button', { name: 'Add Past Condition' }).click(); // Placeholder locator for adding a new condition row/modal
    await page.getByRole('textbox', { name: 'Condition Name' }).last().fill('Hypertension'); // Placeholder locator for condition name
    // Leave the mandatory 'Date of Diagnosis' field empty.
    // Click the 'Save' button.
    await saveMedicalHistory(page);

    // Expected Result: The system displays an error message indicating that the mandatory field 'Date of Diagnosis' is missing and prevents the save.
    await expect(page.getByText('Date of Diagnosis is required.')).toBeVisible(); // Placeholder error message
    await expect(page.locator('.success-message')).not.toBeVisible(); // Ensure no success message
});

test('TC-5: Attempt to Save Medical History for Unauthorized Patient', async ({ page }) => {
    // Preconditions: User is logged in, Patient B exists, User *does not* have access to Patient B
    await login(page, 'testuser', 'password123');

    // Steps:
    // Attempt to navigate to Patient B's medical history section
    await page.goto(`${BASE_URL}/patients/${PATIENT_B_ID}/medical-history`); // Direct URL attempt

    // Expected Result: The system prevents the user from accessing Patient B's record or, if access is somehow granted, prevents the saving of medical history data, displaying an authorization error.
    // We expect either a redirect, an error page, or an error message on the page.
    await expect(page.getByText('Access Denied')).toBeVisible(); // Placeholder for access denied message
    // If the page loads but saving is prevented, uncomment the following:
    // await expect(page.getByRole('textbox', { name: 'Allergies' })).toBeDisabled(); // Example: fields are disabled
    // await page.getByRole('textbox', { name: 'Allergies' }).fill('Attempted Allergy');
    // await saveMedicalHistory(page);
    // await expect(page.getByText('Authorization Error: Cannot save for this patient.')).toBeVisible();
});

test('TC-6: Attempt to Save Medical History with Extremely Long Text Input', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access, free-text field has max limit
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Enter medical history data, including a very long string into a free-text field like 'Notes'.
    const longText = 'a'.repeat(5000); // 5000 characters
    await page.getByRole('textbox', { name: 'Notes' }).fill(longText); // Placeholder locator
    // Click the 'Save' button.
    await saveMedicalHistory(page);

    // Expected Result: The system either truncates the input to the maximum allowed length and saves successfully, or displays an error message.
    // This assertion needs to check for either outcome.
    const notesField = page.getByRole('textbox', { name: 'Notes' });
    const savedText = await notesField.inputValue();

    if (savedText.length < longText.length) {
        // Assuming truncation to 4000 characters based on precondition
        await expect(notesField).toHaveValue(longText.substring(0, 4000)); // Placeholder max length
        await expect(page.getByText('Medical history saved successfully.')).toBeVisible();
    } else {
        // Assuming an error message is displayed
        await expect(page.getByText('Input exceeds maximum allowed length (4000 characters).')).toBeVisible(); // Placeholder error message
        await expect(page.locator('.success-message')).not.toBeVisible();
    }
});

test('TC-7: Concurrent Saves of Medical History by Multiple Users', async ({ browser }) => {
    // Preconditions: Two distinct users, Patient A, both have access
    // This test simulates concurrency using two separate browser contexts.
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    // User 1 logs in and navigates
    await login(user1Page, 'user1', 'password123'); // Placeholder credentials
    await navigateToPatientMedicalHistory(user1Page, PATIENT_A_ID);

    // User 2 logs in and navigates
    await login(user2Page, 'user2', 'password123'); // Placeholder credentials
    await navigateToPatientMedicalHistory(user2Page, PATIENT_A_ID);

    // Steps:
    // User 1 enters new medical history data
    await user1Page.getByRole('textbox', { name: 'Allergies' }).fill('Penicillin');
    // User 2 enters different new medical history data
    await user2Page.getByRole('textbox', { name: 'Past Conditions' }).fill('Diabetes');

    // User 1 clicks 'Save'
    await saveMedicalHistory(user1Page);
    await expect(user1Page.getByText('Medical history saved successfully.')).toBeVisible();

    // User 2 clicks 'Save' shortly after User 1
    await saveMedicalHistory(user2Page);

    // Expected Result: Both sets of medical history data are saved correctly without data loss or corruption,
    // or the system provides a clear conflict resolution mechanism.

    // Option 1: Both saved successfully (optimistic locking/merge) - assuming the system handles this gracefully
    await expect(user2Page.getByText('Medical history saved successfully.')).toBeVisible();
    // Verify data for User 1's view (might need refresh)
    await user1Page.reload();
    await expect(user1Page.getByRole('textbox', { name: 'Allergies' })).toHaveValue('Penicillin');
    await expect(user1Page.getByRole('textbox', { name: 'Past Conditions' })).toHaveValue('Diabetes'); // Expect User 2's data to be visible

    // Verify data for User 2's view
    await user2Page.reload();
    await expect(user2Page.getByRole('textbox', { name: 'Allergies' })).toHaveValue('Penicillin'); // Expect User 1's data to be visible
    await expect(user2Page.getByRole('textbox', { name: 'Past Conditions' })).toHaveValue('Diabetes');

    // Option 2: Conflict resolution (if the system provides a specific message) - uncomment and adjust if applicable
    // await expect(user2Page.getByText('Data has been updated by another user, please refresh and re-enter.')).toBeVisible();
    // If conflict, then User 2's save might fail, and User 1's data should be present.
    // await user1Page.reload();
    // await expect(user1Page.getByRole('textbox', { name: 'Allergies' })).toHaveValue('Penicillin');
    // await expect(user1Page.getByRole('textbox', { name: 'Past Conditions' })).toHaveValue(''); // Or whatever was there before User 2's attempt

    await user1Context.close();
    await user2Context.close();
});

test('TC-8: Attempt to Save Medical History During Simulated Network/Server Error', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access, mechanism to simulate error
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Enter valid medical history data.
    await page.getByRole('textbox', { name: 'Allergies' }).fill('Dust');
    // Initiate the simulated network/server error.
    await page.route('**/api/medical-history/*', async route => { // Placeholder API endpoint
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Internal Server Error' }),
        });
    });

    // Click the 'Save' button.
    await saveMedicalHistory(page);

    // Expected Result: The system displays an appropriate error message and the data is not saved.
    await expect(page.getByText('Unable to connect to server. Please try again later.')).toBeVisible(); // Placeholder error message
    await expect(page.locator('.success-message')).not.toBeVisible();

    // Verify data was not saved (e.g., by reloading and checking the field value)
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Allergies' })).not.toHaveValue('Dust'); // Assuming it reverts or is empty
});

test('TC-9: Attempt to Save Medical History with Malicious Input (SQL Injection)', async ({ page }) => {
    // Preconditions: User is logged in, Patient A exists, User has access
    await login(page, 'testuser', 'password123');
    await navigateToPatientMedicalHistory(page, PATIENT_A_ID);

    // Steps:
    // Enter malicious input into a free-text medical history field (e.g., 'Notes').
    const maliciousInput = `' OR '1'='1; DROP TABLE Users; --`;
    await page.getByRole('textbox', { name: 'Notes' }).fill(maliciousInput);
    // Click the 'Save' button.
    await saveMedicalHistory(page);

    // Expected Result: The system sanitizes the input, saves the literal string, or rejects the input with an error.
    // It should not execute any malicious code or cause data corruption/security breaches.
    const notesField = page.getByRole('textbox', { name: 'Notes' });

    // Option 1: Input is sanitized and saved as literal string (most common and secure outcome)
    await expect(notesField).toHaveValue(maliciousInput); // Expect the literal string to be saved
    await expect(page.getByText('Medical history saved successfully.')).toBeVisible();

    // Option 2: Input is rejected with an specific error message (uncomment and adjust if applicable)
    // await expect(page.getByText('Invalid characters detected in input.')).toBeVisible(); // Placeholder error message
    // await expect(page.locator('.success-message')).not.toBeVisible();
});
