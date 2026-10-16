import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export function validIdeTarget(target,port){
  try{
    const page=new URL(target.url),ws=new URL(target.webSocketDebuggerUrl);
    return target.type==='page'&&page.protocol==='vscode-file:'&&page.hostname==='vscode-app'
      && /\/out\/vs\/code\/electron-browser\/workbench\/workbench\.html$/.test(page.pathname)
      && ws.protocol==='ws:'&&['127.0.0.1','localhost','[::1]'].includes(ws.hostname)&&Number(ws.port)===port;
  }catch{return false;}
}
export async function ideTargets(profile){
  const text=await readFile(join(profile,'DevToolsActivePort'),'utf8');
  const port=Number(text.split(/\r?\n/)[0]);
  if(text.length>1024||!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid IDE renderer port');
  const res=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000)});
  const body=await res.text();if(!res.ok||body.length>1048576)throw Error('IDE renderer discovery failed');
  const targets=JSON.parse(body);if(!Array.isArray(targets))throw Error('Invalid IDE renderer targets');
  return {port,targets:targets.filter(t=>validIdeTarget(t,port))};
}
