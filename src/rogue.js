// Versioned, deterministic Rogue runs. Gameplay streams never consume audio randomness.
const ROGUE_RULESET='expedition-v2',ROGUE_MODS={power:{name:'Power pact',text:'+12% attack and +8% damage received per stack.'},guard:{name:'Guard pact',text:'−15% damage received and −8% attack per stack.'},recovery:{name:'Second wind',text:'Heal surviving team members by 10% max HP after each trainer Pokémon KO per stack.'}};
let pendingRogueConfig=null;
function rogueActive(){return !isAdventureMode()&&!practiceSession&&!save?.bossTest&&[ROGUE_RULESET,'expedition-v1'].includes(save?.rogue?.ruleset)&&!save.rogue.result;}
function seedHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function gameRandom(stream='world'){
 if(!rogueActive())return Math.random();const r=save.rogue;
 let x=(r.rng[stream]??seedHash(r.seed+':'+stream))>>>0;x=(x+0x6D2B79F5)>>>0;r.rng[stream]=x;
 let n=Math.imul(x^(x>>>15),1|x);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296;
}
function randomSeed(){const a=new Uint32Array(2);crypto.getRandomValues(a);return Array.from(a,n=>n.toString(36)).join('').slice(0,12).toUpperCase();}
function parseRogueSeed(value,difficulty){
 let seed=value.trim().toUpperCase(),d=normalizedAdventureDifficulty(difficulty);const m=seed.match(/^KT([23])-([ENH])-(.+)$/);
 if(m){d={E:'easy',N:'normal',H:'hard'}[m[2]];seed=m[3];}
 if(!seed)seed=randomSeed();if(!/^[A-Z0-9][A-Z0-9-]{0,23}$/.test(seed))throw Error('Use 1–24 letters, numbers or hyphens, or paste a KT3 seed code.');
 return {seed,difficulty:d,...(m?.[1]==='2'?{ruleset:'expedition-v1'}:{})};
}
function seedCode(r=save.rogue){return r?.seed?`KT${r.ruleset==='expedition-v1'?'2':'3'}-${r.difficulty[0].toUpperCase()}-${r.seed}`:'LEGACY · UNSEEDED';}
function initializeExpeditionRun(){
 if(isAdventureMode())return;
 const c=pendingRogueConfig||{seed:randomSeed(),difficulty:'normal'};pendingRogueConfig=null;
 save.rogue={ruleset:c.ruleset||ROGUE_RULESET,speedRules:TETRIS_SPEED_RULESET,seed:c.seed,difficulty:c.difficulty,rng:{},modifiers:{},rewards:[],pending:null,elapsed:0,result:null,startedAt:Date.now(),id:randomSeed()};
}
function rogueTick(d){if(rogueActive())save.rogue.elapsed+=Math.max(0,Math.min(100,d));}
function rogueGravityMultiplier(){return rogueActive()?(save.rogue.difficulty==='easy'?.8:save.rogue.difficulty==='hard'?1.1:1):1;}
function rogueStacks(id){return rogueActive()?save.rogue.modifiers[id]||0:0;}
function rogueAttackMultiplier(){return Math.pow(1.12,rogueStacks('power'))*Math.pow(.92,rogueStacks('guard'));}
function rogueDefenseMultiplier(){return Math.pow(1.08,rogueStacks('power'))*Math.pow(.85,rogueStacks('guard'));}
function rogueAfterKO(){const stacks=rogueStacks('recovery');if(!stacks)return;for(const d of save.team){const e=save.collection[d],max=pokemonMaxHP(e.level,d);if(e.currentHP>0)e.currentHP=Math.min(max,e.currentHP+Math.ceil(max*.1*stacks));}}
function queueRogueReward(index){
 const r=save.rogue;if(!rogueActive()||r.pending||r.rewards.some(x=>x.gym===index))return;
 const items=index<3?['superpotion','greatball','revive']:['hyperpotion','ultraball','revive'];
 const available=items.filter(id=>ITEMS[id]);const item=available[Math.floor(gameRandom('rewards')*available.length)];
 const pool=[25,35,37,43,54,58,63,66,77,79,81,92,102,111,123,127,131,133].filter(d=>!save.team.includes(d)&&!save.pc.includes(d));
 const species=pool.length?pool:[133];const dex=species[Math.floor(gameRandom('rewards')*species.length)];
 const mods=Object.keys(ROGUE_MODS).filter(id=>(r.modifiers[id]||0)<3),mod=mods[Math.floor(gameRandom('rewards')*mods.length)];
 r.pending={gym:index,choices:[{kind:'item',id:item,count:2},{kind:'pokemon',dex,level:Math.max(5,Math.min(currentLevelCap(),GYMS[index].ace+2))},{kind:'modifier',id:mod}]};
}
function rewardDescription(c){
 if(c.kind==='item')return {title:`${ITEMS[c.id].name} ×${c.count}`,text:'Goes into your inventory; overflow is stored in Sven’s PC.'};
 if(c.kind==='pokemon')return {title:`${BYDEX[c.dex].name} Lv.${c.level}`,text:'A new teammate, or sent to Bill’s PC if your party is full.'};
 return {title:ROGUE_MODS[c.id].name,text:ROGUE_MODS[c.id].text+' Maximum 3 stacks. Lasts for this run.'};
}
function showRogueRewards(){
 const p=save.rogue?.pending;if(!rogueActive()||!p||!save.badges.includes(p.gym))return false;
 requestAutoPause();$('rogueRewardTitle').textContent=`${GYMS[p.gym].leader} DEFEATED · CHOOSE ONE`;
 $('rogueChoices').innerHTML=p.choices.map((c,i)=>{const d=rewardDescription(c);return `<button data-reward-index="${i}"><small>${c.kind.toUpperCase()}</small><b>${d.title}</b><span>${d.text}</span></button>`;}).join('');
 $('rogueChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>claimRogueReward(+b.dataset.rewardIndex));
 $('rogueRewardStatus').textContent='Choose one reward. The other two are left behind. Your choice is saved.';setModal('rogueRewardModal',true);resetMenuFocus($('rogueRewardModal'));saveRunProgress('Reward offered',true);return true;
}
function claimRogueReward(index){
 const r=save.rogue,p=r?.pending,c=p?.choices[index];if(!rogueActive()||!c||!save.badges.includes(p.gym))return;
 const old=clonePlain(save),meta=[...metaDex];r.pending=null;r.rewards.push({gym:p.gym,...c});
 if(c.kind==='item'){for(let n=0;n<c.count;n++){if(save.items.length<MAX_ITEM_SLOTS)save.items.push(c.id);else save.svenPcItems.push(c.id);}}
 else if(c.kind==='pokemon'){
   const d=c.dex;if(!save.collection[d])save.collection[d]={xp:0,level:c.level,levelXP:0,moveCharge:0,currentHP:pokemonMaxHP(c.level,d),hpModel:'v25-line-battle',catches:0,obtained:Date.now()};
   if(!save.team.includes(d)&&!save.pc.includes(d)){recordPokemonKeepsake(d,'reward',GYMS[p.gym].city,c.level);(save.team.length<6?save.team:save.pc).push(d);}metaDex.add(d);
 }else r.modifiers[c.id]=(r.modifiers[c.id]||0)+1;
 if(!saveRunProgress('Rogue reward',true)){save=old;metaDex=new Set(meta);$('rogueRewardStatus').textContent='Could not save this choice. No reward was consumed. Free storage and try again.';return;}
 persistMetaDex();setModal('rogueRewardModal',false);renderTeam();renderDex();renderItemBar();renderTownStop();resetMenuFocus($('townModal'));
}
function readRogueRecords(){try{const records=JSON.parse(localStorage.getItem(ROGUE_RECORDS_KEY)||'[]');validateRogueRecords(records);return records;}catch{return [];}}
function validateRogueRecords(records){
 if(Array.isArray(records))for(const r of records)if(r?.speedRules!==undefined)backupAssert(['lines-v1',TETRIS_SPEED_RULESET].includes(r.speedRules),'Invalid Rogue speed rules.');
 backupAssert(backupArray(records,200,x=>backupObject(x)&&[ROGUE_RULESET,'expedition-v1','legacy-v0'].includes(x.ruleset)&&['easy','normal','hard'].includes(x.difficulty)&&typeof x.id==='string'&&/^[A-Z0-9-]{1,40}$/.test(x.id)&&typeof x.seed==='string'&&/^[A-Z0-9-]{0,24}$/.test(x.seed)&&['CHAMPION','STACK TOPPED OUT','TEAM FAINTED','RETIRED'].includes(x.result)&&backupNumber(x.score)&&backupInteger(x.lines)&&backupInteger(x.badges,0,8)&&backupNumber(x.elapsed)&&backupNumber(x.endedAt,0,8.64e15)&&backupArray(x.team,6,m=>backupDex(m.dex)&&backupInteger(m.level,1,100))), 'Invalid Rogue records.');
}
function recordRogueResult(){
 const r=save.rogue;if(!r?.result||practiceSession||save.bossTest)return;
 const record={id:r.id,seed:r.seed||'',ruleset:r.ruleset,speedRules:r.speedRules||'lines-v1',difficulty:r.difficulty,result:r.result,endedAt:r.endedAt,...(r.summary||rogueSummary())};
 const records=readRogueRecords();if(!records.some(x=>x.id===r.id))records.unshift(record);
 storePreference(ROGUE_RECORDS_KEY,records.slice(0,200),'Rogue records');
}
function rogueSummary(){return {score,lines:runLines,badges:save.badges.length,elapsed:save.rogue?.elapsed||0,team:save.team.map(d=>({dex:d,level:save.collection[d].level}))};}
function finishRogueRun(result,show=true){
 if(isAdventureMode()||practiceSession||save.bossTest)return;
 if(!save.rogue)save.rogue={ruleset:'legacy-v0',seed:'',difficulty:'normal',rng:{},modifiers:{},rewards:[],pending:null,elapsed:0,id:randomSeed(),startedAt:Date.now()};
 const r=save.rogue;if(!r.result){r.speedRules=TETRIS_SPEED_RULESET;r.result=result;r.endedAt=Date.now();r.summary=rogueSummary();}cancelCampaignTransition();paused=true;gameOver=true;clearHeldInput();r.pending=null;
 recordRogueResult();saveRunProgress('Rogue finished',true);if(show)showRogueRecap();
}
function showRogueRecap(){
 clearControlsScreens();hideOverlay();paused=true;
 const r=save.rogue;if(!r)return;const summary=r.summary||rogueSummary();
 $('rogueRecapTitle').textContent=r.result||'ROGUE RUN · IN PROGRESS';
 $('rogueRecapInfo').textContent=`${seedCode(r)} · ${r.difficulty.toUpperCase()} · ${r.ruleset} · ${summary.score.toLocaleString()} score · ${summary.lines} lines · ${summary.badges}/8 badges · ${Math.floor(summary.elapsed/60000)}m ${Math.floor(summary.elapsed/1000)%60}s active play`;
 $('rogueRecapCode').value=seedCode(r);
 $('rogueRecapTeam').textContent=summary.team.map(m=>`${BYDEX[m.dex].name} Lv.${m.level}`).join(' · ');
 $('rogueRecapRewards').innerHTML=r.rewards.length?r.rewards.map(c=>`<li>${GYMS[c.gym].leader}: ${rewardDescription(c).title}</li>`).join(''):'<li>No gym rewards chosen yet.</li>';
 $('rogueRecapReturn').textContent=r.result==='CHAMPION'?'RETURN TO POSTGAME':r.result?'RETURN TO TITLE':'RETURN TO GAME';setModal('rogueRecapModal',true);resetMenuFocus($('rogueRecapModal'));
}
function closeRogueRecap(){
 setModal('rogueRecapModal',false);if(save.rogue?.result==='CHAMPION'){gameOver=false;routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);}else if(save.rogue?.result){clearControlsScreens();showTitleScreen();}else openMainMenu();
}
function showRogueRecords(){
 requestAutoPause();const rows=readRogueRecords().filter(r=>r.difficulty===$('rogueRecordDifficulty').value&&r.ruleset===$('rogueRecordRules').value&&(r.speedRules||'lines-v1')===$('rogueRecordSpeed').value).sort((a,b)=>(b.result==='CHAMPION')-(a.result==='CHAMPION')||b.badges-a.badges||b.score-a.score||a.elapsed-b.elapsed).slice(0,10);
 $('rogueRecordList').innerHTML=rows.length?rows.map((r,i)=>`<li><b>${i+1}. ${r.result} · ${r.score.toLocaleString()}</b><span>${r.badges}/8 badges · ${r.lines} lines · ${seedCode(r)}</span></li>`).join(''):'<li>No completed runs in this difficulty/ruleset yet.</li>';
 setModal('rogueRecordsModal',true);resetMenuFocus($('rogueRecordsModal'));
}
function openRogueSetup(){requestAutoPause();setModal('titleScreen',false);$('rogueSeedError').textContent='';setModal('rogueSetupModal',true);resetMenuFocus($('rogueSetupModal'));}
function startRogueFromSetup(confirmed=false){
 let c;try{c=parseRogueSeed($('rogueSeed').value,$('rogueDifficulty').value);}catch(e){$('rogueSeedError').textContent=e.message;return;}
 if(hasSavedRun('rogue')&&!confirmed){showControlsConfirm('NEW ROGUE EXPEDITION?','This replaces your saved Rogue run. Adventure, records and the permanent Pokédex remain.',()=>startRogueFromSetup(true),'START RUN');return;}
 pendingRogueConfig=c;clearControlsScreens();setModal('rogueSetupModal',false);resetStateForMode('rogue');
}
function restoreExpansionUI(){
 if(towerActive()){restoreTowerUI();return;}
 if(legendaryActive()){legendaryRestoreUI();return;}
 if(save.league?.finalePending){showChampionFinale();return;}
 if(!isAdventureMode()&&save.rogue?.result&&save.rogue.result!=='CHAMPION'){gameOver=true;showRogueRecap();return;}
 showRogueRewards();
}
function validateExpansionSave(s){
 validateMilestoneSave(s);validateTrainerSave(s);validateRocketSave(s);validateKeepsakeSave(s);validateTowerSave(s);
 if(s.rogue?.speedRules!==undefined)backupAssert(['lines-v1',TETRIS_SPEED_RULESET].includes(s.rogue.speedRules),'Invalid run speed rules.');
 if(s.journey!==undefined){const j=s.journey;backupAssert(backupObject(j)&&j.version===1&&backupArray(j.rivals,3,i=>backupInteger(i,0,2))&&backupUnique(j.rivals)&&(j.starterChoice===null||backupDex(j.starterChoice))&&typeof j.championDefeated==='boolean'&&typeof j.legacyClear==='boolean','Invalid rival progress.');}
 if(s.rogue!==undefined){const r=s.rogue;backupAssert(backupObject(r)&&[ROGUE_RULESET,'expedition-v1','legacy-v0'].includes(r.ruleset)&&typeof r.seed==='string'&&/^[A-Z0-9-]{0,24}$/.test(r.seed)&&['easy','normal','hard'].includes(r.difficulty)&&backupObject(r.rng)&&Object.keys(r.rng).every(k=>['pieces','world','rewards'].includes(k)&&backupInteger(r.rng[k],0,4294967295))&&backupObject(r.modifiers)&&Object.keys(r.modifiers).every(k=>Object.hasOwn(ROGUE_MODS,k)&&backupInteger(r.modifiers[k],0,3))&&backupNumber(r.elapsed)&&typeof r.id==='string'&&/^[A-Z0-9-]{1,40}$/.test(r.id)&&backupNumber(r.startedAt,0,8.64e15)&&(r.result===null||['CHAMPION','STACK TOPPED OUT','TEAM FAINTED','RETIRED'].includes(r.result)),'Invalid Rogue run.');
 const choice=c=>backupObject(c)&&(c.kind==='item'?Object.hasOwn(ITEMS,c.id)&&backupInteger(c.count,1,2):c.kind==='pokemon'?backupDex(c.dex)&&backupInteger(c.level,1,100):c.kind==='modifier'&&Object.hasOwn(ROGUE_MODS,c.id));
 backupAssert(backupArray(r.rewards,8,c=>choice(c)&&backupInteger(c.gym,0,7))&&backupUnique(r.rewards.map(c=>c.gym)),'Invalid Rogue rewards.');
 backupAssert(r.pending===null||backupObject(r.pending)&&backupInteger(r.pending.gym,0,7)&&!r.rewards.some(c=>c.gym===r.pending.gym)&&backupArray(r.pending.choices,3,choice)&&r.pending.choices.length===3&&r.pending.choices.map(c=>c.kind).join()==='item,pokemon,modifier','Invalid pending Rogue choice.');
 if(r.summary!==undefined)backupAssert(backupObject(r.summary)&&backupNumber(r.summary.score)&&backupInteger(r.summary.lines)&&backupInteger(r.summary.badges,0,8)&&backupNumber(r.summary.elapsed)&&backupArray(r.summary.team,6,m=>backupDex(m.dex)&&backupInteger(m.level,1,100)),'Invalid Rogue recap.');
 if(r.result)backupAssert(backupNumber(r.endedAt,0,8.64e15),'Invalid Rogue completion date.');
 }
}
function initializeExpansion(){
 initializeStoryUI();
 $('compactCredits').insertAdjacentHTML('beforeend','<p>Gary Oak rival/Champion portrait: created with OpenAI image generation for this fan project.</p>');
 const modal=(id,title,body)=>`<div id="${id}" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="${id}Heading"><div class="controls-card expansion-card"><h2 id="${id}Heading">${title}</h2>${body}</div></div>`;
 document.body.insertAdjacentHTML('beforeend',modal('rogueSetupModal','ROGUE EXPEDITION',`<p>One run through Kanto. Choose one of three rewards after each gym. A full team defeat or a topped-out stack ends the run, including the League.</p><label>Difficulty<select id="rogueDifficulty"><option value="easy">Easy · gravity 20% slower</option><option value="normal" selected>Normal · +1 speed per badge, cap 8</option><option value="hard">Hard · +2 speed per badge, cap 12</option></select></label><label>Seed or share code<input id="rogueSeed" maxlength="30" placeholder="Leave blank for a new seed" autocomplete="off"></label><p>Ruleset: Expedition v2, now with badge-only speed progression. Line clears and battles never raise your speed level. A KT3 code includes difficulty. The same seed and choices reproduce pieces, encounters and rewards; play timing can change battles. Seed entry is optional on controllers.</p><p id="rogueSeedError" role="status"></p><button id="rogueStart" data-nav-default>START EXPEDITION</button><button id="rogueSetupBack">BACK</button>`)+modal('rogueRewardModal','GYM REWARD',`<h3 id="rogueRewardTitle"></h3><div id="rogueChoices"></div><p id="rogueRewardStatus" role="status"></p>`)+modal('rogueRecapModal','RUN RECAP',`<h3 id="rogueRecapTitle"></h3><p id="rogueRecapInfo"></p><label>Share code<input id="rogueRecapCode" readonly></label><p id="rogueRecapTeam"></p><ul id="rogueRecapRewards"></ul><button id="rogueRecapReturn" data-nav-default>RETURN</button>`)+modal('rogueRecordsModal','ROGUE RECORDS',`<p>Top 10 of the last 200 completed runs. Ranked by Champion, badges, score, then active time. Records stay separate by difficulty, expedition ruleset and speed rules.</p><label>Difficulty<select id="rogueRecordDifficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option></select></label><label>Ruleset<select id="rogueRecordRules"><option value="expedition-v2">Expedition v2</option><option value="expedition-v1">Expedition v1 · previous seeds</option><option value="legacy-v0">Legacy Rogue</option></select></label><label>Speed rules<select id="rogueRecordSpeed"><option value="badge-v1">Badge progression · current</option><option value="lines-v1">Line progression · previous</option></select></label><ol id="rogueRecordList"></ol><button id="rogueRecordsBack" data-nav-default>BACK</button>`));
 navModalIds.unshift('championFinale','rogueRewardModal','rogueRecapModal','rogueRecordsModal','rogueSetupModal');
 navModalIds.splice(navModalIds.indexOf('controlsConfirm'),1);navModalIds.unshift('controlsConfirm');
 $('rogueStart').onclick=()=>startRogueFromSetup();$('rogueSetupBack').onclick=()=>{setModal('rogueSetupModal',false);showTitleScreen();};$('rogueRecapReturn').onclick=closeRogueRecap;
 $('rogueRecordsBack').onclick=()=>{setModal('rogueRecordsModal',false);resetMenuFocus(menuRoot());};for(const id of ['rogueRecordDifficulty','rogueRecordRules','rogueRecordSpeed'])$(id).onchange=showRogueRecords;
 const old=$('titleNewRunBtn'),b=old.cloneNode(true);b.textContent='ROGUE EXPEDITION';old.replaceWith(b);b.onclick=openRogueSetup;
 $('mainPractice').insertAdjacentHTML('afterend','<button id="mainRogueRecap">ROGUE RUN / SEED</button><button id="mainRogueRecords">ROGUE RECORDS</button>');$('mainRogueRecap').onclick=()=>{if(!isAdventureMode()&&save.rogue)showRogueRecap();else flashMessage('ROGUE EXPEDITION','Start a Rogue expedition from the title screen to see its seed and rewards.');};$('mainRogueRecords').onclick=showRogueRecords;
 $('titleBossTestBtn').insertAdjacentHTML('afterend','<button id="titleRogueRecords" class="title-start alt">ROGUE RECORDS</button>');$('titleRogueRecords').onclick=showRogueRecords;
 const startBase=startTitleGame;startTitleGame=function(mode='auto',confirmed=false){if(mode==='new'||mode==='auto'&&!hasSavedRun('rogue'))return openRogueSetup();return startBase(mode,confirmed);};
 const backBase=menuBack;menuBack=function(){const root=menuRoot();if(root?.id==='championFinale'){closeChampionFinale();return;}if(root?.id==='rogueRewardModal')return;if(root?.id==='rogueSetupModal')return $('rogueSetupBack').click();if(root?.id==='rogueRecordsModal')return $('rogueRecordsBack').click();if(root?.id==='rogueRecapModal')return closeRogueRecap();return backBase();};
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return ['championFinale','rogueSetupModal','rogueRewardModal','rogueRecapModal','rogueRecordsModal'].some(isShown)||pauseBase();};
 const clearBase=clearControlsScreens;clearControlsScreens=function(){for(const id of ['championFinale','rogueSetupModal','rogueRewardModal','rogueRecapModal','rogueRecordsModal'])setModal(id,false);clearBase();};
 const hudBase=updateHUD;updateHUD=function(){hudBase();if(isStoryBattle()){$('mapTitle').textContent=save.gymBattle.gymIndex===12?'CHAMPION CHAMBER':'RIVAL ENCOUNTER';$('battleKindLabel').textContent=save.gymBattle.gymIndex===12?'CHAMPION GARY':'RIVAL GARY';$('routeName').textContent=save.gymBattle.gymIndex===12?'CHAMPION CHAMBER':GYMS[save.gymBattle.gymIndex].city;}if(save.journey?.championDefeated)$('leagueBadgeProgress').textContent='INDIGO LEAGUE · KANTO CHAMPION · HALL OF FAME';};
 // Champion is also available as an isolated Practice rematch.
 $('practiceEncounter').insertAdjacentHTML('beforeend','<option value="12">Champion · GARY</option>');
}
