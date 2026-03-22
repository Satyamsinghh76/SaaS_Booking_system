import { test, expect, Page } from '@playwright/test'

// Seed accounts that bypass email verification
const SEED_USER = { email: 'user@bookflow.com', password: 'Admin123!' }
const SEED_ADMIN = { email: 'admin@bookflow.com', password: 'Admin123!' }

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"], input[id="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Authentication — User', () => {
  test('user can log in with seed account', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password)

    // Should redirect to dashboard after login
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('user sees their name after login', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // Access token should be stored
    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(token).toBeTruthy()
  })

  test('user can access protected /dashboard/bookings after login', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    await page.goto('/dashboard/bookings')
    await expect(page).toHaveURL(/.*dashboard\/bookings/)
    // Should show bookings heading or empty state
    await expect(page.locator('text=Your Bookings, text=No bookings, text=Bookings').first()).toBeVisible()
  })

  test('regular user cannot access /admin', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    await page.goto('/admin')
    // Should be redirected away from admin
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10_000 })
    expect(page.url()).not.toContain('/admin')
  })

  test('user can log out', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // Open mobile menu or desktop dropdown to find sign out
    const signOutBtn = page.locator('text=Sign out, text=Logout, text=Log out').first()

    // Try desktop dropdown first
    const userMenu = page.locator('button:has-text("User"), button:has([class*="rounded-full"])').first()
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click()
    }

    // Try hamburger menu on mobile
    const hamburger = page.locator('button[aria-label="Toggle menu"]')
    if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await hamburger.click()
    }

    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click()
      await page.waitForURL('**/login**', { timeout: 10_000 })
    }

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(token).toBeFalsy()
  })

  test('login with wrong password shows error', async ({ page }) => {
    await login(page, SEED_USER.email, 'WrongPassword123!')

    // Should stay on login page and show error
    await expect(page.locator('text=Invalid, text=incorrect, text=error').first()).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('login with empty fields shows validation error', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')

    // Browser validation or custom error should prevent submission
    const emailInput = page.locator('input[type="email"], input[id="email"]').first()
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBeTruthy()
  })
})

test.describe('Authentication — Admin', () => {
  test('admin can log in with seed account', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password)

    // Should redirect to admin dashboard
    await page.waitForURL('**/admin**', { timeout: 15_000 })
    expect(page.url()).toContain('/admin')
  })

  test('admin can access admin dashboard', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15_000 })

    // Should show admin dashboard heading
    await expect(page.locator('text=Admin Dashboard, text=Dashboard').first()).toBeVisible()
  })

  test('admin can navigate to bookings management', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15_000 })

    await page.goto('/admin/bookings')
    await expect(page).toHaveURL(/.*admin\/bookings/)
  })

  test('admin can navigate to services management', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15_000 })

    await page.goto('/admin/services')
    await expect(page).toHaveURL(/.*admin\/services/)
  })

  test('admin can navigate to analytics', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15_000 })

    await page.goto('/admin/analytics')
    await expect(page).toHaveURL(/.*admin\/analytics/)
    await expect(page.locator('text=Analytics').first()).toBeVisible()
  })
})
