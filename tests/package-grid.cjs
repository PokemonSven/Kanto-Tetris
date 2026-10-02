const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'builds/Kanto_Tetris_Build_1_8_11_Grid'),native=path.join(root,'android/qa-results/1.8.11');
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),suites=[];
function add(name,report){if(report.failed||!report.passed)throw Error('Failed/incomplete: '+name);suites.push({name,...report});}
for(const label of ['4x3','16x9','odd-size','small-4x3'])add('Windows grid '+label,JSON.parse(read(path.join(out,'QA-grid-windows-'+label+'.json'))));
for(const label of ['4x3','16x9']){
 add('Windows Tetris '+label,JSON.parse(read(path.join(out,'QA-tetris-windows-'+label+'.json'))));
 for(const name of ['grid','tetris']){const log=read(path.join(native,'suite-'+name+'-'+label+'.txt'));if(!log.includes('result=PASS'))throw Error('Android '+name+' failed');add('Android '+name+' '+label,JSON.parse(JSON.parse(log.match(/^INSTRUMENTATION_RESULT: report=(.+)$/m)[1])));}
 const log=read(path.join(native,'grid-native-'+label+'.txt'));if(!log.includes('result=PASS'))throw Error('Native grid failed');const tests=JSON.parse(log.match(/^INSTRUMENTATION_RESULT: tests=(.+)$/m)[1]);add('Android native preview '+label,{passed:tests.length,failed:0,tests});
 const screen=JSON.parse(read(path.join(out,'QA-screen-pixels-android-'+label+'.json')));if(screen.result!=='PASS')throw Error('Screen pixels failed');add('Android screen pixel scan '+label,{passed:1,failed:0,...screen});
}
const android=JSON.parse(read(path.join(native,'release-verification.json'))),html=read(path.join(out,'index.html'));
if(/nativeQA|qaCampaignTimers|id="qaPanel"|__KANTO_(?:MAP|PIKACHU)_/.test(html))throw Error('QA hooks/placeholders in release');
const apk=path.join(root,'releases/Kanto_Tetris_1.8.11_Android.apk');if(sha(apk)!==android.sha256.toLowerCase())throw Error('APK changed after verification');
const result={version:'1.8.11',passed:suites.reduce((n,s)=>n+s.passed,0),failed:0,windowsHTMLSha256:sha(path.join(out,'index.html')),android,suites,limitations:['Android testing used an emulator, not physical Nova hardware.','Windows and Android canvas filtering can soften an edge at fractional scaling; native pixel scans verify uniform spacing, equal line cores and integrated stroke coverage.','The broader campaign/map suites were not rerun for this renderer-only change.']};
fs.writeFileSync(path.join(out,'QA_RESULTS.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,failed:result.failed,windowsHTMLSha256:result.windowsHTMLSha256},null,2));
