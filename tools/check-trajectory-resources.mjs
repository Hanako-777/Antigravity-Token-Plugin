// Isolated, artificial local HTTP workload; never reads a user conversation.
import {createServer} from 'node:http';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {AntigravityClient} from '../sidecars/panel/client.mjs';
import {trajectoryMetrics} from '../sidecars/panel/metrics.mjs';
const corpusMiB=Number(process.argv[2]),n=Number(process.argv[3]),id='11111111-1111-1111-1111-111111111111';
const expectBudgetRejection=process.argv[4]==='--expect-budget-rejection';
assert.ok(process.argv.length<=5&&(!process.argv[4]||expectBudgetRejection),'Unknown option');
assert.ok(Number.isInteger(corpusMiB)&&corpusMiB>=0&&corpusMiB<=2048&&Number.isInteger(n)&&n>0&&n<=65536,'Usage: node --expose-gc tools/check-trajectory-resources.mjs <corpus MiB 0..2048> <requests 1..65536>');
const summary={stepCount:n+1,lastModifiedTime:'2026-10-13T01:00:00Z',status:'CASCADE_RUN_STATUS_IDLE'},calls=[],telemetry=[];
const step=i=>i===0?{type:'USER_INPUT'}:{type:'PLANNER_RESPONSE',plannerResponse:{response:'Fixture answer'}};
const gen=i=>({stepIndices:[i+1],chatModel:{modelDisplayName:'Fixture model',streamingDuration:'2s',timeToFirstToken:'1s',usage:{responseId:'fixture-'+i,inputTokens:100,cacheReadTokens:300,cacheWriteTokens:0,outputTokens:200,responseOutputTokens:200,apiProvider:'API_PROVIDER_GOOGLE_GEMINI'},chatStartMetadata:{createdAt:'2026-10-13T01:00:00Z',contextWindowMetadata:{estimatedTokensUsed:400,maxContextTokens:10000}}}});
const chunk='x'.repeat(64*1024),pageSize=256;
const server=createServer(async(req,res)=>{
 let body='';for await(const c of req)body+=c;const input=JSON.parse(body);const method=req.url.split('/').at(-1);calls.push({method,offset:input.stepOffset??input.generatorMetadataOffset??null});
 res.on('error',()=>{});res.writeHead(200,{'Content-Type':'application/json'});
 try{
  if(method==='GetAllCascadeTrajectories'){res.end(JSON.stringify({trajectorySummaries:{[id]:summary}}));return;}
  if(method==='GetCascadeTrajectorySteps'){
   const start=input.stepOffset,end=Math.min(n+1,start+pageSize);
   if(start===0){
    res.write('{"steps":[{"type":"USER_INPUT","userInput":{"text":"');
    for(let i=0;i<corpusMiB*16;i++)if(!res.write(chunk))await once(res,'drain');
    res.end('"}}'+Array.from({length:end-1},(_,j)=>','+JSON.stringify(step(j+1))).join('')+']}');
   }else res.end(JSON.stringify({steps:Array.from({length:Math.max(0,end-start)},(_,j)=>step(start+j))}));return;
  }
  assert.equal(method,'GetCascadeTrajectoryGeneratorMetadata');assert.equal(input.includeMessages,false);
  const start=input.generatorMetadataOffset;res.end(JSON.stringify({generatorMetadata:Array.from({length:Math.max(0,Math.min(pageSize,n-start))},(_,j)=>gen(start+j))}));
 }catch(e){res.destroy(e);}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const client=new AntigravityClient({onRpc:s=>telemetry.push(s),paths:()=>({log:'fixture'}),readLog:async()=>`listening on random port at ${port} for HTTP\n`,processes:async()=>[{ProcessId:42,CommandLine:'language_server --standalone --csrf_token=fixture',Ports:[port]}]});
global.gc?.();const before=process.memoryUsage();let peakHeap=before.heapUsed,peakRss=before.rss;
const sample=setInterval(()=>{const m=process.memoryUsage();peakHeap=Math.max(peakHeap,m.heapUsed);peakRss=Math.max(peakRss,m.rss);},25);
try{
 const started=performance.now(),r=await client.trajectory(id),ms=performance.now()-started,m=trajectoryMetrics(r);
 assert.ok(!expectBudgetRejection,'Expected memory-budget rejection, but the workload succeeded');
 const lastMemory=process.memoryUsage();peakHeap=Math.max(peakHeap,lastMemory.heapUsed);peakRss=Math.max(peakRss,lastMemory.rss);
 assert.equal(m.requests,n);assert.equal(m.tps,100);assert.equal(m.cache.hitRate,.75);assert.equal(m.context.usedFraction,.04);assert.equal(m.counts.input,n*100);assert.equal(m.counts.output,n*200);
 assert.ok(!calls.some(c=>c.method==='GetCascadeTrajectory'));
 const bytes=telemetry.reduce((a,b)=>a+b.bytes,0),coldCalls=calls.length;telemetry.length=0;calls.length=0;await client.trajectory(id);assert.ok(calls.every(c=>c.method==='GetAllCascadeTrajectories'));
 const heapIncrease=peakHeap-before.heapUsed;assert.ok(heapIncrease<client.reader.budgetBytes*4+16*1024*1024,'Retained memory must remain within the declared engineering budget margin');
 console.log(JSON.stringify({corpusMiB,requests:n,coldReadMs:Math.round(ms),receivedBytes:bytes,coldCalls,idleRepeatCalls:calls.length,serializedCacheBytes:client.reader.cachedBytes,heapBefore:before.heapUsed,sampledPeakHeap:peakHeap,sampledHeapIncrease:heapIncrease,sampledPeakRss:peakRss,runtimePeakRssKiB:process.resourceUsage().maxRSS,numericParity:true}));
}catch(e){if(!expectBudgetRejection||!/内存预算|采集上限/.test(e.message))throw e;assert.equal(client.reader.entries.size,0);assert.equal(client.reader.cachedBytes,0);console.log(JSON.stringify({corpusMiB,requests:n,budgetRejected:true,error:e.message,cachedEntries:client.reader.entries.size,cachedBytes:client.reader.cachedBytes}));
}finally{clearInterval(sample);server.closeAllConnections();await new Promise(r=>server.close(r));}
