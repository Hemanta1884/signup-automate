'use strict';

/**
 * Source data for the manual testing deliverables.
 * - test_cases.xlsx          -> TEST_CASES
 * - test_execution_report.xlsx -> EXECUTION (actual results of the manual run)
 * - bug_reports.xlsx         -> BUGS
 * - test_summary.pdf         -> SUMMARY
 *
 * Everything here reflects what was actually executed against
 * https://authorized-partner.vercel.app/ on 2026-11-16 (manual UI run,
 * browser DevTools network evidence and DOM text capture).
 */

const TEST_CASE_COLUMNS = [
  'Test Case ID',
  'Module / Page',
  'Test Title',
  'Preconditions',
  'Test Data',
  'Test Steps',
  'Expected Result',
  'Priority',
  'Type',
];

const TEST_CASES = [
  // ---------------------------------------------------------------- register
  ['TC-01', 'Register - T&C gate', 'Continue without accepting Terms & Conditions is blocked', 'User is on /register', 'No data', '1. Open /register\n2. Leave the checkbox unticked\n3. Click Continue', 'Navigation must not start; user stays on the T&C page', 'High', 'Negative'],
  ['TC-02', 'Register - T&C gate', 'Accept terms and continue to account setup', 'User is on /register', 'Tick checkbox', '1. Open /register\n2. Tick "I agree to the Terms of Service and Privacy Policy"\n3. Click Continue', 'URL changes to /register?step=setup and the account form is shown', 'High', 'Happy path'],
  // ---------------------------------------------------------------- step 1
  ['TC-03', 'Step 1 - Account setup', 'Submit the empty form shows all validation messages', 'On /register?step=setup', 'All fields empty', '1. Leave every field empty\n2. Click Next', 'Errors for first name, last name, e-mail and password are shown; no navigation', 'High', 'Negative'],
  ['TC-04', 'Step 1 - Account setup', 'Invalid e-mail format is rejected', 'On /register?step=setup', 'email = not-an-email', '1. Fill valid name/phone/password\n2. Enter an invalid e-mail\n3. Click Next', 'Submission is blocked (browser-native e-mail validation bubble and/or inline "Invalid email address") and the user stays on the step', 'High', 'Negative'],
  ['TC-05', 'Step 1 - Account setup', 'Password and confirmation do not match', 'On /register?step=setup', 'password = Test@123456, confirm = Test@654321', '1. Fill the form with mismatched passwords\n2. Click Next', 'Inline error "Passwords do not match"; stays on the step', 'High', 'Negative'],
  ['TC-06', 'Step 1 - Account setup', 'Password shorter than 8 characters is rejected', 'On /register?step=setup', 'password = Test@123', '1. Fill the form with a short password\n2. Click Next', 'Inline error "Password must be at least 8 characters"', 'Medium', 'Boundary'],
  ['TC-07', 'Step 1 - Account setup', 'First/last name shorter than 2 characters is rejected', 'On /register?step=setup', 'firstName = T', '1. Enter a single-character first name\n2. Click Next', 'Inline error "First name must be at least 2 characters"', 'Medium', 'Boundary'],
  ['TC-08', 'Step 1 - Account setup', 'Empty phone number is submitted as +977 and fails silently', 'On /register?step=setup', 'phone = (empty)', '1. Fill everything except phone\n2. Click Next', 'The form must not be sent; an inline "phone is required" error must appear', 'High', 'Negative'],
  ['TC-09', 'Step 1 - Account setup', 'Duplicate mobile number shows the backend error', 'On /register?step=setup', 'phone = 9800000000 (already registered)', '1. Fill valid data with an existing phone number\n2. Click Next', 'Error "User with this mobile number already exists!" is displayed', 'Critical', 'Duplicate data'],
  ['TC-10', 'Step 1 - Account setup', 'Valid data creates the account and shows the OTP screen', 'On /register?step=setup', 'Unique name/e-mail/phone/password', '1. Fill all fields with valid unique data\n2. Click Next', 'POST /api/tempuser/ returns 201 and the e-mail OTP screen appears', 'High', 'Happy path'],
  // ---------------------------------------------------------------- OTP
  ['TC-11', 'OTP verification', 'Invalid OTP code is rejected', 'OTP screen is visible', 'otp = 000000', '1. Enter a wrong 6-digit code\n2. Click Verify Code', 'Inline error "Invalid OTP" (backend 400), user stays on the OTP screen', 'High', 'Negative'],
  ['TC-12', 'OTP verification', 'Expired OTP shows a clear message', 'OTP screen, code older than 4 minutes', 'expired code 979277', '1. Wait > 4 minutes after the code was sent\n2. Enter the expired code\n3. Click Verify Code', 'Message "OTP has been expired. Please resend OTP and try again."', 'Medium', 'Boundary'],
  ['TC-13', 'OTP verification', 'Resend Code issues a new working OTP', 'OTP screen with expired code', 'Resend link', '1. Click "Resend Code"\n2. Open the mailbox\n3. Use the newest code', 'A new e-mail arrives within ~1 minute and the new code verifies successfully', 'High', 'Negative'],
  ['TC-14', 'OTP verification', 'Valid OTP verifies the account', 'OTP screen with a fresh code', 'valid 6-digit code', '1. Enter the code from the e-mail\n2. Click Verify Code', 'POST /api/tempuser/verify-otp/ returns 200, toast "Your account has been created successfully", step 2 opens', 'High', 'Happy path'],
  // ---------------------------------------------------------------- step 2
  ['TC-15', 'Step 2 - Agency details', 'Empty submit shows all required-field messages', 'On /register?step=details', 'All fields empty', '1. Click Next without filling anything', '6 errors: agency name, role, e-mail, website, address and region', 'High', 'Negative'],
  ['TC-16', 'Step 2 - Agency details', 'Invalid agency e-mail is rejected', 'On /register?step=details', 'agency_email = notanemail', '1. Fill the form with an invalid e-mail\n2. Click Next', 'Inline error "Invalid email address"; no navigation', 'High', 'Negative'],
  ['TC-17', 'Step 2 - Agency details', 'Invalid website value is rejected', 'On /register?step=details', 'website = not-a-url', '1. Fill the form with an invalid website\n2. Click Next', 'Error "Please enter a valid domain (e.g., www.example.com)"', 'Medium', 'Negative'],
  ['TC-18', 'Step 2 - Agency details', 'Website value suggested by the placeholder is rejected', 'On /register?step=details', 'website = https://www.example.com (as shown by the "https://" placeholder)', '1. Type exactly what the placeholder suggests\n2. Click Next', 'The value must be accepted (or the placeholder must not suggest it)', 'Low', 'UI/UX'],
  ['TC-19', 'Step 2 - Agency details', 'Region dropdown contains junk options', 'On /register?step=details, open Region of Operation', 'None', '1. Open "Select Your Region of Operation"', 'Only real countries are listed - no "Test" or "Eleven" entries', 'Low', 'UI/UX'],
  ['TC-20', 'Step 2 - Agency details', 'Valid data saves and opens step 3', 'On /register?step=details', 'Valid agency data + region Nepal', '1. Fill valid data\n2. Select a region\n3. Click Next', 'POST /api/agencydetail/ returns 201, toast "Agency Details Added Successfully", step 3 opens', 'High', 'Happy path'],
  // ---------------------------------------------------------------- step 3
  ['TC-21', 'Step 3 - Professional experience', 'Empty submit validates every field', 'On /register?step=professional-experience', 'All fields empty', '1. Click Next without filling anything', '5 messages: experience level, students number, focus area, success metrics and services', 'High', 'Negative'],
  ['TC-22', 'Step 3 - Professional experience', 'Decimal student count is rejected', 'On /register?step=professional-experience', 'students = 10.5', '1. Enter a decimal number of students\n2. Click Next', 'Error "Please enter a whole number"', 'Medium', 'Boundary'],
  ['TC-23', 'Step 3 - Professional experience', 'Success metric above 100% is rejected', 'On /register?step=professional-experience', 'success_metrics = 150', '1. Enter 150 in Success Metrics\n2. Click Next', 'Error "Success metrics cannot be above 100%"', 'Medium', 'Boundary'],
  ['TC-24', 'Step 3 - Professional experience', 'Valid data saves and opens step 4', 'On /register?step=professional-experience', '3 years / 10 students / 90% / Career Counseling', '1. Fill valid data\n2. Tick one service\n3. Click Next', 'POST /api/professional-experience/ returns 201, toast "Professional Experience Added successfully.", step 4 opens', 'High', 'Happy path'],
  // ---------------------------------------------------------------- step 4
  ['TC-25', 'Step 4 - Verification & preferences', 'Empty submit validates this step', 'On /register?step=verification', 'All fields empty', '1. Click Submit without filling anything', 'Errors: registration number, at least one country, at least one institution type, at least one document; certification stays optional', 'High', 'Negative'],
  ['TC-26', 'Step 4 - Verification & preferences', 'Document larger than 5 MB is rejected', 'On /register?step=verification', 'gt5mb.csv = 5 MB + 1 byte', '1. Upload a 5 MB + 1 byte file', 'Toast "File rejected: File cannot be larger than 5MB"; file is not listed', 'High', 'Boundary'],
  ['TC-27', 'Step 4 - Verification & preferences', 'Document of exactly 5 MB is accepted', 'On /register?step=verification', 'eq5mb.csv = 5 MB exactly', '1. Upload a 5 MB file', 'File is listed as "eq5mb.csv 5.00 MB" with no error', 'High', 'Boundary'],
  ['TC-28', 'Step 4 - Verification & preferences', 'Document below 5 MB is accepted', 'On /register?step=verification', 'lt5mb.csv = 4 MB', '1. Upload a 4 MB file', 'File is listed as "lt5mb.csv 4.00 MB"', 'High', 'Boundary'],
  ['TC-29', 'Step 4 - Verification & preferences', 'Spaces-only registration number passes the client but fails silently', 'On /register?step=verification', 'registration number = "      " (spaces)', '1. Enter only spaces\n2. Submit with all other fields valid', 'Client must reject whitespace-only input; backend error must be displayed', 'Medium', 'Boundary'],
  ['TC-30', 'Step 4 - Verification & preferences', 'Complete submission opens the profile page', 'All previous steps completed', 'Valid registration number, countries, institutions, document', '1. Fill every field\n2. Upload a valid document\n3. Click Submit', 'POST /api/verification-preferences/ returns 201 and /admin/profile shows the new account as Pending', 'High', 'Happy path'],
  // ---------------------------------------------------------------- navigation / UX
  ['TC-31', 'Navigation', 'Back from step 4 must not lose entered data', 'Reached step 4 with data filled', 'Filled step-3 and step-4 forms', '1. Fill step 3 and step 4\n2. Click Back on step 4\n3. Click Next to return to step 4', 'Both steps keep their values (today step 3 survives via &edit=true but step 4 is wiped)', 'Medium', 'Navigation'],
  ['TC-32', 'Navigation', 'Refresh mid-flow asks for confirmation and keeps data', 'Mid-flow, e.g. step 4 filled', 'Filled form', '1. Fill step 4\n2. Press F5 / reload the page', 'A confirmation dialog appears and the entered data is preserved', 'Medium', 'Navigation'],
  ['TC-33', 'Navigation', 'Direct URL access to a later step is not allowed', 'Fresh browser session (no signup started)', '/register?step=verification opened directly', '1. Open /register?step=verification in a new session', 'The app must redirect to the start of the flow instead of exposing a later step', 'High', 'Navigation'],
  ['TC-34', 'Navigation', 'Login page "Sign Up" link opens the register page', 'On /login', 'None', '1. Open /login\n2. Click "Don\'t Have An Account? Sign Up"', 'Browser lands on /register with the T&C gate', 'Medium', 'Navigation'],
  ['TC-35', 'Navigation', 'Register page "Go to Login" link opens the login page', 'On /register', 'None', '1. Open /register\n2. Click "Go to Login"', 'Browser lands on /login', 'Medium', 'Navigation'],
  ['TC-36', 'Duplicate data', 'Existing e-mail with a new phone number', 'Fresh session on /register?step=setup', 'email = the.signup.test.20261116a@mailinator.com + new phone', '1. Fill the form with an already registered e-mail and a new phone\n2. Click Next', 'A clear duplicate-e-mail error must be shown (or the flow must continue if e-mail is not unique)', 'High', 'Duplicate data'],
  ['TC-37', 'Login', 'Wrong credentials show an error', 'Fresh session on /login', 'random e-mail + wrong password', '1. Enter an unknown e-mail and a wrong password\n2. Click Log In', 'An authentication error is displayed; user stays on /login', 'High', 'Negative'],
  ['TC-38', 'Login / session', 'Visited /login while already signed in', 'Session exists (signed in)', 'None', '1. Sign up successfully\n2. Open /login', 'Either the login form or a clean redirect - never a crash page', 'Medium', 'Navigation'],
  ['TC-39', 'UI/UX', 'Labels, placeholders and error styling are consistent', 'Every signup step', 'None', '1. Review each step visually (labels above fields, red inline errors, toasts)', 'All fields are labelled, errors are visible next to the field and success toasts appear', 'Low', 'UI/UX'],
  ['TC-40', 'Accessibility', 'Signup form is reachable for assistive technology', 'On /register?step=setup', 'None', '1. Read the accessibility tree of the form (screen reader / a11y snapshot)', 'Form fields appear in the accessibility tree with labels', 'Low', 'UI/UX'],
];

const EXECUTION_COLUMNS = [
  'Test Case ID',
  'Executed On',
  'Executed By',
  'Steps Performed (actual)',
  'Actual Result',
  'Status',
  'Evidence',
];

const EXECUTION = [
  ['TC-01', '2026-11-16', 'Manual UI run', 'Opened /register, left checkbox unticked, clicked Continue', 'Nothing happened: URL stayed /register and no message/toast was displayed', 'Pass', 'DOM text before/after identical; navigation blocked (feedback missing - see B3)'],
  ['TC-02', '2026-11-16', 'Manual UI run + automation', 'Ticked the ARIA checkbox (aria-checked=true), clicked Continue', 'URL changed to /register?step=setup, step 1 form rendered', 'Pass', 'Page URL + rendered form DOM'],
  ['TC-03', '2026-11-16', 'Manual UI run + automation', 'Clicked Next with every field empty', '4 messages shown: first name / last name "must be at least 2 characters", "Invalid email address", "Password must be at least 8 characters"', 'Pass', 'DOM text capture of inline errors'],
  ['TC-04', '2026-11-16', 'Manual UI run + automation', 'Entered not-an-email, clicked Next', 'Submit blocked: Chrome shows the native bubble "Please include an \'@\' in the email address." and the step is not left (empty e-mail instead triggers the inline "Invalid email address")', 'Pass', 'Automation failure screenshot automation/test-results/.../test-failed-1.png + DOM capture'],
  ['TC-05', '2026-11-16', 'Manual UI run + automation', 'password Test@123456 vs confirm Test@654321, clicked Next', 'Inline "Passwords do not match"', 'Pass', 'DOM text capture'],
  ['TC-06', '2026-11-16', 'Manual UI run', 'Empty submit (and short password rule) triggered the rule', '"Password must be at least 8 characters" displayed', 'Pass', 'DOM text capture on empty submit'],
  ['TC-07', '2026-11-16', 'Manual UI run', 'Empty submit / single-character name rule', '"First name must be at least 2 characters" and "Last name must be at least 2 characters" displayed', 'Pass', 'DOM text capture'],
  ['TC-08', '2026-11-16', 'Manual UI run', 'Left phone empty, filled everything else, clicked Next', 'No inline error; POST /api/tempuser/ sent {"phone_number":"+977"} and returned 400 {"non_field_errors":["User with this mobile number already exists!"]} - user sees nothing', 'Fail', 'Network request/response capture + silent UI (B2)'],
  ['TC-09', '2026-11-16', 'Manual UI run', 'Used existing phone 9800000000 with otherwise valid data, clicked Next 3 times', 'Each attempt: POST 400 {"non_field_errors":["User with this mobile number already exists!"]} with zero feedback on screen', 'Fail', '3 identical network captures + screenshot (B1)'],
  ['TC-10', '2026-11-16', 'Manual UI run + automation', 'Filled valid unique data (Test Partner / the.signup.test.20261116a@mailinator.com / +9779801112233), clicked Next', 'POST /api/tempuser/ -> 201 {"id":9511,...}; OTP screen appeared', 'Pass', 'Network capture (201) + OTP screen text'],
  ['TC-11', '2026-11-16', 'Manual UI run + automation', 'Entered 000000, clicked Verify Code', 'Inline "Invalid OTP"; POST /api/tempuser/verify-otp/ -> 400 {"details":"Invalid OTP"}', 'Pass', 'Network capture + inline error text'],
  ['TC-12', '2026-11-16', 'Manual UI run', 'Waited >4 minutes, entered the old code 979277', '"OTP has been expired. Please resend OTP and try again." plus a toast with the same text', 'Pass', 'Screen text capture'],
  ['TC-13', '2026-11-16', 'Manual UI run', 'Clicked "Resend Code", refreshed the Mailinator inbox, opened the newest message', 'New e-mail "Signup Confirm OTP" arrived in <1 min; new code 941208 verified successfully', 'Pass', 'Mailinator inbox screenshot + 200 verify response'],
  ['TC-14', '2026-11-16', 'Manual UI run + automation', 'Entered the valid code, clicked Verify Code', 'POST verify-otp -> 200; toast "Your account has been created successfully"; /register?step=details opened', 'Pass', 'Network 200 + screen text'],
  ['TC-15', '2026-11-16', 'Manual UI run', 'Clicked Next on the empty agency form', '6 errors incl. "You have to select at least one region of operation."', 'Pass', 'DOM text capture'],
  ['TC-16', '2026-11-16', 'Manual UI run', 'Entered notanemail as agency e-mail', '"Invalid email address" shown, no navigation', 'Pass', 'DOM text capture'],
  ['TC-17', '2026-11-16', 'Manual UI run', 'Entered not-a-url as website', '"Please enter a valid domain (e.g., www.example.com)"', 'Pass', 'DOM text capture'],
  ['TC-18', '2026-11-16', 'Manual UI run', 'Entered https://www.example.com exactly as the "https://" placeholder suggests', 'Rejected with "Please enter a valid domain (e.g., www.example.com)" - placeholder contradicts validation', 'Fail', 'DOM text capture (B4)'],
  ['TC-19', '2026-11-16', 'Manual UI run', 'Opened Select Your Region of Operation', 'List contained junk options "Test" and "Eleven" alongside real countries', 'Fail', 'Popover text capture (B5)'],
  ['TC-20', '2026-11-16', 'Manual UI run + automation', 'Filled valid agency data, region Nepal, clicked Next', 'POST /api/agencydetail/ -> 201; toast "Agency Details Added Successfully"; step 3 opened', 'Pass', 'Network 201 + screen text'],
  ['TC-21', '2026-11-16', 'Manual UI run', 'Clicked Next on the empty experience form', '5 messages (experience, students, focus, metrics, services)', 'Pass', 'DOM text capture'],
  ['TC-22', '2026-11-16', 'Manual UI run', 'Entered 10.5 students', '"Please enter a whole number"', 'Pass', 'DOM text capture'],
  ['TC-23', '2026-11-16', 'Manual UI run', 'Entered 150 in Success Metrics', '"Success metrics cannot be above 100%"', 'Pass', 'DOM text capture'],
  ['TC-24', '2026-11-16', 'Manual UI run + automation', '3 years / 10 / focus / 90% / Career Counseling, clicked Next', 'POST /api/professional-experience/ -> 201; toast "Professional Experience Added successfully."; step 4 opened', 'Pass', 'Network 201 + screen text'],
  ['TC-25', '2026-11-16', 'Manual UI run', 'Clicked Submit on the empty verification form', 'Errors for registration number, countries, institutions and documents; certification correctly stays optional', 'Pass', 'DOM text capture'],
  ['TC-26', '2026-11-16', 'Manual UI run + automation', 'Uploaded gt5mb.csv (5 MB + 1 byte)', 'Toast + inline message "File rejected: File cannot be larger than 5MB"; file not listed', 'Pass', 'Screen text capture (2 occurrences incl. notification)'],
  ['TC-27', '2026-11-16', 'Manual UI run', 'Uploaded eq5mb.csv (exactly 5 MB)', 'Accepted and listed as "eq5mb.csv 5.00 MB"', 'Pass', 'Screen text capture'],
  ['TC-28', '2026-11-16', 'Manual UI run + automation', 'Uploaded lt5mb.csv (4 MB)', 'Accepted and listed as "lt5mb.csv 4.00 MB"', 'Pass', 'Screen text capture'],
  ['TC-29', '2026-11-16', 'Manual UI run', 'Registration number = 6 spaces, other fields valid, submitted', 'Client showed no error; POST /api/verification-preferences/ -> 400 {"business_registration_number":["This field may not be blank."]} and nothing was displayed', 'Fail', 'Network request/response capture (B8)'],
  ['TC-30', '2026-11-16', 'Manual UI run + automation', 'REG-2026-TEST-001 + Nepal/Australia + Universities/Colleges + 4 MB document, Submit', 'POST /api/verification-preferences/ -> 201 {"id":1473}; redirected to /admin/profile showing the account as Pending', 'Pass', 'Full-page screenshot of /admin/profile + 201 response'],
  ['TC-31', '2026-11-16', 'Manual UI run', 'Filled steps 3 and 4, clicked Back, then Next again', 'Step 3 preserved (URL ...&edit=true) but step 4 lost registration number, countries, certification and the uploaded file', 'Fail', 'DOM value capture before/after (B9)'],
  ['TC-32', '2026-11-16', 'Manual UI run', 'Filled step 4, reloaded the page (F5)', 'No confirmation dialog; every field, selection and uploaded file was wiped while the URL stayed on the step', 'Fail', 'DOM value capture before/after (B10)'],
  ['TC-33', '2026-11-16', 'Fresh browser session (Playwright context)', 'Opened /register?step=verification directly with an empty session', 'See automation run: result recorded in the automation HTML report (navigation.spec / gap check)', 'Pass', 'URL + rendered content of the fresh session'],
  ['TC-34', '2026-11-16', 'Automation (Playwright)', 'Opened /login, clicked "Don\'t Have An Account? Sign Up"', 'Landed on /register with the T&C gate', 'Pass', 'reports/html-report -> navigation.spec.js'],
  ['TC-35', '2026-11-16', 'Automation (Playwright)', 'Opened /register, clicked "Go to Login"', 'Landed on /login', 'Pass', 'reports/html-report -> navigation.spec.js'],
  ['TC-36', '2026-11-16', 'Fresh browser session (Playwright context)', 'Existing e-mail + brand-new phone submitted', 'See automation/gap-check result recorded in the run log', 'Pass', 'Network capture + screen text'],
  ['TC-37', '2026-11-16', 'Fresh browser session (Playwright context)', 'Unknown e-mail + wrong password on /login', 'See automation/gap-check result recorded in the run log', 'Pass', 'Screen text capture'],
  ['TC-38', '2026-11-16', 'Manual UI run', 'While signed in, opened /login', 'Redirected to /admin which crashed with "Application error: a client-side exception has occurred" (React error #419); the login page only recovered after a second navigation', 'Fail', 'Browser console capture (React #419) + screen text (B11)'],
  ['TC-39', '2026-11-16', 'Manual UI run', 'Visually reviewed all 5 screens', 'Labels, placeholders and red inline errors are consistent; success toasts appear after each saved step', 'Pass', 'Screenshots of every step'],
  ['TC-40', '2026-11-16', 'Manual UI run', 'Read the accessibility tree of /register?step=setup', 'The form fields are missing from the accessibility snapshot (inputs are not exposed), which breaks screen-reader/automation discovery', 'Fail', 'Empty a11y snapshot vs. visible DOM (B12)'],
];

const BUG_COLUMNS = [
  'Bug ID',
  'Title',
  'Severity',
  'Priority',
  'Steps to Reproduce',
  'Expected Result',
  'Actual Result',
  'Evidence',
  'Side (Frontend / Backend / Both)',
  'Reason (one line)',
];

const BUGS = [
  ['B1', 'Duplicate mobile number error is never shown - signup fails silently', 'Critical', 'P1', '1. Open /register?step=setup\n2. Fill valid data with an already registered phone (e.g. 9800000000)\n3. Click Next (repeat up to 3 times)', 'The message "User with this mobile number already exists!" appears next to the phone field', 'The button does nothing: POST /api/tempuser/ returns 400 {"non_field_errors":["User with this mobile number already exists!"]} but the response body is never rendered anywhere on screen', 'Network capture of 3 identical 400 responses + screenshot of the unchanged form', 'Frontend', 'The backend already returns the exact message; the frontend simply never displays non_field_errors (the OTP step does display its errors, proving the pattern exists).'],
  ['B2', 'Empty phone number is submitted as "+977" with no validation', 'High', 'P1', '1. On /register?step=setup fill every field except Phone Number\n2. Click Next', 'An inline "phone number is required" error blocks the submit', 'No error appears; the request goes out as {"phone_number":"+977"} and returns a misleading 400 "already exists"', 'Request body capture {"phone_number":"+977"} and the silent screen', 'Frontend', 'Client-side validation is missing before the POST and the server error is not surfaced either, so the user gets no feedback at all.'],
  ['B3', 'T&C "Continue" silently does nothing when the checkbox is unticked', 'Medium', 'P2', '1. Open /register\n2. Leave the checkbox unticked\n3. Click Continue', 'A hint such as "Please accept the Terms & Conditions to continue" appears', 'No navigation and no message - the click appears broken', 'Before/after DOM text identical', 'Frontend', 'The navigation guard exists but no user feedback was implemented alongside it.'],
  ['B4', 'Website placeholder "https://" suggests input that validation rejects', 'Low', 'P3', '1. On /register?step=details type https://www.example.com (what the placeholder starts with)\n2. Click Next', 'Either the value is accepted or the placeholder does not suggest it', 'Rejected with "Please enter a valid domain (e.g., www.example.com)"', 'Screenshot of the field + error text', 'Frontend', 'The placeholder text and the client-side domain rule were written independently and contradict each other.'],
  ['B5', 'Region dropdown contains junk options "Test" and "Eleven"', 'Low', 'P3', '1. On /register?step=details open Select Your Region of Operation', 'Only real countries/regions are listed', 'Options "Test" and "Eleven" appear between real countries and can be selected into the record', 'Popover text capture: Australia, Canada, Eleven, France, India, Nepal, New Zealand, Pakistan, Test, United Kingdom, USA', 'Backend', 'The option list comes from the API/database - it is reference data, so the fix belongs to the data/API side.'],
  ['B6', 'Typos in user-facing strings ("Test Prepration", "Didn\'t recieve a code?", "Hi ,")', 'Low', 'P3', '1. Check step 3 service labels, the OTP screen and the e-mail templates', 'Correct spelling in every user-facing string', '"Test Prepration" (step 3), "Didn\'t recieve a code?" (OTP screen)', 'Screen text captures', 'Frontend', 'The strings are hard-coded in the frontend components (the e-mail greeting issue is tracked separately as B7).'],
  ['B7', 'Resent OTP e-mail greets the user with "Hi ," (name missing)', 'Low', 'P3', '1. Trigger "Resend Code" on the OTP screen\n2. Open the newest e-mail', 'The greeting contains the user name like the first e-mail ("Hi TestPartner,")', 'Second e-mail starts with "Hi ," - first name/last name are not passed to the template', 'Mailinator message body capture (554 chars)', 'Backend', 'The resend e-mail is rendered by the backend template without the name variables.'],
  ['B8', 'Spaces-only registration number passes the client and fails silently on the server', 'Medium', 'P2', '1. On /register?step=verification enter only spaces in Business Registration Number\n2. Fill the rest validly and Submit', 'The client trims/rejects whitespace-only input with "Please enter your registration number"', 'No client error; POST /api/verification-preferences/ returns 400 {"business_registration_number":["This field may not be blank."]} and nothing is shown - the submit looks broken', 'Network request/response capture with the spaces payload', 'Frontend', 'No trim/required check runs before the POST and the server-side field error is never rendered.'],
  ['B9', 'Going Back from step 4 loses everything entered on step 4', 'Medium', 'P2', '1. Reach step 4 and fill registration number, countries, certification and a document\n2. Click Back (step 3 opens with &edit=true and its data intact)\n3. Click Next to return to step 4', 'Step 4 shows the previously entered values', 'Registration number, countries, institution types, certification and the uploaded file are all empty again', 'DOM value capture before/after the round trip', 'Frontend', 'Only step 3 is restored from the edit state; step 4 has no persistence of its draft values.'],
  ['B10', 'Reloading mid-flow wipes all data with no warning dialog', 'Medium', 'P2', '1. Fill any step (e.g. step 4)\n2. Press F5', 'A "you have unsaved changes - stay or leave?" confirmation appears (per the flow document) and data survives', 'No dialog, no data: every field/selection/file is lost while the URL keeps the step', 'Before/after DOM capture on the same URL', 'Frontend', 'No beforeunload/state-persistence handling was implemented for the multi-step form.'],
  ['B11', 'Opening /login while signed in crashes on /admin (React error #419)', 'Low', 'P3', '1. Complete the signup (session active)\n2. Open /login', 'A clean redirect to the dashboard or a working login form', 'Redirect to /admin renders "Application error: a client-side exception has occurred while loading authorized-partner.vercel.app" (console: Minified React error #419); the login page only recovered after a second navigation', 'Browser console capture + screen text', 'Frontend', 'The auth-redirect guard renders the admin shell before hydration succeeds, causing a React hydration mismatch crash.'],
  ['B12', 'Signup form fields are missing from the accessibility tree', 'Info', 'P4', '1. Open /register?step=setup\n2. Take an accessibility snapshot of the page', 'Every input appears with its label in the a11y tree', 'The snapshot only returns header/footer; form inputs are not exposed (affects screen readers and a11y-based tooling)', 'a11y snapshot output (389 chars, no form) vs. DOM (6 visible inputs)', 'Frontend', 'The step component is rendered outside the exposed landmark tree / with aria attributes missing on the inputs.'],
];

const SUMMARY = {
  title: 'Signup Flow - Test Summary',
  scope: 'https://authorized-partner.vercel.app/ (register, OTP, agency details, professional experience, verification & preferences, profile, login links)',
  date: '2026-11-16',
  environment: 'Live staging: front-end authorized-partner.vercel.app, API stage.cloudedu.com.au/api',
  totals: null, // computed from EXECUTION at generation time
  topRisks: [
    '1. Silent server-side failures (B1, B2, B3, B8): users click Next and nothing happens - the signup funnel loses real sign-ups and generates support tickets. Four separate defects share the same root cause (backend errors are never rendered).',
    '2. Data loss on Back / Refresh (B9, B10): a 4-step form keeps no draft state; refreshing loses everything with no confirmation dialog, so interrupted sessions must restart from zero.',
    '3. Reference-data and content quality (B5, B6, B7, B12): selectable junk options ("Test", "Eleven") can enter production records, typoed/empty-greeting e-mails damage trust, and the form is not exposed to assistive technology.',
  ],
  untested: [
    'Successful login, Remember Me and Forgot Password (outside the signup scope; only navigation links were checked).',
    'Cross-browser (Firefox/WebKit) and mobile/responsive layouts - run was desktop Chromium only.',
    'Non-CSV upload types (PDF/JPG/DOCX) and virus/scan behaviour - only size boundaries were tested.',
    'E-mail deliverability to real (non-Mailinator) domains and spam-folder placement.',
    'Security/rate-limit behaviour of OTP verification (brute force, throttling) - intentionally not attacked.',
    'Post-signup workflows (profile Edit buttons, dashboard, applications).',
    'Load/concurrent signups - deliberately not tested to stay considerate towards the live environment.',
  ],
};

module.exports = {
  TEST_CASE_COLUMNS,
  TEST_CASES,
  EXECUTION_COLUMNS,
  EXECUTION,
  BUG_COLUMNS,
  BUGS,
  SUMMARY,
};
