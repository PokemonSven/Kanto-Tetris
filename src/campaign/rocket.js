// Optional Adventure story. Badge, rival and Rocket progression have separate owners.
const ROCKET_GRUNT_ART='__ROCKET_GRUNT__',ROCKET_MIRA_ART='__ROCKET_MIRA__';
const ROCKET_CHAPTERS=[
 {title:'THE MISSING PARTNER',city:'CERULEAN CITY',badges:1,leader:'ROCKET GRUNT',ace:17,team:[[19,16],[41,17]],interval:30000,hazard:'CARGO DROP',effect:'One cargo row rises every 30 seconds. Leave space above your stack.',money:300,items:['potion','potion'],summary:'Mira’s Clefairy was rescued. Its research tag picked up a strange signal on Routes 8 and 7.'},
 {title:'SIGNAL IN THE STATIC',city:'CELADON CITY',badges:3,leader:'ROCKET CAPTAIN',ace:29,team:[[88,27],[109,28],[20,29]],interval:26000,hazard:'SIGNAL JAM',effect:'NEXT is hidden for four seconds every 26 seconds. The current piece and HOLD stay visible.',money:600,items:['superpotion','revive'],summary:'The captain’s stolen notes exposed a relay in Saffron. Giovanni plans to lure wild Pokémon into Rocket traps.'},
 {title:'THE SILPH RELAY',city:'SAFFRON CITY',badges:5,leader:'GIOVANNI',ace:40,team:[[33,37],[115,38],[111,38],[31,40]],interval:24000,hazard:'RELAY SURGE',effect:'Every 24 seconds, the relay alternates a rising row and a queued stone. HOLD cannot store or bypass that stone.',money:1500,items:['rarecandy','revive'],summary:'The relay was shut down and every trapped Pokémon was freed. Mira and Clefairy can return to their fieldwork. Giovanni retreated. The Rocket investigation is complete.'}
];
let rocketScene=null,rocketReady=false,rocketQuestKey='';
function freshRocketStory(){return {version:1,accepted:false,completed:[],researchLines:0,choices:[],completedAt:[]};}
function rocketState(){if(!save.rocketStory)save.rocketStory=freshRocketStory();return save.rocketStory;}
function rocketAvailable(){return isAdventureMode()&&!!save.starter&&!practiceSession&&!save.bossTest;}
function rocketIndex(){return isGymBattle()&&save.gymBattle.gymIndex>=16&&save.gymBattle.gymIndex<=18?save.gymBattle.gymIndex-16:-1;}
function isRocketBattle(){return rocketIndex()>=0;}
function rocketTownCursor(i){return ROUTE_CHAIN_NODES.findIndex(n=>n.type==='town'&&n.city===ROCKET_CHAPTERS[i]?.city);}
function rocketCurrentTown(){return save.townStop?.active?(save.townStop.cityName||ROUTE_CHAIN_NODES[save.townStop.chainCursor]?.city||GYMS[save.townStop.gymIndex]?.city):null;}
function rocketPrerequisites(i){
 const d=ROCKET_CHAPTERS[i],s=rocketState(),why=[];
 if(!d)return ['Unknown chapter'];
 if(!rocketAvailable())why.push('Available in Adventure');
 if(s.completed.includes(i))why.push('Chapter complete');
 if(s.completed.length<i)why.push('Complete the previous chapter');
 if(save.badges.length<d.badges)why.push(`Earn ${d.badges} badge${d.badges>1?'s':''}`);
 if(i===1&&s.researchLines<12)why.push(`Investigate Routes 8 / 7: ${s.researchLines}/12 lines`);
 if(rocketCurrentTown()!==d.city)why.push(`Visit ${d.city}`);
 if(isGymBattle()||legendaryActive()||gameOver)why.push('Finish the current challenge');
 return why;
}
function rocketRewardText(i,plan){const d=ROCKET_CHAPTERS[i];return `$${d.money+(plan==='bold'?100:0)} + ${d.items.map(itemName).join(' + ')}`;}
function rocketObjective(){
 const s=rocketState(),i=s.completed.length;
 if(!s.accepted)return 'Meet researcher Mira in Cerulean City after earning the Boulder Badge.';
 if(i===0)return 'Rescue Mira’s Clefairy: defeat the Rocket Grunt in Cerulean City.';
 if(i===1&&s.researchLines<12)return `Trace the unusual signal: clear 12 lines on Route 8 or Route 7 (${s.researchLines}/12). Wild battles and training visits count.`;
 if(i===1)return 'Bring the signal readings to Mira in Celadon City. Defeat the Rocket Captain (3 badges required).';
 if(i===2)return 'Meet Mira in Saffron City and shut down Giovanni’s relay (5 badges required).';
 return 'Quest complete. Clefairy and the missing Pokémon are safe. Read your story log below.';
}
function rocketPages(i,ending=false){
 const s=rocketState(),name=trainerProfile().name;
 if(ending)return [
  ['mira',i===2?'THE SIGNAL IS GONE!':'WE DID IT!',ROCKET_CHAPTERS[i].summary],
  [i===1?'gary':'oak',i===1?'GARY CHECKS IN':'A CALL FROM OAK',i===0?`${name}, a Pokémon isn’t a prize to be taken. You brought a friend home today. Follow those readings, but look after your own team, too.`:i===1?'You found their hideout? Huh. I’ll keep their lookouts busy in Saffron. Don’t make me do all the work!':`${name}, Mira told me everything. You trusted your partners and helped Pokémon you had never met. That is what makes a fine Trainer.`],
  ['mira',i===2?'KANTO CAN BREATHE AGAIN':'OUR NEXT STEP',i===2?'Clefairy keeps tapping its research tag. I think it wants to say thank you. We’ll keep studying Pokémon in the wild — where they belong.':i===0?'The tag detected a signal on Routes 8 and 7. Collect twelve line clears there, then meet me in Celadon. Your Quest journal will keep track of the readings.':'The notes point to Saffron City. Meet me there after you earn five badges. Gary is going ahead to distract the lookouts.']
 ];
 return [
  ['mira',['A PARTNER IS MISSING','THE SIGNAL LEADS UNDERGROUND','THE LAST TRANSMITTER'][i],[
   'I’m Mira, a field researcher working with Professor Oak. A Rocket Grunt took my Clefairy and its research tag. I followed them here from Mt. Moon. Will you help me bring my partner home?',
   `Those readings you collected led straight to the Celadon hideout. Rocket isn’t just stealing Pokémon — they are copying our research to lure them away from their habitats. We need those notes back.`,
   'Gary spotted the Rocket lookouts while I traced the wiring. Their relay is inside a Silph storeroom. If we switch it off, the missing Pokémon can find their way home.'
  ][i]],
  [i===2?'giovanni':'rocket',i===2?'GIOVANNI STEPS FORWARD':'TEAM ROCKET',[
   'That Clefairy found our signal before we were ready. Nothing personal, kid — but this cargo is going to the boss. Think you can clear a path through it?',
   'A clever little tracker. Shame if the signal got… scrambled. Without a preview, you’ll have to think on your feet. The research stays with us!',
   'You have been expensive trouble. A signal, a few traps, and Kanto’s rarest Pokémon would come to me. Show me whether your bonds can withstand real pressure.'
  ][i]],
  [i===1?'gary':'oak',i===1?'A TIP FROM GARY':'OAK’S ADVICE',i===0?'Keep room above your stack. The cargo drop gives you a three-second warning. Clear lines to help your partner; every opponent must be defeated.':i===1?'Their jammer only lasts four seconds. Remember your next piece before it goes dark. And yes, I found that out before you.':'Watch the relay warning. A queued stone must fall before normal pieces resume. HOLD cannot make it disappear. You can still use your items in this encounter.'],
  ['mira','CHOOSE YOUR APPROACH',`${ROCKET_CHAPTERS[i].effect} All hazards give a three-second warning. Choose a careful approach for six extra seconds before the first hazard, or a bold approach for an extra $100 after victory. Your usual difficulty and EXP settings apply.`]
 ];
}
function openRocketScene(i,ending=false,replay=false){
 if(!ROCKET_CHAPTERS[i]||!rocketAvailable())return false;
 if(replay&&!rocketState().completed.includes(i))return false;
 if(!ending&&!replay&&rocketPrerequisites(i).length)return false;
 requestAutoPause();clearHeldInput();rocketScene={i,page:0,ending,replay,error:'',pending:false};
 setModal('rocketSceneModal',true);renderRocketScene();return true;
}
function closeRocketScene(){rocketScene=null;setModal('rocketSceneModal',false);clearHeldInput();renderRocketMenus();resetMenuFocus(menuRoot());enforceAutoPause();}
function renderRocketScene(){
 const r=rocketScene;if(!r)return;const pages=rocketPages(r.i,r.ending),[who,title,copy]=pages[Math.min(r.page,pages.length-1)];
 const arts={mira:ROCKET_MIRA_ART,rocket:ROCKET_GRUNT_ART,oak:OAK_PORTRAIT,gary:GARY_ART,giovanni:CUSTOM_GYM_LEADER_ART[7]};
 $('rocketPortrait').src=arts[who];$('rocketPortrait').alt={mira:'Researcher Mira',rocket:'Team Rocket',oak:'Professor Oak',gary:'Gary Oak',giovanni:'Giovanni'}[who]+' pixel-art portrait';
 $('rocketSpeaker').textContent={mira:'RESEARCHER MIRA',rocket:ROCKET_CHAPTERS[r.i].leader,oak:'PROFESSOR OAK',gary:'GARY',giovanni:'GIOVANNI'}[who];
 $('rocketChapter').textContent=`THE MISSING SIGNAL · CHAPTER ${r.i+1}/3 · ${ROCKET_CHAPTERS[r.i].city}`;
 $('rocketSceneTitle').textContent=title;$('rocketDialogue').textContent=copy;$('rocketSceneError').textContent=r.error;
 const btn=(label,action,value='')=>`<button data-rocket-action="${action}" data-rocket-value="${value}">${label}</button>`;
 let buttons='';
 if(r.pending)buttons=btn('RETRY SAVING VICTORY','retry')+btn('SAVE BACKUPS','backups');
 else if(r.page===pages.length-1&&!r.ending&&!r.replay){buttons=btn('CAREFUL · FIRST HAZARD +6 SECONDS','fight','careful')+btn('BOLD · VICTORY BONUS +$100','fight','bold');}
 else buttons=btn(r.page===pages.length-1?'RETURN TO TOWN / JOURNAL':'CONTINUE',r.page===pages.length-1?'close':'next');
 $('rocketSceneActions').innerHTML=buttons;$('rocketSceneActions').querySelector('button').setAttribute('data-nav-default','');
 $('rocketSceneReward').textContent=r.ending?'REWARDS SAVED · '+rocketRewardText(r.i,rocketState().choices[r.i]):'VICTORY REWARD · '+rocketRewardText(r.i)+' · Overflow items go to Sven’s PC.';
 if(r.pending)$('rocketSceneReward').textContent='VICTORY NOT SAVED · No reward has been claimed yet.';
 $('rocketSkip').hidden=r.pending;$('rocketSkip').textContent=r.ending||r.replay?'SKIP / CLOSE':'SKIP TO BATTLE CHOICES';$('rocketLater').hidden=r.pending;
 $('rocketPageNumber').textContent=`${r.page+1} / ${pages.length} · GAME PAUSED`;
 resetMenuFocus($('rocketSceneModal'));
}
function startRocketBattle(i,plan){
 if(!['careful','bold'].includes(plan)||rocketPrerequisites(i).length)return false;
 if(!save.team.some(d=>save.collection[d]?.currentHP>0)){$('rocketSceneError').textContent='Heal your team at the Pokémon Center first.';return false;}
 const original=runSnapshot(),d=ROCKET_CHAPTERS[i],cursor=rocketTownCursor(i);
 clearControlsScreens();hideOverlay();setModal('townModal',false);selectGamePanel('gamePanel');save.trainingMode=null;flyRouteOverride=null;
 rocketState().accepted=true;save.gymBattle={...campaignNewBattle(16+i),rocketPlan:plan,rocketDelay:plan==='careful'?6000:0,rocketPulses:0,rocketReturnCursor:cursor};
 gym=d.badges+1;save.townStop=null;resetBoardForGymChallenge();loadGymPokemon(0);applyGymTheme();
 if(!saveRunProgress('Rocket battle',true)){restoreRunSnapshot(original,'adventure');openRocketScene(i);rocketScene.error='The battle did not start because the checkpoint could not be saved. Open Save Backups or free storage, then retry.';renderRocketScene();return false;}
 $('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='BATTLE TEAM ROCKET';showGymIntro(16+i);updateHUD();return true;
}
function completeRocketBattle(){
 const i=rocketIndex();if(i<0||rocketState().completed.includes(i)||rocketState().completed.length!==i)return false;
 const b=save.gymBattle,d=ROCKET_CHAPTERS[i];if(!save.encounterDefeated||b.teamIndex!==d.team.length-1)return false;
 cancelCampaignTransition();paused=true;clearHeldInput();
 // Progress and rewards are one slot write. Failure leaves the won battle intact for retry/reload.
 const out=runSnapshot(),s=out.save,r=s.rocketStory;
 r.completed.push(i);r.choices.push(b.rocketPlan);r.completedAt.push(Date.now());r.accepted=true;
 s.money+=d.money+(b.rocketPlan==='bold'?100:0);
 for(const id of d.items)(s.items.length<MAX_ITEM_SLOTS?s.items:s.svenPcItems).push(id);
 s.gymBattle=null;s.encounterDex=null;s.encounterDefeated=false;s.trainingMode=null;s.tetris=cleanTetrisState(null);
 s.routeChain={...s.routeChain,cursor:b.rocketReturnCursor,lines:0,mode:'story'};
 s.townStop={active:true,chainTown:true,chainCursor:b.rocketReturnCursor,cityName:d.city,gymIndex:d.badges,shopStock:makeTownShopStock()};
 out.board=emptyBoard();out.current=null;out.nextPiece=null;out.bag=[];out.gym=d.badges+1;out.gymLines=0;
 try{if(portabilityBusy||portabilityStorageLocked)throw Error('Storage recovery is pending');localStorage.setItem(activeRunSaveKey('adventure'),JSON.stringify(out));}
 catch(err){setModal('gymIntroModal',false);openRocketScene(i,true);rocketScene.pending=true;rocketScene.error='Victory is waiting, but storage could not save it. Resolve storage or backup recovery, then retry. Your rewards have not been spent or duplicated.';renderRocketScene();reportSave('run',false,'Rocket victory not saved');return false;}
 restoreRunSnapshot(out,'adventure');reportSave('run',true,'Rocket chapter and rewards saved');soundtrackFanfare('victory');openRocketScene(i,true);return true;
}
function rocketBattleLoss(kind){
 const i=rocketIndex();if(i<0)return;const cursor=save.gymBattle.rocketReturnCursor;
 cancelCampaignTransition();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;clearAdventureRecoveryFlags();const lost=adventureScorePenalty();healTeamFull();board=emptyBoard();current=null;nextPiece=null;save.tetris=cleanTetrisState(null);gameOver=false;
 routeChainShowTownAtCursor(cursor);$('townStatus').textContent=`${kind==='withdraw'?'You withdrew from the Rocket encounter.':'Team Rocket won this time.'} Team healed; ${lost.toLocaleString()} score lost. Quest progress is safe. Prepare and retry when ready.`;
 applyGymTheme();updateHUD();saveRunProgress('Rocket retry',true);
}
function updateRocketHazards(delta){
 const i=rocketIndex();if(i<0||paused||gameOver||isGymTransition()||pauseDialogOpen()||autoPauseRequested)return;
 const b=save.gymBattle,d=ROCKET_CHAPTERS[i],ms=Math.max(0,Math.min(100,delta));
 if(b.eliteVeil>0){b.eliteVeil=Math.max(0,b.eliteVeil-ms);if(!b.eliteVeil)drawNext();}
 if(b.rocketDelay>0){b.rocketDelay=Math.max(0,b.rocketDelay-ms);return;}
 if(b.eliteWarning>0){b.eliteWarning=Math.max(0,b.eliteWarning-ms);if(!b.eliteWarning){
  b.rocketPulses++;if(i===1){b.eliteVeil=4000;drawNext();}else if(i===2&&b.rocketPulses%2===0)b.pendingHazards++;else leagueRaiseRows(1,'Z');
 }return;}
 b.specialTimer=(b.specialTimer||0)+ms;if(b.specialTimer>=d.interval-3000){b.specialTimer=0;b.eliteWarning=3000;flashMessage(d.hazard+' IN 3 SECONDS',d.effect);}
}
function recordRocketResearch(type,data){
 if(type!=='lines'||data.battle||!rocketAvailable()||isGymBattle()||legendaryActive()||!['ROUTE 8','ROUTE 7'].includes(currentRoute()))return;
 const s=rocketState();if(s.completed.length!==1||s.researchLines>=12)return;
 s.researchLines=Math.min(12,s.researchLines+Math.max(0,Math.floor(data.amount||0)));renderRocketMenus();
}
function validateRocketSave(s){
 const r=s.rocketStory,b=s.gymBattle,rocket=b&&b.gymIndex>=16&&b.gymIndex<=18;
 if(r===undefined){backupAssert(!rocket,'Rocket battle is missing its quest.');return;}
 backupAssert(backupObject(r)&&r.version===1&&typeof r.accepted==='boolean'&&backupArray(r.completed,3,(n,i)=>backupInteger(n,0,2))&&r.completed.every((n,i)=>n===i)&&backupInteger(r.researchLines,0,12)&&backupArray(r.choices,3,c=>['careful','bold'].includes(c))&&backupArray(r.completedAt,3,t=>backupNumber(t,0,8.64e15))&&r.choices.length===r.completed.length&&r.completedAt.length===r.completed.length,'Invalid Rocket quest.');
 backupAssert((!r.completed.length&&!r.researchLines||r.accepted)&&(!r.researchLines||r.completed.length>=1)&&(r.completed.length<2||r.researchLines===12),'Inconsistent Rocket progress.');
 if(rocket){const i=b.gymIndex-16;backupAssert(r.accepted&&r.completed.length===i&&(i!==1||r.researchLines===12)&&s.badges.length>=ROCKET_CHAPTERS[i].badges&&b.rocketReturnCursor===rocketTownCursor(i)&&['careful','bold'].includes(b.rocketPlan)&&backupNumber(b.rocketDelay,0,6000)&&backupInteger(b.rocketPulses,0,100000)&&backupNumber(b.specialTimer,0,ROCKET_CHAPTERS[i].interval)&&backupNumber(b.eliteWarning,0,3000)&&backupNumber(b.eliteVeil,0,4000)&&backupInteger(b.pendingHazards,0,100000),'Invalid Rocket checkpoint.');}
}
function renderRocketMenus(){
 if(!rocketReady)return;const active=rocketAvailable(),town=$('townRocket');
 if(!active){town.hidden=true;$('rocketQuest').hidden=true;return;}
 const s=rocketState(),i=s.completed.length;
 town.hidden=!active||i>=3||rocketCurrentTown()!==ROCKET_CHAPTERS[i]?.city;
 if(!town.hidden){const why=rocketPrerequisites(i);$('townRocketTitle').textContent=`TOWN STORY · ${ROCKET_CHAPTERS[i].title}`;$('townRocketText').textContent=why.length?why.join(' · '):'Mira needs your help. A short, optional story encounter.';$('townRocketStart').disabled=!!why.length;}
 const root=$('rocketQuest');root.hidden=!active;if(!active)return;
 const key=JSON.stringify([s,rocketCurrentTown(),save.badges,isRocketBattle()]);if(key===rocketQuestKey)return;rocketQuestKey=key;
 root.innerHTML=`<div class="rocket-journal-head"><span>CONNECTED QUESTLINE · ${s.completed.length}/3</span><h3>THE MISSING SIGNAL</h3><p>${rocketObjective()}</p></div><div class="rocket-chapters">${ROCKET_CHAPTERS.map((d,n)=>{const done=s.completed.includes(n),why=rocketPrerequisites(n);return `<article><b>${n+1}. ${d.title}</b><p>${d.city} · ${d.badges} badge${d.badges===1?"":"s"} · ${d.team.length} Pokémon · ace Lv.${d.ace}</p><p>${done?'COMPLETE · '+new Date(s.completedAt[n]).toLocaleDateString():why.length?why.join(' · '):'READY'}</p><p>REWARD${done?' SAVED':''}: ${rocketRewardText(n,done?s.choices[n]:null)}</p>${done?`<button data-rocket-replay="${n}">READ CHAPTER ENDING</button>`:`<button data-rocket-open="${n}" ${why.length?'disabled':''}>MEET MIRA</button>`}</article>`;}).join('')}</div>${isRocketBattle()?'<button id="rocketWithdraw">WITHDRAW TO TOWN…</button>':''}<details><summary role="button" tabindex="0">STORY LOG · OAK & GARY</summary>${s.completed.length?s.completed.map(n=>`<article><b>CHAPTER ${n+1} · ${ROCKET_CHAPTERS[n].title}</b><p>${ROCKET_CHAPTERS[n].summary}</p><p>${rocketPages(n,true)[1][1]}: ${rocketPages(n,true)[1][2]}</p><p>Approach: ${s.choices[n].toUpperCase()} · ${rocketRewardText(n,s.choices[n])}</p></article>`).join(''):'<p>Your chapter summaries will appear here.</p>'}</details>`;
 root.querySelectorAll('[data-rocket-open]').forEach(b=>b.onclick=()=>openRocketScene(+b.dataset.rocketOpen));root.querySelectorAll('[data-rocket-replay]').forEach(b=>b.onclick=()=>openRocketScene(+b.dataset.rocketReplay,true,true));
 $('rocketWithdraw')?.addEventListener('click',()=>showControlsConfirm('WITHDRAW FROM TEAM ROCKET?','Return to town with a healed team and lose 15% of your score. Earlier chapters and research readings are safe.',()=>{clearControlsScreens();rocketBattleLoss('withdraw');},'WITHDRAW'));
}
function initializeRocketStory(){
 ROCKET_CHAPTERS.forEach((d,i)=>GYMS.push({...d,name:'TEAM ROCKET',specialty:'ROCKET',icon:'R',goal:0,route:d.city,quote:d.title,effectText:d.effect,team:d.team.map(([dex,level])=>({dex,level,attackType:BYDEX[dex].type}))}));
 $('townSub').insertAdjacentHTML('afterend','<section id="townRocket" hidden><img alt="Researcher Mira"><div><b id="townRocketTitle"></b><p id="townRocketText"></p><button id="townRocketStart">TALK TO MIRA</button></div></section>');$('townRocket').querySelector('img').src=ROCKET_MIRA_ART;$('townRocketStart').onclick=()=>openRocketScene(rocketState().completed.length);
 $('compactQuests').insertAdjacentHTML('afterbegin','<section id="rocketQuest"></section>');
 document.body.insertAdjacentHTML('beforeend',`<div id="rocketSceneModal" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="rocketSceneTitle"><div class="rocket-scene-card"><header><span id="rocketChapter"></span><span id="rocketPageNumber"></span></header><div class="rocket-scene-body"><div class="rocket-portrait-frame"><img id="rocketPortrait" alt=""><b id="rocketSpeaker"></b></div><div class="rocket-scene-copy"><h2 id="rocketSceneTitle"></h2><p id="rocketDialogue"></p><p id="rocketSceneReward"></p><p id="rocketSceneError" role="status"></p><div id="rocketSceneActions"></div></div></div><footer><button id="rocketSkip">SKIP TO BATTLE CHOICES</button><button id="rocketLater">BACK · COME BACK LATER</button></footer></div></div>`);
 $('rocketSceneActions').onclick=e=>{const b=e.target.closest('button[data-rocket-action]'),r=rocketScene;if(!b||!r)return;const a=b.dataset.rocketAction;if(a==='next'){r.page++;renderRocketScene();}else if(a==='fight')startRocketBattle(r.i,b.dataset.rocketValue);else if(a==='retry')completeRocketBattle();else if(a==='backups')openBackupManager();else closeRocketScene();};
 $('rocketSkip').onclick=()=>{if(!rocketScene)return;if(rocketScene.ending||rocketScene.replay)closeRocketScene();else {rocketScene.page=rocketPages(rocketScene.i).length-1;renderRocketScene();}};$('rocketLater').onclick=closeRocketScene;
 navModalIds.splice(navModalIds.indexOf('backupModal')+1,0,'rocketSceneModal');
 const townBase=renderTownStop;renderTownStop=function(){townBase();renderRocketMenus();};
 const questBase=renderQuestBoard;renderQuestBoard=function(){questBase();renderRocketMenus();};
 const backBase=menuBack;menuBack=function(){if(menuRoot()?.id==='rocketSceneModal'){if(!rocketScene?.pending)closeRocketScene();return;}return backBase();};
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return isShown('rocketSceneModal')||pauseBase();};
 const clearBase=clearControlsScreens;clearControlsScreens=function(){rocketScene=null;setModal('rocketSceneModal',false);rocketQuestKey='';clearBase();};
 const hudBase=updateHUD;updateHUD=function(){hudBase();if(isRocketBattle()){$('mapTitle').textContent='TEAM ROCKET';$('battleKindLabel').textContent=ROCKET_CHAPTERS[rocketIndex()].leader;$('routeName').textContent=ROCKET_CHAPTERS[rocketIndex()].title;}};
 const themeBase=gymThemeMeta;gymThemeMeta=function(index=gym-1){return index>=16&&index<=18?{...GYM_THEME_META[7],label:ROCKET_CHAPTERS[index-16].title}:themeBase(index);};
 const artBase=setGymLeaderArt;setGymLeaderArt=function(el,index){if(index<16||index>18)return artBase(el,index);if(index===18)return artBase(el,7);if(el){el.style.backgroundImage=`url("${ROCKET_GRUNT_ART}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';el.setAttribute('aria-label','Team Rocket pixel-art portrait');}};
 const introBase=showGymIntro;showGymIntro=function(index){introBase(index);if(index>=16&&index<=18){$('gymIntroModal').querySelector('.gym-alert').textContent='TEAM ROCKET · CHAPTER '+(index-15);$('gymIntroCity').textContent=ROCKET_CHAPTERS[index-16].city;$('gymIntroCap').textContent=`${GYMS[index].team.length} POKÉMON · ACE LV.${GYMS[index].ace} · ${save.gymBattle?.rocketPlan==='careful'?'FIRST HAZARD +6s':'VICTORY +$100'}`;}};
 const eventBase=recordQuestEvent;recordQuestEvent=function(type,data={}){recordRocketResearch(type,data);return eventBase(type,data);};
 $('compactCredits').insertAdjacentHTML('beforeend','<p>Rocket Grunt and researcher Mira: new pixel-art portraits generated for Kanto Tetris.</p>');
 rocketReady=true;renderRocketMenus();
}
