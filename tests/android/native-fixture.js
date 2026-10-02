musicEnabled=false;sfxEnabled=false;stopMusic();
window.qaErrors=[];window.addEventListener('error',e=>qaErrors.push(e.message));
window.nativeQA={
 mapOpen(){this.milestoneSetup();routeChainStartAtCursor(1,'training',null);clearControlsScreens();hideOverlay();openFlyMap();renderFlyDestinations();drawFlyMap();syncInputContext();},
 mapFocus(route){const i=flyTargets().findIndex(t=>t.route===route);focusMenuElement($('flyDestinations').children[i],$('flyModal'));},
 mapState(){return {route:currentRoute(),mapReady:pixelMapLoaded&&!!pixelMapPikachuRun&&!!pixelMapPikachuSit,hover:flyHoverTarget?.route,location:$('kantoMap').dataset.location,labels:pixelMapLabels,root:menuRoot()?.id};},
 mapPoint(route){const t=flyTargets().find(n=>n.route===route),c=$('flyMapCanvas'),r=c.getBoundingClientRect(),sx=r.width/c.offsetWidth,sy=r.height/c.offsetHeight;return {x:r.left+(c.clientLeft+c.clientWidth*t.x/240)*sx,y:r.top+(c.clientTop+c.clientHeight*t.y/190)*sy,w:innerWidth,h:innerHeight};},
 towerOpen(){this.setup();clearControlsScreens();save.bossTest=false;save.gymBattle=null;runMode='adventure';adventureDifficulty='normal';save.badges=[0,1,2,3,4,5,6,7];save.league={next:4,cleared:true,hallOfFame:[]};save.journey={version:1,rivals:[0,1,2],starterChoice:save.starter,championDefeated:true,legacyClear:false};save.tower=undefined;save.townStop=null;save.trainingMode=null;startTowerSet();syncInputContext();focusMenuElement($('towerInventory'),$('towerModal'));},
 towerFocus(id){syncInputContext();focusMenuElement($(id),menuRoot());},
 towerClock(){return JSON.stringify([save.gymBattle,towerActive()?.elapsed,battleActiveTime]);},
 slotsOpen(){this.setup();clearControlsScreens();activeAdventureSlot=1;pendingAdventureSlot=null;save.bossTest=false;save.gymBattle=null;save.encounterDefeated=false;runMode='adventure';save.trainer=normalizedTrainer({name:'NATIVE'});saveRunProgress('Native slot QA',true);localStorage.removeItem(adventureSlotKey(2));localStorage.removeItem(adventureSlotKey(3));studioIntroSeen=true;restartRun();syncInputContext();focusMenuElement($('titleAdventureNewBtn'),$('titleScreen'));},
 slotsFocus(id){focusMenuElement($(id),menuRoot());},
 slotsState(){return {active:activeAdventureSlot,pending:pendingAdventureSlot,root:menuRoot()?.id,step:oakIntro?.step,count:$('adventureSlotCards').children.length};},
 keepsakeOpen(){this.setup();clearControlsScreens();save.bossTest=false;save.gymBattle=null;runMode='adventure';save.team=[4];save.pc=[];save.buddy=4;save.starter=4;save.collection[4]={level:5,levelXP:0,currentHP:99,obtained:Date.now(),starter:true,hpModel:'v25-line-battle'};recordPokemonKeepsake(4,'starter','PALLET TOWN · OAK’S LAB');metaDex.add(4);openMainMenu();$('mainBadges').click();syncInputContext();focusMenuElement($('scrapbookGrid').querySelector('[data-scrapbook-view="4"]'),$('badgePanel'));},
 keepsakeNameFocus(){focusMenuElement($('pokemonNickname'),$('dexDetailModal'));},
 keepsakeSaveFocus(){focusMenuElement($('nicknameSave'),$('nicknameModal'));},
 keepsakeState(){return {name:save.collection[4].keepsake.nickname,draft:$('nicknameInput').value};},
 rocketOpen(){this.setup();clearControlsScreens();save.bossTest=false;save.gymBattle=null;save.legendary={version:1,cleared:[],caught:[],active:null};runMode='adventure';save.badges=[0];save.rocketStory=freshRocketStory();routeChainShowTownAtCursor(rocketTownCursor(0));syncInputContext();focusMenuElement($('townRocketStart'),$('townModal'));},
 rocketState(){return {page:rocketScene?.page,boss:save.gymBattle?.gymIndex,delay:save.gymBattle?.rocketDelay,plan:save.gymBattle?.rocketPlan,completed:save.rocketStory?.completed.length,root:menuRoot()?.id,paused};},
 rocketFocus(){focusMenuElement($('rocketSkip'),$('rocketSceneModal'));},
 oakOpen(){this.hide();localStorage.removeItem(ADVENTURE_RUN_SAVE_KEY);startOakIntroduction();syncInputContext();},
 oakState(){return {step:oakIntro?.step,wait:oakIntro?.waitMs||0,gift:!!oakIntro?.pikachu,starter:save.starter,origin:save.collection?.[25]?.oakPartner===true,name:save.trainer?.name};},
 oakFocus(action,value){const selector='[data-oak-action="'+action+'"]'+(value===undefined?'':'[data-oak-value="'+value+'"]');focusMenuElement($('oakChoices').querySelector(selector),$('oakIntroModal'));},
 setup(){clearControlsScreens();document.querySelectorAll('.show,.leader-clickthrough,.badge-clickthrough').forEach(e=>e.classList.remove('show','leader-clickthrough','badge-clickthrough'));gameWindowFocused=true;autoPauseRequested=false;document.querySelector('[data-elite-test="2"]').click();beginGymFight();board=emptyBoard();current=piece('T');current.y=0;nextPiece=piece('J');dropCounter=0;last=qaNow;inputContext=undefined;drawBoard();drawNext();updateHUD();},
 state(){return {x:current?.x,y:current?.y,matrix:current?.matrix,hold:tetrisState().hold,holdUsed:tetrisState().used,score,paused,downHeld,root:menuRoot()?.id,focus:document.activeElement?.id,backupMessage:$('backupMessage')?.textContent,errors:qaErrors,viewport:[innerWidth,innerHeight],display:$('androidDisplayInfo')?.textContent,saveStatus:$('portableSaveStatus')?.textContent}},
 frame(ms=1){qaNow+=ms;loop(qaNow)},
 layout(){compactFit();const results=[$('game'),$('holdPiece'),$('tetrisSpeedLevel'),$('next'),$('mainMenuBtn'),$('kantoMap'),$('wildBox'),$('battleFeedback'),...$('teamGrid').children].map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.className,x:r.x,y:r.y,w:r.width,h:r.height,fits:r.width>0&&r.height>0&&r.top>=0&&r.left>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1}});return {viewport:[innerWidth,innerHeight],results,cardOverflow:[...$('teamGrid').children].some(el=>el.scrollHeight>el.clientHeight+1)}},
 expansionGary(){this.setup();save.bossTest=false;save.gymBattle=null;save.journey={version:1,rivals:[],starterChoice:4,championDefeated:false,legacyClear:false};save.badges=[0];syncStoryTrainers();routeChainShowTownAtCursor(routeChainCityCursorByGym(1));syncInputContext();focusMenuElement($('townRival').querySelector('button'),$('townModal'));},
 expansionReward(){this.setup();save.bossTest=false;save.gymBattle=null;runMode='rogue';pendingRogueConfig={seed:'NATIVE-QA',difficulty:'normal'};initializeExpeditionRun();save.badges=[0];routeChainShowTownAtCursor(routeChainCityCursorByGym(0));queueRogueReward(0);showRogueRewards();syncInputContext();focusMenuElement($('rogueChoices').children[0],$('rogueRewardModal'));},
 expansionState(){return {boss:save.gymBattle?.gymIndex,root:menuRoot()?.id,paused,choices:save.rogue?.rewards?.length||0,kind:save.rogue?.rewards?.[0]?.kind};},
 milestoneSetup(){this.setup();save.bossTest=false;save.gymBattle=null;save.townStop=null;save.trainingMode=null;runMode='adventure';save.encounterDefeated=false;save.legendary={version:1,cleared:[],caught:[],active:null};save.badges=[0,1,2,3,4,5,6,7];save.routeChain={cursor:LEAGUE_CAVE_CURSOR,lines:0,mode:'story',visitedCursors:ROUTE_CHAIN_NODES.map((_,i)=>i)};save.league={next:4,cleared:true,hallOfFame:[]};save.journey.championDefeated=true;adventureFlyUnlocked=true;},
 plannerOpen(){this.milestoneSetup();save.wantedDex=null;openCollectionPlanner(25,'POWER PLANT');syncInputContext();focusMenuElement($('plannerPinButton'),$('collectionPlanner'));},
 milestoneState(){return {pin:save.wantedDex,active:legendaryActive(),caught:save.legendary?.caught?.includes(144),root:menuRoot()?.id,paused};},
 trialOpen(){this.milestoneSetup();openLegendaryMenu();syncInputContext();focusMenuElement($('legendaryList').querySelector('[data-trial="144"]'),$('legendaryMenu'));},
 trialConfirm(){syncInputContext();focusMenuElement($('controlsConfirmYes'),$('controlsConfirm'));},
 trialCatch(){save.legendary.active.phase='catch';save.legendary.cleared=[144];clearControlsScreens();showLegendaryCatch();syncInputContext();focusMenuElement($('legendaryClaim'),$('legendaryCatch'));},
 controllerTest(){openControlsPanel();$('androidTestController').click()},
 practiceOpen(){save.bossTest=false;openMainMenu();openPractice();syncInputContext();focusMenuElement($('practiceEncounter'),$('practiceModal'));},
 practiceState(){return {active:!!practiceSession,boss:$('practiceEncounter').value,level:$('practiceSpeed').value,root:menuRoot()?.id,hold:save.tetris?.used,music:comfortSettings.musicVolume,reduced:comfortSettings.reducedMotion};},
 practiceFinish(){finishPractice('SESSION ENDED');syncInputContext();},
 comfortFocus(){clearControlsScreens();comfortSettings={...COMFORT_DEFAULTS};applyComfort();openControlsPanel();syncInputContext();focusMenuElement($('comfort-musicVolume'),$('optionsPanel'));},
 comfortToggleFocus(){focusMenuElement($('comfort-reducedMotion'),$('optionsPanel'));},
 saved(){save.bossTest=false;return saveRunProgress('Native QA',true)},
 roundtrip(){const snap=capturePortableBackup();return {version:parseBackup(JSON.stringify(snap)).version,bytes:JSON.stringify(snap).length}},
 menu(){openMainMenu()},
 backupOpen(id){save.bossTest=false;clearControlsScreens();openBackupManager();$(id).focus();},
 backupText(){return JSON.stringify(capturePortableBackup())},
 backupState(){const state=portableStorageRead();for(const key of [RUN_SAVE_KEY,ADVENTURE_RUN_SAVE_KEY]){if(state[key]){const value=JSON.parse(state[key]);delete value.savedAt;state[key]=JSON.stringify(value)}}return JSON.stringify(state)},
 hide(){clearControlsScreens();paused=true;hideOverlay();$('capture').classList.remove('show');drawBoard();updateHUD()},
 preview(kind){
   this.hide();
   if(kind==='map'){this.mapOpen();}
   if(kind==='maptown'){this.mapOpen();travelToFlyTarget(flyTargets().find(t=>pixelMapTargetKey(t)==='CERULEAN CITY'));clearControlsScreens();openFlyMap();renderFlyDestinations();drawFlyMap();}
   if(kind==='minimap'){this.milestoneSetup();routeChainStartAtCursor(routeChainCursorForRoute('ROUTE 9'),'training',null);clearControlsScreens();clearTimeout(captureFlashTimer);setModal('capture',false);paused=true;hideOverlay();compactFit();drawBoard();drawNext();updateHUD();}
   if(kind==='scrapbook'||kind==='nickname'){this.keepsakeOpen();if(kind==='nickname'){openDexDetail(4);openNicknameEditor(4);}}
   if(kind==='rocket'){this.rocketOpen();openRocketScene(0);}
   if(['legendary','trial','planner','catch'].includes(kind)){this.milestoneSetup();if(kind==='legendary')openLegendaryMenu();if(kind==='planner'){metaDex=new Set([1,4,7]);openCollectionPlanner(25,'POWER PLANT');}if(kind==='trial'){startLegendaryTrial(144);paused=true;hideOverlay();renderLegendaryHUD();drawBoard();}if(kind==='catch'){startLegendaryTrial(144);save.legendary.active.phase='catch';save.legendary.cleared=[144];showLegendaryCatch();}}
   if(kind==='gary'){this.expansionGary();startStoryBattle(13);}
   if(kind==='reward'){this.expansionReward();}
   if(kind==='finale'){this.setup();save.bossTest=false;save.gymBattle=null;save.journey.championDefeated=true;save.league={next:4,cleared:true,hallOfFame:save.team.map(d=>({dex:d,level:save.collection[d].level}))};showChampionFinale();}
   if(kind==='next'){save.gymBattle=null;save.team=[4,14,25];save.buddy=14;save.badges=[];for(const dex of save.team)save.collection[dex]={...bossTestPokemonEntry(8,dex),hpModel:'v25-line-battle'};save.encounterDex=16;save.encounterLevel=4;save.encounterHP=78;save.encounterMaxHP=78;save.townStop=null;save.routeChain={cursor:1,lines:5,mode:'story',visitedCursors:[1]};current=piece('T');current.y=4;nextPiece=piece('I');applyGymTheme();clearTimeout(captureFlashTimer);setModal('capture',false);hideOverlay();paused=true;compactFit();drawBoard();drawNext();updateHUD();renderTeam();}
   if(kind==='battle'){save.gymBattle.pendingHazards=2;save.gymBattle.eliteWarning=2000;battleV25.lastClearAt=battleActiveTime-8000;battleV25.lastIdleStrikeAt=battleActiveTime-8000;battleFeedbackDamage={dealt:42,taken:{name:'BLASTOISE',amount:8}};refreshBattleFeedback();renderTetrisHUD();}
   if(kind==='practice'){this.practiceOpen();$('practiceEncounter').value='10';renderPracticeSetup();}
   if(kind==='comfort'){openControlsPanel();$('comfortSettings').scrollIntoView({block:'start'});}
   if(kind==='dex'){selectGamePanel('dexPanel');renderDex();$('dexFiltertype').value='Flying';collectionFilterChange('dex');}
   if(kind==='pc'||kind==='detail'){save.gymBattle=null;save.pc=[25,95,39,133,143,92];for(const dex of save.pc){save.collection[dex]=bossTestPokemonEntry(dex===25?26:15,dex);metaDex.add(dex)}openBillsPC();if(kind==='detail')$('pcBoxGrid').querySelector('[data-pc-select="25"]').click();}
   if(kind==='tutorial'){openOakGuide();openOakLesson();oakLesson=2;renderOakLesson();}
 }
};
