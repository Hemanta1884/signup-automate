'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /register?step=verification - "4. Verification and Preferences".
 *
 * Fields: business registration number, preferred countries (Radix popover
 * multi-select), preferred institution types (Radix checkboxes), optional
 * certification details and up to two document uploaders (max 5 MB each).
 * Submitting POSTs /api/verification-preferences/ and redirects to /admin/profile.
 */
class VerificationPreferencesPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/register?step=verification';
  }

  get stepHeading() {
    return this.page.getByText('Provide Business Details and Set Preferences').first();
  }

  get registrationNumber() {
    return this.page.locator('input[name="business_registration_number"]');
  }

  get countriesTrigger() {
    // The control is a <button role="combobox"> - match either role.
    return this.page
      .locator('[role="combobox"], button')
      .filter({ hasText: 'Select Your Preferred Countries' })
      .first();
  }

  get certificationDetails() {
    return this.page.locator('input[name="certification_details"]');
  }

  get documentUpload() {
    return this.page.locator('input[type="file"]').first();
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Submit', exact: true });
  }

  get backButton() {
    return this.page.getByRole('button', { name: 'Back', exact: true });
  }

  get uploadTooLargeError() {
    return this.page.getByText('File cannot be larger than 5MB').first();
  }

  async expectVisible() {
    await expect(this.stepHeading).toBeVisible();
    return this;
  }

  /** Radix institution checkbox (Universities / Colleges / Vocational School / Other). */
  institutionCheckbox(label) {
    return this.page
      .locator('div:has(> button[role="checkbox"])')
      .filter({ hasText: label })
      .locator('button[role="checkbox"]')
      .first();
  }

  async selectInstitutions(...labels) {
    for (const label of labels) {
      const box = this.institutionCheckbox(label);
      if ((await box.getAttribute('data-state')) !== 'checked') {
        await box.click();
      }
      await expect(box).toHaveAttribute('data-state', 'checked');
    }
    return this;
  }

  /** Open the countries popover and pick the given countries. */
  async selectCountries(...countries) {
    await this.countriesTrigger.click();
    const popover = this.page.locator('[data-radix-popper-content-wrapper]').last();
    await expect(popover).toBeVisible();
    for (const country of countries) {
      await popover.getByText(country, { exact: true }).first().click();
    }
    await this.page.keyboard.press('Escape');
    for (const country of countries) {
      await expect(
        this.page.locator('[role="combobox"], button').filter({ hasText: country }).first()
      ).toBeVisible();
    }
    return this;
  }

  async setRegistrationNumber(value) {
    await this.registrationNumber.fill(value);
  }

  async setCertification(value) {
    await this.certificationDetails.fill(value);
  }

  /**
   * Attach a document to the first uploader.
   * @param {string} filePath absolute path of the file
   */
  async uploadDocument(filePath) {
    await this.documentUpload.setInputFiles(filePath);
    return this;
  }

  async submit() {
    await this.submitButton.click();
  }

  /** Negative case TC-25: empty submit validates this step. */
  async submitEmptyAndExpectErrors() {
    await this.submit();
    await this.expectUrl(/\/register\?step=verification/);
    await this.expectErrors([
      'Please enter your registration number',
      'You have to select at least one country.',
      'You have to select at least one institution type.',
      'At least one document must be uploaded',
    ]);
  }

  /**
   * Boundary case TC-26: a document larger than 5 MB is rejected with a toast.
   */
  async expectUploadRejected() {
    await expect(this.uploadTooLargeError).toBeVisible();
  }

  /**
   * Fill every field of this step (documents are attached separately through
   * uploadDocument() so tests can assert upload behaviour first).
   * @param {{registrationNumber:string, countries:string[], institutions:string[], certification?:string}} data
   */
  async fillPreferences(data) {
    await this.setRegistrationNumber(data.registrationNumber);
    await this.selectCountries(...data.countries);
    await this.selectInstitutions(...data.institutions);
    if (data.certification) await this.setCertification(data.certification);
    return this;
  }

  /** Submit and wait until the profile page of the new account is shown. */
  async submitAndReachProfile() {
    await this.submit();
    await this.expectUrl(/\/admin\/profile/, { timeout: 30000 });
  }
}

module.exports = VerificationPreferencesPage;
