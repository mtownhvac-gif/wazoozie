import {DurableObject} from 'cloudflare:workers';

// Private SQLite storage, partitioned by provider and calendar month.
// No public endpoint can list or retrieve project briefs.
export class ProjectInbox extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS delivery_outbox(id TEXT PRIMARY KEY, brief_id TEXT NOT NULL, created_at INTEGER NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL, first_attempt INTEGER, email_id TEXT, last_error TEXT)");
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS delivery_events(id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, email_id TEXT NOT NULL, state TEXT NOT NULL)");
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS project_briefs (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, provider TEXT NOT NULL,
      intent TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', name TEXT NOT NULL,
      phone TEXT NOT NULL, email TEXT, town TEXT NOT NULL, zip TEXT NOT NULL,
      state TEXT NOT NULL, details TEXT NOT NULL, timing TEXT NOT NULL,
      role TEXT NOT NULL, property TEXT NOT NULL, equipment TEXT, source TEXT,
      consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL
    )`);
    if (!ctx.storage.sql.exec('PRAGMA table_info(project_briefs)').toArray().some(column=>column.name==='send_consent_version')) ctx.storage.sql.exec('ALTER TABLE project_briefs ADD COLUMN send_consent_version TEXT');
    if (!ctx.storage.sql.exec('PRAGMA table_info(project_briefs)').toArray().some(column => column.name === 'neighbor_code')) ctx.storage.sql.exec('ALTER TABLE project_briefs ADD COLUMN neighbor_code TEXT');
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS neighbor_referrals(id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL)");
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS briefs_created ON project_briefs(created_at)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS submission_limits(client_hash TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS contact_counts(day TEXT NOT NULL, action TEXT NOT NULL, provider TEXT NOT NULL, context TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(day,action,provider,context))');
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS contractor_applications(id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'awaiting_review', business_name TEXT NOT NULL, contact_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, website TEXT, town TEXT NOT NULL, state TEXT NOT NULL, coverage TEXT NOT NULL, registration TEXT, insurance TEXT NOT NULL, services TEXT NOT NULL, interest TEXT NOT NULL, notes TEXT, consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL)");
  }

  async saveBrief(brief, fingerprint, client, now, delivery = null) {
    // Arm recovery before committing an outbox: a crash after commit must not orphan mail.
    if(delivery){const alarm=await this.ctx.storage.getAlarm();if(!alarm||alarm>now+1000)await this.ctx.storage.setAlarm(now+1000);}
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
      if (delivery) {
        this.ctx.storage.sql.exec('UPDATE project_briefs SET send_consent_version=? WHERE id=?',b.sendConsentVersion,b.id);
        for (const item of delivery) this.ctx.storage.sql.exec('INSERT INTO delivery_outbox(id,brief_id,created_at,payload,next_at) VALUES (?,?,?,?,?)', item.id, b.id, now, JSON.stringify(item.payload), now);
      }
      this.incrementContact({action:'brief_saved',provider:b.provider,context:b.source==='hvac-page'?'hvac':'planner'}, now);
    });
    if (status === 201 && !await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 86400000);
    const queued = this.ctx.storage.sql.exec('SELECT state FROM delivery_outbox WHERE brief_id=?', brief.id).toArray();
    return {status,referralAttributed,deliveryState:queued.length ? (queued.some(r=>r.state==='failed')?'failed':queued.every(r=>r.state==='delivered')?'delivered':queued.every(r=>['accepted','delivered'].includes(r.state))?'accepted':'queued') : 'not_sent'};
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

  async dispatchDelivery() {
    // A per-object promise serializes concurrent alarm/RPC dispatch during fetch awaits.
    if (this.dispatching) return this.dispatching;
    this.dispatching = this.dispatchBatch().finally(()=>{this.dispatching=null;});
    return this.dispatching;
  }

  async dispatchBatch() {
    const now=Date.now();
    if(this.env.INQUIRY_DELIVERY_ENABLED!=='1'||!this.env.RESEND_API_KEY)return;
    const rows=this.ctx.storage.sql.exec("SELECT * FROM delivery_outbox WHERE state='queued' AND next_at<=? ORDER BY created_at LIMIT 10",now).toArray();
    for(const row of rows){
      // Stop ambiguous retries before the provider's 24-hour deduplication expires.
      if(row.attempts>=8||(row.first_attempt&&now-row.first_attempt>=23*3600000)){
        this.ctx.storage.sql.exec("UPDATE delivery_outbox SET state='failed',last_error='manual_review_required' WHERE id=?",row.id);continue;
      }
      this.ctx.storage.sql.exec('UPDATE delivery_outbox SET attempts=attempts+1,first_attempt=COALESCE(first_attempt,?) WHERE id=?',now,row.id);
      let error='transport_unconfirmed',permanent=false;
      try{
        const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+this.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':row.id},body:row.payload,signal:AbortSignal.timeout(15000)});
        if(response.ok){
          const result=await response.json();
          if(typeof result.id==='string'&&result.id.length<100){
            this.ctx.storage.sql.exec("UPDATE delivery_outbox SET state=CASE WHEN state='queued' THEN 'accepted' ELSE state END,email_id=?,last_error=NULL WHERE id=?",result.id,row.id);
            const events=this.ctx.storage.sql.exec("SELECT state FROM delivery_events WHERE email_id=? ORDER BY CASE WHEN state='failed' THEN 0 ELSE 1 END LIMIT 1",result.id).toArray();
            if(events.length)this.ctx.storage.sql.exec('UPDATE delivery_outbox SET state=? WHERE id=?',events[0].state,row.id);
            continue;
          }
        }else{error='provider_http_'+response.status;permanent=[400,401,403,404,422].includes(response.status);
          if(response.status===409){try{permanent=(await response.json()).name==='invalid_idempotent_request';}catch{}}}
      }catch{}
      this.ctx.storage.sql.exec("UPDATE delivery_outbox SET state=CASE WHEN state='queued' THEN ? ELSE state END,next_at=?,last_error=? WHERE id=?",permanent?'failed':'queued',now+Math.min(3600000,30000*2**row.attempts),error,row.id);
    }
  }

  async deliveryEvent(eventId,emailId,state,now) {
    this.ctx.storage.transactionSync(()=>{
      if(this.ctx.storage.sql.exec('SELECT id FROM delivery_events WHERE id=?',eventId).toArray().length)return;
      this.ctx.storage.sql.exec('INSERT INTO delivery_events VALUES (?,?,?,?)',eventId,now,emailId,state);
      // Failure is terminal; late accepted/delivered events must not conceal a bounce.
      this.ctx.storage.sql.exec("UPDATE delivery_outbox SET state=? WHERE email_id=? AND state!='failed'",state,emailId);
    });
  }

  async alarm() {
    const now = Date.now();
    this.ctx.storage.sql.exec('DELETE FROM delivery_outbox WHERE created_at<?',now-90*86400000);
    this.ctx.storage.sql.exec('DELETE FROM delivery_events WHERE created_at<?',now-90*86400000);
    await this.dispatchDelivery();
    this.ctx.storage.sql.exec('DELETE FROM neighbor_referrals WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM project_briefs WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM contractor_applications WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM submission_limits WHERE day<?', new Date(now - 2 * 86400000).toISOString().slice(0, 10));
    this.ctx.storage.sql.exec('DELETE FROM contact_counts WHERE day<?', new Date(now - 90 * 86400000).toISOString().slice(0,10));
    if (this.ctx.storage.sql.exec('SELECT (SELECT count(*) FROM project_briefs) + (SELECT count(*) FROM contact_counts) + (SELECT count(*) FROM contractor_applications) + (SELECT count(*) FROM neighbor_referrals) AS n').toArray()[0].n) await this.ctx.storage.setAlarm(Math.min(now+86400000, this.env.INQUIRY_DELIVERY_ENABLED!=='1'?now+86400000:Math.max(now+60000,this.ctx.storage.sql.exec("SELECT MIN(next_at) AS n FROM delivery_outbox WHERE state='queued'").toArray()[0]?.n || now+86400000)));
  }
}
