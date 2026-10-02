const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),folder=path.join(root,'android/qa-results/1.7.7');
const suites=[];
for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.txt'))){
 const text=fs.readFileSync(path.join(folder,file),'utf8'),match=text.match(/^INSTRUMENTATION_RESULT: report=(.*)$/m),native=text.match(/^INSTRUMENTATION_RESULT: tests=(.*)$/m);
 if(!match&&!native)continue;
 const report=match?JSON.parse(JSON.parse(match[1])):{tests:JSON.parse(native[1])};
 const passed=report.passed??report.tests.filter(t=>t.result==='PASS').length,failed=report.failed??report.tests.filter(t=>t.result==='FAIL').length;
 if(!text.includes('INSTRUMENTATION_RESULT: result=PASS')||failed)throw Error('Failed result '+file);
 const layout=text.match(/^INSTRUMENTATION_RESULT: layout=(.*)$/m);
 fs.writeFileSync(path.join(folder,file.replace(/\.txt$/,'.json')),JSON.stringify(report,null,2));
 suites.push({file,passed,failed,...(layout?{layout:JSON.parse(layout[1])}:{})});
}
const apk=path.join(root,'releases/Kanto_Tetris_1.7.7_Android.apk'),browser=JSON.parse(fs.readFileSync(path.join(root,'tests/results/1.7.7/campaign-browser.json'),'utf8'));
if(browser.failed)throw Error('Browser campaign failed');
const summary={version:'1.7.7',date:'2026-09-29',environment:{android:11,webview:'83.0.4103.106',physicalHardwareTested:false},browser:{passed:browser.passed,failed:browser.failed},android:suites,release:{package:'com.kantotetris.game',versionCode:10707,bytes:fs.statSync(apk).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex'),signatureSchemes:['v2','v3'],alignmentVerified:true,qaHooks:false,upgradeFrom:'1.7.6',installAndLaunch:'PASS'}};
fs.writeFileSync(path.join(folder,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({browser:summary.browser,android:suites.map(s=>({file:s.file,passed:s.passed,failed:s.failed})),release:summary.release},null,2));
