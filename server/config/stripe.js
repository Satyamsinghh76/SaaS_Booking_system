'use strict';

const Stripe = require('stripe');

const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_SUCCESS_URL', 'STRIPE_CANCEL_URL'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}\nCheck your .env file.`);
  }
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  throw new Error('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion:        '2023-10-16',
  appInfo:           { name: 'SaaS Booking Platform', version: '1.0.0' },
  maxNetworkRetries: 3,
  timeout:           10_000,
});

const CURRENCY       = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const SUCCESS_URL    = process.env.STRIPE_SUCCESS_URL;
const CANCEL_URL     = process.env.STRIPE_CANCEL_URL;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const toCents   = (price) => Math.round(parseFloat(price) * 100);
const fromCents = (cents) => (cents / 100).toFixed(2);

module.exports = { stripe, CURRENCY, SUCCESS_URL, CANCEL_URL, WEBHOOK_SECRET, toCents, fromCents };
