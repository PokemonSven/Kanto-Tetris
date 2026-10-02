// Disposable sessions. The suspended campaign is restored through the shared save
// restore path without writing a temporary snapshot into either saved slot.
let practiceSession=null,practiceOrigin='title';
function practiceIsFree(){return !!practiceSession&&practiceSession.config.boss<0;}
function practiceAvailableTeam(){return practiceSession?.returnSnapshot?.save||(save?.starter&&!save.bossTest&&!gameOver?save:null);}
function openPractice(){
 if(isGymTransition()||gymVictoryClickthroughActive||isShown('eeveeChoiceModal'))return;
 if(!practiceSession)practiceOrigin=isShown('titleScreen')||!save?.starter?'title':'game';
 requestAutoPause();clearHeldInput();setModal('titleScreen',false);setModal('mainMenuModal',false);setModal('practiceResults',false);hideOverlay();
 const team=practiceAvailableTeam();$('practiceTeam').querySelector('[value="current"]').disabled=!team?.team?.length;
 if($('practiceTeam').value==='current'&&!team?.team?.length)$('practiceTeam').value='preset';
 setModal('practiceModal',true);renderPracticeSetup();resetMenuFocus($('practiceModal'));
}
function closePracticeSetup(){
 setModal('practiceModal',false);clearHeldInput();
 if(practiceSession){if(practiceSession.result){setModal('practiceResults',true);resetMenuFocus($('practiceResults'));}else openMainMenu();}
 else if(practiceOrigin==='title')showTitleScreen();else {setModal('mainMenuModal',true);compactRefreshMenu();resetMenuFocus($('mainMenuModal'));}
}
function renderPracticeSetup(){
 const boss=Number($('practiceEncounter').value),level=Number($('practiceSpeed').value);
 $('practiceGoal').disabled=boss>=0;$('practiceTeam').disabled=boss<0;
 const normal=normalPracticeLevel(boss);
 $('practiceDescription').textContent=boss<0
   ?'Free stacking: no opponent, travel, rewards or idle pressure. Choose endless play or a 40-line sprint.'
   :`${GYMS[boss].leader}: fight the complete ${GYMS[boss].team.length}-Pokémon team. All boss hazards, hidden previews and idle pressure stay enabled. Team XP is frozen for consistent retries.`;
 $('practiceSpeedDescription').textContent=`Fixed level ${level||normal} · ${Math.round(TETRIS_ROW_MS[(level||normal)-1])} ms per row. ${level?'Custom drill speed.':'Uses the normal opening speed for this encounter.'} Hold and movement settings match the main game.`;
}
function startPracticeFromForm(){
 const config={boss:Number($('practiceEncounter').value),level:Number($('practiceSpeed').value),team:$('practiceTeam').value,goal:Number($('practiceGoal').value)};
 if(!Number.isInteger(config.boss)||config.boss< -1||config.boss>12||!Number.isInteger(config.level)||config.level<0||config.level>TETRIS_MAX_LEVEL)return;
 if(!practiceSession){
   const original=save?.starter&&!save.bossTest&&!gameOver?runSnapshot():null;
   if(original&&!saveRunProgress('Before Practice',true)){
     $('practiceDescription').textContent='Could not save your campaign checkpoint. Practice has not started. Return to your run and check Save Backups or browser storage.';return;
   }
   // Portable snapshots intentionally omit temporary Fly visits. A suspended
   // live session keeps those too, because Practice is not a save/reload.
   if(original)original.save=clonePlain(save);
   const runtime={flyRouteOverride:clonePlain(flyRouteOverride),routes:[...adventureVisitedRoutes],cities:[...adventureVisitedCities],unlocked:adventureFlyUnlocked,prompted:adventureFlyPrompted};
   practiceSession={returnSnapshot:original,returnRuntime:runtime,returnTitle:practiceOrigin==='title',returnMeta:[...metaDex],config,teamCopy:null};
 }
 if(config.team==='current'){
   const team=practiceSession.returnSnapshot?.save;
   if(!team?.team?.length){$('practiceDescription').textContent='Continue your campaign first to use a copy of its team.';return;}
   practiceSession.teamCopy=clonePlain({team:team.team,collection:team.collection,buddy:team.buddy,starter:team.starter});
 }else practiceSession.teamCopy=null;
 practiceSession.config=config;startPracticeAttempt();
}
function startPracticeAttempt(){
 if(!practiceSession)return;
 cancelCampaignTransition();clearTimeout(gymIntroTimer);clearHeldInput();clearControlsScreens();
 for(const id of ['practiceModal','practiceResults','titleScreen','starterModal','bossTestModal','momentModal','capture'])setModal(id,false);
 document.querySelectorAll('.leader-clickthrough,.badge-clickthrough').forEach(e=>e.classList.remove('leader-clickthrough','badge-clickthrough'));
 pendingEeveeEvolution=null;gymVictoryClickthroughActive=false;document.querySelector('.app').inert=false;
 const session=practiceSession,config=session.config,index=config.boss;
 session.result=null;session.elapsed=0;session.pieces=0;session.lines=0;session.holds=0;session.tetrises=0;
 runMode='adventure';adventureDifficulty='normal';save=freshRun();save.bossTest=true;save.bossTestGymIndex=Math.max(0,index);save.leagueSchema=1;
 save.badges=Array.from({length:Math.min(8,Math.max(0,index))},(_,i)=>i);save.adventureSpeedRisk=1;
 const profile=index>=8?{active:9,team:[6,9,3,65,68,131]}:BOSS_TEST_TEAMS[Math.max(0,index)];
 const level=index>=8?62:Math.max(5,(GYMS[Math.max(0,index)].ace||14)+2);
 save.team=profile.team.slice();save.buddy=profile.active;save.starter=profile.active;save.collection={};
 save.team.forEach(d=>save.collection[String(d)]=bossTestPokemonEntry(level,d));
 if(session.teamCopy){const team=session.teamCopy;save.team=team.team.slice();save.collection=clonePlain(team.collection);save.buddy=team.buddy;save.starter=team.starter;}
 healTeamFull();save.pc=[];save.money=0;save.items=index>=0?['superpotion','superpotion','revive']:[];save.svenPcItems=[];
 save.questActive=[];save.questDone=[];save.questProgress={};save.encounterDex=null;save.encounterDefeated=false;save.townStop=null;save.trainingMode=null;
 resetAdventureFlyRuntime();gym=Math.min(8,Math.max(1,index+1));gymLines=0;runLines=0;score=0;board=emptyBoard();bag=[];current=null;nextPiece=piece(take());gameOver=false;paused=true;feed=[];
 battleActiveTime=0;v25ResetBattleState('PRACTICE');autoPauseRequested=false;
 document.body.classList.toggle('practice-free',index<0);
 if(index>=0){save.gymBattle=campaignNewBattle(index);loadGymPokemon(0);}
 spawn();applyGymTheme();drawBoard();drawNext();updateHUD();renderTeam();renderBadges();renderDex();renderControlPanels();
 selectGamePanel('gamePanel');hideOverlay();campaignResumePlay();renderPracticeHUD();
}
function clearPracticeLines(){
 let n=0;for(let y=ROWS-1;y>=0;y--){if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(''));n++;y++;}}
 if(n){score+=([0,100,300,500,800][Math.min(4,n)]||0)*tetrisLevel();runLines+=n;save.stats.lines+=n;beep(440,.04);}
 return n;
}
function practiceAfterLock(lines){
 if(!practiceSession||practiceSession.result)return;
 practiceSession.lines+=lines;if(lines===4)practiceSession.tetrises++;
 if(practiceIsFree()&&practiceSession.config.goal&&practiceSession.lines>=practiceSession.config.goal)finishPractice('SPRINT COMPLETE');
 else renderPracticeHUD();
}
function practiceTick(delta){if(practiceSession&&!practiceSession.result)practiceSession.elapsed+=Math.max(0,Math.min(100,delta));}
function practiceTime(){const seconds=Math.floor((practiceSession?.elapsed||0)/1000);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function renderPracticeHUD(){
 if(!practiceSession)return;
 const s=practiceSession,name=practiceIsFree()?'FREE PRACTICE':GYMS[s.config.boss].leader+' REMATCH';
 $('routeName').textContent=name;$('gymGoalText').textContent=`${s.lines}${practiceIsFree()&&s.config.goal?'/'+s.config.goal:''} LINES · ${practiceTime()}`;
 $('gymProgress').style.width=(practiceIsFree()&&s.config.goal?Math.min(100,s.lines/s.config.goal*100):0)+'%';
 const info=$('practiceFreeInfo'),infoKey=[s.config.goal,tetrisLevel(),s.pieces,s.holds,practiceTime()].join(':');
 if(info&&info.dataset.key!==infoKey){info.dataset.key=infoKey;info.innerHTML=`<strong>${s.config.goal?'40-LINE SPRINT':'FREE PRACTICE'}</strong>LEVEL ${tetrisLevel()} · ${Math.round(speed())} ms / ROW<br>${s.pieces} PIECES · ${s.holds} HOLDS<br>TIME ${practiceTime()}<br><br>No enemies or travel.<br>Use Menu to retry, change settings or end practice.`;}
 for(const id of ['pauseSaveExit','mainSaveExit','fieldSaveExit'])if($(id))$(id).textContent='END PRACTICE';
 for(const id of ['mainQuests','mainBills','mainSven','mainFly','mainTravel','mainBackups','fieldBackups','pauseBackups','optionsBackups','saveRunBtn','loadRunBtn','deleteRunSaveBtn','resetSave'])if($(id))$(id).disabled=true;
 $('adventureSpeedSelect').disabled=true;
}
function finishPractice(result){
 if(!practiceSession||practiceSession.result)return;
 cancelCampaignTransition();clearTimeout(gymIntroTimer);practiceSession.result=result;paused=true;gameOver=true;clearHeldInput();clearControlsScreens();hideOverlay();setModal('capture',false);
 const s=practiceSession;const metrics=[['Lines',s.lines],['Pieces',s.pieces],['Time',practiceTime()],['Pieces / second',s.elapsed?(s.pieces/(s.elapsed/1000)).toFixed(2):'0.00'],['Tetrises',s.tetrises],['Holds',s.holds]];
 $('practiceResultTitle').textContent=result;$('practiceResultInfo').textContent=`${s.config.boss<0?'Free practice':GYMS[s.config.boss].leader+' rematch'} · speed level ${tetrisLevel()} · score ${score.toLocaleString()}. No campaign rewards or progress were changed.`;
 $('practiceMetrics').innerHTML=metrics.map(([label,value])=>`<div>${label}<strong>${value}</strong></div>`).join('');
 setModal('practiceResults',true);resetMenuFocus($('practiceResults'));
}
function exitPractice(){
 if(!practiceSession){closePracticeSetup();return;}
 const previous=practiceSession;cancelCampaignTransition();clearHeldInput();clearControlsScreens();practiceSession=null;metaDex=new Set(previous.returnMeta);document.body.classList.remove('practice-free');
 for(const id of ['mainQuests','mainSven','mainBackups','fieldBackups','pauseBackups','optionsBackups','resetSave'])if($(id))$(id).disabled=false;
 if(previous.returnSnapshot){restoreRunSnapshot(previous.returnSnapshot,previous.returnSnapshot.mode,previous.returnRuntime);if(previous.returnTitle){clearControlsScreens();showTitleScreen();}}
 else{studioIntroSeen=true;restartRun();}
 renderSaveControls();renderAdventureSpeedControls();renderDex();compactRefreshMenu();
}
function initializePractice(){
 document.body.insertAdjacentHTML('beforeend',`<div id="practiceModal" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="practiceTitle"><div class="controls-card"><h2 id="practiceTitle">PRACTICE & REMATCHES</h2><p class="practice-copy">Try any boss or practise stacking. Your campaign is suspended and restored when you leave. These sessions never award badges, money or Pokédex registrations.</p><div class="practice-form"><label for="practiceEncounter">Encounter<select id="practiceEncounter"><option value="-1">Free stacking</option>${GYMS.slice(0,12).map((g,i)=>`<option value="${i}">${i>=8?'Elite Four · ':''}${g.leader}</option>`).join('')}</select></label><label for="practiceSpeed">Speed<select id="practiceSpeed"><option value="0">Encounter default</option>${TETRIS_ROW_MS.map((ms,i)=>`<option value="${i+1}">Level ${i+1} · ${Math.round(ms)} ms / row</option>`).join('')}</select></label><label for="practiceTeam">Team<select id="practiceTeam"><option value="preset">Prepared team + item kit</option><option value="current">My current team · healed copy</option></select></label><label for="practiceGoal">Free practice goal<select id="practiceGoal"><option value="0">Endless</option><option value="40">40-line sprint</option></select></label></div><p id="practiceDescription" class="practice-copy"></p><p id="practiceSpeedDescription" class="practice-copy"></p><div class="practice-actions"><button id="practiceStart" data-nav-default>START PRACTICE</button><button id="practiceBack">BACK</button></div></div></div><div id="practiceResults" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="practiceResultTitle"><div class="controls-card"><h2 id="practiceResultTitle"></h2><p id="practiceResultInfo" class="practice-copy"></p><div class="practice-metrics" id="practiceMetrics"></div><div class="practice-actions"><button id="practiceRetry" data-nav-default>RETRY</button><button id="practiceSetup">CHANGE SETUP</button><button id="practiceExit">LEAVE PRACTICE</button></div></div></div>`);
 navModalIds.unshift('practiceResults','practiceModal');
 const old=$('titleBossTestBtn'),button=old.cloneNode(true);button.textContent='PRACTICE & REMATCHES';old.replaceWith(button);button.addEventListener('click',openPractice);
 $('mainOptions').insertAdjacentHTML('beforebegin','<button id="mainPractice">PRACTICE & REMATCHES</button>');$('mainPractice').onclick=openPractice;
 document.querySelector('.compact-map>.screen').insertAdjacentHTML('beforeend','<div id="practiceFreeInfo"></div>');
 for(const id of ['practiceEncounter','practiceSpeed','practiceTeam','practiceGoal'])$(id).onchange=renderPracticeSetup;
 $('practiceStart').onclick=startPracticeFromForm;$('practiceBack').onclick=closePracticeSetup;$('practiceRetry').onclick=startPracticeAttempt;$('practiceSetup').onclick=openPractice;$('practiceExit').onclick=exitPractice;
 document.addEventListener('click',e=>{if(practiceSession&&e.target.closest?.('#saveRunBtn,#loadRunBtn,#deleteRunSaveBtn,#resetSave,#optionsBackups,#fieldBackups,#mainBackups,#pauseBackups')){e.preventDefault();e.stopImmediatePropagation();}},true);
}
