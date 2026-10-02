// Runs inside the real game closure on a disposable origin/package.
// Only the 850/900ms opponent transition delays are advanced by the QA clock.
musicEnabled=false;sfxEnabled=false;stopMusic();
const campaignResults=[],campaignErrors=[];
window.addEventListener('error',e=>campaignErrors.push(e.message));
document.body.insertAdjacentHTML('beforeend','<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run full campaign QA</button><pre id="qaResults">Ready</pre></aside>');
function cqAssert(value,message){if(!value)throw Error(message)}
function cqClean(){
 qaCampaignTimers.length=0;clearControlsScreens();clearTimeout(showMilestoneMoment.timer);gymVictoryClickthroughActive=false;
 if(productionCredits.open)finishProductionCredits();clearTimeout(productionCredits.timer);
 document.querySelectorAll('.show,.leader-clickthrough,.badge-clickthrough').forEach(e=>e.classList.remove('show','leader-clickthrough','badge-clickthrough'));
 document.querySelector('.app').inert=false;pendingEeveeEvolution=null;gameWindowFocused=true;autoPauseRequested=false;
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
}
function cqSetup(index=0,mode='adventure'){
 cqClean();bossTestPrepareRun(Math.min(index,7));save.bossTest=false;runMode=mode;adventureDifficulty='normal';
 save.badges=Array.from({length:Math.min(index,8)},(_,i)=>i);save.leagueSchema=1;
 save.league={next:Math.max(0,index-8),cleared:false,hallOfFame:[]};save.questActive=[];save.questDone=[];
 save.team=[6,9,3,65,68,131];save.buddy=9;save.starter=9;
 for(const d of save.team)save.collection[d]=bossTestPokemonEntry(GYMS[index].ace+2,d);
 save.routeChain={cursor:index<8?routeChainCityCursorByGym(index):LEAGUE_TOWN_CURSOR,lines:0,mode:'story',visitedCursors:[]};
 hideTownStop();save.gymBattle=null;score=10000;gameOver=false;paused=false;
 if(index>=8)startEliteBattle();else startGymBattle(index);
 // Giovanni's warning is cosmetic; permit the real BATTLE action in fixtures.
 $('gymIntroBtn').disabled=false;beginGymFight();autoPauseRequested=false;paused=false;
 board=emptyBoard();current=piece('T');nextPiece=piece('J');current.y=0;dropCounter=0;
 cqAssert(isGymBattle()&&save.gymBattle.gymIndex===index,'Wrong starting boss');
}
function cqDrain(){const timers=qaCampaignTimers.splice(0);for(const t of timers)if(!t.cancelled)t.fn();}
function cqKO(){
 const before=save.gymBattle.teamIndex;save.encounterHP=1;paused=false;autoPauseRequested=false;hideOverlay();
 board=emptyBoard();board[19].fill('I');board[19][4]='';board[19][5]='';current=piece('O');current.x=4;current.y=0;
 hard();cqAssert(save.encounterDefeated&&save.gymBattle?.transition,'Real line clear did not KO opponent '+before);cqDrain();menuRoot();
}
async function cqCase(name,fn){
 console.log('CAMPAIGN QA: '+name);
 try{await fn();cqAssert(!campaignErrors.length,campaignErrors.join('; '));campaignResults.push({name,result:'PASS'});}
 catch(e){campaignResults.push({name,result:'FAIL',error:e.message});campaignErrors.length=0;}
 $('qaResults').textContent=JSON.stringify({running:name,tests:campaignResults},null,2);
 await new Promise(r=>window.setTimeout(r,0));
}
function cqStored(){return JSON.parse(localStorage.getItem(activeRunSaveKey()))}
function cqResume(){if(isShown('gymIntroModal')){$('gymIntroBtn').disabled=false;$('gymIntroBtn').click();}else{$('overlayBtn').click();}cqAssert(inputCanPlay(),'Restored game cannot resume')}
function cqSaveLoad(){cqAssert(saveRunProgress('campaign QA',true),'Save rejected');cqAssert(loadRunProgress('campaign QA',runMode),'Load rejected')}
$('qaRun').onclick=async()=>{
 $('qaRun').disabled=true;const before=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
 try{
 for(const mode of ['adventure','rogue'])for(let i=0;i<12;i++){
  await cqCase(`${mode}: ${GYMS[i].leader} full team victory and saved checkpoint`,async()=>{
   cqSetup(i,mode);const count=GYMS[i].team.length;
   for(let j=0;j<count;j++){cqAssert(save.gymBattle?.teamIndex===j,'Opponent skipped');cqKO();}
   if(i<8){cqAssert(gymVictoryClickthroughActive,'Leader/badge dialog missing');$('momentContinue').click();await new Promise(r=>window.setTimeout(r,220));menuRoot();$('momentContinue').click();await new Promise(r=>window.setTimeout(r,160));cqAssert(save.badges.includes(i)&&isShown('townModal'),'Badge/town missing');cqAssert(save.townStop.gymIndex===i,'Returned to wrong town');}
   else {cqAssert(leagueState().next===i-7,'Wrong League checkpoint');if(i===11){cqAssert(!productionCredits.open&&!leagueState().cleared&&$('townChallengeBtn').textContent.includes('GARY'),'Champion gate missing');}cqAssert(atLeagueTown()&&paused,'League lobby missing');}
   cqAssert(!isGymBattle(),'Battle stayed active');cqSaveLoad();
   cqAssert(i<8?save.badges.includes(i):leagueState().next===i-7,'Checkpoint lost on reload');
   cqAssert(isShown('townModal')&&paused,'Checkpoint reload must restore paused town');
  });
  await cqCase(`${mode}: ${GYMS[i].leader} stack loss follows mode rules`,()=>{
   cqSetup(i,mode);endGame();
   if(i>=8)cqAssert(atLeagueTown()&&leagueState().next===i-8&&score===8500&&!gameOver,'Elite retry checkpoint/penalty wrong');
   else if(mode==='adventure')cqAssert(isShown('townModal')&&save.townStop.gymIndex===i&&!isGymBattle()&&score===8500,'Adventure loss did not return to town');
   else cqAssert(gameOver,'Rogue stack loss did not end run');
  });
  await cqCase(`${mode}: ${GYMS[i].leader} team blackout recovery`,()=>{
   cqSetup(i,mode);save.team.forEach(d=>save.collection[d].currentHP=0);faintActivePartner();
   if(i>=8)cqAssert(atLeagueTown()&&leagueState().next===i-8&&!isGymBattle(),'Elite blackout lost checkpoint');
   else if(mode==='adventure')cqAssert(isShown('townModal')&&save.townStop.gymIndex===i&&!isGymBattle(),'Adventure blackout did not return to town');
   else cqAssert(!gameOver&&paused&&score===8500,'Rogue blackout did not heal/pause with score penalty');
   cqAssert(save.team.every(d=>save.collection[d].currentHP>0),'Blackout did not heal team');
  });
  await cqCase(`${mode}: ${GYMS[i].leader} mid-battle save restores board HP and hazards`,()=>{
   cqSetup(i,mode);board[19][0]='T';current.x=1;current.y=4;save.encounterHP-=17;save.collection[save.buddy].currentHP-=9;
   save.gymBattle.specialTimer=4567;save.gymBattle.pendingHazards=2;const expected={board:clonePlain(board),current:pieceStateSafe(current),enemy:save.encounterHP,hp:save.collection[save.buddy].currentHP,timer:4567};
   cqSaveLoad();cqAssert(isGymBattle()&&save.gymBattle.gymIndex===i,'Battle replaced by route/town');cqAssert(paused,'Load must pause');
   cqAssert(JSON.stringify(board)===JSON.stringify(expected.board)&&JSON.stringify(current)===JSON.stringify(expected.current),'Board/piece changed during load');
   cqAssert(save.encounterHP===expected.enemy&&save.collection[save.buddy].currentHP===expected.hp,'HP changed on load');
   cqAssert(save.gymBattle.specialTimer===expected.timer&&save.gymBattle.pendingHazards===2,'Hazards reset on load');cqResume();
  });
 }
 for(let i=0;i<8;i++)await cqCase(`Adventure ${GYMS[i].city}: Continue, training and reload keep route progress`,()=>{
   cqSetup(i);save.gymBattle=null;save.badges.push(i);gymReturnToDefeatedTownAfterBadge(i);const town=save.townStop.chainCursor;
   $('townContinueBtn').click();cqAssert(routeChainIsRoute()&&!paused&&!isShown('townModal'),'Continue did not enter route');
   routeChainAdvance(3);const state=clonePlain(save.routeChain);board[19][2]='L';cqSaveLoad();
   cqAssert(save.routeChain.cursor===state.cursor&&save.routeChain.lines===state.lines&&board[19][2]==='L','Route progress/stack reset on load');
   routeChainShowTownAtCursor(town);$('townSkipBtn').click();cqAssert(save.routeChain.mode==='training'&&!paused,'Training did not start');
   for(let n=0;n<20&&!isShown('townModal');n++)routeChainAdvance(routeChainLineGoal());
   cqAssert(isShown('townModal')&&save.townStop.chainCursor===town,'Training did not return to its town');
 });
 await cqCase('Opening routes and route blackouts return to the correct destination',()=>{
  cqSetup();save.gymBattle=null;save.badges=[];routeChainResetForNewAdventure();cqAssert(currentRoute()==='ROUTE 1','Opening route wrong');
  routeChainAdvance(routeChainLineGoal());cqAssert(currentRoute()==='VIRIDIAN FOREST','Opening forest skipped');
  endGame();cqAssert(currentRoute()==='ROUTE 1'&&!gameOver&&!isShown('townModal'),'Opening topout must restart Route 1');
  save.badges=[0];routeChainStartAtRoute('ROUTE 3','story');endGame();cqAssert(save.townStop.gymIndex===0,'Route 3 loss did not return to Pewter');
 });
 for(const dex of [1,4,7,63,133])await cqCase(`Evolution ${BYDEX[dex].name}: team, active partner, registration and reload`,()=>{
  cqSetup(7);save.gymBattle=null;hideTownStop();save.team=[dex];save.buddy=dex;save.collection[dex]=bossTestPokemonEntry(40,dex);const entry=save.collection[dex];
  const evolved=checkLevelEvolution(dex,entry);if(dex===133){cqAssert(pendingEeveeEvolution,'Eevee choice missing');chooseEeveeEvolution(134);}
  cqAssert(save.buddy!==dex&&save.team[0]===save.buddy&&metaDex.has(save.buddy),'Evolution lost ownership/registration');const target=save.buddy;cqSaveLoad();cqAssert(save.team[0]===target&&save.buddy===target,'Evolution lost on reload');
 });
 await cqCase('League gates block early entry and cleared postgame remains unlocked',()=>{
  cqSetup(6);save.gymBattle=null;const cursor=save.routeChain.cursor;routeChainStartAtCursor(LEAGUE_GATE_CURSOR);cqAssert(save.routeChain.cursor===cursor,'League unlocked early');
  save.badges=[0,1,2,3,4,5,6,7];save.league={next:0,cleared:false,hallOfFame:[]};routeChainStartAtCursor(LEAGUE_CAVE_CURSOR);cqAssert(save.routeChain.cursor===LEAGUE_GATE_CURSOR,'Cave bypassed League');
  save.journey.championDefeated=true;save.league={next:4,cleared:true,hallOfFame:save.team.map(d=>({dex:d,level:save.collection[d].level}))};routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);$('townContinueBtn').click();cqAssert(currentRoute()==='CERULEAN CAVE'&&inputCanPlay(),'Postgame route blocked');cqSaveLoad();cqAssert(currentRoute()==='CERULEAN CAVE'&&leagueState().cleared,'Postgame unlock lost');
 });
 await cqCase('Agatha and Brock forced pieces survive save/load and consume exactly one queued hazard',()=>{
  for(const i of [0,10]){cqSetup(i);save.gymBattle.pendingHazards=2;cqSaveLoad();cqResume();cqAssert(nextViewerHidden()===(i===10),'Preview visibility wrong');const next=JSON.stringify(nextPiece);hard();cqAssert(current.specialRockfall&&current.type===(i===10?'G':'X'),'Queued hazard was bypassed');cqAssert(save.gymBattle.pendingHazards===1&&JSON.stringify(nextPiece)===next,'Hazard consumed normal NEXT or wrong queue count');}
 });
 if(typeof runCampaignEdgeCases==='function')await runCampaignEdgeCases();
 }finally{cqClean();for(const k of Object.keys(localStorage))if(!before.has(k))localStorage.removeItem(k);for(const [k,v] of before)localStorage.setItem(k,v);}
 $('qaResults').textContent=JSON.stringify({passed:campaignResults.filter(t=>t.result==='PASS').length,failed:campaignResults.filter(t=>t.result==='FAIL').length,tests:campaignResults},null,2);$('qaResults').dataset.complete='true';
};


