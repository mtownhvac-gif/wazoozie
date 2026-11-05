import {spawn} from 'node:child_process';
// Accept the host/port flags used by managed previews and ordinary local tooling.
const args=process.argv.slice(2);
const value=(flag,fallback)=>{const i=args.lastIndexOf(flag);return i<0?fallback:args[i+1];};
const host=value('--host',value('--ip','0.0.0.0'));
const port=value('--port',process.env.PORT||'8123');
if(!/^\d+$/.test(port)||Number(port)>65535) throw new Error('Invalid preview port');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--ip',host,'--port',port,'--var','INTAKE_LOCAL_PREVIEW:1'],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
