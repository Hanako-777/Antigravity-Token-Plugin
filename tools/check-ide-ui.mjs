// Real browser regression for the IDE's CSP, native topology and resize flow.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {trajectoryMetrics} from '../sidecars/panel/metrics.mjs';
const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const sources=await Promise.all(['compat/i18n.cjs','compat/theme.cjs','compat/inline-widget.cjs','ide/surface.cjs'].map(f=>readFile(join(repo,f),'utf8')));
const extract=s=>s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'');
const id='11111111-1111-1111-1111-111111111111',other='22222222-2222-2222-2222-222222222222';
const html=`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="script-src 'unsafe-inline'; style-src 'unsafe-inline'; require-trusted-types-for 'script'; trusted-types 'none'"><style>
body{margin:0;background:#202124;color:#eee;font:12px Arial}.panel{width:100%;box-sizing:border-box;padding:16px}.box{border-radius:16px;background:#292a2d;padding:4px}.editor{height:40px;padding:8px;box-sizing:border-box}.row{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:2px}.native{display:flex;flex:1;min-width:0;align-items:center;gap:1px}.model-wrap{display:flex;min-width:0;gap:4px}.model{display:flex;min-width:0;max-width:100%;align-items:center;padding:0 4px 0 8px;gap:4px;height:28px}.model span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.model svg{width:14px;height:14px}.protected{flex:none;width:28px;height:28px;border:0;color:inherit;background:transparent}.controls{display:flex;flex:none;gap:4px}button{color:inherit;background:transparent;border:0}.top{height:330px}
</style></head><body><div class="antigravity-agent-side-panel panel"><div class="top"></div><div id="conversation" role="region"><div id="antigravity.agentSidePanelInputBox" class="box"><div class="editor" contenteditable="true" role="combobox" aria-label="Message input"></div><div class="row"><div class="native"><button class="protected">＋</button><input hidden><div class="model-wrap"><button class="model" data-testid="model-selector-trigger"><span>Gemini 3.8 Flash High</span><svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg></button></div></div><div class="controls"><button class="protected">♩</button><button class="protected">➤</button></div></div></div></div></div><script>
const box=document.getElementById('antigravity.agentSidePanelInputBox'),panel=document.querySelector('.panel');
const owner={props:{cascadeId:${JSON.stringify(id)}},__k:[]},vnode={type:'div',__e:box,props:{id:box.id},__:owner,__k:[]};owner.__k=[vnode];panel.__k=owner;
window.testOwner=owner;window.metricsRequests=[];window.testTps=166.6;window.testQuality=null;window.testPreferences={language:'en',languageGuideDismissed:true,revision:1};
const windows={'5h':{remaining:.8,available:true,resetAt:new Date(Date.now()+3600000).toISOString()},weekly:{remaining:.6,available:true,resetAt:new Date(Date.now()+86400000).toISOString()}};
window.agPulseHost={getPreferences:async()=>testPreferences,setPreferences:async input=>(testPreferences={...testPreferences,...input,revision:testPreferences.revision+1}),getMetrics:async input=>{metricsRequests.push(input.conversationId);return {connection:'live',preferences:testPreferences,groups:[{id:'gemini',name:'Gemini',windows},{id:'3p',name:'Claude / GPT',windows}],quotaUpdatedAt:'2026-10-10T00:00:00Z',speed:input.conversationId?{conversationId:input.conversationId,tps:testTps,rounds:2,steps:7,counts:{responseOutput:6000,thinkingOutput:2000},transcriptStats:{version:1,status:'partial',complete:false,userTokens:100,assistantTokens:200,toolTokens:50,systemTokens:10,totalTokens:360,matchedSteps:4,compactionMarkers:1,imageSteps:0},cache:{hitRate:.45,totalTokens:53000,measuredRequests:2},context:{usedFraction:.14,remainingFraction:.86,usedTokens:140000,maxTokens:1000000,model:'Gemini'}}:null};}};
window.__agPulseSurface=(${extract(sources[3])})();window.__agPulseI18nFactory=(${extract(sources[0])});window.__agPulseThemeFactory=(${extract(sources[1])});(${extract(sources[2])})();
</script></body></html>`;
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch(process.platform==='win32'&&!process.env.CI?{channel:'msedge',headless:true}:{headless:true});
const page=await browser.newPage({viewport:{width:430,height:800}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>{
 const n=document.getElementById('ag-pulse-status-bar'),r=n?.getBoundingClientRect(),root=n?.shadowRoot,m=document.querySelector('[data-testid="model-selector-trigger"]');
 return {density:n?.dataset.density,layout:n?.dataset.layout,display:n?getComputedStyle(n).display:null,lang:n?.lang,id:window.__agPulseSurface.conversationId(window.__agPulseSurface.findComposer()),tps:root?.getElementById('tps')?.textContent,modelTruncated:m?.querySelector('span').scrollWidth>m?.querySelector('span').clientWidth+1,icons:[...root?.querySelectorAll('[data-card]')||[]].map(e=>({hidden:e.hidden,width:e.getBoundingClientRect().width})),rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};
});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForTimeout(1300);
 assert.deepEqual(errors,[],'IDE template must work under the host Trusted Types policy');
 let narrow=await state();assert.equal(narrow.id,id);assert.equal(narrow.density,'icons');assert.equal(narrow.layout,'ready');assert.equal(narrow.tps,'166.6');assert.equal(narrow.modelTruncated,false);assert.equal(narrow.icons.filter(e=>!e.hidden&&e.width===24).length,3);
 for(const card of ['speed','cache','context']){await page.locator(`[data-card=${card}]`).click();await page.waitForTimeout(150);assert.ok(await page.locator(`#${card}-card`).isVisible());await page.keyboard.press('Escape');}
 await page.setViewportSize({width:960,height:800});await page.waitForTimeout(400);let wide=await state();assert.equal(wide.density,'full');assert.equal(wide.layout,'ready');assert.equal(wide.modelTruncated,false);
 await page.setViewportSize({width:430,height:800});await page.waitForTimeout(350);assert.equal((await state()).density,'icons');
 await page.setViewportSize({width:245,height:800});await page.waitForTimeout(350);const tiny=await state();assert.equal(tiny.rect.width,0);assert.equal(tiny.layout,'blocked');
 await page.setViewportSize({width:430,height:800});await page.waitForTimeout(350);assert.equal((await state()).layout,'ready');
 // Keep a constrained, scrolled card open across multiple real polling ticks.
 // Identical preferences must not replace its labels or oscillate maxHeight.
 await page.locator('[data-card=context]').click();
 assert.equal(await page.locator('#transcript-details,#context-host-limit,#context-provider-limit,#context-compaction-limit,#context-note').count(),0);
 const stable=await page.evaluate(async()=>{
   const root=document.getElementById('ag-pulse-status-bar').shadowRoot,card=root.getElementById('context-card');
   card.scrollTop=80;const scroll=card.scrollTop,rect=card.getBoundingClientRect().toJSON(),requests=metricsRequests.length;
   const changes=[],samples=[];const observer=new MutationObserver(records=>{for(const record of records){const id=record.target.id;if(!['five-countdown','week-countdown','five-timer','week-timer'].includes(id))changes.push({id,attribute:record.attributeName,type:record.type});}});
   observer.observe(root,{subtree:true,childList:true,attributes:true});
   const sample=()=>{samples.push(card.scrollTop);};const timer=setInterval(sample,16);
   await new Promise(r=>setTimeout(r,6500));clearInterval(timer);observer.disconnect();
   return {scroll,rect,finalRect:card.getBoundingClientRect().toJSON(),maxScrollDelta:Math.max(...samples.map(s=>Math.abs(s-scroll))),changes,polls:metricsRequests.length-requests,open:card.matches(':popover-open')};
 });
 assert.ok(stable.scroll>0,'Fixture must actually clip and scroll the card');assert.ok(stable.polls>=2);assert.equal(stable.maxScrollDelta,0);assert.deepEqual(stable.finalRect,stable.rect);assert.deepEqual(stable.changes,[]);assert.equal(stable.open,true);
 await page.locator('.group-trigger').click();await page.waitForTimeout(3300);assert.ok(await page.locator('.group-menu').isVisible());await page.locator('[data-group="3p"]').click();
 await page.evaluate(()=>{testTps=200;});await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('tps').textContent==='200.0');
 await page.evaluate(()=>{const original=agPulseHost.getMetrics;agPulseHost.getMetrics=async input=>{const data=await original(input);return {...data,speed:data.speed&&testQuality?{...data.speed,...testQuality,conversationId:data.speed.conversationId}:data.speed};};});
 const quality=trajectoryMetrics({trajectory:{generatorMetadata:[{stepIndices:[0],chatModel:{usage:{outputTokens:17776,responseOutputTokens:17776},streamingDuration:.349271,timeToFirstToken:106}}],steps:[{type:'CORTEX_STEP_TYPE_PLANNER_RESPONSE',plannerResponse:{toolCalls:[{}]}}]}});
 await page.evaluate(quality=>{testQuality=quality;},quality);
 await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('latest-rate').textContent==='Timing uncertain');
 await page.keyboard.press('Escape');await page.locator('[data-card=speed]').click();
 assert.equal(await page.locator('#rate-note').textContent(),'Calculation: response tokens ÷ streaming time; session TPS is time-weighted.');
 assert.equal(await page.locator('#tps').textContent(),'—');
 await page.screenshot({path:join(repo,'.data/ide/tps-quality-en.png')});
 await page.evaluate(()=>{testQuality=null;});
 await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('tps').textContent==='200.0');
 await page.keyboard.press('Escape');
 await page.locator('[data-card=context]').click();await page.locator('#card-language-zh').click();await page.waitForTimeout(150);assert.equal((await state()).lang,'zh-CN');assert.equal(await page.locator('#transcript-details').count(),0);await page.keyboard.press('Escape');
 await page.evaluate(quality=>{testQuality=quality;},quality);
 await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('latest-rate').textContent==='计时异常');
 await page.locator('[data-card=speed]').click();assert.equal(await page.locator('#rate-note').textContent(),'统计方式：正文 Token ÷ 流式时长；会话 TPS 按总时长加权。');
 await page.screenshot({path:join(repo,'.data/ide/tps-quality-zh.png')});await page.keyboard.press('Escape');await page.evaluate(()=>{testQuality=null;});
 // A different child/subagent/history ID must never win over the input owner.
 await page.evaluate(other=>{const decoy={props:{cascadeId:other},__k:[]};testOwner.__k.unshift(decoy);},other);
 assert.equal((await state()).id,id);
 await page.evaluate(()=>{testOwner.props.cascadeId=null;});await page.waitForTimeout(1400);assert.equal((await state()).id,null);assert.equal((await state()).tps,'—');assert.equal((await state()).icons.filter(e=>!e.hidden).length,3);
 assert.equal(await page.locator('#context-summary').textContent(),'尚无请求');assert.equal(await page.locator('#five-balance').textContent(),'80.0%');
 await page.evaluate(other=>{testOwner.props.cascadeId=other;},other);await page.waitForTimeout(1400);assert.equal((await state()).id,other);
 await page.evaluate(()=>{delete document.querySelector('.panel').__k;});await page.waitForTimeout(1400);assert.equal((await state()).id,null);assert.equal((await state()).tps,'—');
 assert.equal(await page.evaluate(()=>window.__agPulseSurface.conversationState(window.__agPulseSurface.findComposer()).status),'unavailable');assert.equal(await page.locator('#context-summary').textContent(),'上下文容量不可用');
 assert.deepEqual(errors,[]);results.push({trustedTypesEnforced:true,narrow,wide,cardsInteractive:true,nativeModelPreserved:true,stablePolling:stable,emptyAndSwitchedConversationsIsolated:true,missingPrivateAPIUnavailable:true});
 await mkdir(join(repo,'.data/ide'),{recursive:true});await writeFile(join(repo,'.data/ide/ui-report.json'),JSON.stringify({results,pageErrors:errors},null,2));console.log(JSON.stringify({results,pageErrors:errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
