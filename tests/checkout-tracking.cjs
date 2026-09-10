const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const candidatePath = process.argv[2] || path.join(__dirname, '..', 'assets', 'chekly-script-custom.js');
const source = fs.readFileSync(candidatePath, 'utf8');
const originalPath = process.argv[3];

function manager(code, cookie = '') {
  const start = code.indexOf('class i{');
  const end = code.indexOf('class s{', start);
  assert(start >= 0 && end > start, 'Tracking class boundaries changed; update this harness before trusting it.');
  const Manager = vm.runInNewContext('(' + code.slice(start, end) + ')', {
    console, URLSearchParams, encodeURIComponent
  });
  return new Manager({getCookie: () => cookie, setCookieWithExpire() {}});
}

function query(code, search = '', cookie = '', extra = {}) {
  const tracking = manager(code, cookie);
  return new URLSearchParams(
    tracking.buildTrackingQueryString(
      tracking.getTrackingParams(new URLSearchParams(search)), extra
    )
  );
}

new vm.Script(source);
assert.equal(query(source, 'gclid=CLICK_TEST').get('gclid'), 'CLICK_TEST');
assert.equal(query(source, '', JSON.stringify({gclid: 'SAVED_TEST'})).get('gclid'), 'SAVED_TEST');
assert.equal(query(source, 'gclid=NEW_TEST', JSON.stringify({gclid: 'OLD_TEST'})).get('gclid'), 'NEW_TEST');
assert.equal(query(source).has('gclid'), false);
assert.equal(query(source, 'gclid=A%2BB%26C%3DD').get('gclid'), 'A+B&C=D');

const legacy = 'utm_source=google&utm_medium=cpc&utm_campaign=spring&fbclid=FB&ttclid=TT&epik=EP&ScCid=SC';
const extra = {lang: 'uk', fbp: 'F1', fbc: 'F2'};
const actual = query(source, legacy, '', extra);
for (const [key, value] of [
  ['utm_source', 'google'], ['utm_medium', 'cpc'], ['utm_campaign', 'spring'],
  ['fbclid', 'FB'], ['ttclid', 'TT'], ['epik', 'EP'], ['sccid', 'SC'],
  ['_fbp', 'F1'], ['_fbc', 'F2']
]) assert.equal(actual.get(key), value, key);

if (originalPath) {
  const original = fs.readFileSync(originalPath, 'utf8');
  assert.equal(query(original, 'gclid=CLICK_TEST').get('gclid'), null);
  assert.equal(actual.toString(), query(original, legacy, '', extra).toString());
  console.log('PASS: original defect reproduced; existing parameters match baseline.');
}
console.log('PASS: fresh/saved gclid, current-ID precedence, absence, encoding, existing parameters and full-script syntax.');
