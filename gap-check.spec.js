'use strict';

const { test, expect } = require('@playwright/test');
const TermsPage = require('../pages/TermsPage');
const AccountSetupPage = require('../pages/AccountSetupPage');
const LoginPage = require('../pages/LoginPage');
const { generateUser } = require('../utils/dataGenerator');

/**
 * Gap-checks: cases that could not be finished during the manual UI run and
 * are closed here with a fresh browser context each (TC-33, TC-36, TC-37).
 */
test.describe('Signup - manual gap checks', () => {
  test('TC-33 direct URL access to a later step is not allowed for a fresh session', async ({
    page,
  }) => {
    // Fresh session: no signup started at all.
    await page.goto('/register?step=verification', { waitUntil: 'domcontentloaded' });

    // The app must not expose step 4 on its own: it keeps the user at the
    // beginning of the flow (step 1 form) instead of the requested later step.
    await expect(page).toHaveURL(/\/register/);
    const body = await page.locator('body').innerText();
    expect(body).toContain('Provide your personal details.'); // step 1 form
    expect(body).not.toContain('Provide Business Details and Set Preferences'); // step 4
    expect(body).not.toContain('Business Registration Number');
  });

  test('TC-36 an already registered e-mail with a new phone number is handled visibly', async ({
    page,
  }) => {
    const user = generateUser();
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    const setup = new AccountSetupPage(page);
    // E-mail that already exists in the backend from the manual run.
    await setup.fill({ ...user, email: 'the.signup.test.20261116a@mailinator.com' });
    const response = await setup.submitAndWaitForAccountResponse();
    if (response.status() === 429) {
      test.skip(true, 'Backend rate limit (429 Too many requests) - re-run after cooldown');
    }

    // Whatever the backend decides (duplicate error OR the flow continuing),
    // the user must get visible feedback - never a silent no-op.
    const advanced = await setup.otpScreenVisible();
    if (response.status() < 400 && advanced) {
      // Backend accepted the e-mail (not treated as unique) - flow continued.
      expect(response.status()).toBe(201);
      return;
    }
    // Rejected (4xx duplicate e-mail): we must stay on the step with an error.
    await setup.expectUrl(/\/register\?step=setup/);
    const errors = await setup.visibleErrorMessages();
    // NOTE: if this fails with "no visible error", the defect is B1-like
    // silent failure for duplicate e-mail (documented in the manual report).
    expect(
      errors.length,
      'Duplicate e-mail must produce visible feedback on the form'
    ).toBeGreaterThan(0);
  });

  test('TC-37 wrong credentials on the login page show an error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();

    await login.email.fill(`nobody.${Date.now()}@example.com`);
    await login.password.fill('WrongPassword@123');
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/token/create/') && r.request().method() === 'POST',
        { timeout: 30000 }
      ),
      login.loginButton.click(),
    ]);
    if (response.status() === 429) {
      test.skip(true, 'Backend rate limit (429 Too many requests) - re-run after cooldown');
    }

    // Stay on the login page with visible feedback.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid|incorrect|wrong|does not exist|not match|credential/i).first())
      .toBeVisible({ timeout: 15000 });
  });
});
