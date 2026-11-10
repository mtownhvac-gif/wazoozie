import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLiveAlertCapability, validateCapability} from '../scripts/check_live_alerts.mjs';

const healthy = {capabilityVersion: 2, captureReady: true, emailProviders: ['middletown']};

test('accepts the live capability shape required for Middletown office alerts', () => {
  assert.deepEqual(validateCapability(healthy), {captureReady: true, middletownAlerts: true});
});

test('fails closed when capture or office alert routing is missing', () => {
  assert.throws(() => validateCapability({...healthy, captureReady: false}), /capture is not ready/);
  assert.throws(() => validateCapability({...healthy, emailProviders: []}), /alert routing is not advertised/);
  assert.throws(() => validateCapability({...healthy, capabilityVersion: 1}), /Unexpected capability version/);
});

test('reports non-success responses without submitting homeowner data', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, 'https://example.invalid/capabilities');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.cache, 'no-store');
    return {ok: false, status: 503};
  };
  await assert.rejects(
    checkLiveAlertCapability({url: 'https://example.invalid/capabilities', fetchImpl, signal: undefined}),
    /HTTP 503/,
  );
});
