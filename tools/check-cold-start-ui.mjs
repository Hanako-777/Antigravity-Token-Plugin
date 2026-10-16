// Real Chromium/CDP lifecycle test, with synthetic local metrics only.
import {createServer} from 'node:http';
import {readFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {RuntimeUi,makeRendererSource} from '../compat/runtime-ui.mjs';
import {trajectoryMetrics} from '../sidecars/panel/metrics.mjs';
const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const sources=await Promise.all(['i18n.cjs','inline-widget.cjs','theme.cjs','usage-ui.cjs'].map(f=>readFile(join(repo,'compat',f),'utf8')));
const extract=s=>s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'');
const composer=`<div class="rounded-composer"><div role="combobox" aria-label="Message input" contenteditable="true" class="editor"></div><div class="actions"><div class="left"><button aria-label="Add context">+</button><button data-testid="model-selector-trigger">Gemini</button></div><div class="right"><button aria-label="Send message">→</button></div></div></div>`;
const html=`<!doctype html><meta charset="utf-8"><style>body{background:#181a1f;color:#eee;font:14px sans-serif}.rounded-composer{margin:200px auto;width:900px;padding:12px;background:#27292f}.editor{height:70px}.actions,.left,.right{display:flex;align-items:center;gap:6px}.left{flex:1;min-width:0}button{color:inherit;background:none;border:0;height:28px}</style><body><script>setTimeout(()=>document.body.insertAdjacentHTML('beforeend',${JSON.stringify(composer)}),400);</script>`;
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=await mkdtemp(join(tmpdir(),'ag-cold-start-'));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
let context,ui;const errors=[],checks=[];
try{
 context=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:1280,height:800},args:['--remote-debugging-port=0'],...(process.platform==='win32'&&!process.env.CI?{channel:'msedge'}:{})});
 const page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.address().port}`;
 await page.goto(base+'/c/11111111-1111-1111-1111-111111111111',{waitUntil:'domcontentloaded'});
 const prefs={language:'en',languageGuideDismissed:true,revision:1};
 ui=new RuntimeUi({profile,interval:100,source:makeRendererSource(sources[0],sources[1],sources[2],null,0,`window.__agPulseUsageFactory=(${extract(sources[3])});`),
  preferences:{get:async()=>prefs,set:async x=>Object.assign(prefs,x)},snapshot:async input=>({connection:'live',groups:[],preferences:prefs,speed:trajectoryMetrics({trajectory:{cascadeId:input.conversationId,generatorMetadata:[{chatModel:{streamingDuration:'2s',usage:{inputTokens:100,outputTokens:100,responseOutputTokens:100},chatStartMetadata:{contextWindowMetadata:{estimatedTokensUsed:1000,maxContextTokens:100000}}}}]}})})});
 ui.start();
 for(let i=0;i<Number(process.env.AG_PULSE_NAV_ROUNDS||5);i++){
  if(i){
   // Interrupt one initial navigation with a second, then let its DOM settle.
   const first=page.goto(base+`/loading?round=${i}`).catch(()=>{});
   await page.goto(base+'/c/'+(i%2?'22222222-2222-2222-2222-222222222222':'11111111-1111-1111-1111-111111111111'),{waitUntil:'domcontentloaded'});await first;
  }
  await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent==='50.0',null,{timeout:15000}).catch(async error=>{
   console.error(JSON.stringify({round:i,health:ui.health,pageErrors:errors,contexts:[...ui.sessions.values()].map(c=>({frame:c.frameId,contexts:[...c.contexts],candidates:[...c.contextCandidates]})),dom:await page.evaluate(()=>({path:location.pathname,mounted:Boolean(document.getElementById('ag-pulse-status-bar')),bridge:Boolean(window.agPulseHost),installed:window.__agPulseInlineInstalled,tps:document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent}))}));throw error;
  });
  const bridge=await page.evaluate(async()=>{const id=location.pathname.split('/').pop(),data=await agPulseHost.getMetrics({conversationId:id});return {live:data.connection==='live',own:data.speed?.conversationId===id,widgets:document.querySelectorAll('#ag-pulse-status-bar').length};});
  assert.deepEqual(bridge,{live:true,own:true,widgets:1});checks.push({round:i,...bridge});
 }
 await mkdir(join(repo,'.data/cold-start'),{recursive:true});await page.screenshot({path:join(repo,'.data/cold-start/chromium-navigation.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({delayedComposer:true,initialNavigationInterruptions:true,withoutDisableEnable:true,checks,pageErrors:errors}));
}finally{
 await ui?.stop();await context?.close();await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true});
}
