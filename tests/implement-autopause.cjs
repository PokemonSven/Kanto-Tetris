const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../builds/Kanto_Tetris_Build_1_7_1_AutoPause/index.html');
const original = fs.readFileSync(file, 'utf8');
const newline = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replace(/\r\n/g, '\n');
function replaceOnce(before, after) {
  if (source.split(before).length !== 2) throw new Error('Expected exactly one match: ' + before.slice(0, 120));
  source = source.replace(before, () => after);
}
replaceOnce('· Build 1.7</title>', '· Build 1.7.1</title>');
const oldPause = source.match(/^function togglePause\(\).*$/m)[0];
replaceOnce(oldPause, `// Build 1.7.1: leaving play requires an explicit resume, even if a transition
// or an existing dialog's close handler tries to resume in the meantime.
let autoPauseRequested=false,gameWindowFocused=true;
function gameOutsidePlayView(){
 return document.hidden||!gameWindowFocused||!$("gamePanel")?.classList.contains("active");
}
function pauseDialogOpen(){
 return $("momentModal")?.classList.contains("badge-clickthrough")||["starterModal","studioIntro","titleScreen","townModal","gymIntroModal",
   "eeveeChoiceModal","billsPcModal","oakGuideModal","cropEditorModal","flyModal",
   "dexDetailModal","adventureDifficultyModal","bossTestModal","productionCredits"].some(id=>$(id)?.classList.contains("show"));
}
function enforceAutoPause(){
 if(!save?.starter||gameOver){autoPauseRequested=false;return}
 if(gameOutsidePlayView())autoPauseRequested=true;
 if(pauseDialogOpen()){paused=true;downHeld=false;return}
 if(!autoPauseRequested)return;
 paused=true;downHeld=false;
 $("pauseBtn").textContent="RESUME";
 if(!isGymTransition()&&!pauseDialogOpen()&&!$("overlay").classList.contains("show")){
   showOverlay("PAUSED","PRESS RESUME OR YOUR PAUSE KEY TO CONTINUE.","RESUME");
 }
}
function requestAutoPause(){
 if(!save?.starter||gameOver)return;
 autoPauseRequested=true;enforceAutoPause();
}
function togglePause(){
 if(gameOver||isGymTransition()||pauseDialogOpen()||gameOutsidePlayView())return;
 paused=!paused;autoPauseRequested=false;
 $("pauseBtn").textContent=paused?"RESUME":"PAUSE";
 if(paused)showOverlay("PAUSED","PRESS RESUME OR YOUR PAUSE KEY TO CONTINUE.","RESUME");
 else{hideOverlay();last=performance.now()}
 updateBuddy();
}`);
replaceOnce('function openSvensPcPanel(){\n', 'function openSvensPcPanel(){\n requestAutoPause();\n');
replaceOnce('let battleV25={', '// Combat timestamps advance only while battle gameplay is active.\nlet battleActiveTime=0;\nlet battleV25={');
// Replace only combat timestamps, preserving audio/UI clocks and frame timing.
source = source.replace(/lastClearAt:performance\.now\(\),lastIdleStrikeAt:performance\.now\(\)/g, 'lastClearAt:battleActiveTime,lastIdleStrikeAt:battleActiveTime');
replaceOnce('function v25BattleActive(){return !!(!paused&&!gameOver', 'function v25BattleActive(){return !!(!paused&&!autoPauseRequested&&!gameOutsidePlayView()&&!pauseDialogOpen()&&!gameOver');
replaceOnce('const now=performance.now(),gap=Math.max(0,(now-battleV25.lastClearAt)/1000)', 'const now=battleActiveTime,gap=Math.max(0,(now-battleV25.lastClearAt)/1000)');
replaceOnce('const now=performance.now(),idle=now-battleV25.lastClearAt;', 'const now=battleActiveTime,idle=now-battleV25.lastClearAt;');
replaceOnce('loop=function(t=0){v25IdleTick();return loopV1V25(t)};', `loop=function(t=0){
 enforceAutoPause();
 if(v25BattleActive())battleActiveTime+=Math.max(0,t-last);
 v25IdleTick();
 return loopV1V25(t);
};`);
replaceOnce('battleV25.lastClearAt=performance.now();battleV25.lastIdleStrikeAt=performance.now()', 'battleV25.lastClearAt=battleActiveTime;battleV25.lastIdleStrikeAt=battleActiveTime');
replaceOnce('window.addEventListener("blur",()=>{downHeld=false});', `window.addEventListener("blur",()=>{gameWindowFocused=false;downHeld=false;requestAutoPause()});
window.addEventListener("focus",()=>{gameWindowFocused=true;enforceAutoPause()});
document.addEventListener("visibilitychange",()=>{if(document.hidden)requestAutoPause();else enforceAutoPause()});`);
replaceOnce('document.querySelectorAll(".tabs .tab").forEach(btn=>btn.addEventListener("click",()=>{\n', 'document.querySelectorAll(".tabs .tab").forEach(btn=>btn.addEventListener("click",()=>{\n if(btn.dataset.tab!=="gamePanel")requestAutoPause();\n');
new (require('vm').Script)(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
fs.writeFileSync(file, source.replace(/\n/g, newline));
console.log('Applied narrow auto-pause patch; JavaScript parses successfully.');
