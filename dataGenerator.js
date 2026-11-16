'use strict';

const crypto = require('crypto');

/**
 * Unique test data generator.
 *
 * Every run must be re-runnable: the e-mail is timestamped + randomised so
 * reruns never collide with an existing account, and the phone number is
 * derived from the current time so the backend's "mobile number already
 * exists" rule never trips between runs.
 */

/** Fixed, synthetic password used only by the test environment. */
const PASSWORD = 'Test@123456';

function generateUser() {
  const timestamp = Date.now();
  const suffix = crypto.randomBytes(3).toString('hex'); // 6 hex chars
  const mailbox = `e2e.signup.${timestamp}.${suffix}`;

  // Nepal mobile numbers are 10 digits and must start with 98.
  const phone = `98${String(timestamp % 1e8).padStart(8, '0')}`;

  return {
    firstName: 'Test',
    lastName: 'Partner',
    email: `${mailbox}@mailinator.com`,
    /** Mailbox part without @domain - used to read the OTP e-mail. */
    mailbox,
    phone,
    password: PASSWORD,
    agencyName: `E2E Agency ${suffix.toUpperCase()}`,
    role: 'Recruitment Officer',
    agencyEmail: `agency.${mailbox}@example.com`,
    website: 'www.example.com',
    address: 'Kathmandu, Nepal (e2e test data)',
    regions: ['Nepal'],
    experience: '3 years',
    students: 10,
    focusArea: 'Undergraduate admissions to Canada',
    successMetrics: 90,
    service: 'Career Counseling',
    registrationNumber: `E2E-REG-${timestamp}`,
    countries: ['Nepal', 'Australia'],
    institutions: ['Universities', 'Colleges'],
    certification: 'ICEF Certified Education Agent',
  };
}

module.exports = { generateUser, PASSWORD };
