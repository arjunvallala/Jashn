import { test, expect } from '@playwright/test';

test.describe('Jashn End-to-End Smoke Flow', () => {
  test('completes full smoke flow: loads sample, navigates 6 screens, mutates budget, and exports ICS', async ({ page }) => {
    // 1. Visit Home
    await page.goto('/');
    await expect(page).toHaveTitle(/Jashn/i);

    // Verify initial intake wizard is displayed
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample Wedding/i });
    await expect(loadSampleBtn).toBeVisible();

    // 2. Load Sample Wedding
    await loadSampleBtn.click();

    // Navigation bar should now be visible with 6 tabs
    const nav = page.getByRole('navigation', { name: /Celebration Sections/i });
    await expect(nav).toBeVisible();

    // 3. Screen 1: Dashboard Overview
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Celebration/i);
    await expect(page.getByText(/Budget Allocation & Tracking/i)).toBeVisible();

    // 4. Screen 2: Budget Tracker & What-If Mutation
    await nav.getByRole('button', { name: 'Budget' }).click();
    await expect(page.getByRole('heading', { name: /Budget Allocation/i })).toBeVisible();

    // Toggle What-If simulator
    const whatIfBtn = page.getByRole('button', { name: /What-If/i });
    await whatIfBtn.click();
    const budgetInput = page.locator('#sim-budget');
    await expect(budgetInput).toBeVisible();

    // Change budget value and apply simulation
    await budgetInput.fill('2600000');
    const applyBtn = page.getByRole('button', { name: /Apply Simulated Values/i });
    await applyBtn.click();

    // 5. Screen 3: Timeline & ICS Export
    await nav.getByRole('button', { name: 'Timeline' }).click();
    await expect(page.getByRole('heading', { name: /Timeline/i })).toBeVisible();

    // Trigger ICS download
    const exportBtn = page.getByRole('button', { name: /Export iCalendar/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // 6. Screen 4: Vendors Screen
    await nav.getByRole('button', { name: 'Vendors' }).click();
    await expect(page.getByRole('heading', { name: /Vendor/i })).toBeVisible();

    // 7. Screen 5: Ideas Screen
    await nav.getByRole('button', { name: 'Ideas' }).click();
    await expect(page.getByRole('heading', { name: /Creative Concepts|Ideas/i })).toBeVisible();

    // 8. Screen 6: AI Assistant
    await nav.getByRole('button', { name: /AI Assistant/i }).click();
    await expect(page.getByRole('heading', { name: /AI Planning Assistant/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Propose a 10% trim/i)).toBeVisible();

    // 9. Verify Theme Toggle functionality
    const darkToggle = page.getByRole('button', { name: /Switch to dark theme/i });
    await darkToggle.click({ force: true });
    await expect(page.locator('html')).toHaveClass(/dark/);

    const highContrastToggle = page.getByRole('button', { name: /Switch to high contrast theme/i });
    await highContrastToggle.click({ force: true });
    await expect(page.locator('html')).toHaveClass(/high-contrast/);

    const lightToggle = page.getByRole('button', { name: /Switch to light theme/i });
    await lightToggle.click({ force: true });
    await expect(page.locator('html')).not.toHaveClass(/dark|high-contrast/);
  });
});
