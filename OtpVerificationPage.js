'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: OTP verification screen (shown in place of the setup form,
 * URL stays /register?step=setup).
 *
 * The 6-digit code is e-mailed by no-reply@theauthorizedpartner.com and is
 * valid for 4 minutes; a "Resend Code" link with a countdown is available.
 * Reading the code from the public Mailinator inbox is done by
 * utils/otpHelper.js - never skipped, never hard-coded.
 */
class OtpVerificationPage extends BasePage {
  constructor(page) {
    super(page);
  }

  get screenHeading() {
    return this.page.getByText('Email Verification code').first();
  }

  get otpInput() {
    return this.page.locator('input[maxlength="6"]');
  }

  get verifyButton() {
    return this.page.getByRole('button', { name: 'Verify Code', exact: true });
  }

  get resendLink() {
    return this.page.getByText('Resend Code').last();
  }

  get invalidOtpError() {
    return this.page.getByText('Invalid OTP').first();
  }

  get expiredOtpError() {
    return this.page.getByText('OTP has been expired').first();
  }

  async expectVisible() {
    await expect(this.screenHeading).toBeVisible();
    await expect(this.otpInput).toBeVisible();
    return this;
  }

  /**
   * Enter the code and press "Verify Code".
   *
   * The OTP field is a controlled input: filling a new value straight over an
   * already filled one (e.g. the "000000" left behind by a rejected attempt)
   * does not reach React's state. Clearing it first makes the write land, so
   * the helper works both on a fresh screen and after a failed verification.
   */
  async verify(code) {
    if ((await this.otpInput.inputValue()) !== '') {
      await this.otpInput.fill('');
    }
    await this.otpInput.fill(String(code));
    await this.verifyButton.click();
  }

  /**
   * Negative case TC-11: a wrong code keeps the user on the OTP screen and
   * shows the inline error returned by the backend.
   */
  async expectInvalidCodeRejected(code = '000000') {
    await this.verify(code);
    await expect(this.invalidOtpError).toBeVisible();
    await expect(this.screenHeading).toBeVisible();
  }

  /**
   * Happy path: verify the correct code and wait until the next step
   * ("2. Agency Details") is rendered. The assertion uses the step's unique
   * subtitle - never the top stepper, which lists every step name.
   */
  async verifyAndReachAgencyDetails(code) {
    await this.verify(code);
    await expect(this.page.getByText('About your Agency').first()).toBeVisible({
      timeout: 30000,
    });
    await expect(this.page.getByText('Your account has been created successfully').first()).toBeVisible();
  }
}

module.exports = OtpVerificationPage;
