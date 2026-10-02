"""Check the signed release payload, existing Windows build, and final QA reports."""
import hashlib, json, pathlib, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
qa = root / 'android/qa-results/1.8.14'
apk = root / 'releases/Kanto_Tetris_1.8.14_Android.apk'
sha = lambda data: hashlib.sha256(data).hexdigest()
reports = []
for aspect in ('4x3', '16x9'):
    browser = json.loads((qa / f'browser-handheld-{aspect}.json').read_text(encoding='utf-8-sig'))
    assert browser['failed'] == 0 and browser['passed'] == 12
    reports.append(dict(name=f'Browser handheld {aspect}', **browser))
    for mode in ('suite-handheld', 'suite-ui', 'suite-grid', 'map-native', 'handheld-native'):
        content = (qa / f'{mode}-{aspect}.txt').read_text(encoding='utf-8-sig')
        assert 'INSTRUMENTATION_RESULT: result=PASS' in content, mode
        if mode.startswith('suite-'):
            line = next(s for s in content.splitlines() if s.startswith('INSTRUMENTATION_RESULT: report='))
            report = json.loads(json.loads(line.split('=', 1)[1]))
            assert not report['failed'] and report['passed']
            w, h = report['viewport'] if 'viewport' in report else report['metrics']['viewport']
            assert abs(w / h - (4/3 if aspect == '4x3' else 16/9)) < .01
        else:
            line = next(s for s in content.splitlines() if s.startswith('INSTRUMENTATION_RESULT: tests='))
            tests = json.loads(line.split('=', 1)[1])
            assert all(t['result'] == 'PASS' for t in tests)
            report = dict(passed=len(tests), failed=0, tests=tests)
        reports.append(dict(name=f'Android {mode} {aspect}', **report))
for mode in ('all', 'audio-native'):
    content = (qa / f'{mode}-4x3.txt').read_text(encoding='utf-8-sig')
    assert 'INSTRUMENTATION_RESULT: result=PASS' in content
    line = next(s for s in content.splitlines() if s.startswith('INSTRUMENTATION_RESULT: tests='))
    tests = json.loads(line.split('=', 1)[1])
    assert all(t['result'] == 'PASS' for t in tests)
    reports.append(dict(name=f'Android {mode} 4x3', passed=len(tests), failed=0, tests=tests))
with zipfile.ZipFile(apk) as package:
    html = package.read('assets/index.html')
    assert html == (root / 'android/assets/index.html').read_bytes()
    assert b'Build 1.8.14 Android' in html and b'kanto-handheld' in html
    for token in (b'nativeQA', b'id="qaPanel"', b'qaCampaignTimers'):
        assert token not in html, token
    music = json.loads((root / 'src/assets/soundtrack.json').read_text(encoding='utf-8'))
    for track in music['tracks'] + music['fanfares']:
        assert sha(package.read('assets/' + track['file'])) == track['sha256']
windows_hash = sha((root / 'builds/Kanto_Tetris_Build_1_8_13_Music_Polish/index.html').read_bytes())
assert windows_hash == '729435a86b9708330b39a74f645811fd6d0ad9076f9012cbad3ebe107d100909'
report = dict(version='1.8.14', platform='Android', target='Retroid Pocket Nova: 4.5-inch 4:3 AMOLED, 1280 x 960',
    passed=sum(s['passed'] for s in reports), failed=0, bytes=apk.stat().st_size, sha256=sha(apk.read_bytes()),
    windowsVersion='1.8.13', windowsHTMLSha256=windows_hash, offlineAudioAssets=len(music['tracks'])+len(music['fanfares']),
    limitations=['APK tested in Android 11 / WebView 83 emulator at 1280 x 960 and 1920 x 1080; physical Nova/Android 13 visual comfort still requires on-device review.'], suites=reports)
(qa / 'QA_RESULTS.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
apk.with_suffix('.apk.sha256').write_text(report['sha256'] + '  ' + apk.name + '\n', encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k != 'suites'}, indent=2))
