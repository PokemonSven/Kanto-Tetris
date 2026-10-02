const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),base=path.join(root,'builds/Kanto_Tetris_Build_1_7_2_Controls'),out=path.join(root,'builds/Kanto_Tetris_Build_1_7_3_SavePortability');
if(!fs.existsSync(out))fs.cpSync(base,out,{recursive:true});
let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
function once(from,to){const i=html.indexOf(from);if(i<0||html.indexOf(from,i+from.length)>=0)throw new Error('Expected unique anchor: '+from.slice(0,100));html=html.slice(0,i)+to+html.slice(i+from.length)}
once('const DEFAULT_CONTROLS=',fs.readFileSync(path.join(root,'src/save-storage.js'),'utf8')+'\nconst DEFAULT_CONTROLS=');
once('function persist(){\n persistMetaDex();','function persist(){\n if(portabilityStorageLocked||portabilityBusy)return;\n persistMetaDex();');
once('function saveUserCropSet(key,data){try{','function saveUserCropSet(key,data){if(portabilityStorageLocked||portabilityBusy)return;try{');
once('const navModalIds=["controlsConfirm",','const navModalIds=["controlsConfirm","backupModal",');
once('if(["left","right","up","down"].includes(direction)&&index>=0){','// Up/down traverses every item, including tall Continue cards. Left/right follows spatial rows.\n if(["left","right"].includes(direction)&&index>=0){');
once('const close={controlsConfirm:cancelControlsConfirm,','const close={backupModal:closeBackupManager,controlsConfirm:cancelControlsConfirm,');
once('"fieldMenuModal","controlsConfirm"].some','"fieldMenuModal","controlsConfirm","backupModal"].some');
once('["productionCredits","eeveeChoiceModal","starterModal","titleScreen","gymIntroModal"].some(isShown)','["productionCredits","eeveeChoiceModal","starterModal","titleScreen","gymIntroModal","backupModal"].some(isShown)');
once('initializeControlsUI();initCropEditorEvents();',fs.readFileSync(path.join(root,'src/save-validation.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/save-portability.js'),'utf8')+'\ninitializeControlsUI();initializeSavePortability();initCropEditorEvents();');
html=html.replaceAll('Build 1.7.2','Build 1.7.3');
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())new vm.Script(m[1],{filename:`game-${i}.js`});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(root,'inspection/source-1.7.3.html'),html.replace(/data:[^;,"'\s]+;base64,[A-Za-z0-9+/=]+/g,'data:ART_OMITTED'));
console.log('Built 1.7.3; JavaScript parsed.');
