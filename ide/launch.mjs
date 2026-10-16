// Optional interactive launcher. The extension owns the collector lifecycle;
// this launcher only enables the loopback renderer endpoint on a fresh launch.
import {spawn} from 'node:child_process';
const args=process.argv.slice(2),index=args.indexOf('--exe');
if(index<0||!args[index+1])throw Error('Usage: node ide/launch.mjs --exe <Antigravity IDE executable> [workspace]');
const executable=args[index+1];args.splice(index,2);
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(executable,['--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',...args],{detached:true,windowsHide:true,stdio:'ignore',env});
child.once('error',()=>{console.error('Could not launch Antigravity IDE');process.exitCode=1;});child.unref();
