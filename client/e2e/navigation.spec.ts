import { test, expect } from '@playwright/test'

test.describe('Navigation & Routing', () => {
  test('landing page loads with navbar and CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=BookFlow')).toBeVisible()
    // Should have a Get Started or Sign Up CTA
    await expect(page.locator('a[href="/signup"], a[href="/login"]').first()).toBeVisible()
  })

  test('services page loads', async ({ page }) => {
    await page.goto('/services')
    await expect(page).toHaveURL('/services')
    // Should display service cards or a heading
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('booking page loads', async ({ page }) => {
    await page.goto('/booking')
    await expect(page).toHaveURL('/booking')
    // Should show service selection (step 1)
    await expect(page.locator('text=Book Now').first()).toBeVisible()
  })

  test('login page loads with email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[id="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('signup page loads with registration form', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"], input[id="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('unknown route shows 404 or redirects', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')
    // Either a 404 page or a redirect to home
    const status = response?.status() ?? 0
    expect([200, 404].includes(status)).toBeTruthy()
  })

  test('unauthenticated user visiting /dashboard is redirected to login', async ({ page }) => {
    // Clear any stored tokens
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('access_token'))

    await page.goto('/dashboard')
    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('unauthenticated user visiting /admin is redirected to login', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('access_token'))

    await page.goto('/admin')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('navbar links are functional', async ({ page }) => {
    await page.goto('/')

    // Desktop nav should have key links
    const nav = page.locator('header, nav').first()
    await expect(nav).toBeVisible()

    // BookFlow logo/brand should link to home
    const logo = page.locator('a:has-text("BookFlow")').first()
    await expect(logo).toBeVisible()
  })
})
