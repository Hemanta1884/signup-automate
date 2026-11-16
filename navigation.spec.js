'use strict';

const { test, expect } = require('@playwright/test');
const TermsPage = require('../pages/TermsPage');
const LoginPage = require('../pages/LoginPage');

/**
 * Navigation cases: the entry/exit links of the signup funnel must work.
 */
test.describe('Signup - navigation', () => {
  test('TC-34 the "Sign Up" link on the login page opens the register page', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.goToSignUp();
    await expect(page.getByRole('heading', { name: 'Register Your Agency' })).toBeVisible();
  });

  test('TC-35 the "Go to Login" link on the register page opens the login page', async ({
    page,
  }) => {
    const terms = new TermsPage(page);
    await terms.open();
    await terms.goToLoginLink.click();
    await terms.expectUrl(/\/login/);
  });
});
