// Inspect only public capability fields; never treat automation acceptance as inbox receipt.
export function liveIntakeFailures(pages, capability) {
  const failures = [];
  for (const path of ['/', '/request/', '/assets/quick-request.js', '/assets/project-config.mjs']) {
    if (pages[path]?.status !== 200) failures.push(`${path}: expected HTTP 200`);
  }
  if (!/href=["']\/request\//.test(pages['/']?.body || '')) failures.push('Homepage request link missing');
  const request = pages['/request/']?.body || '';
  if (!request.includes('id="quickRequest"')) failures.push('Request form missing');
  if (!request.includes('/assets/quick-request.js')) failures.push('Request script link missing');
  if (!(pages['/assets/quick-request.js']?.body || '').includes('/api/project-briefs')) failures.push('Request submission script missing');
  if (!(pages['/assets/project-config.mjs']?.body || '').includes('export const BUSINESSES')) failures.push('Business configuration module missing');
  if (capability?.capabilityVersion !== 2) failures.push('Unsupported intake capability version');
  if (capability?.captureReady !== true) failures.push('Private capture unavailable');
  if (!Array.isArray(capability?.emailProviders) || !capability.emailProviders.includes('middletown')) failures.push('Middletown office alert routing unavailable');
  return failures;
}

export function validTestReceipt(status, result, reference) {
  return [200, 201].includes(status) && result?.status === 'saved' && result.reference === reference
    && ['pending', 'automation_accepted'].includes(result.providerDelivery);
}
