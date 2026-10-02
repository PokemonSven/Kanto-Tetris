// One snapshot/restore path for Adventure, Rogue, normal gyms and Elite battles.
function cleanRunSaveObject(raw){
 const base=freshRun(),src=(raw&&typeof raw==="object")?raw:{};
 const out={...base,...src};
 out.collection=(src.collection&&typeof src.collection==="object")?src.collection:{};
 out.stats={...base.stats,...(src.stats||{})};
 for(const key of ["team","pc","badges","items","svenPcItems","questActive","questDone"])if(!Array.isArray(out[key]))out[key]=[];
 if(!out.questProgress||typeof out.questProgress!=="object")out.questProgress={};
 if(out.trainingMode&&typeof out.trainingMode==="object"){
   out.trainingMode={active:!!out.trainingMode.active,gymIndex:Math.max(0,Math.min(7,Number.isFinite(+out.trainingMode.gymIndex)?+out.trainingMode.gymIndex:0)),lines:Math.max(0,+out.trainingMode.lines||0),laps:Math.max(0,+out.trainingMode.laps||0)};
 }else out.trainingMode=null;
 if(out.gymBattle&&typeof out.gymBattle==="object")out.gymBattle={pendingHazards:0,shockTimer:0,poisonActive:false,poisonLinesRemaining:0,psychicSpinTimer:0,psychicSpinRotateTimer:0,flameWarningTimer:0,flameColumn:0,quakeWarningTimer:0,...out.gymBattle};
 if(!src.leagueSchema){
   const shift=n=>Number.isInteger(n)&&n>=LEAGUE_GATE_CURSOR?n+2:n;
   if(out.routeChain){for(const key of ['cursor','returnCityCursor','lastGymCityCursor'])out.routeChain[key]=shift(out.routeChain[key]);if(Array.isArray(out.routeChain.visitedCursors))out.routeChain.visitedCursors=out.routeChain.visitedCursors.map(shift);}
   if(out.townStop)out.townStop.chainCursor=shift(out.townStop.chainCursor);
 }
 // Keep route/training metadata, which the original loader discarded.
 if(src.trainingMode&&out.trainingMode)out.trainingMode={...src.trainingMode,...out.trainingMode};
 out.journey=normalizeJourney(src.journey,src);out.trainer=normalizedTrainer(src.trainer);
 out.rocketStory=src.rocketStory||freshRocketStory();
 out.tetris=cleanTetrisState(src.tetris);out.leagueSchema=1;return normalizeKeepsakes(normalizeRunRoster(out));
}

function runSnapshot(){
 normalizeKeepsakes(normalizeRunRoster(save));save.leagueSchema=1;leagueState();
 const snapshot={version:1,savedAt:Date.now(),mode:runMode,adventureDifficulty,save:clonePlain(save),gym,gymLines,board:clonePlain(board||emptyBoard()),current:pieceStateSafe(current),nextPiece:pieceStateSafe(nextPiece),score,runLines,bag:Array.isArray(bag)?bag.slice():[],feed:Array.isArray(feed)?feed.slice(0,12):[],combatState:{activeTime:battleActiveTime,battle:clonePlain(battleV25)}};
 if(snapshot.save.townStop?.flyTown)snapshot.save.townStop=null;
 if(snapshot.save.trainingMode?.flyTraining)snapshot.save.trainingMode=null;
 return snapshot;
}
function saveRunProgress(reason='manual',quiet=false){
 if(practiceSession)return false;
 if(portabilityBusy||portabilityStorageLocked){if(!portabilityBusy)reportSave('recovery',false,'Autosave paused — open Backups for recovery');return false;}
 if(save?.bossTest){reportSave('run',true,'BOSS TEST • NORMAL SAVES UNCHANGED');return false;}
 if(!save?.starter){if(!quiet)renderSaveControls('CHOOSE A STARTER BEFORE SAVING A RUN.');return false;}
 let ok=false;
 try{localStorage.setItem(activeRunSaveKey(),JSON.stringify(runSnapshot()));ok=true;if(!quiet)renderSaveControls(`${modeLabel()} SAVED.`);}
 catch(err){console.warn('Run save unavailable',err);if(!quiet)renderSaveControls('SAVE FAILED: BROWSER STORAGE UNAVAILABLE.');}
 reportSave('run',ok,ok?`${runMode==='adventure'?`Adventure Slot ${activeAdventureSlot}`:'Rogue'} saved • ${new Date().toLocaleTimeString()}`:'Run save failed — check browser storage');return ok;
}
function loadRunProgress(source='manual',requestedMode=runMode){
 if(practiceSession)return false;
 const targetMode=requestedMode==='adventure'?'adventure':'rogue';let data;
 try{
   data=JSON.parse(localStorage.getItem(activeRunSaveKey(targetMode))||'null');
   if(!data?.save||typeof data.save!=='object'||Array.isArray(data.save))throw Error('No saved run');
   const b=data.save.gymBattle,r=data.save.routeChain;
   if(b&&(!Number.isInteger(b.gymIndex)||!GYMS[b.gymIndex]?.team?.[b.teamIndex]))throw Error('Invalid boss checkpoint');
   if(r&&(!Number.isInteger(r.cursor)||!ROUTE_CHAIN_NODES[r.cursor]))throw Error('Invalid route checkpoint');
   validateExpansionSave(data.save);
   if(b?.gymIndex>=16&&targetMode!=='adventure')throw Error('Rocket checkpoint mode mismatch');
   if(data.save.tower?.active&&(targetMode!=='adventure'||data.save.tower.active.difficulty!==data.adventureDifficulty))throw Error('Tower checkpoint difficulty mismatch');
   if(data.save.legendary?.active&&data.save.legendary.active.returnSnapshot.mode!==targetMode)throw Error('Legendary checkpoint mode mismatch');
   if(data.version!==undefined&&data.version!==1)throw Error('Unsupported saved run');
 }
 catch(err){renderSaveControls(`NO VALID SAVED ${targetMode.toUpperCase()} FOUND.`);return false;}
 return restoreRunSnapshot(data,targetMode);
}
function restoreRunSnapshot(data,targetMode,liveRuntime=null){
 // Restore data once. Entering a new route is deliberately not part of loading.
 cancelCampaignTransition();clearControlsScreens();
 runMode=targetMode;adventureDifficulty=isAdventureMode()?normalizedAdventureDifficulty(data.adventureDifficulty):'normal';
 save=cleanRunSaveObject(data.save);syncStoryTrainers();syncTowerTrainers();leagueState();
 if(!Number.isFinite(save.adventureRecoveryLines))save.adventureRecoveryLines=0;
 if(typeof save.adventureRecoveryReturnToGym!=='boolean')save.adventureRecoveryReturnToGym=false;
 if(typeof save.adventureRecoveryReturnToTown!=='boolean')save.adventureRecoveryReturnToTown=false;
 gym=Number.isFinite(data.gym)?data.gym:Math.max(1,Math.min(8,save.badges.length+1));gymLines=Number.isFinite(data.gymLines)?data.gymLines:0;
 board=boardStateSafe(data.board);bag=Array.isArray(data.bag)?data.bag.slice():[];current=pieceStateSafe(data.current);nextPiece=pieceStateSafe(data.nextPiece);resetPieceMotion(false);
 score=Number.isFinite(data.score)?data.score:0;runLines=Number.isFinite(data.runLines)?data.runLines:0;feed=Array.isArray(data.feed)?data.feed.slice(0,12):[];
 paused=true;gameOver=false;dropCounter=0;clearHeldInput();last=performance.now();autoPauseRequested=false;
 ['studioIntro','titleScreen','starterModal','townModal','gymIntroModal','adventureDifficultyModal','eeveeChoiceModal','billsPcModal','oakGuideModal','cropEditorModal'].forEach(id=>setModal(id,false));
 selectGamePanel('gamePanel');hideOverlay();pendingEeveeEvolution=null;
 resetAdventureFlyRuntime();
 if(liveRuntime){flyRouteOverride=clonePlain(liveRuntime.flyRouteOverride);adventureVisitedRoutes=new Set(liveRuntime.routes);adventureVisitedCities=new Set(liveRuntime.cities);adventureFlyUnlocked=liveRuntime.unlocked;adventureFlyPrompted=liveRuntime.prompted;}
 if(isAdventureMode()){save.adventureSpeedRisk=normalizedAdventureSpeed(save.adventureSpeedRisk||1);campaignRouteState();trackAdventureVisit();}
 v25ResetBattleState('SAVED BATTLE');
 const combat=data.combatState;
 if(combat&&Number.isFinite(combat.activeTime)&&combat.battle&&typeof combat.battle==='object'){
   battleActiveTime=Math.max(0,combat.activeTime);
   for(const key of ['lastClearAt','lastIdleStrikeAt','combo','lastClearGap','lastHitPower'])if(Number.isFinite(combat.battle[key]))battleV25[key]=combat.battle[key];
   battleV25.b2bTetris=!!combat.battle.b2bTetris;
 }
 if(towerActive()?.stage!=='battle'&&towerActive()){
   save.townStop=null;restoreTowerUI();
 }else if(legendaryActive()){
   save.townStop=null;legendaryRestoreUI();
 }else if(isGymBattle()){
   save.townStop=null;if(isEliteBattle())gym=8;
   if(save.gymBattle.transition){
     const next=save.gymBattle.teamIndex+1;
     if(next>=GYMS[save.gymBattle.gymIndex].team.length){completeGymBattle();return true;}
     loadGymPokemon(next);
   }
   if(!nextPiece)nextPiece=piece(take());if(!current){current=nextPiece;nextPiece=piece(take());}
   showGymIntro(save.gymBattle.gymIndex);$('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='RESUME BATTLE';
 }else if(save.townStop?.active){
   // Preserve shop stock, current town and League checkpoint without creating a new visit.
   setModal('townModal',true);renderTownStop();resetMenuFocus($('townModal'));
 }else{
   if(!nextPiece)nextPiece=piece(take());if(!current){current=nextPiece;nextPiece=piece(take());}
   ensureRouteEncounter();showOverlay(`${modeLabel()} LOADED`,`Loaded saved progress from ${new Date(data.savedAt||Date.now()).toLocaleString()}.`,'RESUME');
 }
 paused=true;applyGymTheme();drawNext();drawBoard();updateHUD();renderDex();renderBadges();renderTeam();renderSvenPc();renderControlPanels();renderAdventureSpeedControls();updateFlyButton();
 renderSaveControls(`${modeLabel()} LOADED. PRESS RESUME TO CONTINUE.`);restoreExpansionUI();return true;
}
