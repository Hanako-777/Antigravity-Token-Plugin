// Exercise both production renderers against partial and regressing metadata.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {trajectoryMetrics} from '../sidecars/panel/metrics.mjs';
import {reconcileMetrics,safeMetrics} from '../sidecars/panel/history.mjs';
import {panelAppSource,panelPageSource} from '../sidecars/panel/panel-source.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const factories=['i18n','theme','inline-widget'].map(name=>require(join(root,'compat',name+'.cjs')).toString());
const install=`window.__agPulseI18nFactory=${factories[0]};window.__agPulseThemeFactory=${factories[1]};(${factories[2]})();`;
const read=file=>readFile(join(root,file),'utf8');
const id='11111111-1111-1111-1111-111111111111';
const request=(key,usage)=>({chatModel:{usage:{responseId:key,...usage},streamingDuration:'2s'}});
const known=request('known',{apiProvider:'API_PROVIDER_GOOGLE_GEMINI',inputTokens:'15578',cacheReadTokens:'11063',outputTokens:'880'});
const missing=Array.from({length:253},(_,i)=>request(`old-${i}`,{outputTokens:i===0?'89749':'0'}));
const sample=items=>trajectoryMetrics({trajectory:{cascadeId:id,generatorMetadata:items,steps:[]}});
const partial=sample([known,...missing]);
let language='en',speed=partial;
const preferences=()=>({language,languageGuideDismissed:true,revision:1});
const metrics=()=>({connection:'live',groups:[],speed});
const staticFiles={'/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/format.mjs':'format.mjs'};
const server=createServer(async(req,res)=>{
  try {
    const path=new URL(req.url,'http://localhost').pathname;
    let content,type='text/javascript';
    if(path==='/api/preferences'){content=JSON.stringify(preferences());type='application/json';}
    else if(path==='/api/metrics'){content=JSON.stringify(metrics());type='application/json';}
    else if(path==='/app.js')content=panelAppSource();
    else if(path==='/'){content=panelPageSource();type='text/html';}
    else if(path==='/i18n.js')content='export const createI18n='+factories[0];
    else if(path==='/theme.js')content='export const createTheme='+factories[1];
    else if(path==='/theme.css'){content=require(join(root,'compat/theme.cjs'))().css(':root');type='text/css';}
    else if(path==='/preload.js')content='';
    else if(path==='/inline-widget.js')content=install;
    else if(path==='/fixture'){content=await read('sidecars/panel/toolbar-preview.html');type='text/html';}
    else if(staticFiles[path]){content=await read('sidecars/panel/'+staticFiles[path]);type=path==='/'?'text/html':path.endsWith('.css')?'text/css':'text/javascript';}
    else {res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(content);
  }catch(error){res.writeHead(500);res.end(error.message);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const output=join(root,'.data','token-usage-ui');await mkdir(output,{recursive:true});
let browser;
const errors=[],results=[];
try {
  browser=await chromium.launch(process.platform==='win32'&&!process.env.CI?{channel:'msedge',headless:true}:{headless:true});
  const origin='http://127.0.0.1:'+server.address().port;
  for(const inline of [true,false])for(const lang of ['en','zh-CN']) {
    language=lang;speed=partial;
    const page=await browser.newPage({viewport:{width:1100,height:900}});
    page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto(origin+(inline?'/fixture':'/'));
      const scope=inline?page.locator('#ag-pulse-status-bar'):page.locator('body');
      await scope.locator('#cache-output').waitFor({state:'attached'});
      const expectText=async(id,text)=>{
        await page.waitForFunction(({inline,id,text})=>{
          const root=inline?document.getElementById('ag-pulse-status-bar')?.shadowRoot:document;
          return root?.getElementById(id)?.textContent===text;
        },{inline,id,text});
      };
      try{await expectText('cache-output','90,629 tok');}catch(error){
        console.log(JSON.stringify({inline,lang,errors,output:await scope.locator('#cache-output').textContent(),
          rate:await scope.locator(inline?'#rate-note':'#health-note').textContent(),
          note:await scope.locator('#cache-note').textContent()}));throw error;
      }
      await expectText('cache-coverage','117,270 tok');
      if(inline)await scope.locator('[data-card=cache]').hover();
      else await scope.locator('[data-card=cache]').click();
      await scope.locator('#cache-card').waitFor({state:'visible'});
      assert.equal(await scope.locator('#cache-note').isVisible(),false,'Compact cards do not display calculation/coverage explanations');
      assert.equal((await scope.locator('#cache-card').textContent()).includes('≥'),false,'Readable token counters have no repeated inequality prefixes');
      assert.equal(speed.tokens.missingInputRequests,253,'Removing UI notes must not erase coverage from statistics');
      const card=await scope.locator('#cache-card').boundingBox();
      assert.ok(card&&card.y>=0&&card.y+card.height<=900,'Partial-data explanation stays inside viewport');
      await page.screenshot({path:join(output,`${inline?'inline':'panel'}-${lang}.png`)});
      speed=sample([known,...missing,request('new',{outputTokens:'500'})]);
      await expectText('cache-output','91,129 tok');
      await expectText('cache-coverage','117,770 tok');
      speed=sample([request('output-only',{outputTokens:'200'})]);
      await expectText('cache-output','200 tok');
      await expectText('cache-miss','—');
      await expectText(inline?'cache-detail-rate':'cache-rate','—');
      speed=sample([request('zero',{outputTokens:'0'})]);
      await expectText('cache-output','0 tok');
      await expectText('cache-coverage','0 tok');
      const saved=sample([known]);
      const fresh=sample([request('known',{outputTokens:'880'}),request('new',{outputTokens:'500'})]);
      speed=reconcileMetrics(saved,{...fresh,measuredRequests:0},'2026-10-13T00:00:00Z');
      await expectText('cache-output','1,380 tok');
      await expectText('cache-coverage','1,380 tok');
      const legacy=structuredClone(partial);delete legacy.tokens;
      speed=safeMetrics(legacy,id);
      await expectText('cache-output','90,629 tok');
      await expectText('cache-coverage','117,270 tok');
      assert.equal(speed.tokens.coverageUnknown,true,'Legacy/corrupt records keep conservative coverage internally');
      const corrupt=sample([known]);corrupt.tokens.outputTokens=1.5;
      speed=safeMetrics(corrupt,id);
      await expectText('cache-output','—');
      await expectText('cache-coverage','26,641 tok');
      assert.equal(speed.tokens.coverageUnknown,true,'Legacy/corrupt records keep conservative coverage internally');
      speed=sample([request('zero-input',{apiProvider:'API_PROVIDER_GOOGLE_GEMINI',inputTokens:'0',outputTokens:'200'})]);
      await expectText('cache-coverage','200 tok');await expectText('cache-output','200 tok');
      await expectText('cache-miss','0 tok');await expectText('cache-read','0 tok');
      await expectText(inline?'cache-detail-rate':'cache-rate','—');
      assert.equal(speed.cache.hitRate,null,'A zero denominator stays unavailable, not a fabricated cache percentage');
      assert.equal(await scope.locator('#cache-note').isVisible(),false);
      speed=sample([request('partial-input',{apiProvider:'API_PROVIDER_GOOGLE_GEMINI',inputTokens:'100',cacheReadTokens:'invalid',outputTokens:'200'})]);
      await expectText('cache-coverage','300 tok');await expectText('cache-output','200 tok');
      await expectText('cache-miss','100 tok');await expectText('cache-read','—');
      speed=sample([request('cache-only',{apiProvider:'API_PROVIDER_GOOGLE_GEMINI',cacheReadTokens:'40',cacheWriteTokens:'5',outputTokens:'50'})]);
      await expectText('cache-coverage','95 tok');await expectText('cache-miss','—');
      await expectText('cache-read','40 tok');await expectText('cache-write','5 tok');
      await expectText('cache-output','50 tok');
      results.push({renderer:inline?'inline':'panel',language:lang,partial:true,continuedOutput:true,outputOnly:true,zero:true,independentHistory:true,legacyCoverage:true,corruptCounters:true,zeroInput:true,independentInput:true,cacheOnlyInput:true});
    }finally{await page.close();}
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({results,pageErrors:errors,screenshots:output},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
