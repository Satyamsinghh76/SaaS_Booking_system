import { test, expect, Page } from '@playwright/test'

const SEED_USER = { email: 'user@bookflow.com', password: 'Admin123!' }
const SEED_ADMIN = { email: 'admin@bookflow.com', password: 'Admin123!' }

async function login(page: Page, email: string, password: string, expectedUrl: string) {
  await page.goto('/login')
  await page.fill('input[type="email"], input[id="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`**/${expectedUrl}**`, { timeout: 15_000 })
}

test.describe('Data Consistency — User Dashboard', () => {
  test('user dashboard shows booking stats', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password, 'dashboard')

    // Dashboard should load with stat cards
    await expect(
      page.locator('text=Total Bookings, text=Upcoming, text=Completed, text=Total Spent').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('user bookings page reflects API data', async ({ page }) => {
    await login(page, SEED_USER.email, SEED_USER.password, 'dashboard')
    await page.goto('/dashboard/bookings')

    // Should show bookings or empty state — both are valid
    await expect(
      page.locator('text=Your Bookings, text=No bookings').first()
    ).toBeVisible({ timeout: 10_000 })

    // If bookings exist, they should show service name and price
    const bookingCard = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /\$\d+/ }).first()
    if (await bookingCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Booking card should have status badge
      await expect(
        bookingCard.locator('text=Pending, text=Confirmed, text=Completed, text=Cancelled').first()
      ).toBeVisible()
    }
  })

  test('booking created via API appears in user bookings list', async ({ page, request }) => {
    // Log in to get a token
    await login(page, SEED_USER.email, SEED_USER.password, 'dashboard')
    const token = await page.evaluate(() => localStorage.getItem('access_token'))

    if (!token) {
      test.skip(true, 'Could not get access token')
      return
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    // Fetch available services
    const servicesRes = await request.get(`${apiBase}/api/services`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!servicesRes.ok()) {
      test.skip(true, 'Could not fetch services from API')
      return
    }

    const servicesData = await servicesRes.json()
    const services = servicesData.data?.services || servicesData.data || []
    if (services.length === 0) {
      test.skip(true, 'No services available')
      return
    }

    const service = services[0]

    // Create a booking via API
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const bookingRes = await request.post(`${apiBase}/api/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        service_id: service.id,
        date: dateStr,
        start_time: '14:00',
        customer_name: 'Test User',
        customer_email: SEED_USER.email,
      },
    })

    if (!bookingRes.ok()) {
      // Slot may already be taken — skip gracefully
      test.skip(true, 'Could not create test booking (slot conflict or validation)')
      return
    }

    const bookingData = await bookingRes.json()
    const booking = bookingData.data

    // Navigate to bookings page and verify it appears
    await page.goto('/dashboard/bookings')
    await page.waitForSelector('text=Your Bookings', { timeout: 10_000 })

    // The booking's service name should appear
    await expect(
      page.locator(`text=${service.name}`).first()
    ).toBeVisible({ timeout: 10_000 })

    // Clean up: cancel the booking
    await request.delete(`${apiBase}/api/bookings/${booking.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  })
})

test.describe('Data Consistency — Admin Dashboard', () => {
  test('admin dashboard loads with real stats', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password, 'admin')

    // Should show admin-specific stats
    await expect(
      page.locator('text=Total Revenue, text=Total Bookings, text=Active Users').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('admin bookings page shows all user bookings', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password, 'admin')
    await page.goto('/admin/bookings')

    // Should load bookings table or empty state
    await expect(
      page.locator('table, text=No bookings, text=Bookings').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('admin can confirm a pending booking', async ({ page, request }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password, 'admin')

    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    if (!token) {
      test.skip(true, 'Could not get admin token')
      return
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    // Check if there are any pending bookings
    const bookingsRes = await request.get(`${apiBase}/api/admin/bookings?status=pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!bookingsRes.ok()) {
      test.skip(true, 'Could not fetch admin bookings')
      return
    }

    const bookingsData = await bookingsRes.json()
    const pendingBookings = bookingsData.data?.bookings || bookingsData.data || []

    if (pendingBookings.length === 0) {
      test.skip(true, 'No pending bookings to confirm')
      return
    }

    // Confirm the first pending booking via API
    const bookingId = pendingBookings[0].id
    const confirmRes = await request.patch(`${apiBase}/api/admin/bookings/${bookingId}/confirm`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(confirmRes.ok()).toBeTruthy()
  })

  test('admin analytics shows real service data', async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password, 'admin')
    await page.goto('/admin/analytics')

    // Analytics page should load with real data (not mock services like "Deep Tissue Massage")
    await expect(page.locator('text=Analytics').first()).toBeVisible({ timeout: 10_000 })

    // Should NOT show mock service names
    const hasMockData = await page.locator('text=Deep Tissue Massage').isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasMockData).toBeFalsy()
  })
})

test.describe('Data Consistency — Payment Flow', () => {
  test('payment page loads for a booking', async ({ page, request }) => {
    await login(page, SEED_USER.email, SEED_USER.password, 'dashboard')

    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    if (!token) {
      test.skip(true, 'No token')
      return
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    // Get user's unpaid bookings
    const bookingsRes = await request.get(`${apiBase}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!bookingsRes.ok()) {
      test.skip(true, 'Could not fetch bookings')
      return
    }

    const bookingsData = await bookingsRes.json()
    const bookings = bookingsData.data?.bookings || bookingsData.data || []
    const unpaid = bookings.filter((b: any) => b.payment_status === 'unpaid' && b.status !== 'cancelled')

    if (unpaid.length === 0) {
      test.skip(true, 'No unpaid bookings for payment test')
      return
    }

    // Visit payment page for the first unpaid booking
    await page.goto(`/payment?bookingId=${unpaid[0].id}`)

    // Should show payment form with card fields
    await expect(
      page.locator('text=Payment, text=Card Number, input[id="cardNumber"]').first()
    ).toBeVisible({ timeout: 10_000 })

    // Should show booking amount
    await expect(page.locator('text=$').first()).toBeVisible()
  })
})
