// Runs in authenticated AWS CloudShell. Credentials exist only in process memory.
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const region = process.env.AWS_REGION || 'us-east-2';
const endpoint = process.argv[2];
const target = endpoint && new URL(endpoint);
if (!target || target.protocol !== 'https:' || !new RegExp(`^[a-z0-9]+\\.execute-api\\.${region}\\.amazonaws\\.com$`).test(target.hostname) || target.pathname !== '/mcp' || target.search || target.username || target.password) throw new Error('Pass the exact SAM Endpoint output ending /mcp in the selected AWS region.');
function aws(args) {
 const r=spawnSync('aws', args, {encoding:'utf8',timeout:20000});
 if(r.status!==0) throw new Error('AWS CLI could not access the current session. Open authenticated CloudShell and try again.');
 return JSON.parse(r.stdout);
}
let credentials;
if(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) credentials={AccessKeyId:process.env.AWS_ACCESS_KEY_ID,SecretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,SessionToken:process.env.AWS_SESSION_TOKEN};
else credentials=aws(['configure','export-credentials','--format','process']);
if(!credentials.AccessKeyId || !credentials.SecretAccessKey) throw new Error('AWS session credentials unavailable');
const quote=value=>JSON.stringify(String(value));
async function request(body, signed=true, extraHeaders=[], method='POST') {
 await new Promise(resolve=>setTimeout(resolve,650));
 const config=[`url = ${quote(endpoint)}`,`request = ${quote(method)}`,'silent','show-error','max-time = 20',`write-out = ${quote('\n%{http_code}')}`,
   `header = ${quote('Content-Type: application/json')}`,`header = ${quote('Accept: application/json, text/event-stream')}`,`header = ${quote('MCP-Protocol-Version: 2025-11-25')}`];
 if(body) config.push(`data = ${quote(JSON.stringify(body))}`);
 if(signed){config.push(`aws-sigv4 = ${quote('aws:amz:'+region+':execute-api')}`,`user = ${quote(credentials.AccessKeyId+':'+credentials.SecretAccessKey)}`);if(credentials.SessionToken)config.push(`header = ${quote('X-Amz-Security-Token: '+credentials.SessionToken)}`);}
 for(const h of extraHeaders)config.push(`header = ${quote(h)}`);
 const r=spawnSync('curl',['--config','-'],{input:config.join('\n')+'\n',encoding:'utf8',timeout:25000,maxBuffer:262144});
 if(r.status!==0)throw new Error('HTTPS request failed. Check connectivity, curl SigV4 support and AWS session validity.');
 const split=r.stdout.lastIndexOf('\n');
 const status=Number(r.stdout.slice(split+1));
 let parsed;try{parsed=JSON.parse(r.stdout.slice(0,split));}catch{}
 return {status,parsed};
}
const receipt={endpoint,region,checkedAt:new Date().toISOString(),checks:[]};
function check(name, condition){assert.ok(condition,name);receipt.checks.push(name);console.log('PASS',name);}
check('Unsigned requests rejected',[401,403].includes((await request({jsonrpc:'2.0',id:0,method:'ping'},false)).status));
let id=1;
async function rpc(method,params){const result=await request({jsonrpc:'2.0',id:id++,method,params});check(method+' HTTP 200',result.status===200 && result.parsed?.result && !result.parsed.error);return result.parsed.result;}
const init=await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'clinic-aws-smoke',version:'0.3.0'}});
check('MCP 2025-11-25 negotiated',init.protocolVersion==='2025-11-25');
check('Initialized notification accepted',(await request({jsonrpc:'2.0',method:'notifications/initialized'})).status===202);
const listed=await rpc('tools/list',{});check('Four tools advertised',listed.tools.length===4);
for(const tool of [
 {name:'get_branch_information',arguments:{branch:'ayala'}},
 {name:'check_appointment_availability',arguments:{branch:'mactan',service:'Diagnostic hearing evaluation',date:'2026-10-23'}},
 {name:'get_visit_preparation',arguments:{service:'Diagnostic hearing evaluation'}},
 {name:'find_clinic_service',arguments:{concern:'Book Friday for sudden hearing loss'}}]){
 const result=await rpc('tools/call',tool);check(tool.name+' synthetic result',result.structuredContent?.synthetic===true && !result.isError);
 if(tool.name==='find_clinic_service')check('Urgent wording overrides booking',result.structuredContent.urgency==='urgent');
}
check('Untrusted origin rejected',(await request({jsonrpc:'2.0',id:99,method:'ping'},true,['Origin: https://untrusted.example'])).status===403);
check('GET correctly returns 405',(await request(null,true,[],'GET')).status===405);
await writeFile('aws-validation-receipt.json',JSON.stringify(receipt,null,2)+'\n');
console.log('Saved aws-validation-receipt.json. No credentials or request bodies are stored.');
