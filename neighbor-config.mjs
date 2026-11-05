export const NEIGHBOR_CONSENT_VERSION = 'neighbor-referral-2026-11-05';
export const NEIGHBOR_CODE = /^[0-9a-f]{32}$/;
export function neighborCode(value) { return typeof value === 'string' && NEIGHBOR_CODE.test(value) ? value : ''; }
export function neighborLink(code) { return neighborCode(code) ? `https://wazoozie.com/start/?neighbor=${code}` : ''; }
