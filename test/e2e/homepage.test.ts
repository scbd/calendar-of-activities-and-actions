import { setup, createPage } from '@nuxt/test-utils/e2e';
import { describe, it } from 'vitest';
import { expect } from '@playwright/test';

describe('Activities Calendar Homepage', async () => {
  await setup({
    host: 'http://localhost:3000',
  });

  const BASE = '/calendar-of-activities-and-actions/';

  it('should load the main page with heading', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: 'Calendar of Activities and Actions' });

    await expect(heading).toBeVisible();
  });

  it('should display a filter panel', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Basic filter mode is default — verify filter section is present
    const filtersSection = page.locator('.calendar-filters');

    await expect(filtersSection).toBeVisible();

    // Search input should be visible
    const searchInput = page.locator('#search-filter');

    await expect(searchInput).toBeVisible();
  });

  it('should display date range inputs', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    const startDate = page.locator('input[type="date"]').first();
    const endDate = page.locator('input[type="date"]').last();

    await expect(startDate).toBeVisible();
    await expect(endDate).toBeVisible();
  });

  it('should show results count after data loads', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear and results to render
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    // "Showing X of Y results" text should appear
    const resultCount = page.locator('[role="status"]').filter({ hasText: /Showing \d+ of \d+ results/ });

    await expect(resultCount).toBeVisible({ timeout: 15_000 });
  });

  it('should display at least one calendar item', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Wait for initial load to finish
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    // List view shows accordion items inside month groups
    const accordionItems = page.locator('.activities-explorer .accordion');

    // At least one item should be visible
    await expect(accordionItems.first()).toBeVisible({ timeout: 15_000 });
  });

  it('should have view switcher buttons', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    const gridButton = page.getByRole('button', { name: 'Grid View' });
    const listButton = page.getByRole('button', { name: 'List View' });

    await expect(gridButton).toBeVisible();
    await expect(listButton).toBeVisible();

    // List view should be active by default
    await expect(listButton).toHaveClass(/active/);
  });

  it('should switch to grid (table) view', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    const gridButton = page.getByRole('button', { name: 'Grid View' });

    await gridButton.click();

    // Wait for table to appear
    const table = page.locator('table.table-hover');

    await expect(table).toBeVisible({ timeout: 15_000 });

    // Check for expected column headers
    const dateHeader = page.locator('th').filter({ hasText: 'Date' });
    const typeHeader = page.locator('th').filter({ hasText: 'Type' });
    const titleHeader = page.locator('th').filter({ hasText: 'Title' });
    const statusHeader = page.locator('th').filter({ hasText: 'Status' });

    await expect(dateHeader).toBeVisible();
    await expect(typeHeader).toBeVisible();
    await expect(titleHeader).toBeVisible();
    await expect(statusHeader).toBeVisible();
  });

  it('should have tab view toggle', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    const tabToggle = page.locator('#tab-view-toggle');

    await expect(tabToggle).toBeVisible();
    await expect(tabToggle).not.toBeChecked();
  });

  it('should toggle advanced search mode', async () => {
    const page = await createPage(BASE);

    await page.waitForLoadState('networkidle');

    // Click the toggle button to switch to advanced search
    const toggleButton = page.getByRole('button', { name: /Show advanced search/i });

    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Advanced filter (mega-filter) should appear
    const megaFilter = page.locator('.calendar-filters-2');

    await expect(megaFilter).toBeVisible({ timeout: 5_000 });
  });

  it('should filter results by search text via URL', async () => {
    const page = await createPage(`${BASE}?search=biodiversity`);

    await page.waitForLoadState('networkidle');

    // Wait for spinner to finish
    await page.waitForSelector('.loading-container .spinner-border', { state: 'hidden', timeout: 30_000 });

    // Search input should have the value
    const searchInput = page.locator('#search-filter');

    await expect(searchInput).toHaveValue('biodiversity');
  });
});