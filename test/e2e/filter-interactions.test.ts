import { setup, createPage } from '@nuxt/test-utils/e2e';
import { describe, it } from 'vitest';
import { expect } from '@playwright/test';

describe('Filter Interactions', async () => {
  await setup({
    host: 'http://localhost:3000',
  });

  const BASE = '/calendar-of-activities-and-actions/';

  /**
   * Helper: waits for the initial loading spinner to disappear.
   */
  async function waitForDataLoad(page: Awaited<ReturnType<typeof createPage>>) {
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });
  }

  it('should apply record type filter via URL and show results', async () => {
    const page = await createPage(`${BASE}?types=meeting`);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Results should be visible
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });

    // URL should have the types param
    expect(page.url()).toContain('types=meeting');
  });

  it('should apply start date filter via URL', async () => {
    const page = await createPage(`${BASE}?startDate=2026-01-01`);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Start date input should have the value
    const startDateInput = page.locator('input[type="date"]').first();

    await expect(startDateInput).toHaveValue('2026-01-01');

    // Results should load
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });
  });

  it('should clear all filters when clicking Clear button', async () => {
    const page = await createPage(`${BASE}?types=meeting&startDate=2026-01-01`);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Find and click the clear button
    const clearButton = page.locator('button').filter({ hasText: /Clear all filters/i });

    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeEnabled();
    await clearButton.click();

    // Wait for data to reload
    await page.waitForLoadState('networkidle');

    // URL should be cleaned up — types and startDate removed
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('types=');
    expect(page.url()).not.toContain('startDate=');
  });

  it('should show action required checkbox and filter when toggled', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Action required checkbox should be visible
    const actionRequiredCheckbox = page.locator('#action-required-filter');

    await expect(actionRequiredCheckbox).toBeVisible();
    await expect(actionRequiredCheckbox).not.toBeChecked();

    // Toggle it
    await actionRequiredCheckbox.check();

    // Wait for URL to update
    await page.waitForTimeout(500);
    expect(page.url()).toContain('actionRequired=true');
  });

  it('should sync filter state from URL query params', async () => {
    const page = await createPage(`${BASE}?types=notification&actionRequired=true`);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Action required checkbox should be checked
    const actionRequiredCheckbox = page.locator('#action-required-filter');

    await expect(actionRequiredCheckbox).toBeChecked();

    // Results should be visible
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });
  });

  it('should update results when search text is entered', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Get initial results count text
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });
    const initialText = await resultCount.textContent();

    // Type in the search input
    const searchInput = page.locator('#search-filter');

    await searchInput.fill('biodiversity');

    // Wait for debounced search to trigger (300ms debounce + network)
    await page.waitForTimeout(1_000);
    await page.waitForLoadState('networkidle');

    // URL should have search param
    expect(page.url()).toContain('search=biodiversity');
  });

  it('should apply multiple filters via URL simultaneously', async () => {
    const page = await createPage(`${BASE}?types=calendarActivity&startDate=2025-01-01&endDate=2026-12-31`);

    await page.waitForLoadState('networkidle');
    await waitForDataLoad(page);

    // Verify all filter values are applied
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    await expect(startDateInput).toHaveValue('2025-01-01');
    await expect(endDateInput).toHaveValue('2026-12-31');

    // Results should load
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });
  });
});
