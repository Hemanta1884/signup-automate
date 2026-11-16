'use strict';

/**
 * Central configuration.
 *
 * All values come from environment variables (or an optional `.env` file at the
 * repository root) so that no URL, credential or secret is hard-coded in tests.
 * See `.env.example` for the supported keys.
 */
const fs = require('fs');
const path = require('path');

// Minimal .env loader (no external dependency, values already set in the
// environment always win).
(function loadDotEnv() {
  const envFile = path.resolve(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = value;
  }
})();

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = {
  /** Application under test */
  baseURL: process.env.BASE_URL || 'https://authorized-partner.vercel.app',

  /** Backend API (documented for debugging, not called directly by tests) */
  apiBase: process.env.API_BASE || 'https://stage.cloudedu.com.au/api',

  /** OTP e-mail retrieval settings */
  otp: {
    inboxUrl: process.env.OTP_INBOX_URL || 'https://www.mailinator.com/v4/public/inboxes.jsp?to=',
    subject: process.env.OTP_SUBJECT || 'Signup Confirm OTP',
    timeoutMs: int(process.env.OTP_TIMEOUT_MS, 90000),
    /** Manual override (debug only): OTP_CODE=123456 npm test */
    fixedCode: process.env.OTP_CODE || null,
  },

  /** Run tests in a visible browser window when HEADFUL=1 */
  headful: process.env.HEADFUL === '1',

  /** Assertion + navigation timeouts */
  expectTimeoutMs: int(process.env.EXPECT_TIMEOUT_MS, 15000),
  navigationTimeoutMs: int(process.env.NAV_TIMEOUT_MS, 30000),
};
