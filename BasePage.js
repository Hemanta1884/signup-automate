'use strict';

const { expect } = require('@playwright/test');

/**
 * Shared behaviour for every signup page object.
 * Locators and actions live here - tests never touch raw selectors.
 */
class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** Navigate to a path of the application under test. */
  async goto(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Assert the browser is on a given URL (web-first assertion). */
  async expectUrl(pattern, options = {}) {
    await expect(this.page).toHaveURL(pattern, options);
  }

  /** All inline validation messages currently rendered on the page. */
  async visibleErrorMessages() {
    const candidates = this.page.locator('p, span, div, [role="alert"]');
    const texts = await candidates.allInnerTexts();
    return texts
      .map((t) => (t || '').trim())
      .filter(
        (t) =>
          t &&
          t.length < 120 &&
          !t.includes('\n') &&
          /requir|invalid|must|enter|select|error|match|least|character|exist|above/i.test(t)
      )
      .filter((value, index, arr) => arr.indexOf(value) === index);
  }

  /** Assert that at least the expected validation messages are visible. */
  async expectErrors(expectedMessages) {
    for (const message of expectedMessages) {
      await expect(this.page.getByText(message).first()).toBeVisible();
    }
  }

  /** A transient success toast (shown by the app after a successful step). */
  toast(message) {
    return this.page.getByText(message).first();
  }

  /** The primary action button of the current step. */
  button(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Click a button and wait until the URL changes (no fixed waits). */
  async clickAndWaitForUrl(buttonLocator, pattern) {
    await Promise.all([
      this.page.waitForURL(pattern, { timeout: 30000 }),
      buttonLocator.click(),
    ]);
  }
}

module.exports = BasePage;
