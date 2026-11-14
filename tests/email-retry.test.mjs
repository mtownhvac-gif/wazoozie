import test from 'node:test';
import assert from 'node:assert/strict';
import {emailRetryDelay} from '../server/email-retry.mjs';

test('office alert backoff respects Retry-After seconds and dates without shortening ordinary retries', () => {
  const now = Date.UTC(2026, 10, 14, 10);
  assert.equal(emailRetryDelay(1, '3600', now), 3600000);
  assert.equal(emailRetryDelay(1, new Date(now + 7200000).toUTCString(), now), 7200000);
  assert.equal(emailRetryDelay(3, '1', now), 240000);
  for (const header of [null, '', 'nonsense', '-10', new Date(now - 60000).toUTCString()]) {
    assert.equal(emailRetryDelay(2, header, now), 120000, String(header));
  }
  assert.equal(emailRetryDelay(1, '999999999999999999999999', now), 21600000);
  assert.equal(emailRetryDelay(10, null, now), 21600000);
});
