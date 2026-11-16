# Signup Automation — Execution Steps

Manual + automated test delivery for **https://authorized-partner.vercel.app/** (signup flow),
built with **Playwright 1.65.1 / JavaScript / Page Object Model**.

---

## 1. Prerequisites and versions

| Component | Version / requirement | Notes |
|---|---|---|
| Node.js | **>= 18** (verified on **v24.20.0**) | `node -v` |
| npm | >= 9 (verified on **11.19.0**) | On Windows PowerShell use `npm.cmd` / `npx.cmd` (execution policy blocks `.ps1` shims) |
| Playwright | **1.65.1** (`@playwright/test`) | installed as a devDependency |
| Browser | **Google Chrome** (system install) | config uses `channel: 'chrome'`; on machines where Playwright's downloaded Chromium is allowed you may remove `channel` from `automation/playwright.config.js` |
| exceljs | 4.x | generates the manual `.xlsx` deliverables |
| pdfkit | 0.15.x | generates `test_summary.pdf` |
| OS verified | Windows 11/10 (win32) | suite is OS-independent |

> **Browser note:** this machine's Application Control policy blocks executables downloaded into
> `%LOCALAPPDATA%\ms-playwright`, so the suite runs on the locally installed Chrome (same Chromium
> engine). First run on a normal machine: `npx playwright install chromium`.

---

## 2. Setup and install

```powershell
cd "C:\Users\Hemanta\Desktop\New folder\signup-automation"

# 1. install dependencies
npm.cmd install

# 2. (optional) install Playwright's browsers — not needed when using channel:'chrome'
npx.cmd playwright install chromium

# 3. (optional) copy the config template; no secrets are required for this flow
copy .env.example .env
```

Environment variables (all optional, read by `automation/config/index.js`):

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://authorized-partner.vercel.app` | application under test |
| `API_BASE` | `https://stage.cloudedu.com.au/api` | backend reference (debugging) |
| `OTP_INBOX_URL` | Mailinator public inbox URL prefix | OTP e-mail retrieval |
| `OTP_SUBJECT` | `Signup Confirm OTP` | subject filter |
| `OTP_TIMEOUT_MS` | `90000` | max wait for the OTP e-mail |
| `OTP_CODE` | *(unset)* | debug escape hatch: force a code, skip inbox read |
| `HEADFUL` | `0` | `1` = watch the run in a visible browser |

**No credentials or secrets exist in the code.**

---

## 3. Run the tests and open the report

```powershell
# full suite (11 tests, serial, 1 worker — deliberate, see "site consideration")
npm.cmd test

# subsets
npm.cmd run test:negative     # 5 negative/validation tests
npm.cmd run test:headed       # watch it in a real browser window

# single test
npx.cmd playwright test --config automation/playwright.config.js -g "TC-34"

# open the HTML report (after a run)
npm.cmd run report            # -> reports/html-report/index.html
```

* Report output folder: `reports/html-report/` (set in `automation/playwright.config.js`).
* On failure, screenshots/videos/traces land in `automation/test-results/` and are attached
  to the HTML report (`npx playwright show-trace <trace.zip>` to replay).
* Regenerate the manual deliverables: `npm.cmd run generate:manual`.

---

## 4. Project structure and how POM is applied

```
signup-automation/
├── README_execution_steps.md        ← this file
├── package.json                     ← scripts: test / test:negative / test:demo / report / generate:manual
├── .env.example                     ← all configuration (no secrets)
├── manual-testing/
│   ├── test_cases.xlsx              ← 40 manual test cases (ID, module, steps, expected, priority, type)
│   ├── test_execution_report.xlsx   ← execution results of the manual run (Pass/Fail + evidence)
│   ├── bug_reports.xlsx             ← 12 defects, each committed to Frontend / Backend / both + 1-line reason
│   └── test_summary.pdf             ← one-page summary: totals, top-3 risks, untested items
├── automation/
│   ├── playwright.config.js         ← shared setup: timeouts, reporters, browser, 1 worker
│   ├── config/index.js              ← env/.env loader — single source of runtime config
│   ├── pages/                       ← PAGE OBJECTS ONLY (locators + actions + page-level assertions)
│   │   ├── BasePage.js              ← shared: goto, expectUrl, error collection, button helpers
│   │   ├── TermsPage.js             ← step 0: /register T&C gate
│   │   ├── AccountSetupPage.js      ← step 1: personal details + account
│   │   ├── OtpVerificationPage.js   ← step 1b: e-mail OTP screen
│   │   ├── AgencyDetailsPage.js     ← step 2: /register?step=details
│   │   ├── ProfessionalExperiencePage.js ← step 3
│   │   ├── VerificationPreferencesPage.js← step 4
│   │   ├── ProfilePage.js           ← /admin/profile (flow end)
│   │   └── LoginPage.js             ← /login (navigation entry points)
│   ├── tests/                       ← SPECS: only page-method calls + assertions
│   │   ├── happy-path.spec.js       ← 1 end-to-end happy path (zero manual steps)
│   │   ├── negative-signup.spec.js  ← TC-01/03/04/05/11 (validation, from the manual cases)
│   │   ├── navigation.spec.js       ← TC-34/35 link navigation
│   │   └── gap-check.spec.js        ← TC-33/36/37 (manual gaps, fresh context each)
│   └── utils/                       ← helpers, no locators
│       ├── dataGenerator.js         ← unique timestamped e-mail/phone/agency data per run
│       ├── otpHelper.js             ← reads the real OTP from the public inbox
│       └── testFiles.js             ← generates 4 MB / 5 MB / 5 MB+1 boundary files
├── tools/
│   ├── manual-testing-data.js       ← single source of truth for the manual deliverables
│   └── generate-manual-testing.js   ← exceljs ×3 + pdfkit generator
├── reports/html-report/             ← Playwright HTML report (committed)
└── demo_video.mp4                   ← recorded happy-path run
```

**POM rules enforced:**

1. **One page class per signup step** — 9 classes, one per screen/step of the flow.
2. **Locators and actions live only in `automation/pages/`** — specs never contain a selector.
3. **Tests only call page methods and hold assertions** — e.g.
   `await setup.submitAndReachOtpScreen();` then `await expect(...)`.
4. **Shared setup is separated** — `BasePage` (common behaviour), `playwright.config.js`
   (browser/timeouts/reporters), `config/index.js` (env), `utils/` (data + helpers).
5. **No hard-coded waits** — zero `waitForTimeout`/`sleep` in the project; everything uses
   Playwright auto-waiting (`locator.click()`, `toBeVisible()`, `toHaveURL()`, `waitForResponse`).
6. **Unique test data per run** — `generateUser()` builds a timestamped + randomised e-mail
   (`e2e.signup.<epoch>.<rand>@mailinator.com`) and a time-derived phone number.
7. **No secrets in code** — everything through env vars / `.env` (see `.env.example`).

---

## 5. Test data and accounts used

* **Generated per run (automation):**
  * Name `Test Partner`, e-mail `e2e.signup.<timestamp>.<hex>@mailinator.com`
  * Phone `98<timestamp-derived 8 digits>` (Nepal mobile format, `+977` added by the UI)
  * Password `Test@123456` (synthetic, test environment only)
  * Agency `E2E Agency <hex>`, registration number `E2E-REG-<timestamp>`
* **Manual-run account (from the manual execution):**
  `Test Partner / the.signup.test.20261116a@mailinator.com / +9779801112233 / Test@123456`
* **E-mail provider:** Mailinator **public** inboxes (no API key, no account) — each run reads
  its own unique mailbox.
* **Known-existing phones in the backend** (used for duplicate tests): `9800000000`, `"+977"`.

---

## 6. How the OTP e-mail verification is handled (never skipped)

The flow e-mails a **6-digit code** (sender `no-reply@theauthorizedpartner.com`, subject
`Signup Confirm OTP`, valid **4 minutes**) that must be entered on the OTP screen.

**Strategy — `automation/utils/otpHelper.js`:**

1. If the `OTP_CODE` environment variable is set, use it (explicit debug escape hatch — the
   README documents it; it is **not** the default path).
2. Otherwise open the **public Mailinator inbox** for the generated address
   (`.../inboxes.jsp?to=<mailbox>`), wait with Playwright auto-waiting for the message with the
   expected subject, open it, read the body from the `#html_msg_body` iframe and extract the
   6-digit code with a regex.

The happy path **really verifies** the OTP — there is no bypass, no mocked response, and the
test fails if the e-mail does not arrive.

**Discovered behaviour (documented):** a **failed** OTP attempt does **not** invalidate the
code — verified experimentally: after submitting `000000` (rejected with `400 Invalid OTP`)
the *correct* code still returned `200` and advanced to step 2. What actually breaks is the
**OTP input itself**: it is a controlled React input, and writing a new value straight over
an already-filled one (`fill('922567')` over `000000`) never reaches React state — the field
ends up showing a garbage value such as `000009`, which the backend then rejects.
`OtpVerificationPage.verify()` therefore **clears the field first**, and the negative test
`TC-11` stops after asserting the rejection so it does not complete a signup.

---

## 7. Test coverage map (automation ↔ manual cases)

| Spec | Manual cases | Type |
|---|---|---|
| `happy-path.spec.js` | TC-02, TC-10, TC-14, TC-20, TC-24, TC-26, TC-28, TC-30 | 1 × full happy path, end-to-end, zero manual steps |
| `negative-signup.spec.js` | TC-01, TC-03, TC-04, TC-05, TC-11 | 5 negative/validation tests (≥3 required) |
| `navigation.spec.js` | TC-34, TC-35 | navigation |
| `gap-check.spec.js` | TC-33, TC-36, TC-37 | manual-gap checks (fresh context each) |

---

## 8. Site consideration (no load / no spam)

* `workers: 1`, `fullyParallel: false`, `retries: 0` — submissions are strictly serial.
* Exactly **one account** is completed end-to-end per full run; other tests stop before
  completing a signup (validation failures do not create records).
* The suite backs off automatically when the backend answers `429 Too many requests`
  (observed during heavy debugging) — re-run after the cooldown instead of retrying in a loop.
* No brute-forcing, no flood of OTP resends, no concurrent signups.

---

## 9. Assumptions, known limitations, not automated

**Assumptions**
* The staging backend and Mailinator public inbox are reachable from the test machine.
* `channel: 'chrome'` (system Chrome) is acceptable on this machine because of the
  Application Control policy blocking Playwright-downloaded browsers.

**Known limitations**
* `TC-12` (expired OTP) and `TC-13` (resend a code) are **manual-only**: expiry needs a
  >4-minute wait and exercising resend repeatedly would spam the mailbox — both conflict
  with the "considerate of the site" rule. (`TC-11` proves wrong codes are rejected; the
  happy path proves a real code is accepted.)
* `TC-29` (spaces-only registration number) and duplicate-phone `TC-09` are covered manually
  with network evidence; automation would create/reuse deliberately broken records.
* `TC-38` (login-while-authenticated React crash, B11) needs a completed session and is
  documented manually.

**Not automated, and why**
* Cross-browser (Firefox/WebKit) and mobile layouts — desktop Chrome only for this delivery.
* Non-CSV file types (PDF/JPG/DOCX) — only CSV size boundaries are exercised.
* Load/concurrent testing, OTP brute force — explicitly out of scope (considerate testing).
* Post-signup dashboard workflows — outside the signup-flow scope.

**Manual deliverables** (all in `manual-testing/`): 40 test cases, 40 execution rows,
12 bug reports (each assigned to **Frontend**, **Backend**, or **Both** with a one-line reason),
and a one-page summary PDF with totals, top-3 risks and untested items.
