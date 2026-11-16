'use strict';

const { test, expect } = require('@playwright/test');
const TermsPage = require('../pages/TermsPage');
const AccountSetupPage = require('../pages/AccountSetupPage');
const OtpVerificationPage = require('../pages/OtpVerificationPage');
const AgencyDetailsPage = require('../pages/AgencyDetailsPage');
const ProfessionalExperiencePage = require('../pages/ProfessionalExperiencePage');
const VerificationPreferencesPage = require('../pages/VerificationPreferencesPage');
const ProfilePage = require('../pages/ProfilePage');
const { generateUser } = require('../utils/dataGenerator');
const { readSignupOtp } = require('../utils/otpHelper');
const { aboveLimitFile, belowLimitFile } = require('../utils/testFiles');

/**
 * Happy path - the complete signup flow, end to end, with zero manual steps:
 *
 *   T&C gate -> account setup -> e-mail OTP -> agency details ->
 *   professional experience -> verification & preferences -> profile
 *
 * The OTP is really read from the public Mailinator inbox (utils/otpHelper.js).
 * Run count is deliberately kept at 1 (serial, 1 worker) to stay considerate
 * towards the live environment: exactly one account is created per run.
 */
test.describe('Signup - happy path', () => {
  test('TC-10/14/20/24/26/28/30 full signup flow reaches the profile page', async ({
    page,
  }) => {
    const user = generateUser();

    // ---- Step 0: terms & conditions gate -------------------------------
    const terms = new TermsPage(page);
    await terms.open();
    await terms.acceptTerms();
    await terms.continueToSetup();

    // ---- Step 1: account setup -----------------------------------------
    const setup = new AccountSetupPage(page);
    await setup.fill(user);
    await setup.submitAndReachOtpScreen();

    // ---- Step 1b: e-mail OTP verification (real inbox read) -------------
    const otpScreen = new OtpVerificationPage(page);
    await otpScreen.expectVisible();
    const otpCode = await readSignupOtp(page, user.mailbox);
    await otpScreen.verifyAndReachAgencyDetails(otpCode);

    // ---- Step 2: agency details ----------------------------------------
    const details = new AgencyDetailsPage(page);
    await details.expectVisible();
    await details.fillAndContinue(user, ...user.regions);

    // ---- Step 3: professional experience -------------------------------
    const experience = new ProfessionalExperiencePage(page);
    await experience.expectVisible();
    await experience.fillAndContinue(
      {
        experience: user.experience,
        students: user.students,
        focusArea: user.focusArea,
        successMetrics: user.successMetrics,
      },
      user.service
    );

    // ---- Step 4: verification & preferences ----------------------------
    const verification = new VerificationPreferencesPage(page);
    await verification.expectVisible();

    // TC-26: a document above the 5 MB limit must be rejected...
    await verification.uploadDocument(aboveLimitFile());
    await verification.expectUploadRejected();

    // ...while the remaining fields can be filled in.
    await verification.fillPreferences({
      registrationNumber: user.registrationNumber,
      countries: user.countries,
      institutions: user.institutions,
      certification: user.certification,
    });

    // TC-28: a document below the limit is accepted and listed.
    await verification.uploadDocument(belowLimitFile());
    await expect(page.getByText('lt5mb.csv').first()).toBeVisible();

    await verification.submitAndReachProfile();

    // ---- Final: profile page -------------------------------------------
    const profile = new ProfilePage(page);
    await profile.expectLoaded({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: `+977${user.phone}`,
      agencyName: user.agencyName,
    });
    await expect(page.getByText('lt5mb.csv').first()).toBeVisible();
  });
});
