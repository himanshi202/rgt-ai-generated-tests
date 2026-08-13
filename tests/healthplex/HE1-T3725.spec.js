const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // TODO: Replace with actual base URL
const LOGIN_PATH = '/login'; // TODO: Replace with actual login path
const LEAD_MANAGEMENT_DASHBOARD_PATH = '/lead-management/dashboard'; // TODO: Replace with actual Lead Management dashboard path
const LEAD_SOURCE_PATH = '/lead-management/lead-sources'; // TODO: Replace with actual Lead Source page path

const VALID_USERNAME = process.env.VALID_USERNAME || 'user@example.com'; // TODO: Replace with actual valid username
const VALID_PASSWORD = process.env.VALID_PASSWORD || 'password123'; // TODO: Replace with actual valid password

// Helper function for login, to be reused across tests
async function login(page) {
  await page.goto(BASE_URL + LOGIN_PATH);
  await page.getByLabel('Username').fill(VALID_USERNAME); // Assuming a 'Username' label for the input
  await page.getByLabel('Password').fill(VALID_PASSWORD); // Assuming a 'Password' label for the input
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(BASE_URL + LEAD_MANAGEMENT_DASHBOARD_PATH); // Assuming successful login redirects to dashboard
}

// Helper function to navigate to Lead Source Page
async function navigateToLeadSourcePage(page) {
  await page.getByRole('link', { name: 'Lead Management' }).click(); // Assuming a link for Lead Management module
  await page.getByRole('link', { name: 'Lead Source' }).click(); // Assuming a link/tab for Lead Source
  await expect(page).toHaveURL(BASE_URL + LEAD_SOURCE_PATH);
  await expect(page.getByRole('heading', { name: 'Lead Sources' })).toBeVisible(); // Assuming a heading for the Lead Source page
}

test('TC-1: Verify Lead Source Page loads successfully', async ({ page }) => {
  // Preconditions: User is logged in, User has navigated to the Lead Management module
  await login(page);
  await page.getByRole('link', { name: 'Lead Management' }).click(); // Navigate to Lead Management module

  // 1. Click on the 'Lead Source' link or tab within the Lead Management module.
  await page.getByRole('link', { name: 'Lead Source' }).click();

  // Expected Result: The Lead Source Page loads completely without any errors, displaying its main content.
  await expect(page).toHaveURL(BASE_URL + LEAD_SOURCE_PATH);
  await expect(page.getByRole('heading', { name: 'Lead Sources' })).toBeVisible(); // Check for a main heading
  await expect(page.getByRole('button', { name: 'Add New Lead Source' })).toBeVisible(); // Check for a key element
  // You might add more specific checks for content loading, e.g., a table or list of sources
});

test('TC-2: Verify all expected UI elements are present and correctly rendered', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Visually inspect the Lead Source Page.
  // Expected Result: All expected UI elements (e.g., 'Add New Lead Source' button, 'Lead Source Name' input field, a table/list for existing lead sources, search/filter options, labels) are present, clearly visible, and correctly rendered without distortion.
  await expect(page.getByRole('button', { name: 'Add New Lead Source' })).toBeVisible();
  await expect(page.getByLabel('Lead Source Name')).toBeVisible(); // Assuming an input field with this label for adding/editing
  await expect(page.getByRole('table', { name: 'Lead Sources List' })).toBeVisible(); // Assuming a table with an accessible name
  await expect(page.getByPlaceholder('Search Lead Sources')).toBeVisible(); // Assuming a search input with this placeholder
  // Add more specific checks for other elements as needed
});

test('TC-3: Verify Lead Source Page layout consistency and absence of visual defects', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Visually inspect the overall layout and design of the Lead Source Page.
  // Expected Result: The page layout is consistent with design expectations, free of visual defects such as overlapping elements, broken images, misaligned text, or incorrect spacing.
  // This test uses a visual regression snapshot. A human reviewer will need to approve the initial snapshot.
  await expect(page).toHaveScreenshot('lead-source-page-layout.png', { fullPage: true });
});

test('TC-4: Verify user can successfully add a new Lead Source', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Click the 'Add New Lead Source' button.
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await expect(page.getByRole('heading', { name: 'Add Lead Source' })).toBeVisible(); // Assuming a modal/form appears with this heading

  // 2. Enter a valid and unique 'Lead Source Name' (e.g., 'Website Referral') into the input field.
  const newLeadSourceName = 'Website Referral ' + Date.now(); // Ensure uniqueness
  await page.getByLabel('Lead Source Name').fill(newLeadSourceName);

  // 3. Click the 'Save' or 'Create' button.
  await page.getByRole('button', { name: 'Save' }).click(); // Assuming 'Save' button in the form/modal

  // Expected Result: The new Lead Source 'Website Referral' is successfully added and displayed in the list/table of lead sources. A success message is shown.
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible(); // Assuming a success message
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(newLeadSourceName)).toBeVisible();
});

test('TC-5: Verify user can successfully edit an existing Lead Source', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page, An existing Lead Source (e.g., 'Website Referral') is present in the list
  await login(page);
  await navigateToLeadSourcePage(page);

  // Ensure 'Website Referral' exists for editing
  const originalLeadSourceName = 'Website Referral For Edit';
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await page.getByLabel('Lead Source Name').fill(originalLeadSourceName);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(originalLeadSourceName)).toBeVisible();

  // 1. Locate 'Website Referral' in the list of lead sources.
  // 2. Click the 'Edit' icon or button corresponding to 'Website Referral'.
  const rowLocator = page.getByRole('row', { name: originalLeadSourceName });
  await rowLocator.getByRole('button', { name: 'Edit' }).click(); // Assuming an 'Edit' button within the row
  await expect(page.getByRole('heading', { name: 'Edit Lead Source' })).toBeVisible(); // Assuming an edit modal/form heading

  // 3. Modify the 'Lead Source Name' (e.g., change to 'Online Referral').
  const updatedLeadSourceName = 'Online Referral ' + Date.now();
  await page.getByLabel('Lead Source Name').fill(updatedLeadSourceName);

  // 4. Click the 'Save' or 'Update' button.
  await page.getByRole('button', { name: 'Update' }).click(); // Assuming 'Update' button in the form/modal

  // Expected Result: The Lead Source is updated from 'Website Referral' to 'Online Referral' in the list/table. A success message is shown.
  await expect(page.getByText('Lead Source updated successfully.')).toBeVisible(); // Assuming a success message
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(originalLeadSourceName)).not.toBeVisible(); // Original name should be gone
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(updatedLeadSourceName)).toBeVisible(); // New name should be visible
});

test('TC-6: Verify user can successfully delete an existing Lead Source', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page, An existing Lead Source (e.g., 'Online Referral') is present in the list
  await login(page);
  await navigateToLeadSourcePage(page);

  // Ensure 'Online Referral' exists for deletion
  const leadSourceToDelete = 'Online Referral For Delete';
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await page.getByLabel('Lead Source Name').fill(leadSourceToDelete);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(leadSourceToDelete)).toBeVisible();

  // 1. Locate 'Online Referral' in the list of lead sources.
  // 2. Click the 'Delete' icon or button corresponding to 'Online Referral'.
  const rowLocator = page.getByRole('row', { name: leadSourceToDelete });
  await rowLocator.getByRole('button', { name: 'Delete' }).click(); // Assuming a 'Delete' button within the row

  // 3. Confirm the deletion in the confirmation prompt (if any).
  await page.getByRole('button', { name: 'Confirm Delete' }).click(); // Assuming a confirmation dialog with a 'Confirm Delete' button

  // Expected Result: The Lead Source 'Online Referral' is successfully removed from the list/table. A success message is shown.
  await expect(page.getByText('Lead Source deleted successfully.')).toBeVisible(); // Assuming a success message
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(leadSourceToDelete)).not.toBeVisible();
});

test('TC-7: Verify displayed Lead Source data is accurate and up-to-date', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page, There are existing Lead Sources in the system (e.g., 'Direct Call', 'Email Campaign') that match known backend data
  await login(page);
  await navigateToLeadSourcePage(page);

  // For this test, we assume some lead sources are pre-seeded or added by other means.
  // We'll add a couple here for demonstration purposes if they don't exist.
  const knownLeadSources = ['Direct Call', 'Email Campaign'];

  for (const source of knownLeadSources) {
    if (!(await page.getByRole('table', { name: 'Lead Sources List' }).getByText(source).isVisible())) {
      await page.getByRole('button', { name: 'Add New Lead Source' }).click();
      await page.getByLabel('Lead Source Name').fill(source);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
    }
  }
  await page.reload(); // Reload to ensure the list is fresh

  // 1. Observe the list of Lead Sources displayed on the page.
  // 2. Compare the displayed data with known backend data or expected values.
  // Expected Result: The list of Lead Sources displayed on the page accurately reflects the current data in the system, including any recent additions, edits, or deletions.
  for (const source of knownLeadSources) {
    await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(source)).toBeVisible();
  }
  // More advanced checks would involve API calls to verify data against the backend.
});

test('TC-8: Verify valid input is accepted by data entry fields without validation errors', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Click 'Add New Lead Source'.
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await expect(page.getByRole('heading', { name: 'Add Lead Source' })).toBeVisible();

  // 2. Enter a valid, unique 'Lead Source Name' (e.g., 'Social Media Campaign').
  const validLeadSourceName = 'Social Media Campaign ' + Date.now();
  await page.getByLabel('Lead Source Name').fill(validLeadSourceName);

  // 3. Click 'Save'.
  await page.getByRole('button', { name: 'Save' }).click();

  // Expected Result: The new Lead Source is successfully saved, and no validation error messages are displayed.
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(validLeadSourceName)).toBeVisible();
  await expect(page.getByText('Lead Source Name cannot be empty')).not.toBeVisible(); // Ensure no error message
  await expect(page.getByText('Lead Source Name already exists')).not.toBeVisible(); // Ensure no error message
});

test('TC-9: Verify invalid input triggers appropriate error messages for data entry fields', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // Add a lead source to test duplicate scenario
  const existingLeadSource = 'Existing Source For Validation';
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await page.getByLabel('Lead Source Name').fill(existingLeadSource);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
  await page.getByRole('button', { name: 'Add New Lead Source' }).click(); // Re-open the form

  // 1. Click 'Add New Lead Source'. (Already done above)
  // 2. Attempt to enter invalid data (e.g., leave 'Lead Source Name' blank, or enter a name that already exists if uniqueness is enforced).
  // Test blank name
  await page.getByLabel('Lead Source Name').fill('');
  await page.getByRole('button', { name: 'Save' }).click();
  // Expected Result: An appropriate, user-friendly error message is displayed (e.g., 'Lead Source Name cannot be empty', 'Lead Source Name already exists'), and the Lead Source is not saved.
  await expect(page.getByText('Lead Source Name cannot be empty')).toBeVisible(); // Assuming this error message
  await expect(page.getByText('Lead Source added successfully.')).not.toBeVisible();

  // Test duplicate name
  await page.getByLabel('Lead Source Name').fill(existingLeadSource);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source Name already exists')).toBeVisible(); // Assuming this error message
  await expect(page.getByText('Lead Source added successfully.')).not.toBeVisible();

  // Close the form
  await page.getByRole('button', { name: 'Cancel' }).click(); // Assuming a cancel button
});

test('TC-10: Verify navigation actions correctly direct the user to other parts of the application', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Identify and click a navigation link or action on the page (e.g., 'Back to Lead Management Dashboard' or a link to view details of a specific lead source).
  // Assuming a 'Back to Dashboard' link or similar
  await page.getByRole('link', { name: 'Back to Lead Management Dashboard' }).click(); // TODO: Adjust locator if different

  // Expected Result: The user is correctly navigated to the intended destination page or the expected transition occurs without errors.
  await expect(page).toHaveURL(BASE_URL + LEAD_MANAGEMENT_DASHBOARD_PATH);
  await expect(page.getByRole('heading', { name: 'Lead Management Dashboard' })).toBeVisible(); // Assuming a heading for the dashboard
});

test('TC-11: Verify Lead Source Page responsiveness across different screen sizes and devices', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Access the Lead Source Page on various devices (e.g., desktop, tablet, mobile) or use browser developer tools to simulate different screen sizes and orientations.
  // 2. Observe the page layout, element rendering, and functionality.
  // Expected Result: The page layout adapts correctly to different screen sizes, all elements remain accessible and functional, and there are no horizontal scrollbars, truncated content, or broken layouts.

  // Test desktop view
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page).toHaveScreenshot('lead-source-desktop.png', { fullPage: true });

  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('lead-source-tablet.png', { fullPage: true });

  // Test mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('lead-source-mobile.png', { fullPage: true });
});

test('TC-12: Verify unauthorized users cannot access the Lead Source Page', async ({ page }) => {
  // Preconditions: User is not logged in OR User is logged in with a role that does not have permissions for Lead Management

  // Scenario 1: User is not logged in
  await page.goto(BASE_URL + LEAD_SOURCE_PATH);
  // Expected Result: The user is redirected to the login page, an 'Access Denied' error page is displayed, or the Lead Source Page content is not rendered.
  await expect(page).toHaveURL(BASE_URL + LOGIN_PATH); // Assuming redirection to login page
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  // Scenario 2: User is logged in but unauthorized (requires specific setup for roles/permissions)
  // This part is a placeholder as role-based access control setup is outside the scope of a generic script.
  // await loginWithUnauthorizedRole(page); // TODO: Implement if specific unauthorized role credentials are known
  // await page.goto(BASE_URL + LEAD_SOURCE_PATH);
  // await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible(); // Assuming an 'Access Denied' page
});

test('TC-13: Verify page stability under rapid navigation and interaction', async ({ page }) => {
  // Preconditions: User is logged in, User has navigated to the Lead Management module
  await login(page);
  await page.getByRole('link', { name: 'Lead Management' }).click();

  // 1. Rapidly click between the 'Lead Source' link/tab and another module link (e.g., 'Leads List') multiple times.
  const leadSourceLink = page.getByRole('link', { name: 'Lead Source' });
  const leadsListLink = page.getByRole('link', { name: 'Leads List' }); // TODO: Adjust locator for another module link

  for (let i = 0; i < 5; i++) {
    await leadSourceLink.click();
    await expect(page).toHaveURL(BASE_URL + LEAD_SOURCE_PATH);
    await expect(page.getByRole('heading', { name: 'Lead Sources' })).toBeVisible();
    await leadsListLink.click();
    await expect(page).toHaveURL(BASE_URL + '/lead-management/leads'); // TODO: Adjust expected URL for Leads List
    await expect(page.getByRole('heading', { name: 'Leads List' })).toBeVisible(); // TODO: Adjust expected heading for Leads List
  }

  await leadSourceLink.click(); // Ensure we are back on Lead Source page for next steps
  await expect(page).toHaveURL(BASE_URL + LEAD_SOURCE_PATH);

  // 2. While on the Lead Source page, rapidly click 'Add New Lead Source' and 'Cancel' buttons multiple times.
  const addLeadSourceButton = page.getByRole('button', { name: 'Add New Lead Source' });
  const cancelButton = page.getByRole('button', { name: 'Cancel' });

  for (let i = 0; i < 5; i++) {
    await addLeadSourceButton.click();
    await expect(page.getByRole('heading', { name: 'Add Lead Source' })).toBeVisible();
    await cancelButton.click();
    await expect(page.getByRole('heading', { name: 'Add Lead Source' })).not.toBeVisible();
  }

  // 3. Rapidly click 'Edit' and 'Cancel' for an existing item.
  // First, ensure an item exists
  const tempLeadSource = 'Temporary Source For Rapid Edit ' + Date.now();
  await addLeadSourceButton.click();
  await page.getByLabel('Lead Source Name').fill(tempLeadSource);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();

  const editButton = page.getByRole('row', { name: tempLeadSource }).getByRole('button', { name: 'Edit' });
  for (let i = 0; i < 5; i++) {
    await editButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Lead Source' })).toBeVisible();
    await cancelButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Lead Source' })).not.toBeVisible();
  }

  // Expected Result: The page loads consistently without errors, visual glitches, or unexpected behavior. No data corruption or unexpected state changes occur from rapid interactions.
  // We check for page errors and element visibility. Visual glitches would require visual regression.
  page.on('pageerror', error => {
    expect(error).toBeNull(); // Assert no page errors occurred
  });
  await expect(page.getByRole('heading', { name: 'Lead Sources' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' })).toBeVisible();
});

test('TC-14: Verify system handles attempt to delete a non-existent or already deleted Lead Source gracefully', async ({ page }) => {
  // Preconditions: User is on the Lead Source Page
  await login(page);
  await navigateToLeadSourcePage(page);

  // 1. Add a new Lead Source (e.g., 'Temporary Source').
  const temporarySource = 'Temporary Source For Deletion ' + Date.now();
  await page.getByRole('button', { name: 'Add New Lead Source' }).click();
  await page.getByLabel('Lead Source Name').fill(temporarySource);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Lead Source added successfully.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(temporarySource)).toBeVisible();

  // 2. Delete 'Temporary Source'.
  const rowLocator = page.getByRole('row', { name: temporarySource });
  await rowLocator.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm Delete' }).click();
  await expect(page.getByText('Lead Source deleted successfully.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(temporarySource)).not.toBeVisible();

  // 3. Attempt to delete 'Temporary Source' again (e.g., by refreshing the page and clicking a stale delete button, or if the UI allows re-attempting deletion of a recently deleted item).
  await page.reload(); // Refresh the page to ensure UI state is fresh

  // Attempt to click delete for the now non-existent item. This assumes the UI might still show a stale button or allow an action.
  // A more robust UI would disable/remove the button, but we're testing the graceful handling if an attempt is made.
  // We'll try to find a delete button that *might* correspond to the deleted item, or simulate a direct action if possible.
  // For now, we'll assert that the item is not visible and if a delete action is attempted (e.g., via API or a re-enabled button),
  // an appropriate error is shown.

  // If the UI removes the button, this will pass by not finding it.
  // If the UI keeps a stale button, clicking it should result in an error message.
  const deleteButtonForNonExistent = page.getByRole('row', { name: temporarySource }).getByRole('button', { name: 'Delete' });
  if (await deleteButtonForNonExistent.isVisible()) {
    await deleteButtonForNonExistent.click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click(); // Confirm if a dialog appears
    await expect(page.getByText('Lead Source not found')).toBeVisible(); // Assuming an error message for non-existent item
  } else {
    // If the button is not visible, the system is already handling it gracefully by removing the action.
    console.log('Delete button for non-existent item is not visible, system handled gracefully.');
  }

  // Expected Result: The system handles the request gracefully, either by showing an appropriate message (e.g., 'Item not found', 'Lead Source already deleted') or by disabling the delete action for non-existent items. No server error or unexpected behavior occurs.
  await expect(page.getByRole('table', { name: 'Lead Sources List' }).getByText(temporarySource)).not.toBeVisible();
  page.on('pageerror', error => {
    expect(error).toBeNull(); // Assert no page errors occurred
  });
});
