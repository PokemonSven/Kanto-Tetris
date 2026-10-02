// Injected only by the local QA server, inside the game's closure. Not shipped.
musicEnabled=false;sfxEnabled=false;stopMusic();
document.body.insertAdjacentHTML('beforeend','<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run pause regression suite</button><pre id="qaResults">Ready</pre></aside>');
const qaResults=[];
function qaAssert(ok,message){if(!ok)throw new Error(message)}
function qaAdvance(ms){qaNow+=ms;loop(qaNow)}
function qaHP(){return save.collection[String(save.buddy)].currentHP}
function qaState(){return JSON.stringify({board,current,nextPiece,bag,hp:qaHP(),battle:save.gymBattle,score,runLines,dropCounter})}
function qaTab(id){document.querySelector(`.tabs .tab[data-tab="${id}"]`).click()}
function qaSetup(){
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
 if(typeof autoPauseRequested!=='undefined')autoPauseRequested=false;
 if(typeof gameWindowFocused!=='undefined')gameWindowFocused=true;
 document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'));
 qaTab('gamePanel');
 document.querySelector('[data-elite-test="2"]').click();
 beginGymFight();
 qaAssert(!paused&&isEliteBattle(),'Agatha test did not start');
}
async function qaTest(name,test){
 try{qaSetup();await test();qaResults.push({name,result:'PASS'})}
 catch(error){qaResults.push({name,result:'FAIL',error:error.message})}
 $('qaResults').textContent=JSON.stringify(qaResults,null,2);
}
$('qaRun').addEventListener('click',async()=>{
 $('qaRun').disabled=true;qaResults.length=0;
 for(const tab of ['optionsPanel','dexPanel','badgePanel'])await qaTest(`${tab}: freeze and explicit resume`,()=>{
   qaAdvance(4000);const hp=qaHP();qaTab(tab);
   qaAssert(paused,'Opening tab did not pause');
   const frozen=qaState();qaAdvance(300000);
   qaAssert(qaState()===frozen,'Board, HP, score, or boss timer changed in menu');
   togglePause();qaAssert(paused,'Pause key resumed behind menu');
   qaTab('gamePanel');qaAssert(paused,'Returning to GAME auto-resumed');
   togglePause();qaAssert(!paused,'Explicit resume failed');
   qaAdvance(5900);qaAssert(qaHP()===hp,'Paused time caused early idle damage');
   qaAdvance(100);qaAssert(qaHP()<hp,'Idle attack did not resume at its original deadline');
 });
 await qaTest("Sven's PC pauses",()=>{
   qaAdvance(4000);openSvensPcPanel();qaAssert(paused,'Item storage did not pause');
   const frozen=qaState();qaAdvance(60000);qaAssert(qaState()===frozen,'Storage did not freeze battle');
   qaTab('gamePanel');qaAssert(paused,'Storage return auto-resumed');togglePause();qaAssert(!paused,'Storage return could not resume');
 });
 await qaTest('Manual pause retains first and repeat idle deadlines',()=>{
   qaAdvance(4000);let hp=qaHP();togglePause();qaAdvance(300000);togglePause();
   qaAdvance(5999);qaAssert(qaHP()===hp,'First idle strike arrived early');
   qaAdvance(1);qaAssert(qaHP()<hp,'First strike deadline was not preserved');
   hp=qaHP();qaAdvance(3000);togglePause();qaAdvance(300000);togglePause();
   qaAdvance(5999);qaAssert(qaHP()===hp,'Repeat idle strike arrived early');
   qaAdvance(1);qaAssert(qaHP()<hp,'Repeat idle strike deadline was not preserved');
 });
 await qaTest('Window blur requires explicit resume after focus returns',()=>{
   qaAdvance(4000);window.dispatchEvent(new Event('blur'));qaAssert(paused,'Blur did not pause');
   const frozen=qaState();qaAdvance(60000);qaAssert(qaState()===frozen,'Blur did not freeze battle');
   togglePause();qaAssert(paused,'Game resumed without focus');
   window.dispatchEvent(new Event('focus'));qaAssert(paused,'Focus auto-resumed');
   togglePause();qaAssert(!paused,'Focused game could not resume');
 });
 await qaTest('Hidden tab requires explicit resume after becoming visible',()=>{
   qaAdvance(4000);Object.defineProperty(document,'hidden',{configurable:true,value:true});
   document.dispatchEvent(new Event('visibilitychange'));qaAssert(paused,'Hidden page did not pause');
   const frozen=qaState();qaAdvance(300000);qaAssert(qaState()===frozen,'Hidden page did not freeze battle');
   Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
   qaAssert(paused,'Visibility auto-resumed');togglePause();qaAssert(!paused,'Visible game could not resume');
 });
 await qaTest('Agatha warning and queued ghost survive a long menu pause',()=>{
   qaAdvance(25000);qaAssert(save.gymBattle.eliteWarning===3000,'Expected three-second warning');
   qaTab('optionsPanel');const frozen=qaState();qaAdvance(300000);qaAssert(qaState()===frozen,'Warning elapsed in menu');
   qaTab('gamePanel');togglePause();qaAdvance(2999);qaAssert(save.gymBattle.eliteWarning===1,'Warning remainder changed');
   qaAdvance(1);qaAssert(save.gymBattle.pendingHazards===1,'Ghost was not queued after remaining warning');
   qaAssert(nextViewerHidden(),'Agatha NEXT masking regressed');
   qaTab('dexPanel');const queued=qaState();qaAdvance(60000);qaAssert(qaState()===queued,'Queued ghost changed while paused');
 });
 await qaTest('Oak dialog freezes combat clock and preserves its close behavior',()=>{
   qaAdvance(4000);const hp=qaHP();openOakGuide();qaAssert(paused,'Oak did not pause');
   const frozen=qaState();qaAdvance(300000);qaAssert(qaState()===frozen,'Oak dialog did not freeze battle');
   togglePause();qaAssert(paused,'Pause key bypassed Oak dialog');
   closeOakGuide();qaAssert(!paused,'Oak close behavior changed');
   qaAdvance(5900);qaAssert(qaHP()===hp,'Oak reading time caused idle damage');
   qaAdvance(100);qaAssert(qaHP()<hp,'Idle deadline lost after Oak dialog');
 });
 await qaTest('Pokémon transition cannot restart combat after focus loss',async()=>{
   defeatGymPokemon(save.encounterDex);qaAssert(isGymTransition(),'KO transition did not start');
   window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));
   await new Promise(resolve=>window.setTimeout(resolve,1000));
   qaAdvance(1);qaAssert(save.gymBattle.teamIndex===1,'Opponent transition did not complete');
   qaAssert(paused&&!v25BattleActive(),'Opponent transition resumed combat');
   togglePause();qaAssert(!paused&&v25BattleActive(),'Could not resume after opponent transition');
 });
 await qaTest('Pokémon transition cannot restart combat behind Oak dialog',async()=>{
   defeatGymPokemon(save.encounterDex);openOakGuide();
   await new Promise(resolve=>window.setTimeout(resolve,1000));
   const frozen=qaState();qaAdvance(300000);
   qaAssert(paused&&!v25BattleActive()&&qaState()===frozen,'Opponent transition resumed behind Oak dialog');
   closeOakGuide();qaAssert(paused,'Closing dialog lost the previous paused state');togglePause();qaAssert(!paused,'Could not resume after closing Oak');
 });
 await qaTest('Rapid-clear bonus uses active time consistently',()=>{
   qaAdvance(1000);v25LineSkillMultiplier(1);qaAdvance(1000);togglePause();qaAdvance(300000);togglePause();
   const skill=v25LineSkillMultiplier(1);qaAssert(skill.gap===1&&skill.rapid===1.15,'Pause consumed rapid-clear time');
 });
 await qaTest('Load-style paused state gets no idle debt',()=>{
   v25ResetBattleState('LOADED');paused=true;qaAdvance(300000);togglePause();const hp=qaHP();
   qaAdvance(9999);qaAssert(qaHP()===hp,'Loaded pause caused early strike');qaAdvance(1);qaAssert(qaHP()<hp,'Loaded game idle timer did not resume');
 });
 paused=true;
 $('qaResults').textContent=JSON.stringify({passed:qaResults.filter(x=>x.result==='PASS').length,failed:qaResults.filter(x=>x.result==='FAIL').length,tests:qaResults},null,2);
});
