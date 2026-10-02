// Legendary trials and collection planning own their state without adding battle HUD panels.
const LEGENDARY_TRIALS={
 144:{name:'ARTICUNO',route:'SEAFOAM ISLANDS',badges:6,level:50,goal:6,title:'FROZEN SANCTUARY',objective:'Break all six ice seals. Clear the six cyan foundation rows; ordinary rows do not count.',interval:24000,hazard:'ICE RISE',color:'I'},
 145:{name:'ZAPDOS',route:'POWER PLANT',badges:6,level:50,goal:3,title:'OVERLOADED GENERATOR',objective:'Discharge three circuits. Each Double, Triple or Tetris discharges one circuit. Singles do not count.',interval:18000,hazard:'POWER SURGE',color:'O'},
 146:{name:'MOLTRES',route:'VICTORY ROAD',badges:8,level:55,goal:8,title:'EMBER CHAMBER',objective:'Extinguish eight ember rows. Orange foundation rows and new ember rises count; ordinary rows do not.',interval:15000,hazard:'EMBER RISE',color:'L'},
 150:{name:'MEWTWO',route:'CERULEAN CAVE',badges:8,level:70,goal:12,title:'PSYCHIC SEAL',objective:'Clear twelve lines, including at least two Tetrises. Psychic veils hide NEXT for four seconds after each surge.',interval:20000,hazard:'PSYCHIC SURGE',color:'T'}
};
let milestoneReady=false,plannerDex=null,plannerRoute=null;const milestoneDisabled=new Map();
function legendaryActive(){return !!save?.legendary?.active;}
function legendaryState(){
 if(!save.legendary)save.legendary={version:1,cleared:[],caught:[144,145,146,150].filter(d=>dexRunOwned(d)),active:null};
 return save.legendary;
}
function milestoneUsesTrials(){return isAdventureMode()||save.rogue?.ruleset==='expedition-v2';}
function milestoneWildTable(table){return table.filter(m=>!LEGENDARY_TRIALS[m.dex]);}
function legendaryPrerequisites(dex){
 const def=LEGENDARY_TRIALS[dex];if(!def)return ['Unknown challenge'];const reasons=[];
 if(!save.starter)reasons.push('Choose a starter');
 if(practiceSession||save.bossTest)reasons.push('Return to your campaign');
 if(towerActive())reasons.push('Finish or withdraw from your Battle Tower set');
 if(!isAdventureMode()&&save.rogue?.ruleset!=='expedition-v2')reasons.push('Requires Adventure or a new KT3 Rogue expedition');
 if((save.badges?.length||0)<def.badges)reasons.push(`Earn ${def.badges} badges (${save.badges.length}/${def.badges})`);
 const visited=new Set((save.routeChain?.visitedCursors||[]).map(i=>ROUTE_CHAIN_NODES[i]?.route));
 if(isAdventureMode()&&!visited.has(def.route)&&currentRoute()!==def.route)reasons.push(`Visit ${def.route}`);
 if(dex===150){if(!leagueState().cleared)reasons.push('Become Champion');const caught=legendaryState().caught;if(![144,145,146].every(d=>caught.includes(d)||dexRunOwned(d)))reasons.push('Catch all three legendary birds in this run');}
 if(isGymBattle()||isGymTransition()||gymVictoryClickthroughActive||save.encounterDefeated||gameOver||Math.max(0,save.adventureRecoveryLines||0)>0)reasons.push('Finish the current battle, catch or recovery');
 return reasons;
}
function openLegendaryMenu(message=''){
 requestAutoPause();clearHeldInput();setModal('legendaryMenu',true);renderLegendaryMenu();$('legendaryStatus').textContent=message;resetMenuFocus($('legendaryMenu'));
}
function renderLegendaryMenu(){
 const state=legendaryState();$('legendaryList').innerHTML=Object.entries(LEGENDARY_TRIALS).map(([id,d])=>{const dex=+id,caught=state.caught.includes(dex),ready=state.cleared.includes(dex),why=legendaryPrerequisites(dex);return `<article class="legend-card"><canvas width="96" height="96" data-legend-art="${dex}"></canvas><div><h3>${d.name} · Lv.${d.level}</h3><p>${d.route} · ${isAdventureMode()?'visit habitat + ':''}${d.badges} badges${dex===150?' · Champion + three birds':''}</p><p>${d.objective}</p><p>Badge speed ${badgeSpeedLevel()} · ${d.hazard.toLowerCase()} every ${d.interval/1000}s, with a 3s warning.</p><strong>${caught?'CAUGHT IN THIS RUN':ready?'TRIAL COMPLETE · CATCH READY':why.length?why.join(' · '):'READY TO CHALLENGE'}</strong><div class="planner-actions"><button data-trial="${dex}" ${caught||why.length||legendaryActive()?'disabled':''}>${ready?'CLAIM CATCH':'ENTER TRIAL'}</button><button data-plan-legend="${dex}">LOCATIONS</button></div></div></article>`;}).join('');
 $('legendaryList').querySelectorAll('[data-legend-art]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.legendArt],false));
 $('legendaryList').querySelectorAll('[data-plan-legend]').forEach(b=>b.onclick=()=>openCollectionPlanner(+b.dataset.planLegend));
 $('legendaryList').querySelectorAll('[data-trial]').forEach(b=>b.onclick=()=>{const dex=+b.dataset.trial;showControlsConfirm('ENTER '+LEGENDARY_TRIALS[dex].name+' TRIAL?',`Your current board is saved and a fresh trial board opens. Clear the objective for one guaranteed catch; no ball is consumed. Items and normal combat are disabled. ${isAdventureMode()?'You may withdraw safely; topping out uses normal Adventure recovery.':'Topping out or withdrawing ends this Rogue expedition.'}`,()=>startLegendaryTrial(dex),'ENTER TRIAL');});
}
function startLegendaryTrial(dex){
 if(legendaryActive()||legendaryPrerequisites(dex).length||legendaryState().caught.includes(dex))return false;
 const original=runSnapshot();original.save=clonePlain(save);const d=LEGENDARY_TRIALS[dex],state=legendaryState();
 state.active={dex,phase:state.cleared.includes(dex)?'catch':'trial',progress:0,tetrises:0,lines:0,elapsed:0,timer:0,warning:0,veil:0,rises:0,marks:Array(ROWS).fill(false),returnSnapshot:original};
 // The checkpoint has no active trial, preventing recursive save trees.
 state.active.returnSnapshot.save.legendary.active=null;
 clearControlsScreens();hideOverlay();clearTimeout(captureFlashTimer);setModal('capture',false);setModal('townModal',false);selectGamePanel('gamePanel');compactReturn=null;compactTown=false;utilityReturn=null;
 save.townStop=null;save.trainingMode=null;save.encounterDex=dex;save.encounterHP=100;save.encounterMaxHP=100;save.encounterLevel=d.level;save.encounterDefeated=false;save.encounterTetrises=0;save.tetris=cleanTetrisState(null);
 board=emptyBoard();bag=[];current=null;nextPiece=piece(take());gameOver=false;paused=true;
 if(dex===144||dex===146){const rows=dex===144?6:4;for(let y=ROWS-rows;y<ROWS;y++){board[y]=Array.from({length:COLS},(_,x)=>x===4?'':d.color);state.active.marks[y]=true;}}
 spawn(true);resetPieceMotion();v25ResetBattleState('LEGENDARY TRIAL');
 if(!saveRunProgress('Legendary trial',true)){restoreRunSnapshot(original,original.mode);openLegendaryMenu('Could not save the checkpoint. The trial did not start.');return false;}
 if(state.active.phase==='catch')showLegendaryCatch();else campaignResumePlay();updateHUD();drawBoard();return true;
}
function clearLegendaryLines(){
 const a=save.legendary?.active;if(!a||a.phase!=='trial')return 0;let n=0,marked=0;
 for(let y=ROWS-1;y>=0;y--)if(board[y].every(Boolean)){if(a.marks[y])marked++;board.splice(y,1);board.unshift(Array(COLS).fill(''));a.marks.splice(y,1);a.marks.unshift(false);n++;y++;}
 if(!n)return 0;
 a.lines+=n;if(n===4)a.tetrises++;a.progress+=a.dex===144||a.dex===146?marked:a.dex===145?(n>=2?1:0):n;
 beep(440,.05);const d=LEGENDARY_TRIALS[a.dex];
 if(a.progress>=d.goal&&(a.dex!==150||a.tetrises>=2)){
   a.phase='catch';if(!save.legendary.cleared.includes(a.dex))save.legendary.cleared.push(a.dex);paused=true;clearHeldInput();current=null;saveRunProgress('Legendary trial complete',true);showLegendaryCatch();
 }
 updateHUD();return n;
}
function legendaryTick(delta){
 const a=save.legendary?.active;if(!a||a.phase!=='trial'||paused||gameOver||pauseDialogOpen()||autoPauseRequested)return;
 const d=LEGENDARY_TRIALS[a.dex],ms=Math.max(0,Math.min(100,delta));a.elapsed+=ms;a.veil=Math.max(0,a.veil-ms);
 if(a.warning>0){a.warning=Math.max(0,a.warning-ms);if(!a.warning){
   if(board[0].some(Boolean)){loseLegendaryTrial('stack');return;}
   board.shift();const gap=(a.rises*3+4)%COLS;board.push(Array.from({length:COLS},(_,x)=>x===gap?'':a.dex===144?'X':d.color));a.marks.shift();a.marks.push(a.dex===146);a.rises++;
   if(current){current.y--;if(collides(current)){loseLegendaryTrial('stack');return;}}
   if(a.dex===150)a.veil=4000;drawNext();
 }}else{a.timer+=ms;if(a.timer>=d.interval-3000){a.timer=0;a.warning=3000;}}
 if(a.dex===150&&a.veil===0)drawNext();renderLegendaryHUD();
}
function showLegendaryCatch(){
 const a=save.legendary?.active;if(!a||a.phase!=='catch')return;paused=true;clearHeldInput();hideOverlay();
 const d=LEGENDARY_TRIALS[a.dex];$('legendaryCatchTitle').textContent=d.name+' TRUSTS YOU';$('legendaryCatchText').textContent=`${d.title} complete. Catch ${d.name} Lv.${d.level} with a guaranteed Sanctuary Ball. No item is consumed. ${save.team.length>=6?'Your team is full; it will go to Bill’s PC.':'It will join your team.'} You can leave and claim this opportunity later.`;
 drawPortrait($('legendaryCatchPortrait'),BYDEX[a.dex],false);setModal('legendaryCatch',true);resetMenuFocus($('legendaryCatch'));
}
function legendaryReturnSnapshot(){
 const a=save.legendary.active,out=clonePlain(a.returnSnapshot);out.save.legendary=clonePlain(save.legendary);out.save.legendary.active=null;out.save.wantedDex=save.wantedDex??null;if(out.mode==='rogue'&&out.save.rogue&&!out.save.rogue.result)out.save.rogue.elapsed+=a.elapsed;return out;
}
function claimLegendaryCatch(){
 const a=save.legendary?.active;if(!a||a.phase!=='catch'||save.legendary.caught.includes(a.dex))return false;
 const dex=a.dex,d=LEGENDARY_TRIALS[dex],oldSave=save,out=legendaryReturnSnapshot();
 // Commit the reward and restored campaign in one slot write. Failure leaves the offer intact.
 save=out.save;const result=addCaughtPokemonToRunTeamOrPc(BYDEX[dex],{method:'legendary',location:d.route,level:d.level});Object.assign(result.entry,{level:d.level,levelXP:0,currentHP:pokemonMaxHP(d.level,dex),hpModel:'v25-line-battle'});
 save.legendary.caught.push(dex);save.stats.catches++;out.savedAt=Date.now();save=oldSave;
 try{if(portabilityBusy||portabilityStorageLocked)throw Error('Storage recovery is pending');localStorage.setItem(activeRunSaveKey(),JSON.stringify(out));}
 catch(err){$('legendaryCatchText').textContent='Catch not saved. Your opportunity is still here. Free storage or resolve Save Backups recovery, then try again.';reportSave('run',false,'Legendary catch not saved');return false;}
 metaDex.add(dex);persistMetaDex();restoreRunSnapshot(out,out.mode);soundCatch();openLegendaryMenu(`${d.name} CAUGHT! ${result.sentToPc?'Sent to Bill’s PC.':'Added to your team.'}`);return true;
}
function leaveLegendaryTrial(){
 if(!legendaryActive())return;
 if(save.legendary.active.phase==='trial'&&!isAdventureMode()){loseLegendaryTrial('stack');return;}
 const out=legendaryReturnSnapshot();restoreRunSnapshot(out,out.mode);saveRunProgress('Left legendary sanctuary',true);openLegendaryMenu('Returned to your saved board. Completed trials keep their catch opportunity.');
}
function loseLegendaryTrial(kind){
 const out=legendaryReturnSnapshot();restoreRunSnapshot(out,out.mode);campaignLoss(kind);saveRunProgress('Legendary trial lost',true);
}
function legendaryRestoreUI(){
 if(!legendaryActive())return;paused=true;gameOver=false;hideOverlay();
 if(save.legendary.active.phase==='catch')showLegendaryCatch();else showOverlay('LEGENDARY TRIAL SAVED',LEGENDARY_TRIALS[save.legendary.active.dex].objective,'RESUME');
 renderLegendaryHUD();
}
function renderLegendaryHUD(){
 if(!milestoneReady)return;document.body.classList.toggle('legendary-trial',legendaryActive());if(!legendaryActive()){for(const [id,disabled]of milestoneDisabled)if($(id))$(id).disabled=disabled;milestoneDisabled.clear();return;}
 const a=save.legendary.active,d=LEGENDARY_TRIALS[a.dex];
 $('routeName').textContent=d.name+' · '+d.title;$('gymGoalText').textContent=`${Math.min(d.goal,a.progress)}/${d.goal}${a.dex===145?' CIRCUITS':a.dex===150?' LINES':' SEALS'}${a.dex===150?' · '+a.tetrises+'/2 TETRISES':''}`;
 $('gymProgress').style.width=Math.min(100,a.progress/d.goal*100)+'%';$('mapTitle').textContent='LEGENDARY SANCTUARY';$('mapRouteText').textContent=d.route;$('battleKindLabel').textContent=d.name+' · BOARD TRIAL';
 const info=$('legendaryTrialInfo');info.textContent=`${d.objective}\n${a.phase==='catch'?'CATCH READY':`${d.hazard} ${Math.ceil((a.warning||d.interval-a.timer)/1000)}s${a.warning?' · CLEAR SPACE!':''}${a.veil?' · NEXT VEILED':''}${paused?' · PAUSED':''}`}\nMenu → Legendary Challenges to review or withdraw.`;
 $('battleFeedback').hidden=true;
 for(const id of ['mainInventory','mainBills','mainSven','mainFly','mainTravel','mainPractice','mainRogueRecap','fieldBills','fieldSven','fieldFly'])if($(id)){if(!milestoneDisabled.has(id))milestoneDisabled.set(id,$(id).disabled);$(id).disabled=true;}
}
function validateMilestoneSave(s){
 if(s.wantedDex!==undefined&&s.wantedDex!==null)backupAssert(backupDex(s.wantedDex),'Invalid wanted species.');
 if(s.legendary===undefined)return;const l=s.legendary;
 const ids=a=>backupArray(a,4,n=>Number.isInteger(n)&&Object.hasOwn(LEGENDARY_TRIALS,n))&&backupUnique(a);
 backupAssert(backupObject(l)&&l.version===1&&ids(l.cleared)&&ids(l.caught),'Invalid legendary milestones.');
 if(l.active===null)return;const a=l.active;
 backupAssert(backupObject(a)&&Number.isInteger(a.dex)&&Object.hasOwn(LEGENDARY_TRIALS,a.dex)&&['trial','catch'].includes(a.phase)&&!l.caught.includes(a.dex),'Invalid legendary trial.');
 for(const k of ['progress','tetrises','lines','elapsed','timer','warning','veil','rises'])backupAssert(backupNumber(a[k],0,k==='warning'?3000:k==='veil'?4000:1e12),'Invalid legendary counter.');
 backupAssert(backupArray(a.marks,ROWS,v=>typeof v==='boolean')&&a.marks.length===ROWS,'Invalid legendary seals.');
 backupAssert(backupObject(a.returnSnapshot)&&['adventure','rogue'].includes(a.returnSnapshot.mode)&&backupObject(a.returnSnapshot.save)&&!a.returnSnapshot.save.legendary?.active&&!a.returnSnapshot.save.gymBattle,'Invalid legendary return checkpoint.');
 validateBackupRun(a.returnSnapshot,a.returnSnapshot.mode);
 if(a.phase==='catch')backupAssert(l.cleared.includes(a.dex),'Catch without a completed trial.');
}
function plannerCanFly(target){
 updateFlyButton();return !!target?.available&&isAdventureMode()&&save.starter&&!legendaryActive()&&!practiceSession&&!isGymBattle()&&!gameOver&&!$('flyBtn').disabled;
}
function plannerTarget(route){return flyTargets().find(t=>t.kind==='route'&&t.route===route);}
function plannerTravel(route){
 const target=plannerTarget(route);if(!plannerCanFly(target))return false;
 clearControlsScreens();setModal('legendaryMenu',false);setModal('collectionPlanner',false);closeDexDetail();selectGamePanel('gamePanel');compactReturn=null;compactTown=false;utilityReturn=null;fieldReturnTown=false;
 travelToFlyTarget(target);return true;
}
function plannerSetPin(dex){
 if(practiceSession||!save.starter)return false;const before=save.wantedDex;save.wantedDex=dex;
 if(!saveRunProgress('Collection goal',true)){save.wantedDex=before;return false;}renderPlanner();resetMenuFocus($('collectionPlanner'));focusMenuElement($('plannerPinButton'),$('collectionPlanner'));return true;
}
function openCollectionPlanner(dex=null,route=null){
 closeDexDetail();plannerDex=BYDEX[dex]?+dex:save.wantedDex||null;plannerRoute=route||null;requestAutoPause();clearHeldInput();renderPlanner();setModal('collectionPlanner',true);resetMenuFocus($('collectionPlanner'));
}
function plannerRoutesFor(dex){return LEGENDARY_TRIALS[dex]?[LEGENDARY_TRIALS[dex].route]:dexRoutesFor(dex);}
function renderPlanner(){
 const pin=save.wantedDex; $('plannerPin').textContent=pin?`PINNED: #${dexPad(pin)} ${BYDEX[pin].name.toUpperCase()} · ${dexIsUnlocked(pin)?'REGISTERED':'WANTED'}`:'No species pinned. Open any Pokédex entry and choose PLAN & PIN.';
 const mon=BYDEX[plannerDex],d=LEGENDARY_TRIALS[plannerDex],routes=mon?plannerRoutesFor(mon.dex):[];
 const pre=mon?dexPreEvolution(mon.dex):null;
 $('plannerSpecies').innerHTML=mon?`<h3>#${dexPad(mon.dex)} ${mon.name.toUpperCase()}</h3><div class="planner-actions"><button id="plannerPinButton" ${practiceSession||!save.starter?'disabled':''}>${pin===mon.dex?'UNPIN SPECIES':'PIN WANTED SPECIES'}</button>${pre?`<button id="plannerEvolution">PLAN ${BYDEX[pre].name.toUpperCase()} → EVOLVE</button>`:''}</div><p>${d&&milestoneUsesTrials()?'Dedicated challenge · '+d.badges+' badges'+(mon.dex===150?' · Champion + catch all three birds':'')+'.':dexEvolutionText(mon.dex)}</p>${routes.length?routes.map(r=>`<div class="planner-location"><b>${r}</b><button data-plan-route="${r}">ROUTE DETAILS</button><button data-plan-fly="${r}" ${plannerCanFly(plannerTarget(r))?'':'disabled'}>FLY HERE${plannerTarget(r)?.available?'':' · LOCKED'}</button></div>`).join(''):`<p>No wild habitat. ${dexSourcesFor(mon.dex).special.join(' · ')}. Use the evolution link above where available.</p>`}`:'<p>Select a species from the Pokédex, or explore a route below.</p>';
 $('plannerPinButton')?.addEventListener('click',()=>{if(!plannerSetPin(pin===mon.dex?null:mon.dex))$('plannerPin').textContent='Could not save the pin. Your previous goal is unchanged.';});
 $('plannerEvolution')?.addEventListener('click',()=>{plannerDex=pre;renderPlanner();resetMenuFocus($('collectionPlanner'));});
 const allRoutes=[...new Set(ROUTE_CHAIN_NODES.filter(n=>n.type==='route').map(n=>n.route))];if(!allRoutes.includes(plannerRoute))plannerRoute=routes[0]||(allRoutes.includes(currentRoute())?currentRoute():allRoutes[0]);
 $('plannerRouteSelect').innerHTML=allRoutes.map(r=>`<option value="${r}" ${r===plannerRoute?'selected':''}>${r}</option>`).join('');
 const rawTable=ROUTE_CHAIN_ENCOUNTERS[plannerRoute]||ROUTE_ENCOUNTERS[plannerRoute]||[],table=milestoneUsesTrials()?milestoneWildTable(rawTable):rawTable,missing=[...new Set(table.map(m=>m.dex))].filter(dex=>!dexIsUnlocked(dex));
 const legends=Object.keys(LEGENDARY_TRIALS).map(Number).filter(dex=>LEGENDARY_TRIALS[dex].route===plannerRoute);
 $('plannerRouteInfo').innerHTML=`<h3>${plannerRoute}</h3><p>Missing Pokémon found here: ${missing.length}${missing.length?'':' · all wild species registered'}.</p><div class="planner-missing">${missing.map(dex=>`<button data-plan-species="${dex}">#${dexPad(dex)} ${BYDEX[dex].name}</button>`).join('')}</div>${legends.map(dex=>`<p>${LEGENDARY_TRIALS[dex].name}: ${milestoneUsesTrials()?'dedicated challenge, outside the wild pool':'legacy wild encounter; trials require a new KT3 run'}${dexIsUnlocked(dex)?' · registered':' · missing'}.</p>`).join('')}<button data-plan-fly="${plannerRoute}" ${plannerCanFly(plannerTarget(plannerRoute))?'':'disabled'}>FLY TO THIS ROUTE</button><p>${isAdventureMode()?plannerTarget(plannerRoute)?.available?'Visited destination. Fly is available outside battles and trials.':'Visit this route first to unlock Fly; Cerulean Cave requires the Champion victory.':'Fly is Adventure-only. These locations are still useful for planning your Rogue journey.'}</p>`;
 $('collectionPlanner').querySelectorAll('[data-plan-route]').forEach(b=>b.onclick=()=>{plannerRoute=b.dataset.planRoute;renderPlanner();});
 $('collectionPlanner').querySelectorAll('[data-plan-fly]').forEach(b=>b.onclick=()=>plannerTravel(b.dataset.planFly));
 $('collectionPlanner').querySelectorAll('[data-plan-species]').forEach(b=>b.onclick=()=>{plannerDex=+b.dataset.planSpecies;renderPlanner();resetMenuFocus($('collectionPlanner'));});
}
function initializeMilestones(){
 const modal=(id,title,body)=>`<div id="${id}" class="controls-modal milestone-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="${id}Title"><div class="controls-card milestone-card"><h2 id="${id}Title">${title}</h2>${body}</div></div>`;
 document.body.insertAdjacentHTML('beforeend',modal('legendaryMenu','LEGENDARY CHALLENGES','<p>Milestone trials use fresh boards and fixed speeds. Finish the objective, then choose your guaranteed catch. Each Pokémon can be claimed once per run.</p><div id="legendaryList"></div><p id="legendaryStatus" role="status"></p><button id="legendaryWithdraw" hidden>WITHDRAW FROM TRIAL…</button><button id="legendaryBack">BACK</button>')+modal('legendaryCatch','SANCTUARY CLEARED','<canvas id="legendaryCatchPortrait" width="144" height="144"></canvas><p id="legendaryCatchText" role="status"></p><button id="legendaryClaim" data-nav-default>CATCH · GUARANTEED</button><button id="legendaryLater">CLAIM LATER</button>')+modal('collectionPlanner','COLLECTION PLANNER','<p id="plannerPin" role="status"></p><section id="plannerSpecies"></section><label>EXPLORE ROUTE<select id="plannerRouteSelect"></select></label><section id="plannerRouteInfo"></section><button id="plannerBack">BACK</button>'));
 $('mainDex').insertAdjacentHTML('afterend','<button id="mainPlanner">COLLECTION PLANNER</button><button id="mainLegendary">LEGENDARY CHALLENGES</button>');$('mainPlanner').onclick=()=>openCollectionPlanner();$('mainLegendary').onclick=()=>openLegendaryMenu();
 $('dexFilters').insertAdjacentHTML('beforebegin','<button id="dexPlanner" class="smallbtn">COLLECTION PLANNER · PINNED GOAL</button>');$('dexPlanner').onclick=()=>openCollectionPlanner();
 const back=id=>{setModal(id,false);resetMenuFocus(menuRoot());};$('plannerBack').onclick=()=>back('collectionPlanner');$('legendaryBack').onclick=()=>back('legendaryMenu');$('plannerRouteSelect').onchange=()=>{plannerRoute=$('plannerRouteSelect').value;renderPlanner();};
 $('legendaryClaim').onclick=claimLegendaryCatch;$('legendaryLater').onclick=leaveLegendaryTrial;
 $('legendaryWithdraw').onclick=()=>showControlsConfirm('WITHDRAW FROM TRIAL?',isAdventureMode()?'Return to your saved campaign board. You may retry the trial later.':'Withdrawing ends this Rogue expedition.',leaveLegendaryTrial,'WITHDRAW');
 navModalIds.unshift('collectionPlanner','legendaryCatch','legendaryMenu');navModalIds.splice(navModalIds.indexOf('controlsConfirm'),1);navModalIds.unshift('controlsConfirm');
 const detailBase=openDexDetail;openDexDetail=function(dex){detailBase(dex);$('dexDetailBody').insertAdjacentHTML('afterbegin','<button id="dexPlanSpecies" class="smallbtn">PLAN & PIN THIS SPECIES</button>');$('dexPlanSpecies').onclick=()=>openCollectionPlanner(+dex);};
 const tableBase=encounterTable;encounterTable=function(){const table=tableBase();return milestoneUsesTrials()?milestoneWildTable(table):table;};
 const ensureBase=ensureRouteEncounter;ensureRouteEncounter=function(){if(legendaryActive())return;return ensureBase();};
 const chooseBase=chooseRouteEncounter;chooseRouteEncounter=function(){if(legendaryActive())return;return chooseBase();};
 const catchBase=catchWild;catchWild=function(dex){if(legendaryActive())return;return catchBase(dex);};
 const itemBase=consumeItemAt;consumeItemAt=function(...args){if(legendaryActive())return false;return itemBase(...args);};
 const nextBase=nextViewerHidden;nextViewerHidden=function(){return legendaryActive()&&save.legendary.active.veil>0||nextBase();};
 const fieldBase=openFieldMenu;openFieldMenu=function(...args){if(legendaryActive())return;return fieldBase(...args);};
 const pcBase=openBillsPC;openBillsPC=function(){if(legendaryActive())return;return pcBase();};
 const svenBase=openSvensPcPanel;openSvensPcPanel=function(){if(legendaryActive())return;return svenBase();};
 const scoreBase=adventureScoreValue;adventureScoreValue=function(n){return legendaryActive()?0:scoreBase(n);};
 const flyButtonBase=updateFlyButton;updateFlyButton=function(){flyButtonBase();if(legendaryActive())$('flyBtn').disabled=true;};
 const flyBase=travelToFlyTarget;travelToFlyTarget=function(t){if(legendaryActive())return;return flyBase(t);};
 const recapBase=showRogueRecap;showRogueRecap=function(){if(legendaryActive())return;return recapBase();};
 const practiceBase=openPractice;openPractice=function(){if(legendaryActive())return;return practiceBase();};
 const backBase=menuBack;menuBack=function(){const id=menuRoot()?.id;if(id==='legendaryCatch')return;if(id==='legendaryMenu'||id==='collectionPlanner'){back(id);return;}return backBase();};
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return ['legendaryMenu','legendaryCatch','collectionPlanner'].some(isShown)||pauseBase();};
 const clearBase=clearControlsScreens;clearControlsScreens=function(){for(const id of ['legendaryMenu','legendaryCatch','collectionPlanner'])setModal(id,false);clearBase();};
 const hudBase=updateHUD;updateHUD=function(){hudBase();renderLegendaryHUD();};
 const menuBase=compactRefreshMenu;compactRefreshMenu=function(){menuBase();$('mainLegendary').disabled=!!practiceSession||!save.starter;$('legendaryWithdraw').hidden=!legendaryActive()||save.legendary.active.phase!=='trial';renderLegendaryHUD();};
 const feedbackBase=refreshBattleFeedback;refreshBattleFeedback=function(){feedbackBase();if(legendaryActive())$('battleFeedback').hidden=true;};
 const flyListBase=renderFlyDestinations;renderFlyDestinations=function(){flyListBase();for(const t of flyTargets().filter(t=>t.kind==='route')){const b=document.createElement('button');b.textContent=t.route+' · MISSING POKÉMON';b.onclick=()=>openCollectionPlanner(null,t.route);$('flyDestinations').append(b);}};
 const mapBase=drawKantoMap;drawKantoMap=function(){
 if(!legendaryActive())return mapBase();
 const d=LEGENDARY_TRIALS[save.legendary.active.dex],c=$('kantoMap'),g=c.getContext('2d'),shade=ENERGY_THEME[d.color];
 g.save();g.clearRect(0,0,c.width,c.height);g.fillStyle=shade.highlight;g.fillRect(0,0,c.width,c.height);g.fillStyle=shade.shadow;
 for(let y=20;y<c.height;y+=24){g.fillRect(12,y,12,14);g.fillRect(c.width-24,y,12,14);}
 g.strokeStyle=shade.base;g.lineWidth=4;g.strokeRect(36,24,c.width-72,c.height-48);
 const portrait=document.createElement('canvas');portrait.width=96;portrait.height=96;drawPortrait(portrait,BYDEX[save.legendary.active.dex],false);g.imageSmoothingEnabled=false;g.drawImage(portrait,(c.width-96)/2,(c.height-96)/2);
 g.fillStyle='#071821';g.font='bold 10px monospace';g.textAlign='center';g.fillText(d.name,c.width/2,16);g.restore();
 };
 const routesBase=dexRoutesFor;dexRoutesFor=function(dex){return LEGENDARY_TRIALS[dex]?[LEGENDARY_TRIALS[dex].route]:routesBase(dex);};
 $('wildBox').insertAdjacentHTML('afterend','<div id="legendaryTrialInfo" role="status"></div>');
 milestoneReady=true;
}
