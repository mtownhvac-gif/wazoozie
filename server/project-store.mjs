import {emailPayload, validWebhook} from './provider-email.mjs';
import {DurableObject} from 'cloudflare:workers';

// Private SQLite storage, partitioned by provider and calendar month.
// No public endpoint can list or retrieve project briefs.
export class ProjectInbox extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS project_briefs (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, provider TEXT NOT NULL,
      intent TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', name TEXT NOT NULL,
      phone TEXT NOT NULL, email TEXT, town TEXT NOT NULL, zip TEXT NOT NULL,
      state TEXT NOT NULL, details TEXT NOT NULL, timing TEXT NOT NULL,
      role TEXT NOT NULL, property TEXT NOT NULL, equipment TEXT, source TEXT,
      consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL
    )`);
    if (!ctx.storage.sql.exec('PRAGMA table_info(project_briefs)').toArray().some(column => column.name === 'neighbor_code')) ctx.storage.sql.exec('ALTER TABLE project_briefs ADD COLUMN neighbor_code TEXT');
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS neighbor_referrals(id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL)");
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS email_outbox(id TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL, expires INTEGER NOT NULL)");
    this.deliveryChain = Promise.resolve();
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS briefs_created ON project_briefs(created_at)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS submission_limits(client_hash TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS contact_counts(day TEXT NOT NULL, action TEXT NOT NULL, provider TEXT NOT NULL, context TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(day,action,provider,context))');
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS contractor_applications(id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'awaiting_review', business_name TEXT NOT NULL, contact_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, website TEXT, town TEXT NOT NULL, state TEXT NOT NULL, coverage TEXT NOT NULL, registration TEXT, insurance TEXT NOT NULL, services TEXT NOT NULL, interest TEXT NOT NULL, notes TEXT, consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL)");
  }

  async saveBrief(brief, fingerprint, client, now) {
    let status = 201;
    let referralAttributed=Boolean(brief.neighborCode);
    this.ctx.storage.transactionSync(() => {
      const existing = this.ctx.storage.sql.exec('SELECT fingerprint,neighbor_code FROM project_briefs WHERE id=?', brief.id).toArray()[0];
      if (existing) { status = existing.fingerprint === fingerprint ? 200 : 409; referralAttributed=Boolean(existing.neighbor_code); return; }
      const count = this.ctx.storage.sql.exec('SELECT count FROM submission_limits WHERE client_hash=?', client).toArray()[0]?.count || 0;
      const total = this.ctx.storage.sql.exec('SELECT count(*) AS n FROM project_briefs WHERE created_at>=?', now - 86400000).toArray()[0].n;
      if (count >= 5 || total >= 200) { status = 429; return; }
      const b = brief;
      this.ctx.storage.sql.exec(`INSERT INTO project_briefs
        (id,created_at,provider,intent,name,phone,email,town,zip,state,details,timing,role,property,equipment,source,consent_version,fingerprint,neighbor_code)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        b.id, now, b.provider, b.intent, b.name, b.phone, b.email, b.town, b.zip,
        b.state, b.details, b.timing, b.role, b.property, b.equipment, b.source, b.consentVersion, fingerprint, b.neighborCode || null);
      this.ctx.storage.sql.exec('INSERT INTO submission_limits(client_hash,day,count) VALUES (?,?,1) ON CONFLICT(client_hash) DO UPDATE SET count=count+1', client, new Date(now).toISOString().slice(0, 10));
      if (b.notifyProvider) this.ctx.storage.sql.exec('INSERT INTO email_outbox(id,payload,next_attempt,expires) VALUES (?,?,?,?)', b.id, JSON.stringify(emailPayload(b)), now, now + 48*3600000);
      this.incrementContact({action:'brief_saved',provider:b.provider,context:'planner'}, now);
    });
    if (status === 201) await this.scheduleEmailAlarm(now);
    return {status,referralAttributed};
  }

  async saveNeighbor(referral, fingerprint, client, now) {
    let result;
    this.ctx.storage.transactionSync(() => {
      const existing=this.ctx.storage.sql.exec('SELECT fingerprint,code FROM neighbor_referrals WHERE id=?',referral.id).toArray()[0];
      if(existing){result=existing.fingerprint===fingerprint?{status:200,code:existing.code}:{status:409};return;}
      const key='neighbor:'+client;
      const count=this.ctx.storage.sql.exec('SELECT count FROM submission_limits WHERE client_hash=?',key).toArray()[0]?.count||0;
      const total=this.ctx.storage.sql.exec('SELECT count(*) AS n FROM neighbor_referrals WHERE created_at>=?',now-86400000).toArray()[0].n;
      if(count>=3||total>=1000){result={status:429};return;}
      const code=crypto.randomUUID().replaceAll('-','');
      const r=referral;
      this.ctx.storage.sql.exec('INSERT INTO neighbor_referrals(id,code,created_at,name,email,phone,consent_version,fingerprint) VALUES (?,?,?,?,?,?,?,?)',r.id,code,now,r.name,r.email,r.phone,r.consentVersion,fingerprint);
      this.ctx.storage.sql.exec('INSERT INTO submission_limits(client_hash,day,count) VALUES (?,?,1) ON CONFLICT(client_hash) DO UPDATE SET count=count+1',key,new Date(now).toISOString().slice(0,10));
      result={status:201,code};
    });
    if(result.status===201&&!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(now+86400000);
    return result;
  }

  async hasNeighbor(code,now) {
    return Boolean(this.ctx.storage.sql.exec('SELECT 1 AS found FROM neighbor_referrals WHERE code=? AND created_at>?',code,now-90*86400000).toArray()[0]);
  }

  async saveApplication(application,fingerprint,client,now) {
    let status=201;
    this.ctx.storage.transactionSync(()=>{
      const existing=this.ctx.storage.sql.exec('SELECT fingerprint FROM contractor_applications WHERE id=?',application.id).toArray()[0];
      if(existing){status=existing.fingerprint===fingerprint?200:409;return;}
      const key='application:'+client;
      const count=this.ctx.storage.sql.exec('SELECT count FROM submission_limits WHERE client_hash=?',key).toArray()[0]?.count||0;
      const total=this.ctx.storage.sql.exec('SELECT count(*) AS n FROM contractor_applications WHERE created_at>=?',now-86400000).toArray()[0].n;
      if(count>=3||total>=50){status=429;return;}
      const a=application;
      this.ctx.storage.sql.exec('INSERT INTO contractor_applications(id,created_at,business_name,contact_name,email,phone,website,town,state,coverage,registration,insurance,services,interest,notes,consent_version,fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',a.id,now,a.businessName,a.contactName,a.email,a.phone,a.website,a.town,a.state,a.coverage,a.registration,a.insurance,JSON.stringify(a.services),a.interest,a.notes,a.consentVersion,fingerprint);
      this.ctx.storage.sql.exec('INSERT INTO submission_limits(client_hash,day,count) VALUES (?,?,1) ON CONFLICT(client_hash) DO UPDATE SET count=count+1',key,new Date(now).toISOString().slice(0,10));
      this.incrementContact({action:'application_saved',provider:'contractor',context:'contractors'},now);
    });
    if(status===201&&!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(now+86400000);
    return {status};
  }

  incrementContact(event, now) {
    this.ctx.storage.sql.exec('INSERT INTO contact_counts(day,action,provider,context,count) VALUES (?,?,?,?,1) ON CONFLICT(day,action,provider,context) DO UPDATE SET count=count+1', new Date(now).toISOString().slice(0, 10), event.action, event.provider, event.context);
  }

  async recordActivity(event, client, now) {
    let status = 200;
    this.ctx.storage.transactionSync(() => {
      const key = 'activity:' + client;
      const count = this.ctx.storage.sql.exec('SELECT count FROM submission_limits WHERE client_hash=?', key).toArray()[0]?.count || 0;
      const day = new Date(now).toISOString().slice(0, 10);
      const total = this.ctx.storage.sql.exec('SELECT COALESCE(sum(count),0) AS n FROM contact_counts WHERE day=?', day).toArray()[0].n;
      if (count >= 100 || total >= 20000) { status = 429; return; }
      this.incrementContact(event, now);
      this.ctx.storage.sql.exec('INSERT INTO submission_limits(client_hash,day,count) VALUES (?,?,1) ON CONFLICT(client_hash) DO UPDATE SET count=count+1', key, day);
    });
    if (status === 200 && !await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 86400000);
    return {status};
  }

  async scheduleEmailAlarm(now = Date.now()) {
    const next = this.ctx.storage.sql.exec("SELECT min(next_attempt) AS n FROM email_outbox WHERE state='pending'").toArray()[0]?.n;
    const target = Math.min(now + 86400000, next == null ? Infinity : Math.max(now + 1000, next));
    const current = await this.ctx.storage.getAlarm();
    if (!current || current > target) await this.ctx.storage.setAlarm(target);
  }

  async deliverBrief(id) {
    const task = this.deliveryChain.catch(() => {}).then(() => this.sendEmail(id));
    this.deliveryChain = task;
    return task;
  }

  async sendEmail(id) {
    const row = this.ctx.storage.sql.exec('SELECT * FROM email_outbox WHERE id=?',id).toArray()[0];
    if (!row) return 'not_sent';
    if (row.state !== 'pending') return row.state;
    const now = Date.now();
    if (row.next_attempt > now) return 'pending';
    if (row.expires <= now || row.attempts >= 10) {
      this.ctx.storage.sql.exec("UPDATE email_outbox SET state='failed' WHERE id=?",id);
      return 'failed';
    }
    const hook = this.env.MIDDLETOWN_ZAPIER_WEBHOOK;
    let accepted = false;
    if (validWebhook(hook)) {
      try {
        const response = await fetch(hook, {method:'POST', redirect:'manual', headers:{'Content-Type':'application/json'}, body:row.payload, signal:AbortSignal.timeout(8000)});
        accepted = response.ok;
        await response.body?.cancel();
      } catch {}
    }
    const attempts = row.attempts + 1;
    const state = accepted ? 'automation_accepted' : attempts >= 10 ? 'failed' : 'pending';
    const next = now + Math.min(6*3600000,60000 * 2**(attempts-1));
    this.ctx.storage.sql.exec('UPDATE email_outbox SET state=?,attempts=?,next_attempt=? WHERE id=?',state,attempts,next,id);
    await this.scheduleEmailAlarm(now);
    return state;
  }

  async alarm() {
    const now = Date.now();
    const due = this.ctx.storage.sql.exec("SELECT id FROM email_outbox WHERE state='pending' AND next_attempt<=? LIMIT 10",now).toArray();
    for (const row of due) await this.deliverBrief(row.id);
    this.ctx.storage.sql.exec('DELETE FROM email_outbox WHERE expires<?', now - 88*86400000);
    this.ctx.storage.sql.exec('DELETE FROM neighbor_referrals WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM project_briefs WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM contractor_applications WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM submission_limits WHERE day<?', new Date(now - 2 * 86400000).toISOString().slice(0, 10));
    this.ctx.storage.sql.exec('DELETE FROM contact_counts WHERE day<?', new Date(now - 90 * 86400000).toISOString().slice(0,10));
    if (this.ctx.storage.sql.exec('SELECT (SELECT count(*) FROM project_briefs) + (SELECT count(*) FROM contact_counts) + (SELECT count(*) FROM contractor_applications) + (SELECT count(*) FROM neighbor_referrals) AS n').toArray()[0].n) await this.scheduleEmailAlarm(now);
  }
}
