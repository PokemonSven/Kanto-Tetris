"""Copy our QA application's screenshots without PowerShell binary conversion."""
import pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parents[2]
adb = root / '.android-tools/platform-tools/adb.exe'
label = sys.argv[1] if len(sys.argv) > 1 else '4x3'
assert label in ('4x3', '16x9')
output = root / 'android/qa-results/1.8.14'
output.mkdir(parents=True, exist_ok=True)
for screen in ('game', 'menu', 'options', 'oak', 'battle', 'fly'):
    data = subprocess.check_output([str(adb), '-s', 'emulator-5556', 'exec-out', 'run-as', 'com.kantotetris.game.qa', 'cat', f'files/handheld-{screen}.png'])
    assert data.startswith(b'\x89PNG\r\n\x1a\n')
    (output / f'{screen}-{label}.png').write_bytes(data)
print(f'Saved six {label} Android screenshots.')
