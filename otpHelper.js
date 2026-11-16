'use strict';

const { expect } = require('@playwright/test');
const config = require('../config');

/**
 * OTP handling for the signup flow.
 *
 * The application e-mails a 6-digit verification code
 * (sender: no-reply@theauthorizedpartner.com, subject: "Signup Confirm OTP",
 * valid for 4 minutes) to the address entered during account setup.
 *
 * Strategy (documented in README, never skipped silently):
 *   1. If the OTP_CODE environment variable is set, use it (debug escape hatch).
 *   2. Otherwise open the *public* Mailinator inbox that matches the generated
 *      e-mail address, wait - with Playwright's auto-waiting - for the message
 *      to arrive, open it and extract the 6-digit code from the e-mail body.
 *
 * No API key is required: the inbox is public and unique per test run.
 */
async function readSignupOtp(page, mailbox) {
  if (config.otp.fixedCode) {
    return config.otp.fixedCode;
  }

  const inbox = await page.context().newPage();
  try {
    await inbox.goto(`${config.otp.inboxUrl}${mailbox}`, { waitUntil: 'domcontentloaded' });

    // The list renders one row per message; wait for our subject to appear.
    const row = inbox.locator('table tr', { hasText: config.otp.subject }).first();
    await row.waitFor({ state: 'visible', timeout: config.otp.timeoutMs });

    // Opening the message: clicking the subject cell loads the body iframe.
    await row.locator('td').nth(1).click();

    // The HTML body lives in an iframe named/id'd "html_msg_body".
    const body = inbox.frameLocator('#html_msg_body').locator('body');
    await expect(body).toContainText(/\b\d{6}\b/, { timeout: config.otp.timeoutMs });

    const text = await body.innerText();
    const match = text.match(/\b(\d{6})\b/);
    if (!match) {
      throw new Error(`No 6-digit OTP found in the Mailinator message for ${mailbox}`);
    }
    return match[1];
  } finally {
    await inbox.close();
  }
}

module.exports = { readSignupOtp };
