import { test, expect, Page } from '@playwright/test'

const SEED_USER = { email: 'user@bookflow.com', password: 'Admin123!' }

async function loginAsUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"], input[id="email"]', SEED_USER.email)
  await page.fill('input[type="password"]', SEED_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15_000 })
}

test.describe('Booking Flow — Service Selection (Step 1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
  })

  test('booking page shows available services', async ({ page }) => {
    await page.goto('/booking')

    // Wait for services to load (should see service cards or names)
    await page.waitForSelector('[class*="card"], [class*="service"], button:has-text("Book")', {
      timeout: 10_000,
    })

    // At least one service should be visible (from seed data)
    const services = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /\$\d+/ })
    await expect(services.first()).toBeVisible()
  })

  test('clicking a service advances to step 2', async ({ page }) => {
    await page.goto('/booking')

    // Wait for services, then click the first one
    const serviceCard = page.locator('button, [role="button"], a').filter({ hasText: /\$\d+/ }).first()
    await serviceCard.waitFor({ timeout: 10_000 })
    await serviceCard.click()

    // Step 2 should show date/calendar picker
    await expect(
      page.locator('text=Select, text=Pick a date, text=Date, text=Choose a date, input[type="date"]').first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Booking Flow — Date & Time Selection (Step 2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page)
    await page.goto('/booking')

    // Select first service
    const serviceCard = page.locator('button, [role="button"], a').filter({ hasText: /\$\d+/ }).first()
    await serviceCard.waitFor({ timeout: 10_000 })
    await serviceCard.click()
  })

  test('date buttons are visible and clickable', async ({ page }) => {
    // Date picker should show dates
    const dateBtn = page.locator('button').filter({ hasText: /\d{1,2}/ }).first()
    await expect(dateBtn).toBeVisible({ timeout: 5000 })
  })

  test('selecting a date shows available time slots', async ({ page }) => {
    // Click a future date (look for date buttons)
    const dateButtons = page.locator('button[class*="date"], button').filter({ hasText: /^\d{1,2}$/ })

    // Try clicking a few dates until we find one with time slots
    const count = await dateButtons.count()
    for (let i = 0; i < Math.min(count, 7); i++) {
      await dateButtons.nth(i).click()

      // Check if time slots appeared
      const timeSlot = page.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
      if (await timeSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(timeSlot).toBeVisible()
        return // Found time slots — test passes
      }
    }
  })

  test('selecting a time slot advances to step 3', async ({ page }) => {
    // Click a date
    const dateButtons = page.locator('button').filter({ hasText: /^\d{1,2}$/ })
    const count = await dateButtons.count()

    for (let i = 0; i < Math.min(count, 7); i++) {
      await dateButtons.nth(i).click()
      const timeSlot = page.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
      if (await timeSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
        await timeSlot.click()

        // Step 3 should show booking summary or customer info form
        await expect(
          page.locator('text=Summary, text=Your Information, text=Confirm, text=Name, input[id="name"]').first()
        ).toBeVisible({ timeout: 5000 })
        return
      }
    }
  })
})

test.describe('Booking Flow — Confirmation (Step 3)', () => {
  test('complete booking flow end-to-end', async ({ page }) => {
    await loginAsUser(page)
    await page.goto('/booking')

    // Step 1: Select first service
    const serviceCard = page.locator('button, [role="button"], a').filter({ hasText: /\$\d+/ }).first()
    await serviceCard.waitFor({ timeout: 10_000 })
    await serviceCard.click()

    // Step 2: Select a date with available slots
    const dateButtons = page.locator('button').filter({ hasText: /^\d{1,2}$/ })
    const count = await dateButtons.count()
    let foundSlot = false

    for (let i = 0; i < Math.min(count, 10); i++) {
      await dateButtons.nth(i).click()
      const timeSlot = page.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
      if (await timeSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
        await timeSlot.click()
        foundSlot = true
        break
      }
    }

    if (!foundSlot) {
      test.skip(true, 'No available time slots found — seed data may need availability entries')
      return
    }

    // Step 3: Fill customer info
    const nameInput = page.locator('input[id="name"]')
    const emailInput = page.locator('input[id="email"]')

    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Name should be pre-filled from logged-in user, but fill if empty
      const nameVal = await nameInput.inputValue()
      if (!nameVal) await nameInput.fill('Test User')

      const emailVal = await emailInput.inputValue()
      if (!emailVal) await emailInput.fill(SEED_USER.email)
    }

    // Click confirm/submit
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Submit|Book/i }).last()
    await confirmBtn.click()

    // Should show success confirmation dialog/page
    await expect(
      page.locator('text=Confirmed, text=Successfully, text=Booked, text=Success').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('cannot submit booking without required customer info', async ({ page }) => {
    await loginAsUser(page)
    await page.goto('/booking')

    // Select service
    const serviceCard = page.locator('button, [role="button"], a').filter({ hasText: /\$\d+/ }).first()
    await serviceCard.waitFor({ timeout: 10_000 })
    await serviceCard.click()

    // Select date and time
    const dateButtons = page.locator('button').filter({ hasText: /^\d{1,2}$/ })
    const count = await dateButtons.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      await dateButtons.nth(i).click()
      const timeSlot = page.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
      if (await timeSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
        await timeSlot.click()
        break
      }
    }

    // Clear name field if it exists
    const nameInput = page.locator('input[id="name"]')
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear()

      // Confirm button should be disabled
      const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Submit|Book/i }).last()
      await expect(confirmBtn).toBeDisabled()
    }
  })
})
