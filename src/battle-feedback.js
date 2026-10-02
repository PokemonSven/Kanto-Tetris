// Display existing combat clocks; this module never advances a combat timer.
let battleFeedbackReady=false,battleFeedbackKey='',battleFeedbackDamage={dealt:null,taken:null},oakLesson=0,oakLessonFocus=null;
const OAK_BATTLE_LESSONS=[
 ['CLEAR LINES TO ATTACK','Every line clear makes your active partner attack. Doubles, triples and Tetrises hit harder. Quick clears and consecutive clears build extra power. The opponent can counter after your attack, so watch your team’s HP.'],
 ['KEEP THE PRESSURE ON','In gyms and later wild battles, going 10 seconds without clearing a line causes an idle-pressure attack. More attacks follow every 9 seconds. Clear a line to reset the clock. The warning appears with 3 seconds left. Early wild battles before Brock have no idle pressure. Menus and pauses freeze these clocks.'],
 ['READ THE HAZARDS','The battle strip shows the next leader hazard and any active warning. Agatha hides NEXT and queues a fast ghost brick every 28 seconds, with a 3-second warning. “Ghost brick queued” means it arrives after your current piece locks. More than one can be queued.'],
 ['CARE FOR YOUR TEAM','Damage numbers show HP actually lost. Use Inventory to change your active partner or use items. Heal at town Pokémon Centers. Bill’s PC previews a boxed Pokémon before you choose and confirm its destination; the PC is locked during gym battles.'],
 ['CATCH ON THE ROUTES','Wild Pokémon can be caught; gym and Elite Four opponents cannot. Weaken the wild Pokémon and watch the catch chance beside it. Tetrises improve catch odds, and carried items can help. Find missing species and their rumored locations through Pokédex filters.']
];
function battleFeedbackState(){
 const present=!!(save?.starter&&save.encounterDex&&save.buddy&&!gameOver),b=isGymBattle()?save.gymBattle:null;
 const frozen=!v25BattleActive();let hazard='',detail='',urgent=false;
 const sec=ms=>Math.ceil(Math.max(0,ms)/1000)+'s';
 if(b&&!isGymTransition()&&!save.encounterDefeated){
   const i=b.gymIndex;
   if(isRocketBattle()){const d=ROCKET_CHAPTERS[rocketIndex()];hazard=`${d.hazard} ${sec(b.eliteWarning>0?b.eliteWarning:d.interval-(b.specialTimer||0)+(b.rocketDelay||0))}`;urgent=b.eliteWarning>0;if(b.eliteVeil>0)detail=`NEXT JAMMED · ${sec(b.eliteVeil)}`;}
   else if(i>=12){hazard=i===12?`CHAMPION SURGE ${sec(b.eliteWarning>0?b.eliteWarning:30000-(b.specialTimer||0))}`:'RIVAL BATTLE';urgent=b.eliteWarning>0;}
   else if(i>=8){const e=ELITE_FOUR[i-8];hazard=`${e.hazard} ${sec(b.eliteWarning>0?b.eliteWarning:e.interval-(b.specialTimer||0))}`;urgent=b.eliteWarning>0;}
   else{
     const entries=[['STONE DROP',BROCK_STONE_INTERVAL_MS],['RISING TIDE',MISTY_TIDE_INTERVAL_MS],['SHOCK',SURGE_SHOCK_INTERVAL_MS],['OVERGROWTH',ERIKA_OVERGROWTH_INTERVAL_MS],['POISON SPIKES',KOGA_SPIKE_INTERVAL_MS],['PSYCHIC SPIN',SABRINA_SPIN_INTERVAL_MS],['FLAME WARNING',BLAINE_FLAME_INTERVAL_MS],['QUAKE WARNING',GIOVANNI_QUAKE_INTERVAL_MS]];
     const [name,interval]=entries[i];hazard=`${name} ${sec(interval-(b.specialTimer||0))}`;
     if(b.psychicSpinTimer>0){hazard=`PSYCHIC SPIN ACTIVE · ${sec(b.psychicSpinTimer)}`;urgent=true;}
     if(b.flameWarningTimer>0){hazard=`FLAME COLUMN ${(+b.flameColumn||0)+1} · ${sec(b.flameWarningTimer)}`;urgent=true;}
     if(b.quakeWarningTimer>0){hazard=`EARTHQUAKE · ${sec(b.quakeWarningTimer)}`;urgent=true;}
     if(b.shockTimer>0)detail=`CONTROLS SHOCKED · ${sec(b.shockTimer)}`;
     if(b.poisonActive)detail=`POISON · CLEAR ${b.poisonLinesRemaining} LINES TO CURE`;
   }
   if(b.pendingHazards>0)detail=`${i===10?'GHOST BRICK':'STONE'} QUEUED ×${b.pendingHazards} · AFTER LOCK`;
   else if(current?.specialRockfall)detail=current.type==='G'?'GHOST BRICK FALLING':'STONE FALLING';
   else if(i===10)detail='NEXT HIDDEN';
 }
 const pressure=present&&!save.encounterDefeated&&!isGymTransition()&&Math.max(0,save.adventureRecoveryLines||0)<=0&&(!!b||(save.badges?.length||0)>0);
 // Both conditions in v25IdleTick must be met; clearing/fainting resets both.
 const remaining=Math.max(0,battleV25.lastClearAt+V25_IDLE_FIRST_MS-battleActiveTime,battleV25.lastIdleStrikeAt+V25_IDLE_REPEAT_MS-battleActiveTime);
 const idle=pressure?`${remaining<=3000&&!frozen?'CLEAR A LINE! · ':''}IDLE PRESSURE ${sec(remaining)}${frozen?' · PAUSED':''}`:save.encounterDefeated||isGymTransition()?'OPPONENT DEFEATED':present?'IDLE PRESSURE OFF':'';
 return {present,hazard,detail,idle,urgent,pressure,remaining,frozen,warning:pressure&&remaining<=3000};
}
function refreshBattleFeedback(){
 if(!battleFeedbackReady)return;
 const key=v25CurrentBattleKey();if(key!==battleFeedbackKey){battleFeedbackKey=key;battleFeedbackDamage={dealt:null,taken:null};}
 const state=battleFeedbackState(),box=$('battleFeedback');box.hidden=!state.present;
 const mini=document.querySelector('.compact-map .gym-mini');if(mini)mini.classList.toggle('feedback-replaced',state.present&&isGymBattle());
 const set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;$(id).hidden=!text};
 set('battleHazard',state.hazard+(state.hazard&&state.frozen?' · PAUSED':''));set('battleQueued',state.detail);set('battleIdle',state.idle);
 set('battleDamage',`DEALT ${battleFeedbackDamage.dealt==null?'—':'−'+battleFeedbackDamage.dealt} · ${battleFeedbackDamage.taken==null?'TAKEN —':battleFeedbackDamage.taken.name+' −'+battleFeedbackDamage.taken.amount}`);
 box.classList.toggle('hazard-imminent',state.urgent);$('battleIdle').classList.toggle('pressure-warning',state.warning);
 set('battleWarning',state.warning&&!state.frozen?'Idle pressure soon. Clear a line.':'');
}
function showBattleDamage(dex,amount,target){
 if(!battleFeedbackReady||amount<=0)return;
 if(target==='enemy')battleFeedbackDamage.dealt=amount;else battleFeedbackDamage.taken={name:BYDEX[dex]?.name.toUpperCase()||'PARTNER',amount};
 const anchor=target==='enemy'?$('wildBox'):$('teamGrid').querySelector(`[data-team-dex="${dex}"]`);
 if(anchor){const r=anchor.getBoundingClientRect();if(r.width&&r.height){
   const number=document.createElement('span');number.className='battle-damage-number '+target;number.setAttribute('aria-hidden','true');number.textContent='−'+amount;number.style.left=(r.left+r.width/2)+'px';number.style.top=(r.top+8)+'px';document.body.append(number);setTimeout(()=>number.remove(),1400);
 }}
 refreshBattleFeedback();
}
const feedbackAttackBase=v25PlayerLineAttack;
const feedbackResetBase=v25ResetBattleState;
v25ResetBattleState=function(...args){const result=feedbackResetBase(...args);battleFeedbackKey=v25CurrentBattleKey();battleFeedbackDamage={dealt:null,taken:null};return result};
v25PlayerLineAttack=function(n){refreshBattleFeedback();const dex=save.encounterDex,hp=save.encounterHP,result=feedbackAttackBase(n);if(result>0)showBattleDamage(dex,Math.min(hp,result),'enemy');return result};
const feedbackCounterBase=v25EnemyDamage;
v25EnemyDamage=function(...args){refreshBattleFeedback();const dex=save.buddy,entry=save.collection[String(dex)],hp=entry?.currentHP||0,result=feedbackCounterBase(...args);if(result>0)showBattleDamage(dex,Math.min(hp,result),'partner');return result};
const feedbackPoisonBase=kogaPoisonTick;
kogaPoisonTick=function(){refreshBattleFeedback();const dex=save.buddy,entry=save.collection[String(dex)],hp=entry?.currentHP||0;const result=feedbackPoisonBase();showBattleDamage(dex,Math.max(0,hp-(entry?.currentHP||0)),'partner');return result};
const feedbackLoopBase=loop;loop=function(t=0){feedbackLoopBase(t);refreshBattleFeedback()};
const feedbackHudBase=updateHUD;updateHUD=function(){feedbackHudBase();refreshBattleFeedback()};
function renderOakLesson(){
 const [title,body]=OAK_BATTLE_LESSONS[oakLesson];$('oakLessonProgress').textContent=`PROFESSOR OAK · ${oakLesson+1} / ${OAK_BATTLE_LESSONS.length}`;$('oakLessonTitle').textContent=title;$('oakLessonBody').textContent=body;
 $('oakLessonPrev').disabled=oakLesson===0;$('oakLessonNext').textContent=oakLesson===OAK_BATTLE_LESSONS.length-1?'FINISH':'NEXT';
}
function openOakLesson(){oakLessonFocus=document.activeElement;oakLesson=0;requestAutoPause();clearHeldInput();renderOakLesson();setModal('oakBattleLesson',true);resetMenuFocus($('oakBattleLesson'))}
function closeOakLesson(){setModal('oakBattleLesson',false);clearHeldInput();resetMenuFocus(menuRoot());if(oakLessonFocus?.isConnected)focusMenuElement(oakLessonFocus,menuRoot());oakLessonFocus=null;enforceAutoPause()}
const feedbackMenuBackBase=menuBack;menuBack=function(){if(isShown('oakBattleLesson')){closeOakLesson();return}feedbackMenuBackBase()};
const feedbackPauseBase=pauseDialogOpen;pauseDialogOpen=function(){return isShown('oakBattleLesson')||feedbackPauseBase()};
const feedbackClearBase=clearControlsScreens;clearControlsScreens=function(){setModal('oakBattleLesson',false);oakLessonFocus=null;document.querySelectorAll('.battle-damage-number').forEach(el=>el.remove());feedbackClearBase()};
function initializeBattleFeedback(){
 $('wildBox').insertAdjacentHTML('afterend','<div id="battleFeedback" hidden><div id="battleHazard"></div><div id="battleQueued"></div><div id="battleIdle"></div><div id="battleDamage"></div><span id="battleWarning" class="feedback-sr" role="status"></span></div>');
 const oak=$('oakGuideModal');oak.querySelector('button').insertAdjacentHTML('beforebegin','<button id="oakBattleBasics" class="smallbtn">BATTLE BASICS · SHORT TUTORIAL</button>');
 $('compactRunInfo').insertAdjacentHTML('afterend','<button id="optionsBattleBasics" class="smallbtn">OAK’S BATTLE TUTORIAL</button>');
 document.body.insertAdjacentHTML('beforeend','<div id="oakBattleLesson" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="oakLessonTitle"><div class="controls-card compact-dialog"><p id="oakLessonProgress"></p><h2 id="oakLessonTitle"></h2><p id="oakLessonBody"></p><div class="collection-key-actions"><button id="oakLessonPrev">PREVIOUS</button><button id="oakLessonNext" data-nav-default>NEXT</button><button id="oakLessonClose">CLOSE TUTORIAL</button></div><p>You can replay these tips any time. The game stays paused.</p></div></div>');
 for(const id of ['oakBattleBasics','optionsBattleBasics'])$(id).addEventListener('click',openOakLesson);
 $('oakLessonPrev').addEventListener('click',()=>{oakLesson=Math.max(0,oakLesson-1);renderOakLesson();if($('oakLessonPrev').disabled)focusMenuElement($('oakLessonNext'),$('oakBattleLesson'))});
 $('oakLessonNext').addEventListener('click',()=>{if(oakLesson===OAK_BATTLE_LESSONS.length-1)closeOakLesson();else {oakLesson++;renderOakLesson()}});$('oakLessonClose').addEventListener('click',closeOakLesson);
 navModalIds.unshift('oakBattleLesson');battleFeedbackReady=true;refreshBattleFeedback();
}
