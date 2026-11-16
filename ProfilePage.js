'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /admin/profile - the final screen of the signup flow
 * (reached automatically after a successful step-4 submission).
 */
class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/admin/profile';
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'My Profile' });
  }

  get pendingBadge() {
    return this.page.getByText('Pending').first();
  }

  get logoutLink() {
    return this.page.getByText('Logout').first();
  }

  /** Personal information shown on the profile. */
  personalDetail(label) {
    return this.page.getByText(label, { exact: true }).first();
  }

  async expectLoaded({ firstName, lastName, email, phone, agencyName }) {
    await this.expectUrl(/\/admin\/profile/);
    await expect(this.heading).toBeVisible();
    await expect(this.pendingBadge).toBeVisible();
    await expect(this.page.getByText(`${firstName} ${lastName}`).first()).toBeVisible();    await expect(this.page.getByText(email, { exact: false }).first()).toBeVisible();
    await expect(this.page.getByText(phone, { exact: true }).first()).toBeVisible();
    await expect(this.page.getByText(agencyName, { exact: false }).first()).toBeVisible();
  }
}

module.exports = ProfilePage;
