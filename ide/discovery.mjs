import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {parseNetstat,parseLsof,linuxPorts} from '../sidecars/panel/discovery.mjs';
const exec=promisify(execFile);
export const ideServer=row=>/^language_server_(?:windows|linux|macos)_(?:x64|arm|arm64)(?:\.exe)?$/i.test(row.Name||'')
  && /(?:^|\s)--subclient_type(?:=|\s+)"?ide(?:"|\s|$)/.test(row.CommandLine||'')
  && !/(?:^|\s)--enable_lsp(?:\s|=|$)/.test(row.CommandLine||'');
export const ideRoot=row=>/^(?:Antigravity IDE(?:\.exe)?|antigravity-ide)$/i.test(row.Name||'')
  && !/(?:^|[\s"])--(?:type|utility-sub-type)(?:[=\s"]|$)/i.test(row.CommandLine||'');

export function selectIdeServer(rows,portOwners,debugPort) {
  if(!Number.isInteger(debugPort)||debugPort<1||debugPort>65535)throw Error('Invalid IDE renderer port');
  const value=portOwners.get(debugPort);
  const pids=new Set(value instanceof Set||Array.isArray(value)?value:value===undefined?[]:[value]);
  const roots=rows.filter(r=>pids.has(r.ProcessId)&&ideRoot(r));
  if(!roots.length)throw Error('IDE renderer port does not belong to Antigravity IDE');
  if(roots.length!==1)throw Error('Multiple Antigravity IDE instances own the renderer port');
  const root=roots[0];
  const candidates=rows.filter(r=>ideServer(r)&&r.ParentProcessId===root.ProcessId);
  if(candidates.length!==1)throw Error('Waiting for the IDE main language server');
  return {...candidates[0],rootPid:root.ProcessId};
}

export async function discoverIdeProcesses(debugPort,{platform=process.platform,run=exec,uid=process.getuid?.(),linuxPort=linuxPorts}={}) {
  let rows,ports;
  if(platform==='win32'){
    const script="Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(Antigravity IDE|language_server_windows_(x64|arm|arm64))\\.exe$' } | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress";
    const r=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:8000,maxBuffer:2097152});
    const parsed=r.stdout.trim()?JSON.parse(r.stdout.replace(/^\uFEFF/,'')):[];rows=Array.isArray(parsed)?parsed:[parsed];
    ports=parseNetstat((await run('netstat.exe',['-ano','-p','tcp'],{windowsHide:true,timeout:4000,maxBuffer:4194304})).stdout);
  }else{
    const {stdout}=await run('/bin/ps',['-ww','-axo','pid=,ppid=,uid=,args='],{timeout:8000,maxBuffer:4194304});
    rows=stdout.split(/\r?\n/).flatMap(line=>{
      const m=line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/);if(!m||Number(m[3])!==uid)return [];
      const command=m[4];let name;
      if(/(?:^|\/)Antigravity IDE(?:\s|$)/.test(command))name='Antigravity IDE';
      else if(/(?:^|\/)antigravity-ide(?:\s|$)/.test(command))name='antigravity-ide';
      else name=command.match(/(?:^|\/)(language_server_(?:macos|linux)_(?:x64|arm|arm64))(?:\s|$)/)?.[1];
      return name?[{ProcessId:Number(m[1]),ParentProcessId:Number(m[2]),Name:name,CommandLine:command}]:[];
    });
    if(!rows.length)throw Error('Waiting for Antigravity IDE processes');
    if(platform==='darwin'){
      const {stdout}=await run('/usr/sbin/lsof',['-nP','-a','-p',rows.map(r=>r.ProcessId).join(','),'-iTCP','-sTCP:LISTEN','-Fpn'],{timeout:8000,maxBuffer:2097152}).catch(e=>{if(e.code===1)return{stdout:''};throw e;});
      ports=parseLsof(stdout);
    }else if(platform==='linux')ports=new Map(await Promise.all(rows.map(async r=>[r.ProcessId,await linuxPort(r.ProcessId).catch(()=>[])])));
    else throw Error('Unsupported IDE platform');
  }
  const owners=new Map();
  // /proc and lsof may report the same inherited socket for the root, its
  // language server and Electron helpers. Keep all owners; never let process
  // iteration order replace the root or resolve a multi-instance ambiguity.
  for(const [pid,values] of ports)for(const port of values){if(!owners.has(port))owners.set(port,new Set());owners.get(port).add(pid);}
  const selected=selectIdeServer(rows,owners,debugPort);
  return {...selected,Ports:ports.get(selected.ProcessId)||[]};
}

export async function discoverIdeLog(profile,ports,{read=readFile,list=readdir}={}) {
  const names=(await list(join(profile,'logs'))).filter(n=>/^\d{8}T\d{6}$/.test(n)).sort().reverse();
  for(const name of names.slice(0,8)){
    let log;try{log=await read(join(profile,'logs',name,'ls-main.log'),'utf8');}catch{continue;}
    const port=[...log.matchAll(/listening on random port at (\d+) for HTTP(?:\s|$)/g)].reverse().map(m=>Number(m[1])).find(p=>ports.includes(p));
    if(port)return port;
  }
  throw Error('Waiting for the IDE local API port');
}
