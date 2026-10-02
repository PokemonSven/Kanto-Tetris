async function runCampaignEdgeCases(){
 const tick=()=>{paused=false;autoPauseRequested=false;board=emptyBoard();board[19].fill('I');board[19][4]='';board[19][5]='';current=piece('O');current.x=4;current.y=0;hard();};
 for(const mode of ['adventure','rogue'])for(let i=0;i<8;i++)await cqCase(`${mode}: boundary line clears reach the town after ${GYMS[i].leader}`,async()=>{
  cqSetup(i,mode);save.gymBattle=null;save.badges.push(i);gymReturnToDefeatedTownAfterBadge(i);$('townContinueBtn').click();cqAssert(inputCanPlay(),'Continue did not resume');
  let clears=0;while(!isShown('townModal')&&clears++<30){
   // Seed progress immediately before each boundary; exercise real line clearing
   // and every transition without spending hundreds of frames grinding levels.
   if(save.routeChain){save.routeChain.lines=routeChainLineGoal()-1;if(save.trainingMode)save.trainingMode.lines=save.routeChain.lines;}
   gymLines=gymData().goal-1;tick();await new Promise(r=>window.setTimeout(r,0));
  }
  cqAssert(isShown('townModal'),'Route never reached a town');
  const stop=save.townStop;cqAssert(i===7?atLeagueTown():stop.gymIndex==null||stop.gymIndex>i,'Returned to defeated gym');
 });
 await cqCase('Rogue initial town supports heal, training, challenge and reload',()=>{
  cqSetup(0,'rogue');save.gymBattle=null;showTownStop(0);cqAssert(!save.townStop.chainTown,'Fixture is not a legacy Rogue town');
  save.team.forEach(d=>save.collection[d].currentHP=1);$('townCenterBtn').click();cqAssert(save.team.every(d=>save.collection[d].currentHP>1),'Center did not heal');
  const stock=JSON.stringify(save.townStop.shopStock);cqSaveLoad();cqAssert(isShown('townModal')&&JSON.stringify(save.townStop.shopStock)===stock,'Shop rerolled on reload');
  $('townSkipBtn').click();cqAssert(!isShown('townModal')&&!paused,'Rogue training did not start');cqSaveLoad();cqResume();cqAssert(save.trainingMode?.campaignTraining,'Rogue training lost on reload');
  $('trainingGymBtn').click();cqAssert(isShown('townModal')&&save.townStop.gymIndex===0,'Rogue training return failed');$('townChallengeBtn').click();cqAssert(isGymBattle()&&isShown('gymIntroModal'),'Rogue challenge failed');
 });
 for(const i of [0,10])await cqCase(`${GYMS[i].leader}: active forced piece and warning survive reload without reroll`,()=>{
  cqSetup(i);save.gymBattle.pendingHazards=2;hard();cqAssert(current.specialRockfall,'Hazard did not spawn');
  current.x=2;current.y=3;save.gymBattle.eliteWarning=1555;const p=JSON.stringify(pieceStateSafe(current)),q=JSON.stringify(pieceStateSafe(nextPiece));cqSaveLoad();cqResume();
  cqAssert(JSON.stringify(current)===p&&JSON.stringify(nextPiece)===q&&save.gymBattle.pendingHazards===1&&save.gymBattle.eliteWarning===1555,'Active hazard changed');
  cqAssert(nextViewerHidden()===(i===10),'Agatha preview suppression lost');
 });
 await cqCase('Saved combat clock retains remaining idle pressure, with no pause debt',()=>{
  cqSetup(10);battleActiveTime=24000;battleV25.lastClearAt=17000;battleV25.lastIdleStrikeAt=17000;battleV25.combo=2;battleV25.b2bTetris=true;
  cqSaveLoad();qaNow+=300000;loop(qaNow);cqResume();cqAssert(battleActiveTime===24000&&battleV25.lastClearAt===17000&&battleV25.combo===2&&battleV25.b2bTetris,'Combat timing was reset or accrued while paused');
 });
 await cqCase('Loading during a KO advances once and cancels the old callback',()=>{
  cqSetup(10);save.encounterHP=1;tick();const stale=qaCampaignTimers[0];cqAssert(save.gymBattle.transition,'No pending transition');
  cqSaveLoad();const index=save.gymBattle.teamIndex;stale.fn();cqAssert(index===1&&save.gymBattle.teamIndex===1&&!save.gymBattle.transition,'KO transition skipped or repeated');
 });
 await cqCase('A delayed KO from an abandoned run cannot change a new battle',()=>{
  cqSetup(0);save.encounterHP=1;tick();const stale=qaCampaignTimers[0];cqSetup(1);const hp=save.encounterHP;stale.fn();cqAssert(save.gymBattle.gymIndex===1&&save.gymBattle.teamIndex===0&&save.encounterHP===hp,'Old callback mutated new run');
 });
 await cqCase('Last Elite KO reload awards one checkpoint and one prize',()=>{
  cqSetup(10);loadGymPokemon(GYMS[10].team.length-1);save.encounterHP=1;tick();const stale=qaCampaignTimers[0],money=save.money;cqSaveLoad();cqAssert(atLeagueTown()&&leagueState().next===3&&save.money===money+2500,'Final KO was not committed');const after=save.money;stale.fn();completeGymBattle();cqSaveLoad();cqAssert(save.money===after&&leagueState().next===3,'Repeated final KO reward');
 });
 await cqCase('Trainer cannot claim victory or bypass pending hazards by changing route',()=>{
  cqSetup(0);save.gymBattle.pendingHazards=2;const state=JSON.stringify(save.gymBattle);completeGymBattle();routeChainStartAtCursor(skipEarlyOpeningRouteCursor());routeChainShowTownAtCursor(routeChainCityCursorByGym(0));cqAssert(JSON.stringify(save.gymBattle)===state&&!save.badges.includes(0),'Premature battle exit');
 });
 await cqCase('Old saves without combat timing resume safely; pre-League cursor migration is idempotent',()=>{
  cqSetup(10);const data=runSnapshot();delete data.combatState;localStorage.setItem(activeRunSaveKey(),JSON.stringify(data));cqAssert(loadRunProgress('legacy','adventure'),'Legacy load failed');cqResume();
  const legacy=clonePlain(save);delete legacy.leagueSchema;legacy.routeChain.cursor=LEAGUE_GATE_CURSOR;const migrated=cleanRunSaveObject(legacy);cqAssert(migrated.routeChain.cursor===LEAGUE_GATE_CURSOR+2,'Old postgame cursor not migrated');cqAssert(cleanRunSaveObject(migrated).routeChain.cursor===migrated.routeChain.cursor,'Cursor migrated twice');
 });
 await cqCase('Adventure and Rogue saves remain separate, and Boss Test cannot overwrite either',()=>{
  cqSetup(0,'adventure');score=1111;cqSaveLoad();cqSetup(1,'rogue');score=2222;cqSaveLoad();cqAssert(loadRunProgress('mode','adventure')&&score===1111,'Adventure overwritten');cqAssert(loadRunProgress('mode','rogue')&&score===2222,'Rogue overwritten');const before=localStorage.getItem(activeRunSaveKey());save.bossTest=true;cqAssert(!saveRunProgress('test',true)&&localStorage.getItem(activeRunSaveKey())===before,'Boss Test overwrote save');
 });
 await cqCase('Training reload keeps destination and shop reload keeps stock',()=>{
  cqSetup(4);save.gymBattle=null;const town=routeChainCityCursorByGym(4);routeChainShowTownAtCursor(town);const stock=JSON.stringify(save.townStop.shopStock);cqSaveLoad();cqAssert(JSON.stringify(save.townStop.shopStock)===stock,'Reload rerolled stock');$('townSkipBtn').click();routeChainAdvance(3);const before=clonePlain(save.trainingMode);cqSaveLoad();cqAssert(save.trainingMode.returnCityCursor===before.returnCityCursor&&save.trainingMode.naturalRouteTraining,'Training metadata lost');
 });
 await cqCase('Malformed local checkpoint is rejected before changing the live run',()=>{
  cqSetup(2);const owner=save;const data=runSnapshot();data.save.gymBattle.gymIndex=99;localStorage.setItem(activeRunSaveKey(),JSON.stringify(data));cqAssert(!loadRunProgress('invalid','adventure')&&save===owner&&save.gymBattle.gymIndex===2,'Invalid save mutated run');
 });
 await cqCase('Backup validation accepts the combat clock and rejects malformed timing',()=>{
  cqSetup(10);const data=runSnapshot();validateBackupRun(data,'adventure');data.combatState.activeTime='invalid';let rejected=false;try{validateBackupRun(data,'adventure')}catch(e){rejected=true}cqAssert(rejected,'Invalid combat clock accepted');
 });
}
