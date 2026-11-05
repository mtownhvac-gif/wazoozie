import {DurableObject} from 'cloudflare:workers';

// Private SQLite storage, partitioned by provider and calendar month.
// No public endpoint can list or retrieve project briefs.
export class ProjectInbox extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS project_briefs (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, provider TEXT NOT NULL,
      intent TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', name TEXT NOT NULL,
      phone TEXT NOT NULL, email TEXT, town TEXT NOT NULL, zip TEXT NOT NULL,
      state TEXT NOT NULL, details TEXT NOT NULL, timing TEXT NOT NULL,
      role TEXT NOT NULL, property TEXT NOT NULL, equipment TEXT, source TEXT,
      consent_version TEXT NOT NULL, fingerprint TEXT NOT NULL
    )`);
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS briefs_created ON project_briefs(created_at)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS submission_limits(client_hash TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL)');
  }

  async saveBrief(brief, fingerprint, client, now) {
    let status = 201;
    this.ctx.storage.transactionSync(() => {
      const existing = this.ctx.storage.sql.exec('SELECT fingerprint FROM project_briefs WHERE id=?', brief.id).toArray()[0];
      if (existing) { status = existing.fingerprint === fingerprint ? 200 : 409; return; }
      const count = this.ctx.storage.sql.exec('SELECT count FROM submission_limits WHERE client_hash=?', client).toArray()[0]?.count || 0;
      const total = this.ctx.storage.sql.exec('SELECT count(*) AS n FROM project_briefs WHERE created_at>=?', now - 86400000).toArray()[0].n;
      if (count >= 5 || total >= 200) { status = 429; return; }
      const b = brief;
      this.ctx.storage.sql.exec(`INSERT INTO project_briefs
        (id,created_at,provider,intent,name,phone,email,town,zip,state,details,timing,role,property,equipment,source,consent_version,fingerprint)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        b.id, now, b.provider, b.intent, b.name, b.phone, b.email, b.town, b.zip,
        b.state, b.details, b.timing, b.role, b.property, b.equipment, b.source, b.consentVersion, fingerprint);
      this.ctx.storage.sql.exec('INSERT INTO submission_limits(client_hash,day,count) VALUES (?,?,1) ON CONFLICT(client_hash) DO UPDATE SET count=count+1', client, new Date(now).toISOString().slice(0, 10));
    });
    if (status === 201 && !await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 86400000);
    return {status};
  }

  async alarm() {
    const now = Date.now();
    this.ctx.storage.sql.exec('DELETE FROM project_briefs WHERE created_at<?', now - 90 * 86400000);
    this.ctx.storage.sql.exec('DELETE FROM submission_limits WHERE day<?', new Date(now - 2 * 86400000).toISOString().slice(0, 10));
    if (this.ctx.storage.sql.exec('SELECT count(*) AS n FROM project_briefs').toArray()[0].n) await this.ctx.storage.setAlarm(now + 86400000);
  }
}
