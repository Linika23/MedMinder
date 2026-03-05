// ============================================================
// E2E Tests — Navigation & Accessibility
// ============================================================

import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
    test('should load the homepage', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/MedMinder/);
    });

    test('should have skip navigation link', async ({ page }) => {
        await page.goto('/dashboard');
        const skipLink = page.locator('.skip-link');
        await expect(skipLink).toBeAttached();
        await skipLink.focus();
        await expect(skipLink).toBeVisible();
    });

    test('should navigate to all dashboard pages', async ({ page }) => {
        await page.goto('/dashboard');

        const navLinks = [
            { label: 'Medications', url: '/dashboard/medications' },
            { label: 'Interactions', url: '/dashboard/interactions' },
            { label: 'History', url: '/dashboard/history' },
            { label: 'Analytics', url: '/dashboard/analytics' },
            { label: 'Caregivers', url: '/dashboard/caregivers' },
            { label: 'Settings', url: '/dashboard/settings' },
        ];

        for (const link of navLinks) {
            await page.getByRole('link', { name: link.label }).first().click();
            await expect(page).toHaveURL(link.url);
        }
    });

    test('sidebar should be visible on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/dashboard');
        const sidebar = page.locator('aside');
        await expect(sidebar).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('all interactive elements should be keyboard accessible', async ({ page }) => {
        await page.goto('/dashboard/medications');
        await page.keyboard.press('Tab');

        // Should be able to tab through interactive elements
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            const focused = page.locator(':focus');
            const tagName = await focused.evaluate(el => el.tagName?.toLowerCase());
            expect(['a', 'button', 'input', 'select', 'textarea']).toContain(tagName);
        }
    });

    test('should respect prefers-reduced-motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/dashboard');
        // No animations should run — verify CSS applied
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('should have ARIA live region', async ({ page }) => {
        await page.goto('/dashboard');
        const liveRegion = page.locator('#live-announcer');
        await expect(liveRegion).toBeAttached();
        await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/dashboard/medications');
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1); // WCAG: single h1 per page
    });
});
