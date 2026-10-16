"""Install, launch or uninstall the dashboard in the standalone Antigravity IDE."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
IDENTITY = 'you-should-know-me.antigrative-dashboard-ide'
DEBUG_ARGS = ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1']


def application(executable):
    executable = Path(executable).expanduser().resolve(strict=True)
    if not executable.is_file():
        raise ValueError('--exe must name the IDE executable, not its directory or .app bundle')
    candidates = [executable.parent / 'resources/app', executable.parent.parent / 'Resources/app']
    for app in candidates:
        try:
            product = json.loads((app / 'product.json').read_text(encoding='utf-8'))
        except (OSError, ValueError):
            continue
        if product.get('applicationName') == 'antigravity-ide' and (app / 'out/cli.js').is_file():
            return executable, app
    raise ValueError('This installer supports the standalone Antigravity IDE only')


def cli_command(executable, app, args):
    # Use the host's bundled Node runtime. No separate Node installation needed.
    return [str(executable), str(app / 'out/cli.js'), *args]


def manage(action, executable, vsix=None, workspace=None, run=subprocess.run, spawn=subprocess.Popen):
    executable, app = application(executable)
    env = dict(os.environ)
    if action == 'launch':
        env.pop('ELECTRON_RUN_AS_NODE', None)
        args = [str(executable), *DEBUG_ARGS]
        if workspace:
            args.append(str(Path(workspace).expanduser().resolve()))
        options = dict(env=env, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if sys.platform == 'win32':
            options['creationflags'] = subprocess.CREATE_NO_WINDOW
        else:
            options['start_new_session'] = True
        return spawn(args, **options)
    env['ELECTRON_RUN_AS_NODE'] = '1'
    if action == 'install':
        if vsix is None:
            package = json.loads((ROOT / 'ide/package.json').read_text(encoding='utf-8'))
            vsix = ROOT / 'dist' / f"antigrative-dashboard-ide-{package['version']}.vsix"
        vsix = Path(vsix).resolve(strict=True)
        args = ['--install-extension', str(vsix), '--force']
    elif action == 'uninstall':
        args = ['--uninstall-extension', IDENTITY]
    else:
        raise ValueError('Unknown IDE action')
    options = dict(env=env, check=True)
    if sys.platform == 'win32':
        options['creationflags'] = subprocess.CREATE_NO_WINDOW
    return run(cli_command(executable, app, args), **options)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['install', 'launch', 'uninstall'])
    parser.add_argument('--exe', required=True, type=Path)
    parser.add_argument('--vsix', type=Path)
    parser.add_argument('--workspace', type=Path)
    args = parser.parse_args()
    try:
        manage(args.action, args.exe, args.vsix, args.workspace)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, str(error) + '\n')
    print('IDE dashboard ' + args.action + ' requested.')
    if args.action == 'install':
        print('Fully quit the IDE, then use this script with launch, or add the loopback debugging flags to your IDE shortcut. See ide/README.md.')
