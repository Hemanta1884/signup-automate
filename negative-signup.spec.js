'use strict';

const { test, expect } = require('@playwright/test');
const TermsPage = require('../pages/TermsPage');
const AccountSetupPage = require('../pages/AccountSetupPage');
const OtpVerificationPage = require('../pages/OtpVerificationPage');
const { generateUser } = require('../utils/dataGenerator');
const { readSignupOtp } = require('../utils/otpHelper');

/**
 * Negative / validation cases taken from the manual test run.
 * None of them create an account except TC-11 (which needs a real temp user
 * to reach the OTP screen - exactly one is created, no spam/load).
 */
test.describe('Signup - negative and validation cases', () => {
  test('TC-01 continuing without accepting the terms stays on the register page', async ({
    page,
  }) => {
    const terms = new TermsPage(page);
    await terms.open();

    await terms.clickContinue();

    // The user must not pass the gate before ticking the checkbox.
    await terms.expectUrl(/\/register$/);
    await expect(terms.heading).toBeVisible();
  });

  test('TC-03 submitting the empty account setup form shows all validation errors', async ({
    page,
  }) => {
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    const setup = new AccountSetupPage(page);
    await setup.submitEmpty();
  });

  test('TC-04 an invalid e-mail address is rejected', async ({ page }) => {
    const user = generateUser();
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    const setup = new AccountSetupPage(page);
    await setup.fill({ ...user, email: 'not-an-email' });
    await setup.submit();
    // The value is rejected - either by the browser's native e-mail
    // constraint (visible bubble) or by the app's inline message - and the
    // user must never leave the step.
    await setup.expectEmailNativelyInvalid();
  });

  test('TC-05 password and confirmation do not match', async ({ page }) => {
    const user = generateUser();
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    const setup = new AccountSetupPage(page);
    await setup.fill(user);
    await setup.confirmPassword.fill('Different@123');
    await setup.submit();
    await setup.expectOnlyError('Passwords do not match');
  });

  test('TC-11 an invalid OTP code is rejected with an inline error', async ({
    page,
  }) => {
    const user = generateUser();
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    const setup = new AccountSetupPage(page);
    await setup.fill(user);
    await setup.submitAndReachOtpScreen();

    const otpScreen = new OtpVerificationPage(page);
    await otpScreen.expectVisible();

    // A wrong code must be rejected with the inline backend error.
    // The code itself stays valid (a correct retry still succeeds - verified),
    // so we stop here on purpose: this negative case must not complete a signup.
    await otpScreen.expectInvalidCodeRejected('000000');
  });
});
