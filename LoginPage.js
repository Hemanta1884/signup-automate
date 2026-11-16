'use strict';

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page object: /login - entry point used by navigation tests
 * ("Don't Have An Account? Sign Up" must lead to /register).
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/login';
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Welcome Back!' });
  }

  get email() {
    return this.page.locator('input#email');
  }

  get password() {
    return this.page.locator('input#password');
  }

  get loginButton() {
    return this.page.getByRole('button', { name: 'Log In', exact: true });
  }

  get signUpLink() {
    return this.page.getByRole('link', { name: 'Sign Up' });
  }

  get forgotPasswordLink() {
    return this.page.getByRole('link', { name: 'Forgot Password?' });
  }

  get showPasswordButton() {
    return this.page.getByRole('button', { name: 'Show password' });
  }

  async open() {
    await this.goto(this.path);
    await expect(this.heading).toBeVisible();
    return this;
  }

  /** Navigation case TC-34: Sign Up link must lead to the register page. */
  async goToSignUp() {
    await this.signUpLink.click();
    await this.expectUrl(/\/register/);
  }
}

module.exports = LoginPage;
