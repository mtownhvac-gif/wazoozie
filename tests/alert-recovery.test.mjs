import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';

test('identical retries restore a missing alarm after saving committed but scheduling failed', async () => {
  const bundled = await build({
    stdin: {resolveDir: process.cwd(), contents: `
      import {ProjectInbox} from './server/project-store.mjs';
      export class TestInbox extends ProjectInbox {
        failNextAlarm = true;
        async scheduleEmailAlarm(now) {
          if (this.failNextAlarm) { this.failNextAlarm = false; throw new Error('Synthetic alarm outage'); }
          return super.scheduleEmailAlarm(now);
        }
        async deliveryAlarm() { return this.ctx.storage.getAlarm(); }
        async captureSaveFailure(method, data, now) {
          try { await this[method](data, 'original', 'client', now); return ''; }
          catch (error) { return error.message; }
        }
      }
      export default {fetch() {return new Response('Local test');}};
    `},
    bundle: true, write: false, format: 'esm', platform: 'browser', external: ['cloudflare:workers'],
  });
  const mf = new Miniflare(convertV4MiniflareOptions({
    unsafeInspectDurableObjects: true, modules: true, script: bundled.outputFiles[0].text,
    compatibilityDate: '2026-11-04',
    durableObjects: {PROJECT_INBOX: {className: 'TestInbox', useSQLite: true}},
  }));
  try {
    const ns = await mf.getDurableObjectNamespace('PROJECT_INBOX');
    const now = Date.now() + 60000; // Keep automatic alarms outside this test's execution.
    for (const kind of ['brief', 'application']) {
      const store = ns.get(ns.idFromName(kind));
      const common = {id: crypto.randomUUID(), name: 'Synthetic test', phone: '202-555-0100',
        email: 'test@example.invalid', town: 'Media', state: 'PA', consentVersion: 'test'};
      const data = kind === 'brief' ? {...common, provider: 'middletown', intent: 'comfort', zip: '19063',
        details: 'Synthetic local test only', timing: 'Planning ahead', role: 'Homeowner', property: 'House',
        equipment: '', source: 'start-page', notifyProvider: true} : {...common,
        businessName: 'Synthetic business', contactName: 'Synthetic test', website: '', coverage: 'Media',
        registration: '', insurance: 'yes', services: ['carpentry'], interest: 'sponsored', notes: ''};
      const save = fingerprint => kind === 'brief'
        ? store.saveBrief(data, fingerprint, 'client', now)
        : store.saveApplication(data, fingerprint, 'client', now);
      assert.match(await store.captureSaveFailure(kind === 'brief' ? 'saveBrief' : 'saveApplication', data, now), /Synthetic alarm outage/);
      const sql = await mf.unsafeGetDurableObjectStorage(undefined, 'TestInbox', {name: kind});
      assert.equal((await sql.exec('SELECT count(*) AS n FROM email_outbox'))[0].n, 1);
      assert.equal(await store.deliveryAlarm(), null);
      assert.equal((await save('original')).status, 200);
      assert.equal(await store.deliveryAlarm(), now + 1000, `${kind}: retry must repair scheduling`);
      assert.equal((await save('changed')).status, 409);
      assert.equal((await sql.exec('SELECT count(*) AS n FROM email_outbox'))[0].n, 1);
      assert.equal((await sql.exec('SELECT attempts FROM email_outbox'))[0].attempts, 0);
      assert.equal((await sql.exec('SELECT count FROM submission_limits'))[0].count, 1);
      assert.equal((await sql.exec('SELECT count FROM contact_counts'))[0].count, 1);
    }
  } finally { await mf.dispose(); }
});
