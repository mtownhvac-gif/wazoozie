const DEFAULT_URL = 'https://wazoozie.com/api/project-capabilities';

export function validateCapability(capability) {
  if (!capability || typeof capability !== 'object') {
    throw new Error('Capability response was not a JSON object.');
  }
  if (capability.capabilityVersion !== 2) {
    throw new Error(`Unexpected capability version: ${String(capability.capabilityVersion)}`);
  }
  if (capability.captureReady !== true) {
    throw new Error('Private project capture is not ready.');
  }
  if (!Array.isArray(capability.emailProviders) || !capability.emailProviders.includes('middletown')) {
    throw new Error('Middletown office alert routing is not advertised.');
  }
  return {captureReady: true, middletownAlerts: true};
}

export async function checkLiveAlertCapability({
  url = DEFAULT_URL,
  fetchImpl = fetch,
  signal = AbortSignal.timeout(10000),
} = {}) {
  const response = await fetchImpl(url, {
    headers: {'Accept': 'application/json'},
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Capability endpoint returned HTTP ${response.status}.`);
  return validateCapability(await response.json());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const status = await checkLiveAlertCapability({url: process.env.WAZOOZIE_CAPABILITY_URL || DEFAULT_URL});
    console.log(`Wazoozie live alert check passed: capture=${status.captureReady}, middletown=${status.middletownAlerts}`);
  } catch (error) {
    console.error(`Wazoozie live alert check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
