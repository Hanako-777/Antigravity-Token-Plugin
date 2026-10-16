import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

function compareVersions(a, b) {
  const pa = (a || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = (b || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0, nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export class AppUpdater {
  constructor({ pluginDir = process.cwd(), dataDir = null, onReload = null } = {}) {
    this.pluginDir = pluginDir;
    this.dataDir = dataDir;
    this.onReload = onReload;
    this.state = {
      state: 'idle',
      host: 'app',
      currentVersion: this.readLocalVersion(),
      latestVersion: null,
      progress: { phase: 'check' }
    };
  }

  readLocalVersion() {
    try {
      const p = join(this.pluginDir, 'plugin.json');
      const data = JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
      return data.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  publicState() {
    return { ...this.state };
  }

  async current() {
    return this.readLocalVersion();
  }

  async check() {
    this.state = { ...this.state, state: 'checking', progress: { phase: 'check' } };
    const currentVersion = this.readLocalVersion();
    this.state.currentVersion = currentVersion;

    try {
      const headers = {
        'User-Agent': 'Antigravity-Token-Plugin-Updater',
        'Accept': 'application/vnd.github.v3+json'
      };
      let remoteVersion = null;
      let notes = '';
      let downloadUrl = 'https://github.com/Hanako-777/Antigravity-Token-Plugin/archive/refs/heads/main.zip';

      // 1. Check GitHub Releases
      try {
        const res = await fetch('https://api.github.com/repos/Hanako-777/Antigravity-Token-Plugin/releases/latest', { headers });
        if (res.ok) {
          const rel = await res.json();
          if (rel && rel.tag_name) {
            remoteVersion = rel.tag_name.replace(/^v/, '');
            notes = rel.body || '';
            const zipAsset = rel.assets?.find(a => a.name?.endsWith('.zip'));
            if (zipAsset?.browser_download_url) downloadUrl = zipAsset.browser_download_url;
            else if (rel.zipball_url) downloadUrl = rel.zipball_url;
          }
        }
      } catch {}

      // 2. If no release tag found, check plugin.json in repository main branch
      if (!remoteVersion) {
        try {
          const res = await fetch('https://api.github.com/repos/Hanako-777/Antigravity-Token-Plugin/contents/plugin.json', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data?.content) {
              const decoded = Buffer.from(data.content, 'base64').toString('utf8');
              const parsed = JSON.parse(decoded);
              remoteVersion = parsed.version;
            }
          }
        } catch {}

        try {
          const resCommit = await fetch('https://api.github.com/repos/Hanako-777/Antigravity-Token-Plugin/commits?per_page=1', { headers });
          if (resCommit.ok) {
            const commits = await resCommit.json();
            if (commits?.[0]?.commit?.message) {
              notes = commits[0].commit.message;
            }
          }
        } catch {}
      }

      remoteVersion = remoteVersion || currentVersion;

      if (compareVersions(remoteVersion, currentVersion) > 0) {
        this.state = {
          state: 'available',
          host: 'app',
          currentVersion,
          latestVersion: remoteVersion,
          notes,
          downloadUrl,
          progress: { phase: 'check' }
        };
      } else {
        this.state = {
          state: 'current',
          host: 'app',
          currentVersion,
          latestVersion: currentVersion,
          progress: { phase: 'check' }
        };
      }
    } catch (e) {
      this.state = {
        state: 'error',
        host: 'app',
        currentVersion,
        error: 'network',
        progress: { phase: 'check' }
      };
    }
    return this.publicState();
  }

  async apply() {
    this.state = { ...this.state, state: 'installing', progress: { phase: 'download', received: 0, total: 0 } };
    try {
      const url = this.state.downloadUrl || 'https://github.com/Hanako-777/Antigravity-Token-Plugin/archive/refs/heads/main.zip';
      const tempZip = join(tmpdir(), `antigravity-pulse-update-${Date.now()}.zip`);

      const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Token-Plugin-Updater' } });
      if (!res.ok) throw new Error('Download failed: ' + res.status);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      writeFileSync(tempZip, buffer);

      this.state = { ...this.state, progress: { phase: 'extract' } };

      const pyScript = `
import zipfile, shutil, os, sys
zip_path = sys.argv[1]
target_dir = sys.argv[2]
extract_tmp = os.path.join(os.path.dirname(zip_path), 'pulse_extracted_' + str(os.getpid()))
os.makedirs(extract_tmp, exist_ok=True)
try:
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(extract_tmp)
    entries = os.listdir(extract_tmp)
    source_root = os.path.join(extract_tmp, entries[0]) if len(entries) == 1 and os.path.isdir(os.path.join(extract_tmp, entries[0])) else extract_tmp
    runtime_files = ['assets', 'compat', 'sidecars', 'desktop', 'plugin.json']
    for item in runtime_files:
        src = os.path.join(source_root, item)
        dst = os.path.join(target_dir, item)
        if os.path.exists(src):
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '*.log', '.data', 'data'))
            else:
                shutil.copy2(src, dst)
finally:
    shutil.rmtree(extract_tmp, ignore_errors=True)
    try:
        os.remove(zip_path)
    except:
        pass
`;
      await new Promise((resolve, reject) => {
        const proc = spawn('python', ['-c', pyScript, tempZip, this.pluginDir], { stdio: 'ignore', windowsHide: true });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error('Extraction exited with code ' + code)));
        proc.on('error', reject);
      });

      const newVersion = this.readLocalVersion();
      this.state = {
        state: 'installed',
        host: 'app',
        currentVersion: newVersion,
        latestVersion: newVersion,
        progress: { phase: 'complete' }
      };
    } catch (e) {
      this.state = {
        ...this.state,
        state: 'error',
        error: 'install',
        progress: { phase: 'check' }
      };
    }
    return this.publicState();
  }

  async request(input) {
    const action = input?.action || 'status';
    if (action === 'check') return await this.check();
    if (action === 'apply') return await this.apply();
    if (action === 'reload') {
      this.state = { ...this.state, state: 'reloading' };
      setTimeout(() => this.onReload?.(), 100);
      return this.publicState();
    }
    return this.publicState();
  }
}
