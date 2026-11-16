'use strict';

const { expect, test } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /register?step=setup - "1. Set up your Account".
 *
 * Fields: First name, Last name, Email, Phone (country code defaults to +977 NP),
 * Password, Confirm password. Submitting POSTs /api/tempuser/ and the OTP
 * screen replaces this form in place (see OtpVerificationPage).
 */
class AccountSetupPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/register?step=setup';
  }

  get stepHeading() {
    return this.page.getByText('Set up your Account').first();
  }

  get firstName() {
    return this.page.locator('input[name="firstName"]');
  }

  get lastName() {
    return this.page.locator('input[name="lastName"]');
  }

  get email() {
    return this.page.locator('input[name="email"]');
  }

  get phone() {
    return this.page.locator('input[name="phoneNumber"]');
  }

  get password() {
    return this.page.locator('input[name="password"]');
  }

  get confirmPassword() {
    return this.page.locator('input[name="confirmPassword"]');
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next', exact: true });
  }

  async open() {
    await this.goto(this.path);
    await expect(this.stepHeading).toBeVisible();
    return this;
  }

  /**
   * Fill the whole form with a test user object
   * ({ firstName, lastName, email, phone, password }).
   * `phone` is filled as digits - the country selector already adds +977.
   */
  async fill(user, { skip = [] } = {}) {
    const fields = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      password: this.password,
      confirmPassword: this.confirmPassword,
    };
    const value = (key) => (key === 'confirmPassword' ? user.password : user[key]);
    for (const [key, locator] of Object.entries(fields)) {
      if (skip.includes(key)) continue;
      await locator.fill(String(value(key)));
    }
    return this;
  }

  async submit() {
    await this.nextButton.click();
  }

  /** Negative case TC-03: submit the empty form and keep the step. */
  async submitEmpty() {
    await this.submit();
    await this.expectUrl(/\/register\?step=setup/);
    await this.expectErrors([
      'First name must be at least 2 characters',
      'Last name must be at least 2 characters',
      'Invalid email address',
      'Password must be at least 8 characters',
    ]);
  }

  /** Validation messages expected when a single field is invalid. */
  async expectOnlyError(message) {
    await expect(this.page.getByText(message).first()).toBeVisible();
    await this.expectUrl(/\/register\?step=setup/);
  }

  /**
   * Happy path helper: fill valid data, submit and wait until the OTP
   * verification screen replaces the form (URL stays the same).
   *
   * If the staging backend answers 429 (rate limit) the test is skipped with
   * an explicit reason instead of failing — see README "site consideration".
   */
  async submitAndReachOtpScreen() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/tempuser/') && r.request().method() === 'POST',
        { timeout: 30000 }
      ),
      this.nextButton.click(),
    ]);
    if (response.status() === 429) {
      test.skip(true, 'Backend rate limit (429 Too many requests) - re-run after cooldown');
    }
    await expect(this.page.getByText('Email Verification code').first()).toBeVisible({
      timeout: 30000,
    });
  }

  /**
   * The browser's native e-mail constraint (type="email") rejects malformed
   * values before the form is submitted, so the step can never be left with
   * an invalid address.
   */
  async expectEmailNativelyInvalid() {
    await expect(this.email).toHaveJSProperty('validity.valid', false);
    await this.expectUrl(/\/register\?step=setup/);
  }

  /** True when the OTP screen has replaced the form (instant check). */
  async otpScreenVisible() {
    return this.page.getByText('Email Verification code').first().isVisible();
  }

  /** Submit and wait for the backend's /api/tempuser/ response. */
  async submitAndWaitForAccountResponse() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/tempuser/') && r.request().method() === 'POST',
        { timeout: 30000 }
      ),
      this.nextButton.click(),
    ]);
    return response;
  }
}

module.exports = AccountSetupPage;
