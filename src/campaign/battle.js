// Owns battle entry, opponent transitions, victory and mode-specific loss dispatch.
// A callback belongs to one save, battle object and opponent; it cannot affect a
// restarted or loaded run, even if the next run is fighting the same leader.
let campaignTransitionTimer=null,campaignTransitionEpoch=0;
function cancelCampaignTransition(){clearTimeout(campaignTransitionTimer);campaignTransitionTimer=null;campaignTransitionEpoch++;}
function campaignResumePlay(){autoPauseRequested=false;clearHeldInput();paused=false;gameOver=false;last=performance.now();dropCounter=0;enforceAutoPause();}
function campaignNewBattle(index){
 cancelCampaignTransition();
 return {active:true,gymIndex:index,teamIndex:0,transition:false,specialTimer:0,pendingHazards:0,shockTimer:0,poisonActive:false,poisonLinesRemaining:0,psychicSpinTimer:0,psychicSpinRotateTimer:0,flameWarningTimer:0,flameColumn:0,quakeWarningTimer:0,quakeDirection:0,eliteWarning:0,eliteVeil:0,battleLines:0};
}
function startGymBattle(index){
 if(isGymBattle()||save.badges.includes(index)||index<0||index>=8)return;
 const g=GYMS[index];if(!g)return;
 if(index===2)clearAllSurgeParalysis();
 save.gymBattle=campaignNewBattle(index);gymLines=g.goal;
 resetBoardForGymChallenge();applyGymTheme();loadGymPokemon(0);
 feed.unshift(`GYM ALERT! ${g.leader} IS READY TO BATTLE.`);feed=feed.slice(0,12);
 showGymIntro(index);if(index===7)showGiovanniRobberyDialogue();
 classicalAutoSelectMusic(true);classicalContextChangedAutoSwitch();updateHUD();
}
function startEliteBattle(){
 const state=leagueState();if(!leagueUnlocked()||isGymBattle()||storyState().championDefeated)return;
 if(state.next===4){startStoryBattle(12);return;}
 if(!save.team.some(d=>save.collection[String(d)]?.currentHP>0)){flashMessage('HEAL YOUR TEAM','Visit the Pokémon Center before entering a chamber.');return;}
 hideTownStop();hideOverlay();save.trainingMode=null;flyRouteOverride=null;gym=8;
 save.gymBattle=campaignNewBattle(state.next+8);gameOver=false;gymLines=0;
 resetBoardForGymChallenge();loadGymPokemon(0);
 $('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='BATTLE!';showGymIntro(state.next+8);
 $('gymIntroCity').textContent=`INDIGO PLATEAU • ELITE FOUR ${state.next+1}/4`;
 $('gymIntroCap').textContent=`YOUR LEVEL CAP: ${currentLevelCap()} • FIVE POKéMON • VICTORY SAVES YOUR CHECKPOINT`;
 classicalAutoSelectMusic(true);updateHUD();persist();saveRunProgress('Elite battle',true);
}
function loadGymPokemon(teamIndex){
 if(!isGymBattle())return;
 const b=save.gymBattle,g=GYMS[b.gymIndex],member=g?.team?.[teamIndex];if(!member)return;
 cancelCampaignTransition();b.teamIndex=teamIndex;b.transition=false;
 save.encounterDex=member.dex;save.encounterLevel=member.level;
 save.encounterMaxHP=gymPokemonMaxHP(member.level,b.gymIndex,teamIndex);save.encounterHP=save.encounterMaxHP;
 save.encounterHpModel='v25-line-battle';save.encounterDefeated=false;save.encounterTetrises=0;
 v25ResetBattleState('GYM OPPONENT');
 feed.unshift(`${g.leader} SENT OUT ${BYDEX[member.dex].name.toUpperCase()} LV.${member.level}!`);feed=feed.slice(0,12);updateHUD();
}
function beginGymFight(){
 if(!isGymBattle()||$('gymIntroBtn')?.disabled)return;
 setModal('gymIntroModal',false);applyGymTheme();campaignResumePlay();
 const g=GYMS[save.gymBattle.gymIndex],m=g.team[save.gymBattle.teamIndex];
 feed.unshift(`GYM BATTLE START! ${g.leader} • ${BYDEX[m.dex].name.toUpperCase()} LV.${m.level}`);feed=feed.slice(0,12);updateHUD();
}
function defeatGymPokemon(dex){
 if(!isGymBattle()||save.encounterDefeated)return;
 if(isTowerBattle()&&!towerCanDefeat()){save.encounterHP=1;flashMessage('TOWER OBJECTIVE',towerObjectiveText());return;}
 const owner=save,b=save.gymBattle,g=GYMS[b.gymIndex],member=g.team[b.teamIndex],mon=BYDEX[dex];if(!mon||!member||member.dex!==dex)return;
 save.encounterDefeated=true;save.encounterHP=0;rogueAfterKO();
 recordQuestEvent('gym_ko',{dex:mon.dex,gymIndex:b.gymIndex});
 awardPartnerXP(Math.max(18,Math.round(member.level*.85)),Math.max(4,Math.round(member.level*.16)),`GYM KO • ${g.leader}`);
 feed.unshift(`${mon.name.toUpperCase()} FAINTED! • ${g.leader} HAS ${g.team.length-b.teamIndex-1} POKéMON LEFT.`);feed=feed.slice(0,12);
 flash(mon,'GYM KO!',`${g.leader}: ${mon.name.toUpperCase()} FAINTED!`);
 const index=b.teamIndex,next=index+1,epoch=campaignTransitionEpoch;
 paused=true;clearHeldInput();b.transition=true;
 campaignTransitionTimer=setTimeout(()=>{
   if(save!==owner||save.gymBattle!==b||!b.transition||b.teamIndex!==index||campaignTransitionEpoch!==epoch)return;
   campaignTransitionTimer=null;
   if(next<g.team.length){loadGymPokemon(next);paused=false;last=performance.now();enforceAutoPause();updateHUD();}
   else completeGymBattle();
 },next<g.team.length?850:900);
}
function completeGymBattle(){
 if(!isGymBattle()||!save.encounterDefeated||save.gymBattle.teamIndex!==GYMS[save.gymBattle.gymIndex].team.length-1)return;
 if(practiceSession){soundtrackFanfare('victory');finishPractice('REMATCH WON');return;}
 if(isTowerBattle()){completeTowerRound();return;}
 if(isRocketBattle()){completeRocketBattle();return;}
 if(isStoryBattle()){completeStoryBattle();return;}
 const owner=save,idx=save.gymBattle.gymIndex;cancelCampaignTransition();
 if(idx>=8){
   const i=idx-8,state=leagueState();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;
   if(i===state.next){state.next++;addMoney(1500+i*500,`${ELITE_FOUR[i].leader} DEFEATED`);}
   state.cleared=false;
   if(state.cleared){state.hallOfFame=save.team.map(d=>({dex:d,level:save.collection[String(d)]?.level||1}));state.completedAt=Date.now();}
   board=emptyBoard();current=null;nextPiece=null;gameOver=false;gym=8;applyGymTheme();
   routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);renderBadges();soundtrackFanfare('victory');
   $('townStatus').textContent=state.next===4?'LANCE DEFEATED! GARY awaits in the Champion chamber. Heal and prepare for the final six-Pokémon battle.':`${ELITE_FOUR[i].leader} DEFEATED! Heal and prepare for ${ELITE_FOUR[state.next].leader}.`;
   saveRunProgress('Elite victory',true);if(state.cleared)startProductionCredits();return;
 }
 if(idx===2)clearAllSurgeParalysis();
 save.gymBattle=null;save.encounterDefeated=false;save.trainingMode=null;flyRouteOverride=null;
 renderItemBar();applyGymTheme();awardGymPrize(idx);gymLines=0;
 soundtrackFanfare('victory');awardBadge(idx,()=>{if(save===owner)gymReturnToDefeatedTownAfterBadge(idx)});
 persist();updateHUD();renderBadges();
}
function leagueBattleLoss(reason){
 if(!isEliteBattle())return;const name=GYMS[save.gymBattle.gymIndex].leader;
 cancelCampaignTransition();score=Math.max(0,score-Math.round(score*.15));
 save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;clearAdventureRecoveryFlags();
 healTeamFull();board=emptyBoard();current=null;nextPiece=null;gameOver=false;applyGymTheme();
 routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);
 $('townStatus').textContent=`${reason} against ${name}. Team healed; 15% score lost. Previous Elite Four victories are safe.`;
 saveRunProgress('Elite retry',true);
}
function failGymBattle(){
 if(!isGymBattle())return false;
 if(isTowerBattle()){finishTowerSet('TEAM FAINTED');return true;}
 if(isRocketBattle()){rocketBattleLoss('team');return true;}
 if(isEliteBattle()){leagueBattleLoss('Battle lost');return true;}
 if(isAdventureMode()){const idx=save.gymBattle.gymIndex;routeChainTownAfterGymLoss(idx,`${GYMS[idx].leader} won the Gym battle`,0);return true;}
 return false;
}
function campaignLoss(kind){
 if(isTowerBattle()){finishTowerSet(kind==='stack'?'STACK TOPPED OUT':'TEAM FAINTED');return;}
 if(isRocketBattle()){rocketBattleLoss(kind);return;}
 if(legendaryActive()){loseLegendaryTrial(kind);return;}
 if(practiceSession){finishPractice(kind==='stack'?'STACK TOPPED OUT':'TEAM FAINTED');return;}
 if(rogueActive()){finishRogueRun(kind==='stack'?'STACK TOPPED OUT':'TEAM FAINTED');return;}
 if(isStoryBattle()){storyBattleLoss(kind);return;}
 cancelCampaignTransition();
 if(isEliteBattle()){leagueBattleLoss(kind==='stack'?'Stack topped out':'Team fainted');return;}
 if(routeTopoutIsAdventureRoute()){
   routeTopoutReturnToPriorTown(kind==='stack'?'Route topout':'Team blackout on route',routeTopoutPenalty());beep(110,.09);beep(82,.12,.08);return;
 }
 if(isAdventureMode()&&isGymBattle()){
   const idx=save.gymBattle.gymIndex,leader=GYMS[idx].leader;
   routeChainTownAfterGymLoss(idx,kind==='stack'?`Your stack topped out against ${leader}`:`${leader} defeated your team`,adventureScorePenalty());beep(110,.09);beep(82,.12,.08);return;
 }
 if(kind==='stack'&&!isAdventureMode()){
   if(save.bossTest){gameOver=true;clearHeldInput();showOverlay('RUN OVER','TEST BATTLE ENDED','NEW RUN');return;}
   finishRogueRun('STACK TOPPED OUT');return;
 }
 const wasGym=isGymBattle(),leader=wasGym?GYMS[save.gymBattle.gymIndex].leader:null,old=BYDEX[save.encounterDex],progress=gymLines,lost=adventureScorePenalty();
 healTeamFull();save.buddy=save.team[0]||save.buddy;
 if(wasGym)failGymBattle();else chooseRouteEncounter();
 setAdventureRecovery(wasGym,progress);resetAdventureBoard();paused=true;gameOver=false;clearHeldInput();applyGymTheme();
 adventureCenterOverlay(wasGym?`${leader} defeated your team.`:old?`${old.name.toUpperCase()} defeated your team.`:'Your team fainted.',lost,leader);
 persist();updateHUD();beep(110,.09);beep(82,.12,.08);
}
function endGame(){return campaignLoss('stack')}
function teamBlackout(){return campaignLoss('team')}
