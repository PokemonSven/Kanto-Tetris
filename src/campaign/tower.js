// Adventure-profile-owned Tower: three rounds, explicit preparation, atomic run rewards.
const TOWER_RULESET='tower-v1',TOWER_FIRST=19;
const TOWER_ROUNDS=[
 {name:'STONE & TIDE',leader:'BROCK',art:0,team:[76,141],levels:[62,64],lines:6,multi:0,interval:24000,theme:0,hazard:'STONE + RISING ROW'},
 {name:'VEIL & GHOST',leader:'AGATHA',art:10,team:[94,124],levels:[65,67],lines:0,multi:2,interval:26000,theme:10,hazard:'GHOST + 6s NEXT VEIL'},
 {name:'DRAGON SUMMIT',leader:'LANCE',art:11,team:[130,149],levels:[68,70],lines:10,multi:2,interval:28000,theme:11,hazard:'GHOST + RISING ROW + 6s VEIL'}
];
const TOWER_THEMES={classic:{label:'Classic',board:'#e0f8cf',grid:'#86c06c'},slate:{label:'Tower Slate',board:'#dce9ed',grid:'#8caaaf'},dusk:{label:'Tower Dusk',board:'#e6dff2',grid:'#ae97c4'},gold:{label:'Tower Gold',board:'#faedc9',grid:'#b5a06c'}};
let towerUtility=false;
function towerState(){if(!save.tower)save.tower={version:1,active:null,records:[],clears:{easy:0,normal:0,hard:0},themes:['classic'],theme:'classic'};return save.tower;}
function towerActive(){return isAdventureMode()&&!practiceSession?save?.tower?.active:null;}
function isTowerBattle(){return !!(towerActive()?.stage==='battle'&&isGymBattle()&&save.gymBattle.gymIndex===TOWER_FIRST+towerActive().round);}
function towerUnlocked(){return isAdventureMode()&&!practiceSession&&!save.bossTest&&save.journey?.championDefeated===true&&save.badges.length===8;}
function towerEntryReady(){return towerUnlocked()&&!isGymBattle()&&!legendaryActive()&&!gameOver&&!isGymTransition()&&!save.league?.finalePending;}
function syncTowerTrainers(){
 const difficulty=save?.tower?.active?.difficulty||adventureDifficulty,offset=difficulty==='hard'?6:difficulty==='easy'?-8:0;
 TOWER_ROUNDS.forEach((r,i)=>{if(!GYMS[TOWER_FIRST+i])return;GYMS[TOWER_FIRST+i].team=r.team.map((dex,n)=>({dex,level:r.levels[n]+offset,attackType:BYDEX[dex].type}));GYMS[TOWER_FIRST+i].ace=r.levels[1]+offset;});
}
function towerObjectiveText(a=towerActive()){
 if(!a)return '';const r=TOWER_ROUNDS[a.round];return [r.lines?`LINES ${Math.min(a.lines,r.lines)}/${r.lines}`:'',r.multi?`DOUBLE+ ${Math.min(a.multi,r.multi)}/${r.multi}`:''].filter(Boolean).join(' · ');
}
function towerCanDefeat(){const a=towerActive(),b=save.gymBattle,r=TOWER_ROUNDS[a.round];return b.teamIndex<1||a.lines>=r.lines&&a.multi>=r.multi;}
function towerSave(label){const ok=saveRunProgress(label,true);if($('towerSaveStatus'))$('towerSaveStatus').textContent=ok?'CHECKPOINT SAVED':'SAVE FAILED · Keep the game open and retry saving.';return ok;}
function startTowerSet(){
 if(!towerEntryReady()||towerActive()||portabilityStorageLocked||portabilityBusy)return false;
 // Save the journey before entering. A failed checkpoint never replaces the live journey.
 if(!saveRunProgress('Before Battle Tower',true))return false;
 clearControlsScreens();hideTownStop();hideOverlay();save.trainingMode=null;flyRouteOverride=null;clearAdventureRecoveryFlags();
 towerState().active={rules:TOWER_RULESET,stage:'prep',difficulty:adventureDifficulty,round:0,startedAt:Date.now(),elapsed:0,lines:0,multi:0,totalLines:0,partners:[],rounds:[],scoreStart:score};
 save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;board=emptyBoard();current=null;nextPiece=null;gym=8;gymLines=0;healTeamFull();gameOver=false;paused=true;
 openTowerMenu();towerSave('Tower preparation');updateHUD();return true;
}
function startTowerRound(){
 const a=towerActive();if(!a||a.stage!=='prep'||isGymBattle()||!save.team.some(d=>save.collection[d]?.currentHP>0))return false;
 clearControlsScreens();hideOverlay();syncTowerTrainers();a.stage='battle';a.lines=0;a.multi=0;
 save.gymBattle=campaignNewBattle(TOWER_FIRST+a.round);save.tetris=cleanTetrisState(null);save.townStop=null;save.trainingMode=null;
 resetBoardForGymChallenge();loadGymPokemon(0);$('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='BEGIN TOWER ROUND';showGymIntro(TOWER_FIRST+a.round);towerSave('Tower round');return true;
}
function completeTowerRound(){
 const a=towerActive();if(!isTowerBattle()||!save.encounterDefeated||save.gymBattle.teamIndex!==1||!towerCanDefeat())return false;
 soundtrackFanfare('victory');a.rounds.push({round:a.round,lines:a.lines,multi:a.multi});cancelCampaignTransition();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;
 if(a.round===2){finishTowerSet('SET CLEARED');return true;}
 a.round++;a.stage='prep';a.lines=0;a.multi=0;board=emptyBoard();current=null;nextPiece=null;healTeamFull();paused=true;gameOver=false;openTowerMenu();towerSave('Tower round cleared');updateHUD();return true;
}
function finishTowerSet(outcome){
 const a=towerActive();if(!a||a.stage==='recap')return false;
 const state=towerState(),won=outcome==='SET CLEARED';if(won&&a.rounds.length!==3)return false;
 cancelCampaignTransition();clearControlsScreens();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;board=emptyBoard();current=null;nextPiece=null;gameOver=false;paused=true;healTeamFull();normalizeKeepsakes(save);
 const rewards=[];
 if(won){
   state.clears[a.difficulty]++;const ribbon='tower-'+a.difficulty;
   for(const d of [...save.team,...save.pc]){const k=save.collection[d]?.keepsake;if(k&&a.partners.some(p=>k.evolutionPath.includes(p))&&!k.ribbons.includes(ribbon))k.ribbons.push(ribbon);}
   rewards.push(KEEPSAKE_RIBBONS[ribbon]+' for participating partners');
   for(const theme of ['slate',...(Object.values(state.clears).reduce((x,y)=>x+y,0)>=3?['dusk']:[]),...(a.difficulty==='hard'?['gold']:[])])if(!state.themes.includes(theme)){state.themes.push(theme);rewards.push(TOWER_THEMES[theme].label+' board theme');}
 }
 const record={rules:TOWER_RULESET,difficulty:a.difficulty,date:Date.now(),outcome,rounds:a.rounds.length,lines:a.totalLines,elapsed:Math.round(a.elapsed),score:Math.max(0,score-a.scoreStart),partners:a.partners.slice(),rewards};
 state.records.push(record);state.records=state.records.slice(-90);a.stage='recap';a.result=record;
 openTowerMenu();towerSave('Tower result');updateHUD();return true;
}
function leaveTower(){
 const a=towerActive();if(!a)return closeTowerMenu();if(a.stage!=='recap')return showControlsConfirm('WITHDRAW FROM THE TOWER?','End this set and keep earned EXP. Your team will be healed. No score penalty. Completed rounds appear in your recap.',()=>finishTowerSet('WITHDREW'),'END SET');
 // Commit the result before clearing its resume checkpoint.
 if(!towerSave('Tower result'))return;
 clearControlsScreens();towerState().active=null;save.tetris=cleanTetrisState(null);routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);towerSave('Return from Tower');updateHUD();
}
function updateTowerHazards(delta){
 if(!isTowerBattle()||paused||gameOver||isGymTransition())return;const a=towerActive(),b=save.gymBattle,r=TOWER_ROUNDS[a.round];a.elapsed+=delta;
 if(b.eliteVeil>0){b.eliteVeil=Math.max(0,b.eliteVeil-delta);if(!b.eliteVeil)drawNext();}
 if(b.eliteWarning>0){b.eliteWarning=Math.max(0,b.eliteWarning-delta);if(b.eliteWarning===0){
   b.pendingHazards++;if(a.round>0)b.eliteVeil=6000;
   if(a.round!==1)leagueRaiseRows(1,a.round===0?'I':'L');
   if(!isTowerBattle())return;flashBossSpecial(r.hazard,GYM_THEME_META[r.theme].cls);drawNext();updateHUD();
 }return;}
 b.specialTimer+=delta;if(b.specialTimer>=r.interval-3000){b.specialTimer=0;b.eliteWarning=3000;flashMessage(r.hazard+' IN 3 SECONDS','Finish the objective and defeat both opponents.');}
}
function towerLinesBeforeClear(){
 if(!isTowerBattle())return;const n=board.filter(row=>row.every(Boolean)).length;if(!n)return;
 const a=towerActive();a.lines+=n;a.totalLines+=n;if(n>=2)a.multi++;if(!a.partners.includes(save.buddy))a.partners.push(save.buddy);
}
function towerBoardTheme(fallback){const s=isAdventureMode()&&!practiceSession?save?.tower:null;return s?.theme!=='classic'&&s?.themes.includes(s.theme)?TOWER_THEMES[s.theme]:fallback;}
function openTowerMenu(){
 if(!towerActive()&&(isGymBattle()||legendaryActive()||practiceSession))return false;
 setModal('mainMenuModal',false);setModal('townModal',false);compactReturn=null;compactTown=false;requestAutoPause();clearHeldInput();hideOverlay();setModal('towerModal',true);renderTowerMenu();resetMenuFocus($('towerModal'));return true;
}
function closeTowerMenu(){
 if(towerActive()?.stage==='prep'||towerActive()?.stage==='recap')return;
 setModal('towerModal',false);if(isTowerBattle()){paused=true;showOverlay('TOWER PAUSED',towerObjectiveText(),'RESUME');}else if(save.townStop?.active){setModal('townModal',true);renderTownStop();resetMenuFocus($('townModal'));}else openMainMenu();
}
function restoreTowerUI(){const a=towerActive();if(!a)return;syncTowerTrainers();if(a.stage==='battle'){if(!isShown('gymIntroModal')){showGymIntro(TOWER_FIRST+a.round);$('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='RESUME TOWER ROUND';}}else openTowerMenu();}
function renderTowerMenu(){
 if(!$('towerModal'))return;const s=towerState(),a=towerActive(),d=a?.difficulty||adventureDifficulty,r=TOWER_ROUNDS[a?.round||0];
 $('towerSubtitle').textContent=`${d.toUpperCase()} · ${d==='easy'?'FIXED BADGE SPEED 1 · EASY SLIDER APPLIES':'BADGE SPEED CAP '+(d==='hard'?12:8)} · THREE ROUNDS`;
 $('towerOverview').hidden=!!a;$('towerPreparation').hidden=!a||a.stage!=='prep';$('towerResult').hidden=!a||a.stage!=='recap';$('towerLive').hidden=!a||a.stage!=='battle';
 $('towerStart').disabled=!towerEntryReady()||!!a||portabilityStorageLocked;$('towerLock').textContent=towerUnlocked()?'Enter from a peaceful spot. After the set you return to Indigo Plateau. Your journey, earned EXP and team are kept.':'Defeat Champion Gary in this Adventure profile to unlock the Tower.';
 $('towerRoundTitle').textContent=`ROUND ${(a?.round||0)+1} / 3 · ${r.name}`;
 syncTowerTrainers();$('towerOpponents').innerHTML=GYMS[TOWER_FIRST+(a?.round||0)].team.map(m=>`<article><canvas width="96" height="96" data-tower-art="${m.dex}"></canvas><b>${BYDEX[m.dex].name}</b><span>Lv.${m.level}</span></article>`).join('');
 $('towerOpponents').querySelectorAll('canvas').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.towerArt],false));
 $('towerObjective').textContent=`Defeat both Pokémon AND ${[r.lines?'clear '+r.lines+' lines':'',r.multi?'make '+r.multi+' clears of 2+ lines':''].filter(Boolean).join(' and ')}. Final opponent holds at 1 HP until the objective is met.`;
 $('towerHazards').textContent=`${r.hazard} · every ${r.interval/1000}s · 3s warning. Mandatory bricks cannot be held. A fresh board and empty Hold start each round.`;
 $('towerParty').textContent=save.team.map(n=>`${pokemonName(n)} Lv.${save.collection[n]?.level||1}`).join(' · ');
 $('towerLiveText').textContent=a?`ROUND ${a.round+1} · ${towerObjectiveText(a)}`:'';
 $('towerWithdraw').hidden=!a||a.stage==='recap';$('towerReturn').hidden=!a||a.stage!=='recap';$('towerClose').hidden=!!a&&a.stage!=='battle';
 $('towerSave').hidden=!a;$('towerSaveExit').hidden=!a;
 if(a?.stage==='recap'){const q=a.result;$('towerResultTitle').textContent=q.outcome;$('towerResultText').textContent=`${q.rounds}/3 rounds won · ${q.lines} lines · ${q.score.toLocaleString()} score · ${Math.ceil(q.elapsed/1000)}s active battle time`;$('towerRewards').textContent=q.rewards.join(' · ')||'No ribbon this time. Your earned EXP is kept; your team is healed.';}
 $('towerThemes').innerHTML=s.themes.map(t=>`<option value="${t}">${TOWER_THEMES[t].label}</option>`).join('');$('towerThemes').value=s.theme;
 renderTowerRecords();
}
function renderTowerRecords(){
 const s=towerState(),d=$('towerRecordDifficulty').value,records=s.records.filter(r=>r.difficulty===d&&r.rules===TOWER_RULESET).slice().sort((a,b)=>b.rounds-a.rounds||b.score-a.score||a.elapsed-b.elapsed).slice(0,10);
 $('towerRecordCount').textContent=`${d.toUpperCase()} · ${s.clears[d]} CLEARED SETS · TOWER V1`;
 $('towerRecordList').innerHTML=records.map(r=>`<li>${r.outcome} · ${r.rounds}/3 · ${r.score.toLocaleString()} score · ${r.lines} lines · ${Math.ceil(r.elapsed/1000)}s · ${new Date(r.date).toLocaleDateString()}</li>`).join('')||'<li>No completed sets on this difficulty yet.</li>';
}
function validateTowerSave(s){
 const t=s.tower,b=s.gymBattle,towerBattle=b&&b.gymIndex>=TOWER_FIRST;
 if(t===undefined){backupAssert(!towerBattle,'Tower checkpoint is missing.');return;}
 const diff=d=>['easy','normal','hard'].includes(d),record=r=>backupObject(r)&&r.rules===TOWER_RULESET&&diff(r.difficulty)&&backupInteger(r.date,1,8.64e15)&&['SET CLEARED','STACK TOPPED OUT','TEAM FAINTED','WITHDREW'].includes(r.outcome)&&backupInteger(r.rounds,0,3)&&(r.outcome==='SET CLEARED'?r.rounds===3:r.rounds<3)&&backupInteger(r.lines)&&backupNumber(r.elapsed)&&backupNumber(r.score)&&backupArray(r.partners,150,backupDex)&&backupUnique(r.partners)&&backupArray(r.rewards,4,v=>typeof v==='string'&&v.length<160);
 backupAssert(backupObject(t)&&t.version===1&&backupObject(t.clears)&&['easy','normal','hard'].every(d=>backupInteger(t.clears[d]))&&backupArray(t.themes,4,v=>Object.hasOwn(TOWER_THEMES,v))&&backupUnique(t.themes)&&t.themes.includes('classic')&&t.themes.includes(t.theme)&&backupArray(t.records,90,record),'Invalid Tower records or rewards.');
 const a=t.active;if(a===null){backupAssert(!towerBattle,'Orphaned Tower battle.');return;}
 backupAssert(backupObject(a)&&a.rules===TOWER_RULESET&&['prep','battle','recap'].includes(a.stage)&&diff(a.difficulty)&&backupInteger(a.round,0,2)&&backupInteger(a.startedAt,1,8.64e15)&&backupNumber(a.elapsed)&&backupInteger(a.lines)&&backupInteger(a.multi)&&backupInteger(a.totalLines,a.lines)&&backupNumber(a.scoreStart)&&backupArray(a.partners,150,backupDex)&&backupUnique(a.partners)&&backupArray(a.rounds,3,(v,i)=>backupObject(v)&&v.round===i&&backupInteger(v.lines,TOWER_ROUNDS[i].lines)&&backupInteger(v.multi,TOWER_ROUNDS[i].multi)),'Invalid Tower set.');
 backupAssert(s.journey?.championDefeated===true&&s.badges.length===8&&!s.legendary?.active&&!s.townStop&&!s.trainingMode,'Invalid Tower entry.');
 if(a.stage==='recap')backupAssert(!b&&record(a.result)&&a.result.difficulty===a.difficulty&&a.result.rounds===a.rounds.length&&JSON.stringify(t.records[t.records.length-1])===JSON.stringify(a.result),'Invalid Tower recap.');
 else backupAssert(a.rounds.length===a.round&&!a.result,'Invalid Tower round order.');
 if(a.stage==='battle')backupAssert(towerBattle&&b.gymIndex===TOWER_FIRST+a.round&&b.active===true&&backupInteger(b.teamIndex,0,1)&&backupNumber(b.specialTimer,0,TOWER_ROUNDS[a.round].interval)&&backupNumber(b.eliteWarning,0,3000)&&backupNumber(b.eliteVeil,0,6000)&&backupInteger(b.pendingHazards,0,100000),'Invalid Tower hazard checkpoint.');
 else backupAssert(!b,'Tower preparation cannot contain a battle.');
}
function initializeTower(){
 TOWER_ROUNDS.forEach(r=>GYMS.push({leader:r.leader,city:'BATTLE TOWER',name:r.name,route:'BATTLE TOWER',goal:0,icon:'◆',specialty:'TOWER',ace:70,quote:'A Champion’s next challenge. Prepare your team and read the board.',effectText:r.hazard,team:[]}));syncTowerTrainers();
 document.body.insertAdjacentHTML('beforeend',`<div id="towerModal" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="towerTitle"><div class="controls-card tower-card"><header><p>INDIGO PLATEAU · POSTGAME</p><h2 id="towerTitle">BATTLE TOWER</h2><p id="towerSubtitle"></p></header><section id="towerOverview"><p id="towerLock"></p><p>Three battles, two opponents each. Heal and prepare between rounds. Clear board objectives as well as defeating the opponents. No added speed escalation.</p><p>Partners who clear lines earn a difficulty ribbon when you win all three rounds. First win: Slate board. Three wins: Dusk board. Hard win: Gold board. Themes and records belong to this trainer profile.</p><button id="towerStart" data-nav-default>START THREE-ROUND SET</button></section><section id="towerPreparation"><h3 id="towerRoundTitle"></h3><div id="towerOpponents"></div><p id="towerObjective"></p><p id="towerHazards"></p><p><b>TEAM HEALED · PREPARE BEFORE CONTINUING</b></p><p id="towerParty"></p><div class="tower-actions"><button id="towerInventory">INVENTORY & PARTNER</button><button id="towerPC">BILL’S PC</button><button id="towerBegin" data-nav-default>BEGIN ROUND</button></div></section><section id="towerLive"><p id="towerLiveText"></p></section><section id="towerResult"><h3 id="towerResultTitle"></h3><p id="towerResultText"></p><p id="towerRewards"></p></section><details><summary role="button" tabindex="0">RECORDS & BOARD THEMES</summary><label>Difficulty <select id="towerRecordDifficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option></select></label><p id="towerRecordCount"></p><ol id="towerRecordList"></ol><p>Best 10 of the latest 90 attempts; ranked by rounds, score, then time. Easy’s optional speed slider can increase score.</p><label>Earned board theme <select id="towerThemes"></select></label></details><footer class="tower-actions"><button id="towerClose">BACK</button><button id="towerWithdraw">WITHDRAW…</button><button id="towerReturn" data-nav-default>RETURN TO INDIGO PLATEAU</button><button id="towerSave">SAVE CHECKPOINT</button><button id="towerSaveExit">SAVE & RETURN TO TITLE</button></footer><p id="towerSaveStatus" role="status"></p></div></div>`);
 navModalIds.splice(navModalIds.indexOf('townModal'),0,'towerModal');
 $('mainPractice').insertAdjacentHTML('beforebegin','<button id="mainTower">BATTLE TOWER</button>');$('mainTower').onclick=openTowerMenu;
 $('townSub').insertAdjacentHTML('afterend','<button id="townTower" hidden>BATTLE TOWER · THREE-ROUND SETS</button>');$('townTower').onclick=openTowerMenu;
 $('towerStart').onclick=startTowerSet;$('towerBegin').onclick=startTowerRound;$('towerClose').onclick=closeTowerMenu;$('towerWithdraw').onclick=leaveTower;$('towerReturn').onclick=leaveTower;
 $('towerInventory').onclick=()=>{towerUtility=true;setModal('towerModal',false);openFieldMenu();};$('towerPC').onclick=()=>{towerUtility=true;setModal('towerModal',false);openBillsPC();};$('towerSave').onclick=()=>towerSave('Tower checkpoint');$('towerSaveExit').onclick=()=>{if(towerSave('Tower checkpoint'))saveAndReturnToTitle();};
 $('towerRecordDifficulty').onchange=renderTowerRecords;$('towerThemes').onchange=()=>{const t=towerState();if(t.themes.includes($('towerThemes').value)){t.theme=$('towerThemes').value;drawBoard();drawNext();towerSave('Board theme');}};
 const clearBase=clearLines;clearLines=function(){towerLinesBeforeClear();return clearBase();};
 const hpBase=gymPokemonMaxHP;gymPokemonMaxHP=function(level,index,slot){return index>=TOWER_FIRST?Math.round((360+level*6+(slot||0)*60)*(adventureDifficulty==='hard'?1.15:adventureDifficulty==='easy'?.8:1)):hpBase(level,index,slot);};
 const dataBase=gymData;gymData=function(){return isTowerBattle()?GYMS[save.gymBattle.gymIndex]:dataBase();};
 const encounterBase=ensureRouteEncounter;ensureRouteEncounter=function(){if(towerActive())return;return encounterBase();};
 const practiceBase=openPractice;openPractice=function(){if(towerActive())return;return practiceBase();};
 const themeBase=gymThemeMeta;gymThemeMeta=function(index=gym-1){return index>=TOWER_FIRST?{...GYM_THEME_META[TOWER_ROUNDS[index-TOWER_FIRST].theme],label:'BATTLE TOWER'}:themeBase(index);};
 const artBase=setGymLeaderArt;setGymLeaderArt=function(el,index){return artBase(el,index>=TOWER_FIRST?TOWER_ROUNDS[index-TOWER_FIRST].art:index);};
 const introBase=showGymIntro;showGymIntro=function(index){introBase(index);if(index>=TOWER_FIRST){$('gymIntroModal').querySelector('.gym-alert').textContent=`BATTLE TOWER · ROUND ${index-TOWER_FIRST+1}/3`;$('gymIntroCity').textContent=TOWER_ROUNDS[index-TOWER_FIRST].name;$('gymIntroCap').textContent=towerObjectiveText()+' · BADGE SPEED '+tetrisLevel();$('gymIntroEffect').textContent=$('towerObjective').textContent+' '+TOWER_ROUNDS[index-TOWER_FIRST].hazard;}};
 const feedbackBase=battleFeedbackState;battleFeedbackState=function(){const s=feedbackBase();if(isTowerBattle()){const a=towerActive(),b=save.gymBattle,r=TOWER_ROUNDS[a.round];s.hazard=`${r.hazard} ${Math.ceil((b.eliteWarning||r.interval-b.specialTimer)/1000)}s`;s.urgent=b.eliteWarning>0;s.detail=[towerObjectiveText(),b.pendingHazards?`${a.round===0?'STONE':'GHOST BRICK'} QUEUED ×${b.pendingHazards}`:'',b.eliteVeil?`NEXT HIDDEN ${Math.ceil(b.eliteVeil/1000)}s`:''].filter(Boolean).join(' · ');}return s;};
 const hudBase=updateHUD;updateHUD=function(){hudBase();if(isTowerBattle()){$('mapTitle').textContent='BATTLE TOWER';$('battleKindLabel').textContent=`ROUND ${towerActive().round+1}/3 · ${TOWER_ROUNDS[towerActive().round].leader}`;$('routeName').textContent='TOWER · '+towerObjectiveText();}if($('mainTower'))$('mainTower').disabled=!!practiceSession||!!legendaryActive()||isGymBattle()&&!isTowerBattle();};
 const townBase=renderTownStop;renderTownStop=function(){townBase();$('townTower').hidden=!towerUnlocked();};
 const rootBase=menuRoot;menuRoot=function(){const root=rootBase();if(towerUtility&&towerActive()&&(!root||root.id==='overlay')){towerUtility=false;hideOverlay();setModal('towerModal',true);renderTowerMenu();resetMenuFocus($('towerModal'));return $('towerModal');}return root;};
 const fieldBase=renderFieldMenu;renderFieldMenu=function(){fieldBase();if(towerActive())$('fieldFly').disabled=true;};
 const flyBase=travelToFlyTarget;travelToFlyTarget=function(target){if(towerActive())return false;return flyBase(target);};
 const menuBase=compactRefreshMenu;compactRefreshMenu=function(){menuBase();if(towerActive()){for(const id of ['mainFly','mainTravel','mainPractice'])$(id).disabled=true;}};
 const backBase=menuBack;menuBack=function(){if(menuRoot()?.id==='towerModal'){if(towerActive()?.stage==='prep')leaveTower();else if(towerActive()?.stage==='recap')leaveTower();else closeTowerMenu();return;}return backBase();};
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return isShown('towerModal')||!!towerActive()&&towerActive().stage!=='battle'||pauseBase();};
 const screensBase=clearControlsScreens;clearControlsScreens=function(){towerUtility=false;setModal('towerModal',false);screensBase();};
}
