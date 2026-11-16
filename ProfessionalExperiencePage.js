'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /register?step=professional-experience - "3. Professional Experience".
 *
 * Fields: years of experience (native <select>), students recruited (integer),
 * focus area (text), success metrics (%), services provided (Radix checkboxes).
 * Submitting POSTs /api/professional-experience/.
 */
class ProfessionalExperiencePage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/register?step=professional-experience';
  }

  get stepHeading() {
    return this.page.getByText('Professional Experience').first();
  }

  get experienceSelect() {
    return this.page.locator('select').first();
  }

  get studentsInput() {
    return this.page.locator('input[name="number_of_students_recruited_annually"]');
  }

  get focusAreaInput() {
    return this.page.locator('input[name="focus_area"]');
  }

  get successMetricsInput() {
    return this.page.locator('input[name="success_metrics"]');
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next', exact: true });
  }

  get backButton() {
    return this.page.getByRole('button', { name: 'Back', exact: true });
  }

  async expectVisible() {
    await expect(this.page.getByText('Experience and Performance Metrics').first()).toBeVisible();
    return this;
  }

  /**
   * Radix checkbox locator: the visible control is a <button role="checkbox">
   * whose label sits next to it inside the same wrapper div.
   */
  checkbox(label) {
    return this.page
      .locator('div:has(> button[role="checkbox"])')
      .filter({ hasText: label })
      .locator('button[role="checkbox"]')
      .first();
  }

  async selectExperience(label) {
    await this.experienceSelect.selectOption({ label });
  }

  async selectService(label) {
    const box = this.checkbox(label);
    if ((await box.getAttribute('data-state')) !== 'checked') {
      await box.click();
    }
    await expect(box).toHaveAttribute('data-state', 'checked');
  }

  async fill(metrics) {
    if (metrics.experience) await this.selectExperience(metrics.experience);
    if (metrics.students !== undefined) await this.studentsInput.fill(String(metrics.students));
    if (metrics.focusArea) await this.focusAreaInput.fill(metrics.focusArea);
    if (metrics.successMetrics !== undefined) {
      await this.successMetricsInput.fill(String(metrics.successMetrics));
    }
    return this;
  }

  async submit() {
    await this.nextButton.click();
  }

  /** Negative case TC-21: empty submit validates every field of this step. */
  async submitEmptyAndExpectErrors() {
    await this.submit();
    await this.expectUrl(/\/register\?step=professional-experience/);
    await this.expectErrors([
      'Please select your experience level',
      'Please enter a number',
      'Please enter your focus area',
      'You have to select at least one service.',
    ]);
  }

  /** Boundary cases TC-22 / TC-23. */
  async expectFieldError(message) {
    await expect(this.page.getByText(message).first()).toBeVisible();
    await this.expectUrl(/\/register\?step=professional-experience/);
  }

  /**
   * Happy path: fill valid metrics, pick a service and continue to step 4.
   */
  async fillAndContinue(metrics, service) {
    await this.fill(metrics);
    await this.selectService(service);
    await this.submit();
    await expect(
      this.page.getByText('Provide Business Details and Set Preferences').first()
    ).toBeVisible({ timeout: 30000 });
    await expect(
      this.page.getByText('Professional Experience Added successfully').first()
    ).toBeVisible();
  }
}

module.exports = ProfessionalExperiencePage;
