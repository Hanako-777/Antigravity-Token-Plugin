// A large single JSONL string exercises the real optional file reader. The
// corpus is generated in chunks and contains no user data.
import {mkdtemp,mkdir,open,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import {TranscriptReader} from '../sidecars/panel/transcript.mjs';
const root=await mkdtemp(join(tmpdir(),'ag-transcript-resource-'));
const id='11111111-1111-1111-1111-111111111111',scope='a'.repeat(64),created='2026-10-14T00:00:00.000Z';
const directory=join(root,id,'.system_generated','logs');await mkdir(directory,{recursive:true});
const file=await open(join(directory,'transcript_full.jsonl'),'w');
try{
 await file.write(`{"step_index":0,"type":"PLANNER_RESPONSE","created_at":"${created}","content":"`);
 const chunk='x'.repeat(1024*1024);for(let i=0;i<40;i++)await file.write(chunk);
 await file.write('","tool_calls":[{"arguments":"'+chunk+'"}]}\n');
}finally{await file.close();}
global.gc?.();const baseline=process.memoryUsage().heapUsed;
let peak=baseline,beats=0,maxGap=0,last=performance.now();
const timer=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;beats++;peak=Math.max(peak,process.memoryUsage().heapUsed);},1);
try{
 const reader=new TranscriptReader({root}),raw={trajectory:{steps:[{type:'PLANNER_RESPONSE',metadata:{createdAt:created}}]}};
 let stats,passes=0;const start=performance.now();
 do{reader.request(scope,id,raw);await reader.idle();stats=reader.peek(scope,id);passes++;assert.ok(passes<100);}while(!stats.complete);
 global.gc?.();const retained=process.memoryUsage().heapUsed-baseline;
 assert.equal(stats.totalTokens,40*1024*1024/4);assert.equal(stats.matchedSteps,1);
 assert.ok(passes>1);assert.ok(beats>0);assert.ok(retained<16*1024*1024,`Retained heap: ${retained}`);
 assert.ok(peak-baseline<96*1024*1024,`Peak extra heap: ${peak-baseline}`);
 console.log(JSON.stringify({syntheticTranscriptMiB:41,passes,eventLoopTicks:beats,maxEventLoopGapMs:Math.round(maxGap),elapsedMs:Math.round(performance.now()-start),peakExtraHeapMiB:+((peak-baseline)/1024/1024).toFixed(2),retainedHeapMiB:+(retained/1024/1024).toFixed(2),textEstimate:stats.totalTokens}));
}finally{clearInterval(timer);await rm(root,{recursive:true,force:true});}
