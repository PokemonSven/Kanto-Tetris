const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'builds/Kanto_Tetris_Build_1_8_10_LocationMarker'),native=path.join(root,'android/qa-results/1.8.10');
const read=p=>fs.readFileSync(p,'utf8'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const suites=[];
for(const [file,name] of [['QA-map-windows-4x3.json','Windows map 1280×960'],['QA-map-windows-16x9.json','Windows map 1280×720']]){
 const report=JSON.parse(read(path.join(out,file)));if(report.failed||!report.passed)throw Error('Fail/incomplete '+name);
 suites.push({name,...report,buildVersion:'1.8.10'});
}
for(const [file,name] of [['suite-map-4x3.txt','Android map 4:3'],['suite-map-16x9.txt','Android map 16:9']]){
 const text=read(path.join(native,file));if(!text.includes('result=PASS'))throw Error('Fail '+name);
 const encoded=text.match(/^INSTRUMENTATION_RESULT: report=(.+)$/m)[1],report=JSON.parse(JSON.parse(encoded));
 if(report.failed||!report.passed)throw Error('Fail/incomplete '+name);suites.push({name,...report,buildVersion:'1.8.10'});
}
for(const label of ['4x3','16x9']){
 const text=read(path.join(native,'map-native-'+label+'.txt'));if(!text.includes('result=PASS'))throw Error('Native failure');
 const tests=JSON.parse(text.match(/^INSTRUMENTATION_RESULT: tests=(.+)$/m)[1]);suites.push({name:'Android native touch and controller '+label,passed:tests.length,failed:0,tests});
 for(const name of ['preview-map','preview-minimap','preview-maptown']){
  const log=read(path.join(native,name+'-'+label+'.txt'));if(!log.includes('result=PASS'))throw Error('Preview failure');
  fs.copyFileSync(path.join(native,name+'-'+label+'.png'),path.join(out,name.replace('preview-','')+'-android-'+label+'.png'));
 }
}
const verification=JSON.parse(read(path.join(native,'release-verification.json')));
const html=read(path.join(out,'index.html'));if(/nativeQA|qaCampaignTimers|id="qaPanel"|__KANTO_(?:MAP|PIKACHU)_/.test(html))throw Error('Release contains test hook or placeholder');
for(const file of ['ADVENTURE_SLOTS.md','BALANCE.md','BATTLE_TOWER.md','KEEPSAKES.md','ROCKET_STORY.md'])fs.copyFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_8_8_BattleTower',file),path.join(out,file));
fs.copyFileSync(path.join(root,'src/assets/kanto-map-art-prompts.txt'),path.join(out,'MAP_ART_PROMPTS.txt'));
fs.copyFileSync(path.join(root,'src/assets/pikachu-map-sources.txt'),path.join(out,'PIKACHU_SOURCES.txt'));
const result={buildVersion:'1.8.10',passed:suites.reduce((n,s)=>n+s.passed,0),failed:0,windowsHTMLSha256:sha(path.join(out,'index.html')),androidRelease:verification,suites,limitations:['Android checks used an Android 11 emulator with native WebView, touch events and gamepad key events; physical Nova hardware was not available.','Route 11 is rendered as a map-only location because the existing Adventure chain has no Fly cursor for it.']};
fs.writeFileSync(path.join(out,'QA_RESULTS.json'),JSON.stringify(result,null,2));
fs.writeFileSync(path.join(out,'VERSION.txt'),'Kanto Tetris 1.8.10 — Pikachu Map Marker\nWindows: offline browser edition\nAndroid: versionCode 10810\n');
console.log(JSON.stringify({passed:result.passed,failed:0,suites:suites.map(s=>({name:s.name,passed:s.passed})),windowsHTMLSha256:result.windowsHTMLSha256},null,2));
