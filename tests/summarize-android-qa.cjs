const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'android/qa-results');
const names=['brock','controls','pause','suite-backups','suite-ui','files','native-controls','native-rp4','native-1080p','native-4x3'];
const suites=names.map(name=>{
 const text=fs.readFileSync(path.join(dir,name+'.txt'),'utf8');
 if(!text.includes('INSTRUMENTATION_RESULT: result=PASS'))throw Error(name+' did not pass');
 const line=text.split('\n').find(s=>s.startsWith('INSTRUMENTATION_RESULT: report='));
 const direct=text.split('\n').find(s=>s.startsWith('INSTRUMENTATION_RESULT: tests='));
 const report=line?JSON.parse(JSON.parse(line.slice(line.indexOf('=')+1))):{tests:JSON.parse(direct.slice(direct.indexOf('=')+1))};
 if(report.tests.some(t=>t.result!=='PASS'))throw Error(name+' has a failing test');
 return {suite:name,passed:report.tests.length};
});
const apk=path.join(root,'releases/Kanto_Tetris_1.7.5_Android.apk');
const summary={build:'1.7.5',checkedAt:new Date().toISOString(),environment:'Android 11 x86_64 emulator, WebView 83.0.4103.106',controllerStateTests:53,suites,physicalDevicesTested:[],apk:{bytes:fs.statSync(apk).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex')}};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(apk+'.sha256',summary.apk.sha256+'  '+path.basename(apk)+'\n');
console.log(JSON.stringify(summary,null,2));
