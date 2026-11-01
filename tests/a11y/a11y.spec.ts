import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit (WCAG 2.2 AA)', () => {
  const themes = ['light', 'dark', 'high-contrast'] as const;

  for (const theme of themes) {
    test(`Intake Wizard has zero serious or critical a11y violations in ${theme} mode`, async ({ page }) => {
      await page.goto('/');

      if (theme === 'dark') {
        await page.getByRole('button', { name: /Switch to dark theme/i }).click({ force: true });
      } else if (theme === 'high-contrast') {
        await page.getByRole('button', { name: /Switch to high contrast theme/i }).click({ force: true });
      }

      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const criticalViolations = scanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(criticalViolations).toEqual([]);
    });

    test(`Celebration Screens have zero serious or critical a11y violations in ${theme} mode`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/');

      // Load sample wedding to enter planner screens
      await page.getByRole('button', { name: /Load Sample Wedding/i }).click();

      if (theme === 'dark') {
        await page.getByRole('button', { name: /Switch to dark theme/i }).click({ force: true });
      } else if (theme === 'high-contrast') {
        await page.getByRole('button', { name: /Switch to high contrast theme/i }).click({ force: true });
      }

      const nav = page.getByRole('navigation', { name: /Celebration Sections/i });
      const screens = ['dashboard', 'budget', 'timeline', 'vendors', 'ideas', 'chat'];

      for (const screen of screens) {
        if (screen === 'chat') {
          const btn = nav.getByRole('button', { name: /AI Assistant/i });
          await btn.click();
          await btn.scrollIntoViewIfNeeded();
        } else if (screen !== 'dashboard') {
          const btn = nav.getByRole('button', { name: new RegExp(screen, 'i') });
          await btn.click();
          await btn.scrollIntoViewIfNeeded();
        }

        await page.waitForTimeout(200);

        const scanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();

        const criticalViolations = scanResults.violations.filter(
          v => v.impact === 'serious' || v.impact === 'critical'
        );

        expect(
          criticalViolations,
          `Accessibility violations on ${screen} in ${theme} mode: ${JSON.stringify(criticalViolations, null, 2)}`
        ).toEqual([]);
      }
    });
  }
});
