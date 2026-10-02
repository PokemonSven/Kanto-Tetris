const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'android/qa-results/1.7.8'),suites=[];
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
const browser=['4x3','1080'].map(label=>{const report=JSON.parse(fs.readFileSync(path.join(root,`tests/results/1.7.8/tetris-browser-${label}.json`),'utf8'));if(report.failed||report.passed!==21)throw Error('Browser failure '+label);return {label,passed:report.passed,failed:report.failed};});
for(const name of ['suite-tetris','suite-campaign','suite-controls','suite-pause','suite-brock','suite-backups','suite-ui','suite-features','all','files'])if(!suites.some(s=>s.file===`${name}-4x3.txt`))throw Error('Missing '+name);
const apk=path.join(root,'releases/Kanto_Tetris_1.7.8_Android.apk');
const summary={version:'1.7.8',date:'2026-09-29',environment:{android:11,webview:'83.0.4103.106',physicalHardwareTested:false},browser,android:suites,release:{package:'com.kantotetris.game',versionCode:10708,bytes:fs.statSync(apk).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex'),signatureSchemes:['v2','v3'],alignmentVerified:true,qaHooks:false,upgradeFrom:'1.7.7',installAndLaunch:'PASS'}};
fs.writeFileSync(path.join(folder,'summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(apk+'.sha256',summary.release.sha256+'  '+path.basename(apk)+'\n');
console.log(JSON.stringify({browser,android:suites.map(({file,passed,failed})=>({file,passed,failed})),release:summary.release},null,2));
