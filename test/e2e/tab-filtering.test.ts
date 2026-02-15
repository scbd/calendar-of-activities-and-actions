import { setup, createPage } from '@nuxt/test-utils/e2e';
import { describe, it, expect } from 'vitest';

describe('Tab View Filtering', async () => {
  await setup({
    host: 'http://localhost:3001',
  });

  it('should filter by type when switching tabs', async () => {
    const page = await createPage('/calendar-of-activities-and-actions/');

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();
    await page.waitForTimeout(500); // Wait for UI to update

    // Initially, "Meeting" tab should be active and only meetings shown
    const meetingTab = page.locator('button.nav-link:has-text("Meeting")');

    await expect(meetingTab).toHaveClass(/active/);
    
    // Wait for the URL to update
    await page.waitForURL(/types=meeting/);

    // Check that we have results
    const firstMeetingRows = await page.locator('table tbody tr.main-row').count();

    console.log('Meetings count:', firstMeetingRows);
    expect(firstMeetingRows).toBeGreaterThan(0);

    // Click on "Notification" tab
    const notificationTab = page.locator('button.nav-link:has-text("Notification")');

    await notificationTab.click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Check that notification tab is active
    await expect(notificationTab).toHaveClass(/active/);
    
    // Wait for the URL to update
    await page.waitForURL(/types=notification/);

    // Check that we have different results (notifications)
    const notificationRows = await page.locator('table tbody tr.main-row').count();

    console.log('Notifications count:', notificationRows);
    expect(notificationRows).toBeGreaterThan(0);

    // Click on "Activities" tab (calendarActivity schema)
    const activityTab = page.locator('button.nav-link:has-text("Activities")');

    await activityTab.click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Check that activity tab is active
    await expect(activityTab).toHaveClass(/active/);
    
    // Wait for the URL to update
    await page.waitForURL(/types=calendarActivity/);

    // Check that we have results (activities)
    const activityRows = await page.locator('table tbody tr.main-row').count();

    console.log('Activities count:', activityRows);
    expect(activityRows).toBeGreaterThan(0);

    // Go back to meetings to verify it still works
    await meetingTab.click();
    await page.waitForTimeout(500);
    await expect(meetingTab).toHaveClass(/active/);
    await page.waitForURL(/types=meeting/);

    const secondMeetingRows = await page.locator('table tbody tr.main-row').count();

    console.log('Meetings count (2nd time):', secondMeetingRows);
    expect(secondMeetingRows).toEqual(firstMeetingRows);
  });
});
