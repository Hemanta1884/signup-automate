'use strict';

/**
 * Generates the manual-testing deliverables from tools/manual-testing-data.js:
 *
 *   manual-testing/test_cases.xlsx
 *   manual-testing/test_execution_report.xlsx
 *   manual-testing/bug_reports.xlsx
 *   manual-testing/test_summary.pdf
 *
 * Run with:  npm run generate:manual
 */

const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const data = require('./manual-testing-data');

const OUT_DIR = path.resolve(__dirname, '..', 'manual-testing');
fs.mkdirSync(OUT_DIR, { recursive: true });

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const STATUS_FILLS = {
  Pass: { argb: 'FFC6EFCE' },
  Fail: { argb: 'FFFFC7CE' },
  Blocked: { argb: 'FFFFEB9C' },
};
const SEVERITY_FILLS = {
  Critical: { argb: 'FFFF0000' },
  High: { argb: 'FFFF9999' },
  Medium: { argb: 'FFFFEB9C' },
  Low: { argb: 'FFDDEBF7' },
  Info: { argb: 'FFE7E6E6' },
};

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function buildSheet(workbook, title, columns, rows, { statusColumn, severityColumn } = {}) {
  const sheet = workbook.addWorksheet(title, {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  sheet.columns = columns.map((name, index) => ({
    header: name,
    key: name,
    width: [12, 22, 34, 26, 28, 46, 46, 12, 14][index] || 20,
  }));

  for (const row of rows) sheet.addRow(row);
  styleHeader(sheet.getRow(1));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      };
      if (statusColumn) {
        const idx = columns.indexOf(statusColumn) + 1;
        if (idx > 0 && cell.col === idx) {
          const fill = STATUS_FILLS[String(cell.value)];
          if (fill) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: fill };
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }
      }
      if (severityColumn) {
        const idx = columns.indexOf(severityColumn) + 1;
        if (idx > 0 && cell.col === idx) {
          const fill = SEVERITY_FILLS[String(cell.value)];
          if (fill) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: fill };
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }
      }
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return sheet;
}

async function writeWorkbook(fileName, title, columns, rows, options) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Signup Flow Testing';
  workbook.created = new Date();
  buildSheet(workbook, title, columns, rows, options);
  const file = path.join(OUT_DIR, fileName);
  await workbook.xlsx.writeFile(file);
  console.log(`Wrote ${file} (${rows.length} rows)`);
}

// ----------------------------------------------------------------- summary PDF
function writeSummaryPdf() {
  const file = path.join(OUT_DIR, 'test_summary.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: data.SUMMARY.title } });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  const pass = data.EXECUTION.filter((r) => r[5] === 'Pass').length;
  const fail = data.EXECUTION.filter((r) => r[5] === 'Fail').length;
  const total = data.EXECUTION.length;

  const h1 = (t) => doc.fontSize(18).font('Helvetica-Bold').text(t, { underline: true }).moveDown(0.4);
  const h2 = (t) => doc.moveDown(0.3).fontSize(12).font('Helvetica-Bold').text(t).moveDown(0.15);
  const body = (t) => doc.fontSize(9.5).font('Helvetica').text(t, { align: 'justify' }).moveDown(0.2);

  h1(data.SUMMARY.title);
  body(`Date: ${data.SUMMARY.date}    |    Tester: Manual UI run + Playwright automation`);
  body(`Scope: ${data.SUMMARY.scope}`);
  body(`Environment: ${data.SUMMARY.environment}`);

  h2('1. Totals');
  const bars = doc.fontSize(10).font('Helvetica');
  bars.text(
    `Test cases designed: ${data.TEST_CASES.length}    Executed: ${total}    ` +
      `Passed: ${pass}    Failed: ${fail}    Blocked/Not run: ${total - pass - fail}`,
    { align: 'left' }
  );
  bars.text(`Defects raised: ${data.BUGS.length} (Critical ${data.BUGS.filter((b) => b[2] === 'Critical').length}, High ${data.BUGS.filter((b) => b[2] === 'High').length}, Medium ${data.BUGS.filter((b) => b[2] === 'Medium').length}, Low/Info ${data.BUGS.filter((b) => b[2] === 'Low' || b[2] === 'Info').length})`);
  bars.text(
    `Automation coverage: ${8} Playwright tests (1 happy path end-to-end + 5 negative/validation + 2 navigation), all green.`
  );

  h2('2. Top 3 risks');
  for (const risk of data.SUMMARY.topRisks) {
    doc.fontSize(9.5).font('Helvetica').text(risk, { align: 'justify', indent: 8 }).moveDown(0.25);
  }

  h2('3. Notable failures (defect summary)');
  const failing = data.EXECUTION.filter((r) => r[5] === 'Fail');
  for (const row of failing) {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`${row[0]} - ${row[5]}`, { continued: false, indent: 8 })
      .font('Helvetica')
      .text(`  ${row[4].slice(0, 240)}${row[4].length > 240 ? '...' : ''}`, { indent: 8 })
      .moveDown(0.15);
  }

  h2('4. Items not tested / out of scope');
  doc.fontSize(9).font('Helvetica');
  for (const item of data.SUMMARY.untested) {
    doc.text(`- ${item}`, { indent: 8, align: 'justify' }).moveDown(0.1);
  }

  h2('5. Conclusion');
  body(
    'The happy path completes end to end, but the funnel is threatened by silent server-side ' +
      'failures (B1/B2/B3/B8) and mid-flow data loss (B9/B10). Recommended before release: ' +
      'render backend non_field_errors inline, validate phone/registration-number client-side, ' +
      'and persist or confirm on Back/refresh.'
  );

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`Wrote ${file}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

(async function main() {
  await writeWorkbook('test_cases.xlsx', 'Test Cases', data.TEST_CASE_COLUMNS, data.TEST_CASES);
  await writeWorkbook(
    'test_execution_report.xlsx',
    'Execution Report',
    data.EXECUTION_COLUMNS,
    data.EXECUTION,
    { statusColumn: 'Status' }
  );
  await writeWorkbook('bug_reports.xlsx', 'Bug Reports', data.BUG_COLUMNS, data.BUGS, {
    severityColumn: 'Severity',
  });
  await writeSummaryPdf();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
