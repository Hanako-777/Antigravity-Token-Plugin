const vscode=require('vscode');
const {spawn}=require('node:child_process');
const {join,resolve}=require('node:path');
const {readFileSync,existsSync}=require('node:fs');
const supportedIde=require('./host.cjs');
let child,output;
exports.activate=function(context){
  output=vscode.window.createOutputChannel('Antigrative Dashboard IDE');
  if(!supportedIde(vscode.env)){
    output.appendLine('This adapter supports the standalone Antigravity IDE only.');
    context.subscriptions.push(output);return;
  }
  const profile=resolve(context.globalStorageUri.fsPath,'../../..');
  function stop(){if(child){const prior=child;child=null;try{prior.send({type:'stop'});}catch{prior.kill();}const deadline=setTimeout(()=>prior.kill(),2000);deadline.unref();prior.once('exit',()=>clearTimeout(deadline));}}
  function start(){
    stop();if(!vscode.workspace.getConfiguration('antigrativeDashboard.ide').get('enabled',true))return;
    if(!existsSync(join(profile,'DevToolsActivePort'))){output.appendLine('Renderer connection unavailable. Fully quit the IDE, then start with --remote-debugging-port=0 --remote-debugging-address=127.0.0.1. See the extension README.');return;}
    child=spawn(process.execPath,[join(context.extensionPath,'ide','main.mjs')],{windowsHide:true,stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,ELECTRON_RUN_AS_NODE:'1',AG_PULSE_IDE_PROFILE:profile,AG_PULSE_IDE_DATA:context.globalStorageUri.fsPath}});
    const launched=child;
    // Never echo API responses, command lines or credentials into IDE logs.
    child.stdout.resume();child.stderr.resume();
    child.once('error',()=>output.appendLine('IDE collector could not start.'));
    child.once('exit',code=>{output.appendLine(`IDE collector stopped (${code??'signal'}).`);if(child===launched)child=null;});
    output.appendLine('IDE collector started.');
  }
  context.subscriptions.push(output,{dispose:stop},vscode.commands.registerCommand('antigrativeDashboard.ide.openHealth',()=>{
    let status='Waiting for a fresh IDE renderer connection';
    try{const value=JSON.parse(readFileSync(join(context.globalStorageUri.fsPath,'integration-state.json'),'utf8'));const age=Date.now()-Date.parse(value.checkedAt);if(age>=0&&age<15000)status=value.state==='mounted'?'Dashboard attached to the Agent composer':value.state;}catch{}
    output.appendLine(status);output.show(true);
  }),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('antigrativeDashboard.ide.enabled'))start();}));
  start();
  exports.deactivate=stop;
};
