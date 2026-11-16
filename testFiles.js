'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Boundary-size upload fixtures.
 *
 * The signup step 4 rejects files larger than 5 MB and accepts exactly 5 MB.
 * Files are generated once (lazily) into automation/.tmp/ which is git-ignored.
 */
const TMP_DIR = path.resolve(__dirname, '..', '.tmp');
const MB = 1024 * 1024;

function ensureFile(name, bytes) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const filePath = path.join(TMP_DIR, name);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size !== bytes) {
    const header = 'test_id,field,value,note\n';
    const row = (i) => `row_${i},field_${i},value_${i},"synthetic upload boundary test data padding row"\n`;
    const parts = [header];
    let size = Buffer.byteLength(header);
    let i = 0;
    while (size < bytes) {
      const r = row(i++);
      size += Buffer.byteLength(r);
      parts.push(r);
    }
    fs.writeFileSync(filePath, Buffer.from(parts.join(''), 'utf8').subarray(0, bytes));
  }
  return filePath;
}

/** File below the limit (4 MB) - must be accepted. */
function belowLimitFile() {
  return ensureFile('lt5mb.csv', 4 * MB);
}

/** File of exactly 5 MB - must be accepted (boundary). */
function exactLimitFile() {
  return ensureFile('eq5mb.csv', 5 * MB);
}

/** File above the limit (5 MB + 1 byte) - must be rejected. */
function aboveLimitFile() {
  return ensureFile('gt5mb.csv', 5 * MB + 1);
}

module.exports = { belowLimitFile, exactLimitFile, aboveLimitFile };
