// ============================================================
// E2E Tests — Medications Flow
// ============================================================

import { test, expect } from '@playwright/test';

test.describe('Medications Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/medications');
    });

    test('should display medications list', async ({ page }) => {
        const heading = page.getByRole('heading', { name: /medications/i });
        await expect(heading).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Lisinopril');
        // Search should filter the list
        await page.waitForTimeout(300); // debounce
    });

    test('should have filter buttons', async ({ page }) => {
        const filters = ['All', 'Active', 'As Needed', 'Discontinued'];
        for (const filter of filters) {
            const button = page.getByRole('button', { name: filter });
            await expect(button).toBeVisible();
        }
    });

    test('should navigate to add medication page', async ({ page }) => {
        const addButton = page.getByRole('link', { name: /add/i });
        await addButton.click();
        await expect(page).toHaveURL(/medications\/add/);
    });
});

test.describe('Add Medication Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/medications/add');
    });

    test('should display 3 method options', async ({ page }) => {
        await expect(page.getByText(/manual entry/i)).toBeVisible();
        await expect(page.getByText(/barcode/i)).toBeVisible();
        await expect(page.getByText(/ocr/i)).toBeVisible();
    });

    test('should show manual entry form', async ({ page }) => {
        await page.getByText(/manual entry/i).click();
        await expect(page.getByPlaceholder(/search drug/i).or(page.getByLabel(/medication name/i))).toBeVisible();
    });
});
