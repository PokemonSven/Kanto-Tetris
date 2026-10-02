const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'builds/Kanto_Tetris_Build_1_8_12_Soundtrack'),native=path.join(root,'android/qa-results/1.8.12');
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),suites=[];
function add(name,report){if(report.failed||!report.passed)throw Error('Failed/incomplete '+name);suites.push({name,...report});}
for(const label of ['4x3','16x9']){
 for(const name of ['audio','map','grid']){
  const report=JSON.parse(read(path.join(out,`QA-${name}-windows-${label}.json`))),size=report.viewport||report.metrics?.viewport;
  if(!size||Math.abs(size[0]/size[1]-(label==='4x3'?4/3:16/9))>.01)throw Error('Wrong viewport '+name+' '+label);
  add('Windows '+name+' '+label,report);
 }
 for(const name of ['audio','map','grid','tetris']){
  const text=read(path.join(native,`suite-${name}-${label}.txt`));if(!text.includes('result=PASS'))throw Error('Android '+name+' '+label);
  add('Android '+name+' '+label,JSON.parse(JSON.parse(text.match(/^INSTRUMENTATION_RESULT: report=(.+)$/m)[1])));
 }
 const text=read(path.join(native,`audio-native-${label}.txt`));if(!text.includes('result=PASS'))throw Error('Native '+label);const tests=JSON.parse(text.match(/^INSTRUMENTATION_RESULT: tests=(.+)$/m)[1]);add('Android native audio '+label,{passed:tests.length,failed:0,tests});
}
for(const name of ['backups','controls']){const text=read(path.join(native,`suite-${name}-16x9.txt`));if(!text.includes('result=PASS'))throw Error(name);add('Android '+name,JSON.parse(JSON.parse(text.match(/^INSTRUMENTATION_RESULT: report=(.+)$/m)[1])));}
const android=JSON.parse(read(path.join(native,'release-verification.json'))),html=read(path.join(out,'index.html')),apk=path.join(root,'releases/Kanto_Tetris_1.8.12_Android.apk');
if(/nativeQA|nativeAudioFocus|qaCampaignTimers|id="qaPanel"|__FRLG_SOUNDTRACK__/.test(html))throw Error('Test hooks in release');
if(sha(apk)!==android.sha256.toLowerCase())throw Error('Release changed after verification');
const music=require('../src/assets/soundtrack.json');for(const t of music.tracks)if(sha(path.join(out,t.file))!==t.sha256)throw Error('Windows music mismatch '+t.file);
const report={version:'1.8.12',passed:suites.reduce((n,s)=>n+s.passed,0),failed:0,windowsHTMLSha256:sha(path.join(out,'index.html')),tracks:music.tracks.length,musicBytes:music.tracks.reduce((n,t)=>n+t.bytes,0),android,suites,limitations:['Android tests used an Android 11 emulator with WebView 83, not a physical Retroid.','Windows browser playback was tested through the local preview. The browser automation policy blocks file:// navigation, so opening the extracted HTML directly was not automated.','Album recordings retain their original endings/fades; these are full-track repeats, not edited seamless loops.','Route 24/25 use the album Road to Cerulean arrangement; Cycling Road and sea routes use Cycling and Surfing.']};
fs.writeFileSync(path.join(out,'QA_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:0,tracks:report.tracks,windowsHTMLSha256:report.windowsHTMLSha256},null,2));
