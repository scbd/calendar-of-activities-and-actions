import { setup, createPage } from '@nuxt/test-utils/e2e';
import { describe, it } from 'vitest';
import { expect } from '@playwright/test';

describe.skip('Activities Calendar E2E', async () => {
  await setup({
    host: 'http://localhost:3000',
  });

  describe('Home page', () => {
    it('should load the main page', async () => {
  const page = await createPage('/');
  await page.waitForLoadState();

      // Check if the main heading is visible
      const heading = page.getByRole('heading', { name: 'Activities & Actions Explorer' });
      await expect(heading).toBeVisible();
    });

    it('should display a data table', async () => {
  const page = await createPage('/');
  await page.waitForLoadState();

      // Check if table exists and has expected headers
  const table = page.locator('table');
  await expect(table).toBeVisible();

      // Check for table headers
  const titleHeader = page.getByRole('columnheader', { name: 'Title' });
  const typeHeader = page.getByRole('columnheader', { name: 'Type' });
  const statusHeader = page.getByRole('columnheader', { name: 'Status' });

      await expect(titleHeader).toBeVisible();
      await expect(typeHeader).toBeVisible();
      await expect(statusHeader).toBeVisible();
    });

    it('should have pagination controls', async () => {
  const page = await createPage('/');
  await page.waitForLoadState();

      // Check for pagination buttons
  const prevButton = page.getByRole('button', { name: 'Prev' });
  const nextButton = page.getByRole('button', { name: 'Next' });

  await expect(prevButton).toBeVisible();
  await expect(nextButton).toBeVisible();

      // Check for page indicator
      const pageIndicator = page.getByText('Page 1 / 1');
      await expect(pageIndicator).toBeVisible();
    });
  });
});