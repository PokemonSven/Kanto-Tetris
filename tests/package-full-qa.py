"""Consolidate baseline/regression evidence and verify the QA-fix release."""
import base64, hashlib, html, json, pathlib, re, zipfile

root = pathlib.Path(__file__).resolve().parents[1]
qa = root / 'tests/results/full-qa-1.8.15'
build = root / 'builds/Kanto_Tetris_Build_1_8_16_QA_Fixes'
apk = root / 'releases/Kanto_Tetris_1.8.16_Android.apk'
sha = lambda b: hashlib.sha256(b).hexdigest()
web = (build / 'index.html').read_bytes()
android = (root / 'android/assets/index.html').read_bytes()
old_web = (root / 'builds/Kanto_Tetris_Build_1_8_15_Title_Art/index.html').read_bytes()
with zipfile.ZipFile(root / 'releases/Kanto_Tetris_1.8.15_Android.apk') as z:
    old_android = z.read('assets/index.html')
scripts = lambda b: re.findall(rb'<script(?:\s[^>]*)?>([\s\S]*?)</script>', b)
normalize_badge = lambda b: re.sub(rb'const FAN_BADGE_URL="[^"]*";', b'const FAN_BADGE_URL="BUNDLED_BADGES";', b)
assert scripts(normalize_badge(old_web.replace(b'1.8.15', b'1.8.16'))) == scripts(normalize_badge(web)), 'Windows logic unexpectedly changed'
assert scripts(old_android.replace(b'1.8.15', b'1.8.16')) == scripts(android), 'Android logic unexpectedly changed'
baseline_hashes = json.loads((qa / 'baseline-source-hashes.json').read_text(encoding='utf-8-sig'))
changes = [p for p, digest in baseline_hashes.items() if sha((root / p).read_bytes()) != digest]
assert set(changes) == {'src\\game-shell.html', 'src\\android-handheld.css'}, changes
for payload in (web, android):
    assert b'__KANTO_' not in payload
    assert all(token not in payload for token in (b'nativeQA', b'id="qaPanel"', b'qaCampaignTimers'))
    for name in ('kanto-title-tree-v1.png', 'badge-sheet-v1.png'):
        assert b'data:image/png;base64,' + base64.b64encode((root / 'src/assets' / name).read_bytes()) in payload
music = json.loads((root / 'src/assets/soundtrack.json').read_text(encoding='utf8'))
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None and z.read('assets/index.html') == android
    assert not any('SmokeInstrumentation' in n or '\\' in n for n in z.namelist())
    for track in music['tracks'] + music['fanfares']:
        assert sha(z.read('assets/' + track['file'])) == track['sha256']
        assert sha((build / track['file']).read_bytes()) == track['sha256']

# Keep all raw failures. Only a later successful run of the same suite supersedes one.
effective = {}
for stage in ('baseline', 'fixed', 'final'):
    for row in json.loads((qa / f'android/{stage}/summary.json').read_text()):
        tests = row.get('report', {}).get('tests', []) + row.get('tests', [])
        effective[('Android', row['aspect'], row['mode'])] = dict(platform='Android emulator', aspect=row['aspect'], suite=row['mode'], build='1.8.15' if stage == 'baseline' else '1.8.16', result=row['result'], checks=len(tests), failed=[t for t in tests if t['result'] != 'PASS'], evidence=f'android/{stage}/{row["mode"]}-{row["aspect"]}.txt')
for stage in ('initial', 'fixed'):
    for p in sorted((qa / f'windows/{stage}').glob('*.json'), key=lambda p:('corrected' in p.name,p.name)):
        if 'android' in p.name: continue  # Exploratory browser emulation is not native evidence.
        row = json.loads(p.read_text())
        suite, aspect = p.stem.split('-', 1)
        aspect = '16x9' if aspect.startswith('16x9') else '4x3'
        tests = row['tests']
        effective[('Windows', aspect, suite)] = dict(platform='Windows browser', aspect=aspect, suite=suite, build='1.8.15' if stage == 'initial' else '1.8.16', result='PASS' if all(t['result'] == 'PASS' for t in tests) else 'FAIL', checks=len(tests), failed=[t for t in tests if t['result'] != 'PASS'], evidence=f'windows/{stage}/{p.name}')
assert all(r['result'] == 'PASS' for r in effective.values()), [r for r in effective.values() if r['result'] != 'PASS']
assert all(('Android', a, 'suite-audit') in effective for a in ('4x3', '16x9'))
assert all(('Windows', a, 'audit') in effective for a in ('4x3', '16x9'))
upgrade_before = (qa / 'release/upgrade-before.txt').read_text(encoding='utf-8-sig')
upgrade_after = (qa / 'release/upgrade-after.txt').read_text(encoding='utf-8-sig')
launch = (qa / 'release/cold-launch.txt').read_text(encoding='utf-8-sig')
assert 'versionCode=10815' in upgrade_before and 'versionCode=10816' in upgrade_after
assert 'Status: ok' in launch
signing = (qa / 'android/release-build.log').read_text(encoding='utf-8-sig')
assert '3dac933dc3710acba0f424ecdc5b5c6aa0b12d974cc40611c4a94c0658f7e529' in signing
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signing
report = dict(version='1.8.16', checkedFrom='1.8.15', finalFailures=0, passed=sum(r['checks'] for r in effective.values()), suites=len(effective), sourceChanges=changes,
    gameLogicUnchanged=True, offlineAudioAssets=len(music['tracks']) + len(music['fanfares']), apkSha256=sha(apk.read_bytes()), windowsHTMLSha256=sha(web),
    fixes=['Windows badge art now loads from the bundled sheet offline.', 'Long Android Rocket dialogue uses the available height and readable line spacing.', 'Wide Android displays correctly apply 32px body / 36px action text.', 'Nickname editor uses a wider handheld panel to reduce wrapping.'],
    testCorrections=['HOLD/NEXT and Nova minimum sizes now reflect the intentional 108×72 Android previews; size, alignment and tile equality remain checked.', 'Ghost pixels are sampled at the actual raster cell size, instead of legacy 30px coordinates.', 'Dense Oak and nickname menus allow intentional handheld scrolling, while verifying every controller action is visible/reachable and text does not overflow.'],
    scope=['Adventure/Rogue progression, all Gym/League/Champion battles, Rocket story, legendary trials, Tower, rewards and evolution.', 'Three Adventure slots, Rogue saves, legacy migration, invalid backups, failed writes, Practice isolation and Android file exchange.', 'Keyboard/controller movement, Hold, drop, repeat/held-button behavior, pause, disconnect and lifecycle.', 'Uniform grid at fractional scaling, map/Fly/Pikachu position, menus, title art, offline assets and music playback.', '6,600 randomized input actions per stress run at levels 1, 8 and 15.'],
    limitations=['Android 11 / WebView 83 emulator; a physical Retroid Pocket Nova was not connected.', 'Real controller hardware modes, physical-screen comfort, audio quality, thermal/battery behavior and device sleep/wake still need an on-device check.', 'Windows was tested in the browser preview; direct file launch and every browser/OS combination were not automated.', 'Baseline suites remain valid for unchanged game logic; presentation changes received focused 1.8.16 regressions. No claim of exhaustive bug absence.'],
    results=sorted(effective.values(), key=lambda r:(r['platform'], r['aspect'], r['suite'])))
(qa / 'QA_RESULTS.json').write_text(json.dumps(report, indent=2), encoding='utf8')
(build / 'QA_RESULTS.json').write_text(json.dumps(report, indent=2), encoding='utf8')
esc = html.escape
li = lambda xs: '<ul>'+''.join('<li>'+esc(x)+'</li>' for x in xs)+'</ul>'
groups = {}
for r in report['results']:
    key=(r['platform'],r['aspect']);g=groups.setdefault(key,[0,0]);g[0]+=1;g[1]+=r['checks']
rows=''.join(f'<tr><td>{esc(p)}</td><td>{a.replace("x", ":")}</td><td>{v[0]}</td><td>{v[1]}</td><td>PASS</td></tr>' for (p,a),v in groups.items())
details=''.join(f'<tr><td>{esc(r["platform"])}</td><td>{r["aspect"]}</td><td><a href="{r["evidence"]}">{esc(r["suite"])}</a></td><td>{r["build"]}</td><td>{r["checks"]}</td><td>PASS</td></tr>' for r in report['results'])
page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kanto Tetris QA — 1.8.16</title><style>body{{margin:0;background:#111b20;color:#ecf2e6;font:17px/1.55 system-ui}}main{{max-width:1040px;margin:auto;padding:36px 24px}}h1{{font-size:40px;line-height:1.15}}h2{{margin-top:36px;color:#f3cf6b}}a{{color:#93d9ff}}.status{{background:#233e31;padding:20px;border-left:5px solid #9bd49b;font-size:22px}}table{{border-collapse:collapse;width:100%;margin:20px 0}}th,td{{padding:10px;text-align:left;border-bottom:1px solid #48616a}}small{{color:#b8c9ca}}li{{margin:8px 0}}</style><main><small>LOCAL QA REPORT · OCTOBER 1, 2026</small><h1>Kanto Tetris 1.8.16</h1><p class="status">{report['passed']:,} checks passed across {report['suites']} effective suite runs. No unresolved failures in this test matrix.</p><p>Started with 1.8.15, investigated every failing check, corrected presentation issues, then retested the affected behavior in 1.8.16. Earlier releases and raw test evidence are retained.</p><h2>Results</h2><table><tr><th>Platform</th><th>Screen</th><th>Suite runs</th><th>Checks</th><th>Result</th></tr>{rows}</table><h2>Changes delivered</h2>{li(report['fixes'])}<h2>Coverage</h2>{li(report['scope'])}<h2>Test corrections</h2>{li(report['testCorrections'])}<p>An exploratory browser stress run overlapped another fixture on the same test origin, causing save comparisons to fail. Isolated reruns on Windows and Android passed; this exploratory run is excluded from the results above.</p><h2>Limits</h2>{li(report['limitations'])}<p>Release APK installed over 1.8.15 using the existing signing identity and cold-launched successfully. All 42 packaged audio files were hash-verified. The supplied title image is unchanged. Save and gameplay scripts match 1.8.15 after normalizing only the version and Windows badge asset URL.</p><details><summary>Detailed suite evidence</summary><table><tr><th>Platform</th><th>Screen</th><th>Suite</th><th>Build</th><th>Checks</th><th>Result</th></tr>{details}</table></details></main></html>'''
(qa / 'QA_REPORT.html').write_text(page, encoding='utf8')
(build / 'QA_REPORT.html').write_text(re.sub(r'<a href="[^"]+">(.*?)</a>',r'\1',page), encoding='utf8')
archive = root / 'releases/Kanto_Tetris_Build_1_8_16_QA_Fixes.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(build.rglob('*')):
        if p.is_file(): z.write(p, p.relative_to(build).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None and z.read('index.html') == web
for p in (apk, archive): p.with_suffix(p.suffix+'.sha256').write_text(sha(p.read_bytes())+'  '+p.name+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('results',)},indent=2))
