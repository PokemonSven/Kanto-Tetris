"""Verify the supplied title asset, unchanged game scripts, QA reports and packages."""
import base64, hashlib, json, pathlib, re, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
qa = root / 'android/qa-results/1.8.15'
build = root / 'builds/Kanto_Tetris_Build_1_8_15_Title_Art'
apk = root / 'releases/Kanto_Tetris_1.8.15_Android.apk'
sha = lambda data: hashlib.sha256(data).hexdigest()
art = (root / 'src/assets/kanto-title-tree-v1.png').read_bytes()
assert sha(art) == '08c43e4e4fade627e66c3b12eea41073b74582f2990409a0d180b1684bf8a51a'
image_url = b'data:image/png;base64,' + base64.b64encode(art)
web = (build / 'index.html').read_bytes()
android = (root / 'android/assets/index.html').read_bytes()
for html in (web, android):
    title = html.split(b'id="titleScreen"', 1)[1].split(b'id="adventureDifficultyModal"', 1)[0]
    assert image_url in title and b'object-fit:contain' in html
    assert b'__KANTO_TITLE_ART__' not in html
    assert all(token not in html for token in (b'nativeQA', b'id="qaPanel"', b'qaCampaignTimers'))
def scripts(html):
    return re.findall(rb'<script(?:\s[^>]*)?>([\s\S]*?)</script>', html)
old_web = (root / 'builds/Kanto_Tetris_Build_1_8_13_Music_Polish/index.html').read_bytes()
assert scripts(old_web.replace(b'1.8.13', b'1.8.15')) == scripts(web), 'Windows game scripts changed'
with zipfile.ZipFile(root / 'releases/Kanto_Tetris_1.8.14_Android.apk') as old_apk:
    old_android = old_apk.read('assets/index.html')
assert scripts(old_android.replace(b'1.8.14', b'1.8.15')) == scripts(android), 'Android game scripts changed'
music = json.loads((root / 'src/assets/soundtrack.json').read_text(encoding='utf8'))
with zipfile.ZipFile(apk) as package:
    assert package.read('assets/index.html') == android
    for track in music['tracks'] + music['fanfares']:
        assert sha(package.read('assets/' + track['file'])) == track['sha256']
        assert sha((build / track['file']).read_bytes()) == track['sha256']
reports = []
for aspect in ('4x3', '16x9'):
    desktop = json.loads((qa / f'windows-{aspect}.json').read_text())
    assert desktop['failed'] == 0 and desktop['passed'] == 7
    reports.append(dict(platform='Windows', aspect=aspect, **desktop))
    text = (qa / f'native-{aspect}.txt').read_text(encoding='utf-8-sig')
    assert 'INSTRUMENTATION_RESULT: result=PASS' in text
    native = json.loads(json.loads(next(s.split('=', 1)[1] for s in text.splitlines() if s.startswith('INSTRUMENTATION_RESULT: report='))))
    assert native['failed'] == 0 and native['passed'] == 7
    reports.append(dict(platform='Android WebView', aspect=aspect, **native))
    tests = json.loads(next(s.split('=', 1)[1] for s in text.splitlines() if s.startswith('INSTRUMENTATION_RESULT: tests=')))
    assert all(t['result'] == 'PASS' for t in tests)
    reports.append(dict(platform='Android native controller', aspect=aspect, passed=len(tests), failed=0, tests=tests))
    for report in (desktop, native):
        w, h = report['geometry']['viewport']
        assert abs(w / h - (4 / 3 if aspect == '4x3' else 16 / 9)) < .01
assert '10814' in (qa / 'upgrade-before.txt').read_text(encoding='utf-8-sig')
assert '1.8.15' in (qa / 'upgrade-after.txt').read_text(encoding='utf-8-sig')
assert 'Status: ok' in (qa / 'release-cold-launch.txt').read_text(encoding='utf-8-sig')
report = dict(version='1.8.15', passed=sum(r['passed'] for r in reports), failed=0,
    titleArtworkSha256=sha(art), artworkUnmodified=True, gameScriptsUnchangedExceptVersion=True,
    offlineAudioAssets=len(music['tracks']) + len(music['fanfares']), apkSha256=sha(apk.read_bytes()),
    windowsHTMLSha256=sha(web), upgrade='1.8.14 → 1.8.15, existing application ID and signing identity',
    limitations=['Android 11 / WebView 83 emulator, not a physical Nova. Windows checked in browser preview; direct file launch was not automated.'], suites=reports)
for path in (qa / 'QA_RESULTS.json', build / 'QA_RESULTS.json'):
    path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
archive = root / 'releases/Kanto_Tetris_Build_1_8_15_Title_Art.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for file in sorted(build.rglob('*')):
        if file.is_file(): package.write(file, file.relative_to(build).as_posix())
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None and package.read('index.html') == web
for file in (apk, archive):
    file.with_suffix(file.suffix + '.sha256').write_text(sha(file.read_bytes()) + '  ' + file.name + '\n')
print(json.dumps({k:v for k,v in report.items() if k != 'suites'}, indent=2))
print(f'Windows ZIP: {archive.stat().st_size:,} bytes. APK: {apk.stat().st_size:,} bytes.')
