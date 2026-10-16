// Pure local version; external update checks disabled to protect custom code.
export class AppUpdater {
  constructor({ onReload = null } = {}) {
    this.onReload = onReload;
  }
  state = { state: 'idle', host: 'app', currentVersion: '1.0.0' };
  publicState() {
    return { ...this.state };
  }
  async current() {
    return '1.0.0';
  }
  async check() {
    return this.publicState();
  }
  async apply() {
    return this.publicState();
  }
}
