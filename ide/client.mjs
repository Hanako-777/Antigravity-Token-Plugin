import {AntigravityClient} from '../sidecars/panel/client.mjs';
import {discoverIdeProcesses,discoverIdeLog} from './discovery.mjs';
export class IdeClient extends AntigravityClient {
  constructor({profile,debugPort,processes=discoverIdeProcesses,logPort=discoverIdeLog}={}){super();this.profile=profile;this.debugPort=debugPort;this.ideProcesses=processes;this.logPort=logPort;}
  async discoverNow(){
    this.server=null;
    const row=await this.ideProcesses(this.debugPort());
    const port=await this.logPort(this.profile,row.Ports);
    const csrf=row.CommandLine.match(/--csrf_token(?:=|\s+)"?([^\s"]+)/)?.[1];
    if(!csrf)throw Error('IDE local API credential unavailable');
    this.server={port,csrf,pid:row.ProcessId};this.discoveredAt=Date.now();return this.server;
  }
}
