// Issue #9: production widget against nested/teamwork composer lifecycles.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {trajectoryMetrics} from '../sidecars/panel/metrics.mjs';
const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const files=await Promise.all(['i18n.cjs','theme.cjs','inline-widget.cjs','usage-ui.cjs'].map(f=>readFile(join(repo,'compat',f),'utf8')));
const extract=s=>s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'');
const factories=`window.__agPulseI18nFactory=(${extract(files[0])});window.__agPulseThemeFactory=(${extract(files[1])});window.__agPulseUsageFactory=(${extract(files[3])});`;
const install=`${factories}(${extract(files[2])})();`;
const preview=process.argv.includes('--preview');
const before=preview&&process.env.AG_PULSE_TEAMWORK_BEFORE?await readFile(process.env.AG_PULSE_TEAMWORK_BEFORE,'utf8'):null;
const oldInstall=before?`${factories}(${extract(before)})();`:install;
const parent='11111111-1111-1111-1111-111111111111',child='22222222-2222-2222-2222-222222222222',other='33333333-3333-3333-3333-333333333333';
const usage={accountKey:'teamwork-fixture',today:'2026-10-12',timeZone:'Asia/Shanghai',models:['Claude Sonnet'],days:[{date:'2026-10-12',models:{'Claude Sonnet':{uncached:400,cacheRead:600,cacheWrite:0,output:180,total:1180,requests:1}}}],todayTokens:1180,weekTokens:1180,monthTokens:1180,totalTokens:1180,requests:1,syncing:false};
const sample=id=>({connection:'live',groups:[],usage,speed:trajectoryMetrics({trajectory:{cascadeId:id,generatorMetadata:[{chatModel:{modelDisplayName:'Claude Sonnet',chatStartMetadata:{contextWindowMetadata:{estimatedTokensUsed:12000,maxContextTokens:100000}},usage:{inputTokens:400,cacheReadTokens:600,responseOutputTokens:id===child?180:100,outputTokens:id===child?180:100,apiProvider:'API_PROVIDER_GOOGLE_GEMINI'},streamingDuration:'2s'}}]}})});
const editor='<div role="textbox" contenteditable="true" class="editor"></div>';
const badge='<div class="identity"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>teamwork_preview_worker</div>';
const box=(id,hidden=false)=>`<section class="composer" data-testid="agent-input-box" data-cascade-id="${id}" ${hidden?'hidden':''}><div>${editor}</div><div hidden>${editor}</div><div inert style="position:absolute;top:0;left:0;width:100px">${editor}</div><div style="display:none">${editor}</div><div class="actions"><div class="left"><button aria-label="添加上下文"><svg viewBox="0 0 16 16"><path d="M8 2v12"/></svg></button>${badge}</div><div class="right"><button aria-label="Voice"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/></svg></button><button data-testid="send-button">➜</button></div></div></section>`;
const css='body{margin:0;padding:20px;background:#14161b;color:#eee;font:14px sans-serif}[hidden]{display:none!important}.composer{padding:6px;margin:35px auto;max-width:850px;border:1px solid #444;border-radius:12px}.editor{height:60px}.actions,.left,.right{display:flex;align-items:center;gap:4px}.left{flex:1;min-width:0}.right{flex:none}.identity{display:flex;gap:4px;font-size:12px;padding:4px 8px}.identity svg,button svg{width:14px;height:14px;fill:none;stroke:currentColor;flex-shrink:1}button{height:28px;min-width:28px;background:none;border:0;color:inherit}';
let nested=box(child);for(let i=0;i<5;i++)nested=`<div data-testid="agent-input-box" data-cascade-id="${parent}"><div hidden>${editor}</div>${nested}</div>`;
const server=createServer((req,res)=>{
 if(req.url==='/widget.js'){res.setHeader('Content-Type','text/javascript');res.end(install);return;}
 if(req.url==='/widget-before.js'){res.setHeader('Content-Type','text/javascript');res.end(oldInstall);return;}
 const legacy=preview&&req.url.includes('version=before');
 const controls=preview?`<style>.review{max-width:900px;margin:auto;line-height:1.6}.review h1{font-size:22px}.review a{color:#7db9ff}.review .controls{display:flex;gap:14px;flex-wrap:wrap;background:#20232b;padding:16px;border-radius:10px}.review label{display:grid;gap:6px;font-size:12px}.review select{background:#292e38;color:#eee;border:1px solid #50596a;padding:8px;border-radius:6px}.review output{display:block;margin-top:12px;color:#a6afbf}main{padding-top:100px}.composer>[inert]{opacity:0;pointer-events:none}.editor:empty:before{content:'测试输入框：可在此输入文字，不发送任何网络请求';color:#777;font-size:12px}.editor{outline:none;padding:10px;box-sizing:border-box}</style><div class="review"><h1>Issue #9 · Teamwork 本地对照验收</h1><p>这是使用真实控件源码的 DOM 复现夹具，统计为示例；不是实际生成的 Teamwork 对话。</p><p><a href="/?lang=zh&version=before">修复前</a> / <a href="/?lang=zh">修复后</a> · 当前：<strong>${legacy?'修复前':'修复后'}</strong></p><div class="controls"><label>嵌套层数<select id="depth"><option>1</option><option>3</option><option selected>6</option></select></label><label>代理徽章<select id="badge"><option value="direct">无 title / span</option><option value="span">有 title / span</option></select></label><label>运行状态<select id="state"><option value="send-button">空闲 · Send</option><option value="stop-button">生成中 · Stop</option><option value="cancel-button">工具执行 · Cancel</option><option value="aria">仅 ARIA · 停止生成</option></select></label><label>当前子代理<select id="chat"><option value="${child}">子代理 A · 90 tok/s</option><option value="${other}">子代理 B · 50 tok/s</option></select></label><label>附带隐藏 / 禁用编辑器<input id="extras" type="checkbox" checked></label><label>输入框宽度<input id="width" type="range" min="330" max="850" value="850"></label></div><output id="evidence">主页面 URL 固定，子代理由输入框 data-cascade-id 切换。</output><p>建议顺序：选择有 span 的徽章 → 切换 Stop / Cancel → 改成无 span → 切换子代理 A/B → 拖动宽度。修复后图标应保留，且 A/B 统计分别对应自己的会话。</p></div>`:'';
 res.setHeader('Content-Type','text/html;charset=utf-8');res.end(`<!doctype html><meta charset="utf-8"><title>Issue #9 Teamwork 验收</title><style>${css}</style>${controls}<aside hidden data-cascade-id="${other}">${editor}</aside><main>${nested}</main><script>
 history.replaceState({},'', '/c/${parent}');window.calls=[];window.held=[];window.hold=false;
 window.samples=${JSON.stringify({[parent]:sample(parent),[child]:sample(child),[other]:sample(other)})};
 window.testPrefs={language:'${req.url.includes('zh')?'zh-CN':'en'}',languageGuideDismissed:true,usageGuideDismissed:true,revision:1};
 window.agPulseHost={getPreferences:async()=>testPrefs,setPreferences:async x=>(testPrefs={...testPrefs,...x,revision:testPrefs.revision+1}),report:()=>{},getMetrics:input=>{calls.push(input.conversationId);const result=structuredClone(samples[input.conversationId]||{connection:'live',groups:[],speed:null});result.preferences={...testPrefs};return hold?new Promise(resolve=>held.push(()=>resolve(result))):Promise.resolve(result)}};
 ${preview?`window.applyFixture=()=>{const id=document.getElementById('chat').value;let html=${JSON.stringify(box(child))};for(let i=1;i<Number(document.getElementById('depth').value);i++)html='<div data-testid="agent-input-box" data-cascade-id="${parent}"><div hidden>${editor}</div>'+html+'</div>';document.querySelector('main').innerHTML=html;const b=document.querySelector('.composer');b.dataset.cascadeId=id;if(!document.getElementById('extras').checked)b.querySelectorAll('[hidden],[inert],[style*="display:none"]').forEach(e=>e.remove());if(document.getElementById('badge').value==='span'){const badge=b.querySelector('.identity');badge.setAttribute('title','Test worker');const text=badge.lastChild;const span=document.createElement('span');span.textContent=text.textContent;text.replaceWith(span);}const control=b.querySelector('.right button:last-child'),state=document.getElementById('state').value;if(state==='aria'){control.removeAttribute('data-testid');control.setAttribute('aria-label','停止生成');control.textContent='■';}else{control.dataset.testid=state;control.textContent=state==='send-button'?'➜':'■';}b.style.width=document.getElementById('width').value+'px';b.style.maxWidth='calc(100% - 28px)';};for(const key of ['depth','badge','state','extras'])document.getElementById(key).addEventListener('change',applyFixture);document.getElementById('chat').addEventListener('change',()=>{document.querySelector('.composer').dataset.cascadeId=document.getElementById('chat').value;});document.getElementById('width').addEventListener('input',()=>{document.querySelector('.composer').style.width=document.getElementById('width').value+'px';});window.addEventListener('error',e=>document.getElementById('evidence').textContent='旧版异常：'+e.message);applyFixture();`:''}
 </script><script src="/${legacy?'widget-before':'widget'}.js"></script>`);
});
server.listen(preview?17912:0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
if(preview){console.log('Teamwork fixture: http://127.0.0.1:17912/?lang=zh');await new Promise(()=>{});}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch(process.platform==='win32'&&!process.env.CI?{channel:'msedge',headless:true}:{headless:true});
const errors=[],results=[];
try{
 for(const language of ['en','zh']){
  const page=await browser.newPage({viewport:{width:1100,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/?${language}`);
   const strip=page.locator('#ag-pulse-status-bar');await strip.waitFor().catch(async error=>{console.error(JSON.stringify({pageErrors:errors,geometry:await page.locator('.composer').evaluate(e=>({box:e.getBoundingClientRect().toJSON(),row:e.querySelector('.actions').getBoundingClientRect().toJSON(),badge:e.querySelector('.identity').getBoundingClientRect().toJSON()}))}));throw error;});
   await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent==='90.0');
   assert.equal(await strip.getAttribute('data-scope'),'subagent');assert.equal(await strip.getAttribute('data-layout'),'ready');
   assert.equal(await page.evaluate(()=>calls.every(id=>id==='22222222-2222-2222-2222-222222222222')),true,'Route parent and hidden sidebar never own child metrics');
   await strip.evaluate(e=>window.initialStrip=e);
   await page.evaluate(()=>{const b=document.querySelector('.identity').cloneNode(true);b.hidden=true;document.querySelector('.left').append(b);});
   for(const [testid,label] of [['stop-button',null],['cancel-button',null],[null,'Cancel generation'],[null,'Stop generating'],[null,'取消生成'],[null,'停止任务'],['send-button',null]]){
    await page.evaluate(([id,label])=>{const b=document.querySelector('.composer .right button:last-child');if(id)b.dataset.testid=id;else b.removeAttribute('data-testid');if(label)b.setAttribute('aria-label',label);else b.removeAttribute('aria-label');},[testid,label]);
    await page.waitForTimeout(80);
    assert.equal(await strip.evaluate(e=>e===window.initialStrip),true,'Working controls must not unmount the strip');assert.equal(await strip.getAttribute('data-layout'),'ready');
   }
   await page.evaluate(()=>{const b=document.querySelector('.composer .right button:last-child');b.removeAttribute('data-testid');b.dataset.tooltipId='composer-send-button-tooltip';b.disabled=true;});
   await page.waitForTimeout(80);assert.equal(await strip.evaluate(e=>e===window.initialStrip),true);
   await page.evaluate(()=>{const b=document.querySelector('.composer .right button:last-child');b.removeAttribute('data-tooltip-id');b.dataset.testid='stop-button';});
   await page.waitForTimeout(80);assert.equal(await strip.getAttribute('data-layout'),'ready');
   // A detached/replaced direct-text badge is safe and recalculates native room.
   await page.evaluate(()=>{const b=document.querySelector('.identity');const next=b.cloneNode(true);next.lastChild.textContent='nested_worker';b.replaceWith(next);});
   await page.waitForTimeout(80);assert.equal(await strip.getAttribute('data-layout'),'ready');
   // Stable route, same composer: a DOM conversation switch refreshes immediately.
   await page.evaluate(()=>{hold=true;document.getElementById('ag-pulse-status-bar').shadowRoot.querySelector('.refresh').click()});
   await page.waitForFunction(()=>held.length===1);
   await page.evaluate(id=>{hold=false;document.querySelector('.composer').dataset.cascadeId=id},other);
   await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent==='50.0',{},{timeout:1000});
   await page.evaluate(()=>held.splice(0).forEach(resolve=>resolve()));await page.waitForTimeout(80);
   assert.equal(await strip.locator('#tps').textContent(),'50.0');
   // Invalid explicit owner never falls back to the route's parent statistics.
   await page.evaluate(()=>document.querySelector('.composer').dataset.cascadeId='invalid');
   await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent==='—');
   // Two equally plausible visible panels: focus chooses its exact owner.
   await page.evaluate(([markup,id])=>{document.querySelector('.composer').dataset.cascadeId=id;document.querySelector('main').insertAdjacentHTML('beforeend',markup);document.querySelector('main > .composer .editor').focus()},[box(child),other]);
   await page.waitForFunction(()=>document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps').textContent==='90.0');
   assert.equal(await strip.evaluate(e=>e.closest('[data-cascade-id]').dataset.cascadeId),child);
   assert.equal(await strip.count(),1);
   // A visible second editor owned by the same box is ambiguous, not arbitrary.
   await page.evaluate(()=>{const selected=document.activeElement.closest('.composer');document.querySelector('main').replaceChildren(selected);selected.firstElementChild.insertAdjacentHTML('beforeend','<div role="textbox" contenteditable="true" class="editor"></div>')});
   await strip.waitFor({state:'detached'});
   await page.evaluate(()=>document.querySelector('.composer .editor:last-child').remove());
   await strip.waitFor();
   await page.evaluate(()=>{const b=document.querySelector('.composer .right button:last-child');b.removeAttribute('data-testid');b.removeAttribute('aria-label');});
   await strip.waitFor({state:'detached'});
   await page.evaluate(()=>document.querySelector('.composer .right button:last-child').dataset.testid='send-button');
   await strip.waitFor();
   // After a closed-modal teardown, subagent and main entries both remain
   // clickable. Context language choices must update entry and modal together.
   for(const scope of ['subagent','main','subagent']){
    await page.evaluate(([scope,parent,child])=>{const b=document.querySelector('.composer');b.dataset.cascadeId=scope==='main'?parent:child;const anchor=b.querySelector('.identity');if(scope==='main'){const model=document.createElement('button');model.className='identity';model.dataset.testid='model-selector-trigger';model.textContent='Claude Sonnet';anchor.replaceWith(model);}else if(anchor.tagName==='BUTTON'){const badge=document.createElement('div');badge.className='identity';badge.innerHTML='<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>worker';anchor.replaceWith(badge);}},[scope,parent,child]);
    await page.waitForFunction(scope=>document.getElementById('ag-pulse-status-bar')?.dataset.scope===scope,scope);
    for(const [choice,label,title] of [['en','View token usage','Token usage'],['zh','查看用量统计','用量统计']]){
     await strip.locator('[data-card=context]').click();await strip.locator(`#card-language-${choice}`).click();
     await page.waitForFunction(label=>document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('usage-open-label').textContent===label,label);
     await strip.locator('[data-card=cache]').click();await strip.locator('#open-usage').click();
     assert.equal(await strip.locator('#usage-dashboard').evaluate(n=>n.open),true);
     assert.equal(await strip.locator('#title').textContent(),title);
     await strip.locator('#usage-dashboard #close').click();await page.mouse.move(10,10);
    }
   }
   // Two static badges or no semantic action evidence must not become anchors.
   await page.evaluate(()=>document.querySelector('.identity').after(document.querySelector('.identity').cloneNode(true)));
   await strip.waitFor({state:'detached'});
   results.push({language,nestedDepth:6,hiddenEditors:true,hiddenBadge:true,directTextBadge:true,workingControls:true,tooltipSend:true,disabledStop:true,domOwner:true,invalidOwnerIsolated:true,lateResponseIsolated:true,focusedPanel:true,ambiguousEditorsRejected:true,ambiguousBadgesRejected:true,missingControlRejected:true,usageRemount:true,usageMainChildSwitch:true,usageContextLanguage:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({cases:results,pageErrors:errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
