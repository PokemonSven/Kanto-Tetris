"""Run the current isolated QA APK sequentially and retain every result."""
import argparse, json, pathlib, subprocess, time

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--aspects', nargs='+', default=['4x3', '16x9'])
parser.add_argument('--modes', nargs='+')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[2]
out = root / args.output
out.mkdir(parents=True, exist_ok=True)
adb = str(root / '.android-tools/platform-tools/adb.exe')
def call(*arguments, timeout=450):
    return subprocess.run([adb, '-s', 'emulator-5556', *arguments], capture_output=True, text=True, encoding='utf8', errors='replace', timeout=timeout)
if call('shell', 'getprop', 'sys.boot_completed').stdout.strip() != '1':
    raise SystemExit('Emulator must finish booting before running instrumented QA.')
suites = 'controls pause tetris grid speed campaign brock backups slots features practice expansion milestones nova oak rocket keepsakes tower map audio ui handheld title audit'.split()
modes = args.modes or ['suite-' + s for s in suites] + ['all', 'files', 'audio-native', 'map-native', 'title-native', 'handheld-native']
results = []
for aspect in args.aspects:
    call('shell', 'am', 'force-stop', 'com.kantotetris.game.qa')
    call('shell', 'wm', 'size', {'4x3':'960x1280', '16x9':'1080x1920'}[aspect])
    call('shell', 'wm', 'density', '240')
    time.sleep(2)
    for mode in modes:
        started = time.monotonic()
        try:
            run = call('shell', 'am', 'instrument', '-w', '-e', 'mode', mode, 'com.kantotetris.game.qa/com.kantotetris.game.SmokeInstrumentation')
            text = run.stdout + run.stderr
        except subprocess.TimeoutExpired:
            text = 'RUNNER TIMEOUT\n'
            call('shell', 'am', 'force-stop', 'com.kantotetris.game.qa')
        (out / f'{mode}-{aspect}.txt').write_text(text, encoding='utf8')
        row = dict(mode=mode, aspect=aspect, result='PASS' if 'INSTRUMENTATION_RESULT: result=PASS' in text else 'FAIL', seconds=round(time.monotonic()-started, 1))
        for key in ('report', 'tests', 'error', 'layout'):
            line = next((s.split('=', 1)[1] for s in text.splitlines() if s.startswith(f'INSTRUMENTATION_RESULT: {key}=')), None)
            if line is not None:
                try:
                    value = json.loads(line)
                    if key == 'report' and isinstance(value, str): value = json.loads(value)
                except ValueError: value = line
                row[key] = value
        if isinstance(row.get('report'), dict) and row['report'].get('failed', 0): row['result'] = 'FAIL'
        results.append(row)
        (out / 'summary.json').write_text(json.dumps(results, indent=2), encoding='utf8')
        print(f'{aspect} {mode}: {row["result"]} ({row["seconds"]}s)', flush=True)
        shots = ['failure'] if row['result'] == 'FAIL' else ([mode] if mode.startswith('preview-') else ['handheld-'+s for s in ('game','menu','options','oak','battle','fly')] if mode == 'handheld-native' else ['title-fresh','title-saved'] if mode == 'title-native' else [])
        for shot in shots:
            picture = subprocess.run([adb, '-s', 'emulator-5556', 'exec-out', 'run-as', 'com.kantotetris.game.qa', 'cat', f'files/{shot}.png'], capture_output=True)
            if picture.stdout.startswith(b'\x89PNG'):
                (out / f'{mode}-{shot}-{aspect}.png').write_bytes(picture.stdout)
print(f'Completed {len(results)} runs; {sum(r["result"]=="FAIL" for r in results)} failed.', flush=True)
raise SystemExit(1 if any(r['result']=='FAIL' for r in results) else 0)
