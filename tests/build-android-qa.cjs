const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),out=path.join(root,'android/out/qa');fs.mkdirSync(path.join(out,'assets'),{recursive:true});
let manifest=fs.readFileSync(path.join(root,'android/AndroidManifest.xml'),'utf8').replace('package="com.kantotetris.game"','package="com.kantotetris.game.qa"').replace('android:name=".MainActivity"','android:name="com.kantotetris.game.MainActivity"').replace('</manifest>','<instrumentation android:name="com.kantotetris.game.SmokeInstrumentation" android:targetPackage="com.kantotetris.game.qa" /></manifest>');
manifest=manifest.replace('<application ','<application android:debuggable="true" ');fs.writeFileSync(path.join(out,'AndroidManifest.xml'),manifest);
let html=fs.readFileSync(path.join(root,'android/assets/index.html'),'utf8');
html=html.replace('"use strict";','"use strict";\nlet qaNow=1000,qaCampaignFast=false;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];const setTimeout=(fn,ms,...args)=>{if(qaCampaignFast&&(ms===850||ms===900)){const timer={fn:()=>fn(...args)};qaCampaignTimers.push(timer);return timer;}return window.setTimeout(fn,ms,...args)};const clearTimeout=id=>{if(id&&typeof id==="object")id.cancelled=true;else window.clearTimeout(id)};');
let fixtures=fs.readFileSync(path.join(__dirname,'android/native-fixture.js'),'utf8');
fixtures+='\nwindow.nativeQASuites={};\n';
for(const [name,file] of Object.entries({audit:'full-audit-browser-suite.js',title:'title-browser-suite.js',handheld:'handheld-browser-suite.js',audio:'music-polish-browser-suite.js',grid:'grid-browser-suite.js',map:'map-browser-suite.js',tower:'tower-browser-suite.js',slots:'slots-browser-suite.js',speed:'speed-browser-suite.js',keepsakes:'keepsakes-browser-suite.js',rocket:'rocket-browser-suite.js',oak:'oak-browser-suite.js',nova:'nova-fixes-browser-suite.js',milestones:'milestones-browser-suite.js',expansion:'expansion-browser-suite.js',practice:'practice-browser-suite.js',tetris:'tetris-browser-suite.js',campaign:'campaign-browser-suite.js',brock:'brock-browser-suite.js',controls:'controls-browser-suite.js',pause:'pause-browser-suite.js',ui:'compact-browser-suite.js',backups:'backup-browser-suite.js',features:'collection-battle-suite.js'})){
 let suite=fs.readFileSync(path.join(__dirname,file),'utf8');
 if(name==='handheld'||name==='title'||name==='audit')suite=suite.replace('// BASE: grid-browser-suite.js',fs.readFileSync(path.join(__dirname,'grid-browser-suite.js'),'utf8').split("$('qaRun').textContent='Run grid QA'")[0]);
 if(name==='campaign')suite+='\n'+fs.readFileSync(path.join(__dirname,'campaign-edge-cases.js'),'utf8');
 // Route the engine's pad read to the fixture's snapshots, retaining all real navigation code.
 const pad=(name==='grid'||name==='map'||name==='tower'||name==='slots'||name==='speed'||name==='keepsakes'||name==='rocket'||name==='oak'||name==='brock'||name==='controls'||name==='ui'||name==='tetris'||(name==='practice'||name==='expansion'||name==='milestones'||name==='nova'))?'firstGamepad=()=>qaPad;':'';
 fixtures+=`\nnativeQASuites.${name}=function(run=true){\n${(name==='map'||name==='tower'||name==='slots'||name==='speed'||name==='keepsakes'||name==='rocket'||name==='campaign'||(name==='practice'||name==='expansion'||name==='nova'))?'qaCampaignFast=true;':''}\n${suite}\n${pad}\nif(run)$('qaRun').click();\n};\n`;
}
const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fixtures+html.slice(end);
fs.writeFileSync(path.join(out,'assets/index.html'),html);

require('./copy-soundtrack.cjs')(path.join(out,'assets'));
