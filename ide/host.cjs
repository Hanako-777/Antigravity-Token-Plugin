// VSIX format alone does not establish support for other VS Code-based hosts.
module.exports = function supportedIde(env) {
  return env.appName === 'Antigravity IDE' && env.uiKind === 1;
};
