'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /register - Terms & Conditions gate (step 0 of the signup flow).
 *
 * Known issue covered by manual test TC-01 / bug B3: clicking "Continue"
 * without ticking the checkbox silently does nothing (no message is shown).
 */
class TermsPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/register';
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Register Your Agency' });
  }

  /** The app renders a custom ARIA checkbox (Radix), not a native input. */
  get acceptTermsCheckbox() {
    return this.page.getByRole('checkbox').first();
  }

  get continueButton() {
    return this.page.locator('button', { hasText: 'Continue' }).first();
  }

  get goToLoginLink() {
    return this.page.getByText('Go to Login').first();
  }

  get termsOfServiceLink() {
    return this.page.getByRole('link', { name: 'Terms of Service' });
  }

  get privacyPolicyLink() {
    return this.page.getByRole('link', { name: 'Privacy Policy' });
  }

  async open() {
    await this.goto(this.path);
    await expect(this.heading).toBeVisible();
    return this;
  }

  async acceptTerms() {
    await this.acceptTermsCheckbox.click();
    await expect(this.acceptTermsCheckbox).toHaveAttribute('aria-checked', 'true');
  }

  async isTermsAccepted() {
    return (await this.acceptTermsCheckbox.getAttribute('aria-checked')) === 'true';
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  /**
   * Continue and land on the account setup step.
   * The app switches the URL to /register?step=setup in place.
   */
  async continueToSetup() {
    await this.clickContinue();
    await this.expectUrl(/\/register\?step=setup/);
  }
}

module.exports = TermsPage;
