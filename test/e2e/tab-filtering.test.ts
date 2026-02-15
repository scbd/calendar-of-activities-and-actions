import { setup, createPage } from '@nuxt/test-utils/e2e';
import { describe, it } from 'vitest';
import { expect } from '@playwright/test';

describe('Tab View Filtering', async () => {
  await setup({
    host: 'http://localhost:3000',
  });

  const BASE = '/calendar-of-activities-and-actions/';

  it('should enable tab view and default to Meeting tab', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();

    // Wait for tab nav to appear
    const tabList = page.locator('[role="tablist"]');

    await expect(tabList).toBeVisible({ timeout: 10_000 });

    // Meeting tab should be active by default
    const meetingTab = page.locator('button.nav-link').filter({ hasText: 'Meetings' });

    await expect(meetingTab).toHaveClass(/active/);

    // URL should reflect the meeting type
    await page.waitForURL(/types=meeting/, { timeout: 10_000 });
  });

  it('should switch to Notification tab and update URL', async () => {
    const page = await createPage(`${BASE}?types=meeting`);

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();

    // Wait for tab nav to appear
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 });

    // Click on Notification tab
    const notificationTab = page.locator('button.nav-link').filter({ hasText: 'Notifications' });

    await notificationTab.click();

    // Check that notification tab is active
    await expect(notificationTab).toHaveClass(/active/);

    // Wait for the URL to update
    await page.waitForURL(/types=notification/, { timeout: 10_000 });
  });

  it('should switch to Calendar Activity tab and update URL', async () => {
    const page = await createPage(`${BASE}?types=meeting`);

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();

    // Wait for tab nav to appear
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 });

    // Click on Activities tab (calendarActivity schema)
    const activityTab = page.locator('button.nav-link').filter({ hasText: 'Activities' });

    await activityTab.click();

    // Check that activity tab is active
    await expect(activityTab).toHaveClass(/active/);

    // Wait for the URL to update — uses calendarActivity (not activity)
    await page.waitForURL(/types=calendarActivity/, { timeout: 10_000 });
  });

  it('should show results for each tab type', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();

    // Wait for tab nav and initial data to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 });
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    // Meeting tab should have results
    const meetingTab = page.locator('button.nav-link').filter({ hasText: 'Meetings' });

    await expect(meetingTab).toHaveClass(/active/);

    // Wait for results to appear — list view default
    const resultStatus = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultStatus).toBeVisible({ timeout: 15_000 });

    // Switch to notifications and verify results load
    const notificationTab = page.locator('button.nav-link').filter({ hasText: 'Notifications' });

    await notificationTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    // Result count should update (allow time for SOLR response)
    await expect(resultStatus).toBeVisible({ timeout: 15_000 });

    // Switch to activities and verify results load
    const activityTab = page.locator('button.nav-link').filter({ hasText: 'Activities' });

    await activityTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    await expect(resultStatus).toBeVisible({ timeout: 15_000 });
  });

  it('should persist tab view in grid mode', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Enable tab view
    const tabViewToggle = page.locator('#tab-view-toggle');

    await tabViewToggle.check();

    // Wait for tab nav
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 });

    // Switch to grid view
    const gridButton = page.getByRole('button', { name: 'Grid View' });

    await gridButton.click();

    // Table should appear with tabs still showing
    const table = page.locator('table.table-hover');

    await expect(table).toBeVisible({ timeout: 15_000 });

    // Tabs should still be visible
    const tabList = page.locator('[role="tablist"]');

    await expect(tabList).toBeVisible();
  });
});
