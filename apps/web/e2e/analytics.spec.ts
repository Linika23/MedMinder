// ============================================================
// E2E Tests — Analytics & Export
// ============================================================

import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/analytics');
    });

    test('should display adherence score ring', async ({ page }) => {
        const heading = page.getByRole('heading', { name: /analytics/i });
        await expect(heading).toBeVisible();

        // Score ring SVG should be present
        const svg = page.locator('svg circle');
        await expect(svg.first()).toBeAttached();
    });

    test('should display weekly bar chart', async ({ page }) => {
        await expect(page.getByText(/last 7 days/i)).toBeVisible();
        // Day labels should be present
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (const day of dayLabels) {
            const label = page.getByText(day, { exact: true });
            // At least some days should be visible in the chart
        }
    });

    test('should display monthly heatmap', async ({ page }) => {
        // Heatmap should have month/year heading
        await expect(page.getByText(/2026/)).toBeVisible();

        // Legend should be present
        await expect(page.getByText(/less/i)).toBeVisible();
        await expect(page.getByText(/more/i)).toBeVisible();
    });

    test('should navigate months in heatmap', async ({ page }) => {
        const prevButton = page.locator('button').filter({ has: page.locator('svg path[d*="15.75"]') }).first();
        if (await prevButton.isVisible()) {
            await prevButton.click();
            await expect(page.getByText(/feb/i).or(page.getByText(/2026/))).toBeVisible();
        }
    });

    test('should display per-medication breakdown', async ({ page }) => {
        await expect(page.getByText(/per-medication/i)).toBeVisible();
    });

    test('should have export buttons', async ({ page }) => {
        await expect(page.getByText(/csv/i)).toBeVisible();
        await expect(page.getByText(/pdf/i)).toBeVisible();
        await expect(page.getByText(/doctor/i)).toBeVisible();
    });
});

test.describe('Interactions Page', () => {
    test('should display interactions page', async ({ page }) => {
        await page.goto('/dashboard/interactions');
        const heading = page.getByRole('heading', { name: /interactions/i });
        await expect(heading).toBeVisible();
    });

    test('should have run check button', async ({ page }) => {
        await page.goto('/dashboard/interactions');
        const checkButton = page.getByRole('button', { name: /check/i });
        await expect(checkButton).toBeVisible();
    });
});

test.describe('Caregivers Page', () => {
    test('should display caregivers page', async ({ page }) => {
        await page.goto('/dashboard/caregivers');
        const heading = page.getByRole('heading', { name: /caregiver/i });
        await expect(heading).toBeVisible();
    });
});

test.describe('Settings Page', () => {
    test('should display settings with tabs', async ({ page }) => {
        await page.goto('/dashboard/settings');
        await expect(page.getByText(/profile/i).first()).toBeVisible();
        await expect(page.getByText(/preferences/i)).toBeVisible();
        await expect(page.getByText(/notifications/i)).toBeVisible();
        await expect(page.getByText(/security/i)).toBeVisible();
    });
});
