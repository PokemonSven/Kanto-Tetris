// Campaign route/town entry and progression. No chained replacements.
function campaignRouteState(){
 routeChainEnsure();if(!save.routeChain)save.routeChain={cursor:skipEarlyOpeningRouteCursor(),lines:0,mode:'story',visitedCursors:[]};
 if(!Array.isArray(save.routeChain.visitedCursors))save.routeChain.visitedCursors=[];return save.routeChain;
}
function routeChainStartAtCursor(cursor,mode='story',returnCityCursor=null){
 if(isGymBattle())return false;
 cursor=Math.max(0,Math.min(ROUTE_CHAIN_NODES.length-1,+cursor||0));
 if(cursor===LEAGUE_CAVE_CURSOR&&!leagueState().cleared){cursor=LEAGUE_GATE_CURSOR;mode='story';}
 if((cursor===LEAGUE_GATE_CURSOR||cursor===LEAGUE_TOWN_CURSOR)&&!leagueUnlocked()){flashMessage('EIGHT BADGES REQUIRED','Defeat Giovanni and earn all eight badges to enter Indigo Plateau.');return false;}
 const state=campaignRouteState(),node=ROUTE_CHAIN_NODES[cursor];
 if(node.type==='town'){routeChainShowTownAtCursor(cursor);return true;}
 cancelCampaignTransition();rcMinimalCloseTownModal();state.cursor=cursor;state.lines=0;state.mode=mode;state.returnCityCursor=returnCityCursor;
 routeChainMarkVisited(cursor);const targetCity=routeChainNextCityCursor(cursor),target=ROUTE_CHAIN_NODES[targetCity];
 const targetGym=target?.gymIndex!=null?+target.gymIndex:routeChainStoryTargetGymIndex();
 gym=cursor>=LEAGUE_GATE_CURSOR?8:pewterFixOpeningRouteCursor(cursor)?1:Math.max(1,Math.min(8,targetGym+1));
 flyRouteOverride=null;gymLines=0;save.trainingMode={active:true,gymIndex:Math.max(0,Math.min(7,targetGym)),routeName:node.route,lines:0,laps:0,routeChain:true,routeChainMode:mode,noStoryProgress:mode!=='story',returnTownIndex:targetGym,returnCityCursor:returnCityCursor??targetCity};
 // Rogue retains its gym-line progression until the shared League approach.
 // Leaving a story route marked as training prevents the next town from arriving.
 if(!isAdventureMode()&&mode==='story'&&cursor<LEAGUE_GATE_CURSOR)save.trainingMode=null;
 chooseRouteEncounter();resetAdventureBoard();campaignResumePlay();
 if(pewterFixOpeningRouteCursor(cursor))pewterFixClampOwnedLevelsToCap();
 classicalAutoSelectMusic(true);classicalContextChangedAutoSwitch();persist();updateHUD();return true;
}
function routeChainShowTownAtCursor(cursor){
 const c=Math.max(0,Math.min(ROUTE_CHAIN_NODES.length-1,+cursor||0)),node=ROUTE_CHAIN_NODES[c];
 if(!node||node.type!=='town'||isGymBattle())return false;
 if(c===LEAGUE_TOWN_CURSOR&&!leagueUnlocked()){flashMessage('LEAGUE GATE LOCKED','Earn all eight Gym badges first.');return false;}
 cancelCampaignTransition();const state=campaignRouteState();state.cursor=c;state.lines=0;
 save.trainingMode=null;flyRouteOverride=null;routeChainMarkVisited(c);
 const elite=c===LEAGUE_TOWN_CURSOR;
 if(elite){gym=8;gymLines=0;leagueState();}
 save.townStop={active:true,chainTown:true,chainCursor:c,cityName:node.city,gymIndex:node.gymIndex!=null?+node.gymIndex:null,shopStock:makeTownShopStock(),...(elite?{league:true}:{})};
 paused=true;gameOver=false;clearHeldInput();hideOverlay();$('townStatus').textContent='';setModal('townModal',true);
 renderTownStop();classicalAutoSelectMusic(true);classicalContextChangedAutoSwitch();updateHUD();persist();
 if(elite)saveRunProgress('League checkpoint',true);return true;
}
function routeChainContinueFromTownCursor(cursor){
 if(isGymBattle())return false;const c=+cursor;
 if(c===LEAGUE_TOWN_CURSOR){if(leagueState().cleared)return routeChainStartAtCursor(LEAGUE_CAVE_CURSOR,'story');return false;}
 if(skipEarlyIsForbiddenOpeningTownCursor(c))return routeChainStartAtCursor(skipEarlyOpeningRouteCursor(),'story');
 const node=ROUTE_CHAIN_NODES[c];
 if(node?.gymIndex!=null&&!save.badges.includes(node.gymIndex)&&routeChainGymReady(node.gymIndex))return false;
 const pallet=palletContinueRouteCursor(c),start=pallet??rcMinimalFirstRouteAfterTown(c);if(start<0)return false;
 const ok=routeChainStartAtCursor(start,'story');if(ok){feed.unshift(`CONTINUED TOWARD ${routeChainNextDestinationLabel(c)} • STORY PROGRESSION ACTIVE.`);feed=feed.slice(0,12);}return ok;
}
function trainingFlowStartFromTown(cursor){
 const c=+cursor;if(c===LEAGUE_TOWN_CURSOR)return routeChainStartAtCursor(LEAGUE_GATE_CURSOR,'training',c);
 if(!isAdventureMode())return campaignRogueTraining(ROUTE_CHAIN_NODES[c]?.gymIndex??save.townStop?.gymIndex);
 const town=ROUTE_CHAIN_NODES[c],start=trainingFlowFirstRouteAfterPrevTown(c);
 if(!town||town.type!=='town'||start<0)return false;
 if(!routeChainStartAtCursor(start,'training',c))return false;
 Object.assign(save.trainingMode,{naturalRouteTraining:true,noStoryProgress:false,returnCityCursor:c,returnTownIndex:town.gymIndex??save.trainingMode.gymIndex});
 feed.unshift(`TRAINING ROUTE • ${trainingFlowTargetLabel(c)}.`);feed=feed.slice(0,12);persist();updateHUD();return true;
}
function campaignRogueTraining(index){
 if(isAdventureMode()||!Number.isInteger(index)||!GYMS[index]||isGymBattle())return false;
 const result=configureLocalTrainingFromTown(index);
 if(result){delete save.trainingMode.flyTraining;save.trainingMode.campaignTraining=true;campaignResumePlay();persist();}
 return result;
}
function routeChainTrainFromTownCursor(cursor){return trainingFlowStartFromTown(cursor)}
function routeChainChallengeTownGym(){
 const stop=save.townStop;if(!stop?.chainTown)return false;
 if(atLeagueTown()){startEliteBattle();return true;}
 const node=ROUTE_CHAIN_NODES[stop.chainCursor],index=node?.gymIndex;
 if(index==null){flashMessage('NO GYM HERE',`${node?.city||'THIS TOWN'} has no Gym Leader battle.`);return true;}
 if(save.badges.includes(index)||!routeChainGymReady(index)){routeChainRenderTownStop();return true;}
 save.routeChain.lastGymCityCursor=stop.chainCursor;save.trainingMode=null;flyRouteOverride=null;gym=index+1;gymLines=GYMS[index].goal;
 hideTownStop();startGymBattle(index);return true;
}
function routeChainAdvance(amount){
 if(!(amount>0)||isGymBattle())return;
 const state=campaignRouteState();if(!isAdventureMode()&&state.cursor!==LEAGUE_GATE_CURSOR)return;
 const node=routeChainNode();if(node?.type!=='route')return;
 state.lines+=amount;if(save.trainingMode)save.trainingMode.lines=state.lines;
 if(state.cursor===LEAGUE_GATE_CURSOR){if(state.lines>=30)routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);else{persist();updateHUD();}return;}
 const training=state.mode==='training'&&state.returnCityCursor!=null;
 let safety=0;
 while(state.lines>=routeChainLineGoal()&&safety++<ROUTE_CHAIN_NODES.length){
   const finished=routeChainNode(),overflow=state.lines-routeChainLineGoal();routeChainMarkVisited(state.cursor);
   const forced=training?null:skipEarlyOpeningDestinationAfterRouteCursor(state.cursor);
   let nextCursor=forced??state.cursor+1,next=ROUTE_CHAIN_NODES[nextCursor];
   if(training&&(!next||next.type==='town')){
     const town=state.returnCityCursor;state.mode='story';routeChainShowTownAtCursor(town);
     $('townStatus').textContent=`Training route complete. Returned to ${ROUTE_CHAIN_NODES[town]?.city||'town'}.`;return;
   }
   if(!next){state.lines=0;break;}
   if(next.type==='town'){routeChainShowTownAtCursor(nextCursor);return;}
   state.cursor=nextCursor;state.lines=training||forced!=null?0:overflow;routeChainMarkVisited(nextCursor);
   if(save.trainingMode)Object.assign(save.trainingMode,{routeName:next.route,lines:state.lines,routeChainMode:state.mode});
   chooseRouteEncounter();feed.unshift(`${finished.route} CLEARED!`,`ENTERED ${next.route} • CLEAR ${next.length||ROUTE_LEN} LINES.`);feed=feed.slice(0,12);
 }
 if(pewterFixOpeningRouteCursor(state.cursor)){gym=1;pewterFixClampOwnedLevelsToCap();}
 if(save.trainingMode)save.trainingMode.lines=state.lines;persist();updateHUD();
}

function routeChainTownAfterGymLoss(index,cause="Gym battle lost",scoreLost=0){
 cancelCampaignTransition();
 const idx=Math.max(0,Math.min(7,Number(index)||0));
 const cityCursor=routeChainCityCursorByGym(idx);
 clearAdventureRecoveryFlags?.();
 if(idx===2&&typeof clearAllSurgeParalysis==="function")clearAllSurgeParalysis();
 save.gymBattle=null;
 healTeamFull(`${GYMS[idx].city} POKéMON CENTER`);
 save.buddy=save.team[0]||save.buddy;
 if(typeof resetAdventureBoard==="function")resetAdventureBoard();
 else if(typeof resetBoardAfterGymVictory==="function")resetBoardAfterGymVictory();
 routeChainShowTownAtCursor(cityCursor);
 const penalty=scoreLost?` Lost ${scoreLost.toLocaleString()} score (-15%).`:"";
 $("townStatus").textContent=`${cause}.${penalty} Team healed. Train the route chain, shop, heal, or rematch when ready.`;
}

function gymReturnToDefeatedTownAfterBadge(index){
 const idx=Math.max(0,Math.min(7,Number(index)||0));
 const g=GYMS[idx];
 if(!g)return;

 if(typeof clearAdventureRecoveryFlags==="function")clearAdventureRecoveryFlags();
 if(idx===2&&typeof clearAllSurgeParalysis==="function")clearAllSurgeParalysis();

 save.gymBattle=null;
 save.encounterDefeated=false;
 save.trainingMode=null;
 if(typeof flyRouteOverride!=="undefined")flyRouteOverride=null;
 gymLines=0;
 gym=Math.max(1,Math.min(8,idx+1));

 gymReturnCleanBoardForTownPause();

 if(typeof routeChainEnsure==="function")routeChainEnsure();
 const cityCursor=gymReturnCityCursorForGym(idx);
 if(cityCursor>=0&&typeof routeChainShowTownAtCursor==="function"){
   routeChainShowTownAtCursor(cityCursor);
 }else{
   ensureEconomy();
   save.townStop={active:true,gymIndex:idx,shopStock:makeTownShopStock(),postGymReturn:true};
   $("townModal")?.classList.add("show");
   $("townModal")?.setAttribute("aria-hidden","false");
   renderTownStop();
 }

 if(typeof save!=="undefined"){
   if(!Array.isArray(save.badges))save.badges=[];
   if(!save.badges.includes(idx))save.badges.push(idx);
   if(save.routeChain&&cityCursor>=0){
     save.routeChain.cursor=cityCursor;
     save.routeChain.lines=0;
     save.routeChain.mode="story";
     if(!Array.isArray(save.routeChain.visitedCursors))save.routeChain.visitedCursors=[];
     if(!save.routeChain.visitedCursors.includes(cityCursor))save.routeChain.visitedCursors.push(cityCursor);
   }
 }
 if(typeof adventureVisitedCities!=="undefined")adventureVisitedCities.add(idx);

 gymReturnEnsureTownButtonState(idx);

 const nextLabel=(typeof routeChainNextDestinationLabel==="function"&&cityCursor>=0)?routeChainNextDestinationLabel(cityCursor):(idx<7?`${GYMS[idx+1].city} CITY`:"CERULEAN CAVE");
 $("townStatus").textContent=`${g.name} earned! Gym defeated. Heal, shop, train, or Continue On to ${nextLabel}.`;
 feed.unshift(`${g.name} EARNED! RETURNED TO ${g.city} CITY.`);
 feed.unshift(`GYM DEFEATED • CHOOSE TRAINING, CENTER, SHOP, OR CONTINUE ON.`);
 feed=feed.slice(0,12);

 paused=true;
 gameOver=false;
 downHeld=false;
 persist();
 updateHUD();
 renderBadges();
 renderTeam();
 drawBoard();
 if(rogueActive())showRogueRewards();
}
