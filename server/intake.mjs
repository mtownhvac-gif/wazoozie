import {BUSINESSES} from '../project-config.mjs';
import {validateBrief} from './brief-validation.mjs';
import {validateActivity} from '../activity-config.mjs';
import {validateNeighbor} from './neighbor-validation.mjs';
import {validateApplication} from './application-validation.mjs';
import {validWebhook} from './provider-email.mjs';

function respond(data, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff'}});
}

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readJSON(request, limit = 16384) {
  if (Number(request.headers.get('content-length')) > limit) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks = [];
  let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new RangeError(); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleIntake(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/project-capabilities') {
    return request.method === 'GET' ? respond({capabilityVersion: 2, captureReady: Boolean(env.PROJECT_INBOX), emailProviders: validWebhook(env.MIDDLETOWN_ZAPIER_WEBHOOK) ? ['middletown'] : []}) : respond({error: 'Method not allowed.'}, 405);
  }
  const neighbor = url.pathname === '/api/neighbor-referrals';
  const activity = url.pathname === '/api/contact-activity';
  const businessApplication = url.pathname === '/api/contractor-applications';
  if (url.pathname !== '/api/project-briefs' && !activity && !businessApplication && !neighbor) return respond({error: 'Not found.'}, 404);
  if (request.method !== 'POST') return respond({error: 'Method not allowed.'}, 405);
  const origins = new Set(['https://wazoozie.com', 'https://www.wazoozie.com']);
  if (env.INTAKE_LOCAL_PREVIEW === '1' || ['localhost', '127.0.0.1'].includes(url.hostname)) origins.add(url.origin);
  if (!origins.has(request.headers.get('origin'))) return respond({error: 'Request origin not allowed.'}, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return respond({error: 'Use JSON.'}, 415);
  if (!env.PROJECT_INBOX) return respond({error: businessApplication ? 'Applications are unavailable. Please try again later.' : 'Saving is unavailable. Please call the business directly.'}, 503);

  let input;
  try { input = await readJSON(request, activity ? 512 : 16384); }
  catch (error) { return respond({error: error instanceof RangeError ? 'Request too large.' : 'Invalid JSON.'}, error instanceof RangeError ? 413 : 400); }
  if (neighbor) {
    const {referral,error}=validateNeighbor(input);
    if(error)return respond({error},400);
    const now=Date.now();
    const date=new Date(now).toISOString();
    const fingerprint=await hash(JSON.stringify(referral));
    const client=await hash(date.slice(0,10)+'|'+(request.headers.get('cf-connecting-ip')||'unknown'));
    try{
      const {status,code}=await env.PROJECT_INBOX.getByName('neighbors:v1').saveNeighbor(referral,fingerprint,client,now);
      if(status===429)return respond({error:'Link limit reached. You can still share wazoozie.com directly.'},429);
      if(status===409)return respond({error:'This reference already has different details. Reopen the page for a new link.'},409);
      if(![200,201].includes(status)||!code)throw Error('Save not confirmed');
      return respond({code,status:'created',expiresInDays:90},status);
    }catch{return respond({error:'We could not confirm your link. Retry the same details.'},503);}
  }
  if (businessApplication) {
    const {application,error} = validateApplication(input);
    if (error) return respond({error},400);
    const now=Date.now();
    const date=new Date(now).toISOString();
    const fingerprint=await hash(JSON.stringify(application));
    const client=await hash(date.slice(0,10)+'|'+(request.headers.get('cf-connecting-ip')||'unknown'));
    try {
      const inbox=env.PROJECT_INBOX.getByName(`applications:${date.slice(0,7)}`);
      const {status}=await inbox.saveApplication(application,fingerprint,client,now);
      if(status===429)return respond({error:'Application limit reached. Please try again another day.'},429);
      if(status===409)return respond({error:'This reference has different details. Reopen the application for a new reference.'},409);
      if(![200,201].includes(status))throw new Error('Application not confirmed');
      return respond({reference:application.id,status:'awaiting_review',published:false,charged:false},status);
    }catch{return respond({error:'We could not confirm a save. Retry the same application details.'},503);}
  }
  if (activity) {
    const event = validateActivity(input);
    if (!event) return respond({error: 'Invalid contact action.'}, 400);
    const now = Date.now();
    const date = new Date(now).toISOString();
    const client = await hash(date.slice(0, 10) + '|' + (request.headers.get('cf-connecting-ip') || 'unknown'));
    try {
      const inbox = env.PROJECT_INBOX.getByName(`activity:${date.slice(0, 7)}`);
      const {status} = await inbox.recordActivity(event, client, now);
      return respond(status === 429 ? {error:'Action limit reached.'} : {counted:true}, status);
    } catch { return respond({error:'Counting is unavailable.'}, 503); }
  }
  const {brief, error} = validateBrief(input);
  if (error) return respond({error}, 400);

  const now = Date.now();
  const date = new Date(now).toISOString();
  const fingerprint = await hash(JSON.stringify(brief));
  // Rotate the pseudonymous abuse key daily; never store raw IP addresses.
  const client = await hash(date.slice(0, 10) + '|' + (request.headers.get('cf-connecting-ip') || 'unknown'));
  try {
    if(brief.neighborCode && !await env.PROJECT_INBOX.getByName('neighbors:v1').hasNeighbor(brief.neighborCode,now)) delete brief.neighborCode;
    const inbox = env.PROJECT_INBOX.getByName(`${brief.provider}:${date.slice(0, 7)}`);
    const {status,referralAttributed} = await inbox.saveBrief(brief, fingerprint, client, now);
    if (status === 429) return respond({error: 'Request limit reached. Please call the business directly.'}, 429);
    if (status === 409) return respond({error: 'This reference already has different details. Start a new brief.'}, 409);
    if(![200,201].includes(status)) throw Error('Save not confirmed');
    let providerDelivery = 'not_sent';
    if (brief.notifyProvider) {
      try { providerDelivery = await inbox.deliverBrief(brief.id); }
      catch { providerDelivery = 'pending'; }
    }
    return respond({reference: brief.id, provider: BUSINESSES[brief.provider].name, status: 'saved', providerDelivery, referralAttributed: referralAttributed ?? Boolean(brief.neighborCode)}, status);
  } catch {
    return respond({error: 'We could not confirm a save. Retry this same brief or call the business directly.'}, 503);
  }
}
