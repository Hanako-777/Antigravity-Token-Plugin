import test from 'node:test';
import assert from 'node:assert/strict';
import supportedIde from '../host.cjs';

test('IDE adapter activates only in the native Antigravity IDE desktop host',()=>{
  assert.equal(supportedIde({appName:'Antigravity IDE',uiKind:1}),true);
  for(const appName of ['Visual Studio Code','Code - OSS','Antigravity','Cursor',''])
    assert.equal(supportedIde({appName,uiKind:1}),false);
  assert.equal(supportedIde({appName:'Antigravity IDE',uiKind:2}),false);
});
