// Rival encounters and the Champion own their progression separately from badges.
const RIVAL_STOPS=[{city:'CERULEAN',gym:1,level:18,count:2,quote:'You made it through Mt. Moon? Let’s see how much stronger you are.'},{city:'CELADON',gym:3,level:29,count:4,quote:'I’ve been building a real team. Keep up!'},{city:'INDIGO PLATEAU',gym:null,level:52,count:5,quote:'We started in the same town. Only one of us gets to be Champion.'}];
const GARY_ART='__GARY_PORTRAIT__';
function normalizeJourney(raw,old){
 if(raw?.version===1)return {version:1,rivals:Array.isArray(raw.rivals)?[...new Set(raw.rivals.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[],starterChoice:raw.starterChoice||old.starter||null,championDefeated:raw.championDefeated===true,legacyClear:raw.legacyClear===true};
 return {version:1,rivals:[0,1,2].filter(i=>(old.badges?.length||0)>[1,3,7][i]),starterChoice:old.starter||null,championDefeated:false,legacyClear:old.league?.next===4&&old.league?.cleared===true};
}
function storyState(){if(!save.journey)save.journey=normalizeJourney(null,save);return save.journey;}
function rivalStarter(){const d=storyState().starterChoice||save.starter||1;return d<=3?4:d<=6?7:1;}
function syncStoryTrainers(){
 if(GYMS.length<13)return;
 const starter=rivalStarter(),member=(dex,level)=>({dex,level,attackType:BYDEX[dex].type});
 GYMS[12].team=[member(18,61),member(65,61),member(112,61),member(starter===4?130:59,63),member(starter===1?130:103,63),member(starter+2,65)];
 RIVAL_STOPS.forEach((s,i)=>{const extras=[[17],[17,64,58],[18,65,111,58]][i];GYMS[13+i].team=[...extras.map(d=>member(d,s.level-2)),member(starter+(i===0?1:2),s.level)];});
}
function isStoryBattle(){return isGymBattle()&&save.gymBattle.gymIndex>=12&&save.gymBattle.gymIndex<=15;}
function rivalAtTown(){
 if(practiceSession||save.bossTest||!save.starter||!save.townStop?.active)return -1;
 const cursor=save.townStop.chainCursor,city=ROUTE_CHAIN_NODES[cursor]?.city||GYMS[save.townStop.gymIndex]?.city;
 return RIVAL_STOPS.findIndex((s,i)=>s.city===city?.replace(/ CITY$/,'')&&!storyState().rivals.includes(i)&&(save.badges?.length||0)>=[1,3,8][i]);
}
function renderRivalTown(){
 const i=rivalAtTown(),root=$('townRival');if(!root)return;root.hidden=i<0;
 if(i>=0){root.querySelector('p').textContent=`GARY: “${RIVAL_STOPS[i].quote}” ${GYMS[13+i].team.length} Pokémon · ace Lv.${RIVAL_STOPS[i].level}.`;root.querySelector('button').textContent='BATTLE GARY';}
}
function startStoryBattle(index){
 if(isGymBattle()||!GYMS[index]||index<12||index>15)return false;
 if(index===12&&(!leagueUnlocked()||leagueState().next<4||storyState().championDefeated))return false;
 if(index>12&&rivalAtTown()!==index-13)return false;
 if(!save.team.some(d=>save.collection[String(d)]?.currentHP>0)){flashMessage('HEAL YOUR TEAM','Use the Pokémon Center before challenging Gary.');return false;}
 const returnCursor=save.townStop?.chainCursor??(index===12?LEAGUE_TOWN_CURSOR:routeChainCityCursorByGym(RIVAL_STOPS[index-13].gym));
 hideTownStop();hideOverlay();syncStoryTrainers();save.trainingMode=null;flyRouteOverride=null;
 save.gymBattle={...campaignNewBattle(index),storyReturnCursor:returnCursor};gym=index===12?8:Math.min(8,Math.max(1,save.badges.length+1));
 resetBoardForGymChallenge();loadGymPokemon(0);applyGymTheme();$('gymIntroBtn').disabled=false;$('gymIntroBtn').textContent='BATTLE GARY';showGymIntro(index);saveRunProgress('Gary encounter',true);return true;
}
function completeStoryBattle(){
 const b=save.gymBattle,index=b.gymIndex,returnCursor=b.storyReturnCursor??LEAGUE_TOWN_CURSOR;
 cancelCampaignTransition();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;board=emptyBoard();current=null;nextPiece=null;gameOver=false;
 if(index===12){
   storyState().championDefeated=true;const l=leagueState();l.cleared=true;l.hallOfFame=save.team.map(d=>({dex:d,level:save.collection[String(d)].level}));l.completedAt=Date.now();l.finalePending=true;
   addMoney(5000,'KANTO CHAMPION');routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);soundtrackFanfare('victory');if(rogueActive())finishRogueRun('CHAMPION',false);saveRunProgress('Champion victory',true);showChampionFinale();
 }else{
   const i=index-13;if(!storyState().rivals.includes(i)){storyState().rivals.push(i);addMoney(200+i*300,'GARY DEFEATED');}
   routeChainShowTownAtCursor(returnCursor);$('townStatus').textContent=`GARY DEFEATED! “Next time, I’m winning.” Your journey continues.`;saveRunProgress('Rival victory',true);soundtrackFanfare('victory');
 }
 applyGymTheme();updateHUD();renderBadges();
}
function storyBattleLoss(kind){
 const cursor=save.gymBattle.storyReturnCursor??LEAGUE_TOWN_CURSOR;cancelCampaignTransition();save.gymBattle=null;save.encounterDex=null;save.encounterDefeated=false;
 const lost=adventureScorePenalty();healTeamFull();board=emptyBoard();current=null;nextPiece=null;gameOver=false;applyGymTheme();routeChainShowTownAtCursor(cursor);
 $('townStatus').textContent=`Gary won. Your team is healed; ${lost.toLocaleString()} score lost. Previous victories are safe. You can retry when ready.`;saveRunProgress('Gary retry',true);
}
function updateStoryHazards(delta){
 if(paused||gameOver||isGymTransition()||save.gymBattle.gymIndex!==12)return;
 const b=save.gymBattle;
 if(b.eliteWarning>0){b.eliteWarning=Math.max(0,b.eliteWarning-delta);if(!b.eliteWarning){leagueRaiseRows(1,'L');flashBossSpecial('CHAMPION SURGE','psychic');}return;}
 b.specialTimer=(b.specialTimer||0)+delta;if(b.specialTimer>=27000){b.specialTimer=0;b.eliteWarning=3000;flashMessage('CHAMPION SURGE IN 3 SECONDS','One rising row. Clear space before Gary strikes.');}
}
function renderChampionLobby(){
 const s=storyState(),l=leagueState();$('townTitle').textContent='INDIGO PLATEAU';
 $('townSub').textContent=s.championDefeated?'KANTO CHAMPION • YOUR HALL OF FAME TEAM IS SAVED.':s.legacyClear?'YOUR PREVIOUS HALL OF FAME IS PRESERVED. GARY’S NEW CHAMPION CHALLENGE IS AVAILABLE.':'ELITE FOUR DEFEATED • ONE FINAL CHALLENGE: CHAMPION GARY.';
 if(!$('leagueHall'))$('townSub').insertAdjacentHTML('afterend','<div id="leagueHall"></div>');
 $('leagueHall').innerHTML=`<div class="champion-lobby"><img src="${GARY_ART}" alt="Gary Oak pixel-art Champion portrait"><div><b>${s.championDefeated?'GARY DEFEATED':'CHAMPION GARY'}</b><p>Six Pokémon · ace Lv.65. Champion Surge adds one rising row every 30 seconds, with a 3-second warning.</p><p>${GYMS[12].team.map(m=>`${BYDEX[m.dex].name} Lv.${m.level}`).join(' · ')}</p>${s.championDefeated?'<button id="replayFinale">VIEW HALL OF FAME</button>':''}</div></div>`;
 $('replayFinale')?.addEventListener('click',showChampionFinale);
 const b=$('townChallengeBtn');b.hidden=false;b.disabled=s.championDefeated;b.textContent=s.championDefeated?'KANTO CHAMPION!':'CHALLENGE GARY';
 const c=$('townContinueBtn');c.hidden=!l.cleared;c.disabled=!l.cleared;c.textContent='CONTINUE TO CERULEAN CAVE';
 $('townSkipBtn').hidden=false;$('townSkipBtn').disabled=false;$('townSkipBtn').textContent='GO BACK AND TRAIN';
}
function showChampionFinale(){
 clearControlsScreens();requestAutoPause();paused=true;
 $('championSummary').textContent=`Gary: “You earned it. Take your place in the Hall of Fame.” ${score.toLocaleString()} score · ${runLines} lines · 8 badges · ${storyState().rivals.length}/3 rival encounters won.`;
 $('championTeam').innerHTML=leagueState().hallOfFame.map(m=>`<div><canvas width="96" height="96" data-hall-dex="${m.dex}"></canvas><b>${BYDEX[m.dex].name}</b><span>Lv.${m.level}</span></div>`).join('');
 document.querySelectorAll('[data-hall-dex]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.hallDex],false));setModal('championFinale',true);resetMenuFocus($('championFinale'));
}
function closeChampionFinale(){setModal('championFinale',false);leagueState().finalePending=false;saveRunProgress('Hall of Fame',true);startProductionCredits();}
function initializeStoryUI(){
 const make=(leader,ace,city)=>({leader,ace,city,specialty:'BALANCED',name:'RIVAL',icon:'★',goal:0,route:city,quote:'I chose my partner to beat yours. Show me what you’ve learned!',effectText:'Clear lines to attack. Idle pressure stays active.',team:[]});
 GYMS.push({...make('GARY',65,'INDIGO'),name:'KANTO CHAMPION',quote:'You beat Lance? I got here first. Now prove you’re the best!',effectText:'CHAMPION SURGE: one rising row every 30s, with a 3s warning.'},...RIVAL_STOPS.map(s=>({...make('GARY',s.level,s.city),quote:s.quote})));
 syncStoryTrainers();
 const themeBase=gymThemeMeta;gymThemeMeta=function(index=gym-1){return index>=12?{...GYM_THEME_META[5],label:index===12?'CHAMPION CHAMBER':'RIVAL BATTLE'}:themeBase(index);};
 const artBase=setGymLeaderArt;setGymLeaderArt=function(el,index){if(index<12)return artBase(el,index);if(el){el.classList.add('custom-leader-art');el.style.backgroundImage=`url("${GARY_ART}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';el.setAttribute('aria-label','Gary Oak pixel-art rival portrait');}};
 const introBase=showGymIntro;showGymIntro=function(index){introBase(index);if(index>=12){$('gymIntroModal').querySelector('.gym-alert').textContent=index===12?'CHAMPION FINALE':'RIVAL ENCOUNTER';$('gymIntroCity').textContent=GYMS[index].city;$('gymIntroCap').textContent=`YOUR CAP: ${currentLevelCap()} · ${GYMS[index].team.length} POKÉMON · ACE LV.${GYMS[index].ace}`;}};
 $('townSub').insertAdjacentHTML('afterend','<section id="townRival" hidden><img alt="Gary Oak rival portrait"><div><p></p><button>BATTLE GARY</button></div></section>');$('townRival').querySelector('img').src=GARY_ART;$('townRival').querySelector('button').onclick=()=>{const i=rivalAtTown();if(i>=0)startStoryBattle(13+i);};
 const townBase=renderTownStop;renderTownStop=function(){townBase();renderRivalTown();};
 document.body.insertAdjacentHTML('beforeend',`<div id="championFinale" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="championTitle"><div class="controls-card expansion-card"><p>INDIGO LEAGUE · HALL OF FAME</p><h2 id="championTitle">YOU ARE THE KANTO CHAMPION!</h2><p id="championSummary"></p><div id="championTeam"></div><button id="championCredits" data-nav-default>CELEBRATE · VIEW CREDITS</button></div></div>`);
 $('championCredits').onclick=closeChampionFinale;
}
