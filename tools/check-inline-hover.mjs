// Load the production widget: copying its timer functions would miss DOM and
// top-layer lifecycle failures when the host removes/replaces its composer.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';

const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const factories=['i18n','theme','inline-widget'].map(name=>require(join(repo,'compat',`${name}.cjs`)).toString());
const install=`window.__agPulseI18nFactory=${factories[0]};window.__agPulseThemeFactory=${factories[1]};(${factories[2]})();`;
const html=await readFile(join(repo,'sidecars','panel','toolbar-preview.html'),'utf8');
const conversation='11111111-1111-1111-1111-111111111111';
const preferences={language:'en',languageGuideDismissed:true,revision:1};
const metrics={connection:'live',groups:[],speed:{conversationId:conversation,counts:{},cache:null,context:null}};
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!['/fixture','/inline-widget.js','/api/preferences','/api/metrics'].includes(path)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':path==='/fixture'?'text/html;charset=utf-8':path==='/inline-widget.js'?'text/javascript':'application/json'});
  res.end(path==='/fixture'?html:path==='/inline-widget.js'?install:JSON.stringify(path==='/api/preferences'?preferences:metrics));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
let browser;
const results=[],errors=[];
const host=page=>page.locator('#ag-pulse-status-bar');
const chip=(page,name)=>host(page).locator(`[data-card=${name}]`);
const card=(page,name)=>host(page).locator(`#${name}-card`);
const outside=page=>page.mouse.move(10,700);
async function check(name,run,{realTimers=false}={}){
  const page=await browser.newPage({viewport:{width:1100,height:850}});
  page.on('pageerror',error=>errors.push({case:name,message:error.message}));
  try{
    // Install before the widget registers timers/rAF callbacks. Replacing the
    // clock after mount can strand a native layout callback on macOS Chromium.
    if(!realTimers){await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));}
    await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
    await chip(page,'speed').waitFor();
    if(!realTimers)await page.clock.runFor(32);
    await run(page);
    assert.deepEqual(errors,[],'Production widget must not throw browser errors');
    results.push(name);
  }finally{await page.close();}
}
try{
  browser=await chromium.launch(process.platform==='win32'&&!process.env.CI?{channel:'msedge',headless:true}:{headless:true});
  await check('cold hover waits exactly 250ms',async page=>{
    await chip(page,'speed').hover();assert.equal(await card(page,'speed').isVisible(),false);
    await page.clock.runFor(249);assert.equal(await card(page,'speed').isVisible(),false);
    await page.clock.runFor(1);assert.equal(await card(page,'speed').isVisible(),true);
  });
  await check('leaving before the delay cancels opening',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await outside(page);await page.clock.runFor(500);assert.equal(await card(page,'speed').isVisible(),false);
  });
  await check('switching cold chips cancels the previous timer',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await chip(page,'cache').hover();await page.clock.runFor(150);
    assert.equal(await card(page,'speed').isVisible(),false);assert.equal(await card(page,'cache').isVisible(),false);
    await page.clock.runFor(100);assert.equal(await card(page,'cache').isVisible(),true);
  });
  await check('warm switching and chip/card crossings remain immediate and stable',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(250);
    await chip(page,'cache').hover();assert.equal(await card(page,'cache').isVisible(),true);assert.equal(await card(page,'speed').isVisible(),false);
    await card(page,'cache').hover();await page.clock.runFor(500);assert.equal(await card(page,'cache').isVisible(),true);
    await chip(page,'context').hover();assert.equal(await card(page,'context').isVisible(),true);
    await outside(page);await page.clock.runFor(119);assert.equal(await card(page,'context').isVisible(),true);
    await page.clock.runFor(1);assert.equal(await card(page,'context').isVisible(),false);
  });
  for(const elapsed of [349,350,400])await check(`warm window expires 350ms after leaving (${elapsed}ms)`,async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(250);
    await outside(page);await page.clock.runFor(elapsed);await chip(page,'context').hover();
    assert.equal(await card(page,'context').isVisible(),elapsed<350);
    if(elapsed>=350){await page.clock.runFor(249);assert.equal(await card(page,'context').isVisible(),false);await page.clock.runFor(1);assert.equal(await card(page,'context').isVisible(),true);}
  });
  await check('click and keyboard focus bypass the delay',async page=>{
    await chip(page,'speed').click();assert.equal(await card(page,'speed').isVisible(),true);
    await page.keyboard.press('Escape');assert.equal(await card(page,'speed').isVisible(),false);
    await chip(page,'context').focus();assert.equal(await card(page,'context').isVisible(),true);
  });
  for(const dismissal of ['Escape','outside click'])await check(`${dismissal} resets warm state`,async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(250);
    if(dismissal==='Escape')await page.keyboard.press('Escape');else await page.mouse.click(10,700);
    await chip(page,'context').hover();assert.equal(await card(page,'context').isVisible(),false);
    await page.clock.runFor(250);assert.equal(await card(page,'context').isVisible(),true);
  });
  await check('blocked layout cancels a pending popup',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    const width=await host(page).evaluate(node=>{
      node.style.flex='0 0 40px';node.style.maxWidth='40px';
      const width=node.getBoundingClientRect().width;
      // Exercise the production resize listener under the same clock; native
      // ResizeObserver delivery is asynchronous and not driven by runFor().
      window.dispatchEvent(new Event('resize'));
      return width;
    });
    assert.ok(width>0&&width<=40,'The fixture must actually constrain the strip to 40px');
    await page.clock.runFor(16);assert.equal(await host(page).getAttribute('data-layout'),'blocked');
    await page.clock.runFor(500);assert.equal(await host(page).getAttribute('data-layout'),'blocked');assert.equal(await card(page,'speed').isVisible(),false);
  });
  await check('navigation rejects an old pending popup before the next heartbeat',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await page.evaluate(()=>history.pushState({},'', '/c/22222222-2222-2222-2222-222222222222'));
    await page.clock.runFor(150);assert.equal(await card(page,'speed').isVisible(),false);
  });
  await check('detached composer cancels pending work and recovers after remount',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await page.evaluate(()=>{window.savedComposer=document.querySelector('.rounded-composer');window.savedComposer.remove();});
    await page.clock.runFor(500);assert.equal(await host(page).count(),0);
    // Restoring a control under a stationary pointer can legitimately emit a
    // new pointerenter. Isolate cancellation of the removed control's timer.
    await outside(page);
    await page.evaluate(()=>document.body.append(window.savedComposer));await page.clock.runFor(1000);
    assert.equal(await host(page).count(),1);assert.equal(await card(page,'speed').isVisible(),false);
    await outside(page);
    await chip(page,'speed').hover();assert.equal(await card(page,'speed').isVisible(),false);
    await page.clock.runFor(250);assert.equal(await card(page,'speed').isVisible(),true);
  });
  await check('replacement editor does not inherit a pending hover',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await page.evaluate(()=>{const editor=document.querySelector('.editor');editor.replaceWith(editor.cloneNode(true));});
    await page.clock.runFor(500);assert.equal(await card(page,'speed').isVisible(),false);
  });
  await check('disposal cancels pending work',async page=>{
    await chip(page,'speed').hover();await page.clock.runFor(100);
    await page.evaluate(()=>window.__agPulseDispose());await page.clock.runFor(500);assert.equal(await host(page).count(),0);
  });
  await check('detachment with native browser timers has no popover exception',async page=>{
    // Same reproducer that failed on PR c8a26a4, without a mocked clock.
    await chip(page,'speed').hover();await page.evaluate(()=>document.querySelector('.rounded-composer').remove());
    await page.waitForTimeout(350);assert.equal(await host(page).count(),0);
  },{realTimers:true});
  console.log(JSON.stringify({cases:results,pageErrors:errors},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
