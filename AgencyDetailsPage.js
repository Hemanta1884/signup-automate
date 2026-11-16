'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /register?step=details - "2. Agency Details".
 *
 * Fields: agency name, role, e-mail, website, address and a multi-select
 * "Region of Operation" popover (Radix). Submitting POSTs /api/agencydetail/.
 */
class AgencyDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/register?step=details';
  }

  get stepHeading() {
    return this.page.getByText('About your Agency').first();
  }

  get agencyName() {
    return this.page.locator('input[name="agency_name"]');
  }

  get roleInAgency() {
    return this.page.locator('input[name="role_in_agency"]');
  }

  get agencyEmail() {
    return this.page.locator('input[name="agency_email"]');
  }

  get agencyWebsite() {
    return this.page.locator('input[name="agency_website"]');
  }

  get agencyAddress() {
    return this.page.locator('input[name="agency_address"]');
  }

  get regionTrigger() {
    // The control is a <button role="combobox"> - match either role.
    return this.page
      .locator('[role="combobox"], button')
      .filter({ hasText: 'Select Your Region of Operation' })
      .first();
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next', exact: true });
  }

  get backButton() {
    return this.page.getByRole('button', { name: 'Back', exact: true });
  }

  async expectVisible() {
    await expect(this.stepHeading).toBeVisible();
    return this;
  }

  /**
   * Fill the agency form.
   * @param {{agencyName:string, role:string, email:string, website:string, address:string}} agency
   */
  async fill(agency) {
    await this.agencyName.fill(agency.agencyName);
    await this.roleInAgency.fill(agency.role);
    await this.agencyEmail.fill(agency.email);
    await this.agencyWebsite.fill(agency.website);
    await this.agencyAddress.fill(agency.address);
    return this;
  }

  /** Open the region popover and pick one or more regions. */
  async selectRegions(...regions) {
    await this.regionTrigger.click();
    const popover = this.page.locator('[data-radix-popper-content-wrapper]').last();
    await expect(popover).toBeVisible();
    for (const region of regions) {
      await popover.getByText(region, { exact: true }).first().click();
    }
    // close the popover without losing the selection
    await this.page.keyboard.press('Escape');
    for (const region of regions) {
      await expect(
        this.page.locator('[role="combobox"], button').filter({ hasText: region }).first()
      ).toBeVisible();
    }
    return this;
  }

  async submit() {
    await this.nextButton.click();
  }

  /** Negative case TC-15: empty submit shows every required-field message. */
  async submitEmptyAndExpectErrors() {
    await this.submit();
    await this.expectUrl(/\/register\?step=details/);
    await this.expectErrors([
      "Please enter your agency's name",
      'Please enter your role',
      'Invalid email address',
      'Please enter your website',
      'Please enter your address',
      'You have to select at least one region of operation.',
    ]);
  }

  /**
   * Happy path: fill valid data, choose regions and continue to step 3.
   * @param {string[]} regions
   */
  async fillAndContinue(agency, ...regions) {
    await this.fill(agency);
    await this.selectRegions(...regions);
    await this.submit();
    await expect(this.page.getByText('Experience and Performance Metrics').first()).toBeVisible({
      timeout: 30000,
    });
    await expect(
      this.page.getByText('Agency Details Added Successfully').first()
    ).toBeVisible();
  }
}

module.exports = AgencyDetailsPage;
