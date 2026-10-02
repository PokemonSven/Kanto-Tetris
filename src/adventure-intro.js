// The lab is a draft until a starter is chosen: existing Adventure saves are safe on cancel.
const OAK_PORTRAIT='__OAK_PORTRAIT__',OAK_LAB='__OAK_LAB__';
const OAK_DIFFICULTIES={
 easy:['EASY · A STEADY START','The blocks stay at level 1, even after badges and in gyms. Want more score? Raise the speed slider in Options whenever you like. Speed Bike will still help EXP without speeding up Easy.'],
 normal:['NORMAL · THE ORIGINAL JOURNEY','Start at speed level 1. Each new Gym Badge adds one speed level, up to level 8. Clearing lines, entering gyms and meeting legendary Pokémon will not raise your speed. Take time to train!'],
 hard:['HARD · A QUICKER CHALLENGE','The same journey, rewards and battles as Normal. Start at speed level 1; each new Gym Badge adds two speed levels, up to level 12. Line clears and new battles will not raise your speed.']
};
let oakIntro=null;
function oakSample(values,count=4){const pool=values.slice(),out=[];while(pool.length&&out.length<count){const i=Math.floor(Math.random()*pool.length);out.push(pool.splice(i,1)[0]);}return out;}
function startOakIntroduction(){
 if(practiceSession)return;
 clearControlsScreens();hideOverlay();setModal('titleScreen',false);setModal('starterModal',false);setModal('adventureDifficultyModal',false);paused=true;clearHeldInput();
 oakIntro={step:'welcome',history:[],name:'RED',favorite:null,outing:null,expMode:'team',difficulty:'normal',speedRisk:1,tutorialSeen:false,lesson:0,
   favorites:oakSample(MONS.map(m=>m.dex)),names:oakSample(['RED','LEAF','ALEX','SKY','ASH','JAMIE','ROBIN','SAM']),outings:oakSample(['forest','sea','mountain','city']),waitMs:0,lastAt:null,pikachu:false,settingsOpen:false};
 setModal('oakIntroModal',true);renderOakIntro();
}
function oakGo(step){if(!oakIntro)return;if(oakIntro.step!==step&&step!=='shock'&&oakIntro.step!=='shock')oakIntro.history.push(oakIntro.step);oakIntro.step=step;oakIntro.lastAt=null;clearHeldInput();renderOakIntro();}
function oakBack(){
 const o=oakIntro;if(!o)return;
 if(o.step==='shock'){oakGo('choose');return;}
 if(o.step==='lesson'&&o.lesson>0){o.lesson--;renderOakIntro();return;}
 if(!o.history.length){cancelOakIntroduction();return;}
 if(o.step==='choose'){o.waitMs=0;o.pikachu=false;}
 o.step=o.history.pop();o.lastAt=null;clearHeldInput();renderOakIntro();
}
function cancelOakIntroduction(){oakIntro=null;setModal('oakIntroModal',false);$('oakSettingsReturn').hidden=true;selectGamePanel('gamePanel');openAdventureSlots(false);}
function oakButton(label,action,value='',extra=''){return `<button data-oak-action="${action}" data-oak-value="${value}" ${extra}>${label}</button>`;}
function renderOakIntro(){
 const o=oakIntro;if(!o)return;const name=escapeControlsText(o.name||'TRAINER');let title='',text='',body='';
 const next=(step,label='CONTINUE')=>oakButton(label,'step',step,'data-nav-default');
 switch(o.step){
 case 'welcome':title='WELCOME TO THE WORLD OF POKÉMON!';text='Hello there! I’m Professor Oak. Here in Kanto, a clear line and a good partner can take you a long way. Before we begin, let’s get to know you.';body=next('name','HELLO, PROFESSOR!');break;
 case 'name':title='FIRST, WHAT IS YOUR NAME?';text='Choose a name, or use the name keypad to write your own. This is what we’ll put on your Trainer Card.';body=`<div class="oak-choice-grid">${o.names.map(n=>oakButton(n,'name',n)).join('')}</div>`+oakButton('WRITE MY OWN NAME','step','nameKeys');break;
 case 'nameKeys':title='YOUR TRAINER NAME';text='Up to 12 letters or numbers. Use your keyboard or choose letters with the D-pad and A. Then choose Done.';body=`<label class="oak-name-label">NAME<input id="oakNameInput" maxlength="12" value="${name}" autocomplete="off" spellcheck="false"></label><div class="oak-name-keys">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map(k=>oakButton(k,'key',k)).join('')}</div><div class="oak-choice-grid">${oakButton('DELETE','key','delete')}${oakButton('CLEAR','key','clear')}${oakButton('SPACE','key','space')}${oakButton('DONE','nameDone','','data-nav-default')}</div>`;break;
 case 'favorite':title='WHICH OF THESE IS YOUR FAVORITE?';text=`${name}! A fine name. Just for fun, which of these four Pokémon catches your eye? Your answer won’t change your starter or your adventure.`;body=`<div class="oak-choice-grid oak-mon-choices">${o.favorites.map(d=>oakButton(`<canvas width="144" height="144" data-oak-mon="${d}"></canvas><span>${BYDEX[d].name.toUpperCase()}</span>`,'favorite',d)).join('')}</div>`;break;
 case 'outing':title='WHERE WOULD YOU SPEND A FREE AFTERNOON?';text=`${BYDEX[o.favorite]?.name||'Pokémon'} — a wonderful choice! And where would you and a partner go exploring? There are no right or wrong answers.`;body=`<div class="oak-choice-grid">${o.outings.map(v=>oakButton({forest:'A QUIET FOREST',sea:'BESIDE THE SEA',mountain:'UP A MOUNTAIN',city:'A BUSTLING CITY'}[v],'outing',v)).join('')}</div>`;break;
 case 'difficulty':title='WHAT SORT OF CHALLENGE WOULD YOU LIKE?';text='This choice sets the pace for this Adventure. Easy is steady, Normal is our original journey, and Hard gets fast sooner. Legendary trials follow your badge speed. Practice lets you choose a fixed drill speed.';body=Object.entries(OAK_DIFFICULTIES).map(([v,[t,d]])=>oakButton(`<strong>${t}</strong><small>${d}</small>`,'difficulty',v)).join('');break;
 case 'exp':title='HOW SHOULD YOUR TEAM LEARN?';text='Every battle teaches us something. Team EXP helps your whole carried team grow together. Your active partner still earns extra, and Pokémon in Bill’s PC don’t receive battle EXP.';body=oakButton('<strong>TEAM EXP · RECOMMENDED</strong><small>Share battle and duplicate-catch EXP with all six carried Pokémon.</small>','exp','team')+oakButton('<strong>ACTIVE POKÉMON ONLY</strong><small>Only the active partner gains battle and duplicate-catch EXP. Change partners to train each one.</small>','exp','active');break;
 case 'settings':title='MAKE YOURSELF COMFORTABLE';text='Let’s set the speed and sound before you head out. You can also review all controls and display preferences. You can change EXP sharing and the speed slider later in Options.';body=`<label>SPEED / SCORE <output id="oakSpeedValue">×${o.speedRisk.toFixed(2)}</output><input id="oakSpeed" type="range" min="0" max="5" step="1" value="${ADVENTURE_SPEED_RISK_VALUES.indexOf(o.speedRisk)}"></label><div class="oak-choice-grid">${oakButton('MUSIC: '+(musicEnabled?'ON':'OFF'),'music')}${oakButton('SFX: '+(sfxEnabled?'ON':'OFF'),'sfx')}${oakButton('ALL OPTIONS & CONTROLS','options')}${next('tutorial','SETTINGS READY')}</div>`;break;
 case 'tutorial':title='A QUICK LESSON BEFORE WE BEGIN?';text='I can explain how line clears, Pokémon battles, catching and gym hazards work. You can find these lessons again in the menu any time.';body=oakButton('YES, TEACH ME!','lessonStart','','data-nav-default')+next('starterTalk','I’M READY TO CHOOSE MY PARTNER');break;
 case 'lesson':{const lesson=OAK_BATTLE_LESSONS[o.lesson];title=lesson[0];text=lesson[1];body=`<p class="oak-page">LESSON ${o.lesson+1} / ${OAK_BATTLE_LESSONS.length}</p>`+oakButton(o.lesson===OAK_BATTLE_LESSONS.length-1?'LET’S MEET THE STARTERS':'NEXT LESSON','lessonNext','','data-nav-default')+next('starterTalk','SKIP TO STARTERS');break;}
 case 'starterTalk':title='YOUR VERY FIRST PARTNER';text=`Now, ${name}, the Pokémon on that table are waiting to meet you. Bulbasaur, Charmander and Squirtle each have their own strengths. Take your time and choose the friend you want beside you.`;body=next('choose','MEET THE STARTERS');break;
 case 'choose':title='WHO WILL JOIN YOUR ADVENTURE?';text=o.pikachu?'Pikachu seems to have chosen you! This energetic little friend has 20% more HP, damage and EXP gain. That special bond stays with it if it evolves into Raichu. You can still choose any of the original three.':'Bulbasaur is calm and dependable. Charmander is spirited and brave. Squirtle is cheerful and strong. There’s no need to rush!';body=`<div class="oak-choice-grid oak-mon-choices oak-starters">${[1,4,7,...(o.pikachu?[25]:[])].map(d=>oakButton(`<canvas width="144" height="144" data-oak-mon="${d}"></canvas><strong>${BYDEX[d].name.toUpperCase()}</strong><small>${d===25?'OAK’S PARTNER ★ +20% HP / DAMAGE / EXP':v25Types(d).join(' / ').toUpperCase()}</small>`,'starter',d)).join('')}</div>`;break;
 case 'shock':title='YEOOOW! PIKACHU!';text='A startled Pikachu dashes out from behind the equipment and gives Oak a little shock! “Well! That’s one way to introduce yourself! It looks like this one wants to come along, too.”';body=next('choose','MEET PIKACHU!');break;
 }
 $('oakSceneTitle').textContent=title;$('oakDialogue').textContent=text;$('oakChoices').innerHTML=body;
 $('oakIntroModal').classList.toggle('oak-shocked',o.step==='shock');$('oakVisitor').hidden=!o.pikachu||!['choose','shock'].includes(o.step);
 $('oakSceneChapter').textContent=['choose','starterTalk','shock'].includes(o.step)?'PALLET TOWN · YOUR FIRST PARTNER':'PALLET TOWN · OAK’S LAB';
 $('oakChoices').querySelectorAll('[data-oak-mon]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.oakMon],false));
 if(o.pikachu)drawPortrait($('oakVisitor'),BYDEX[25],false);
 $('oakExit').textContent='BACK TO SAVE SLOTS';const first=$('oakChoices').querySelector('[data-nav-default]')||$('oakChoices').querySelector('button');if(first)first.setAttribute('data-nav-default','');resetMenuFocus($('oakIntroModal'));
 if(o.step==='choose')o.lastAt=performance.now();
}
function oakOpenOptions(){const o=oakIntro;if(!o)return;o.settingsOpen=true;o.lastAt=null;setModal('oakIntroModal',false);selectGamePanel('optionsPanel');$('oakSettingsReturn').hidden=false;resetMenuFocus($('optionsPanel'));}
function oakCloseOptions(){if(!oakIntro)return;oakIntro.settingsOpen=false;$('oakSettingsReturn').hidden=true;selectGamePanel('gamePanel');setModal('oakIntroModal',true);renderOakIntro();}
function oakCommitStarter(dex,confirmed=false){
 const o=oakIntro;if(!o||o.step!=='choose'||![1,4,7,...(o.pikachu?[25]:[])].includes(dex))return;
 return commitAdventureSlot(o,dex,confirmed);
}
// Construct the run while writes are suspended; the slot owner commits it atomically.
function buildOakAdventure(o,dex){
 const profile=normalizedTrainer({...o,introComplete:true});oakIntro=null;setModal('oakIntroModal',false);$('oakSettingsReturn').hidden=true;clearControlsScreens();
 resetStateForMode('adventure',o.difficulty);save.trainer=profile;save.adventureSpeedRisk=o.speedRisk;
 chooseStarter(dex);
 if(dex===25){save.collection['25'].oakPartner=true;save.collection['25'].currentHP=pokemonMaxHP(save.collection['25'].level,25);feed.unshift('OAK’S PARTNER ★ +20% HP, DAMAGE AND EXP. THE BOND LASTS THROUGH EVOLUTION.');}
 updateHUD();renderTeam();renderBadges();renderAdventureSpeedControls();
}
function oakAction(action,value){
 const o=oakIntro;if(!o)return;
 if(action==='step'){oakGo(value);return;}
 if(action==='name'){o.name=value;oakGo('favorite');return;}
 if(action==='key'){
   o.name=value==='clear'?'':value==='delete'?o.name.slice(0,-1):(o.name+(value==='space'?' ':value)).slice(0,12);$('oakNameInput').value=o.name;return;
 }
 if(action==='nameDone'){o.name=normalizedTrainer({name:$('oakNameInput').value}).name;oakGo('favorite');return;}
 if(action==='favorite'){o.favorite=+value;oakGo('outing');return;}
 if(action==='outing'){o.outing=value;oakGo('difficulty');return;}
 if(action==='difficulty'){o.difficulty=value;oakGo('exp');return;}
 if(action==='exp'){o.expMode=value;oakGo('settings');return;}
 if(action==='music'){$('musicBtn').click();renderOakIntro();return;}
 if(action==='sfx'){$('sfxBtn').click();renderOakIntro();return;}
 if(action==='options'){oakOpenOptions();return;}
 if(action==='lessonStart'){o.lesson=0;oakGo('lesson');return;}
 if(action==='lessonNext'){if(++o.lesson>=OAK_BATTLE_LESSONS.length){o.tutorialSeen=true;oakGo('starterTalk');}else renderOakIntro();return;}
 if(action==='starter')oakCommitStarter(+value);
}
// Only visible, focused time on the actual selection screen counts. No timeout survives leaving it.
function oakTick(now=performance.now()){
 const o=oakIntro;if(!o)return;
 const eligible=o.step==='choose'&&!o.pikachu&&!o.settingsOpen&&isShown('oakIntroModal')&&!isShown('controlsConfirm')&&!document.hidden&&gameWindowFocused;
 if(!eligible){o.lastAt=null;return;}
 if(o.lastAt!==null)o.waitMs+=Math.max(0,now-o.lastAt);
 o.lastAt=now;
 if(o.waitMs>=60000){o.pikachu=true;oakGo('shock');beep(780,.08);beep(330,.12,.1);}
}
function initializeAdventureIntro(){
 document.body.insertAdjacentHTML('beforeend',`<div id="oakIntroModal" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="oakSceneTitle"><div class="oak-lab-card"><img class="oak-lab-bg" src="${OAK_LAB}" alt="Professor Oak’s pixel-art Pokémon laboratory"><header><span id="oakSceneChapter"></span><button id="oakExit">BACK TO TITLE</button></header><div class="oak-stage"><img id="oakPortrait" src="${OAK_PORTRAIT}" alt="Professor Oak welcomes you"><span class="oak-sparks" aria-hidden="true">ϟ ϟ ϟ</span><canvas id="oakVisitor" width="240" height="240" hidden aria-label="A surprise Pikachu"></canvas><span class="oak-nameplate">PROFESSOR OAK</span></div><section class="oak-decisions"><h2 id="oakSceneTitle"></h2><div id="oakChoices"></div></section><div class="oak-dialogue-box"><p id="oakDialogue" aria-live="polite"></p><small>D-PAD / ARROWS · CHOOSE &nbsp; A / ENTER · CONFIRM &nbsp; B / ESC · BACK</small></div></div></div>`);
 navModalIds.splice(navModalIds.indexOf('controlsConfirm')+1,0,'oakIntroModal');
 $('oakChoices').addEventListener('click',e=>{const b=e.target.closest('[data-oak-action]');if(b)oakAction(b.dataset.oakAction,b.dataset.oakValue);});
 $('oakChoices').addEventListener('input',e=>{if(!oakIntro)return;if(e.target.id==='oakNameInput'){oakIntro.name=e.target.value.replace(/[^A-Za-z0-9 '-]/g,'').slice(0,12);e.target.value=oakIntro.name;}if(e.target.id==='oakSpeed'){oakIntro.speedRisk=ADVENTURE_SPEED_RISK_VALUES[+e.target.value];$('oakSpeedValue').textContent='×'+oakIntro.speedRisk.toFixed(2);}});
 $('oakExit').onclick=cancelOakIntroduction;
 $('optionsPanel').insertAdjacentHTML('afterbegin','<button id="oakSettingsReturn" hidden>RETURN TO PROFESSOR OAK</button>');$('oakSettingsReturn').onclick=oakCloseOptions;
 $('optionsPanel').querySelector('.options-grid').insertAdjacentHTML('beforeend','<div class="options-card"><h3>ADVENTURE EXP</h3><label>Who gains battle EXP?<select id="adventureExpMode"><option value="team">Team EXP (recommended)</option><option value="active">Active Pokémon only</option></select></label><p class="tiny">Includes duplicate-catch EXP. Bill’s PC is excluded. Active partners keep their existing EXP bonus.</p></div>');
 $('adventureExpMode').onchange=e=>{if(oakIntro){oakIntro.expMode=e.target.value;return;}trainerProfile().expMode=e.target.value;persist();renderBadges();};
 $('adventureSpeedSlider').addEventListener('input',e=>setAdventureSpeedRisk(ADVENTURE_SPEED_RISK_VALUES[+e.target.value]));
 const riskBase=setAdventureSpeedRisk;setAdventureSpeedRisk=function(v){if(oakIntro){oakIntro.speedRisk=normalizedAdventureSpeed(v);renderAdventureSpeedControls();return;}riskBase(v);};
 const speedControlsBase=renderAdventureSpeedControls;renderAdventureSpeedControls=function(){speedControlsBase();if(oakIntro){$('adventureSpeedSlider').disabled=false;$('adventureSpeedSlider').value=ADVENTURE_SPEED_RISK_VALUES.indexOf(oakIntro.speedRisk);$('adventureSpeedStatus').textContent=`NEW ADVENTURE · speed / score ×${oakIntro.speedRisk.toFixed(2)}`;}};
 const panelBase=selectGamePanel;selectGamePanel=function(id){panelBase(id);if(id==='optionsPanel'){$('adventureExpMode').value=oakIntro?.expMode||trainerProfile().expMode;$('adventureExpMode').disabled=!oakIntro&&!isAdventureMode();renderAdventureSpeedControls();}};
 openAdventureDifficulty=startOakIntroduction;
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return !!oakIntro||pauseBase();};
 const backBase=menuBack;menuBack=function(){if(isShown('controlsConfirm')){backBase();return;}if(oakIntro?.settingsOpen&&menuRoot()?.id==='optionsPanel'&&!pendingRemapAction){oakCloseOptions();return;}if(isShown('oakIntroModal')){oakBack();return;}backBase();};
 const clearBase=clearControlsScreens;clearControlsScreens=function(){oakIntro=null;setModal('oakIntroModal',false);$('oakSettingsReturn').hidden=true;clearBase();};
 const titleBase=showTitleScreen;showTitleScreen=function(){oakIntro=null;setModal('oakIntroModal',false);$('oakSettingsReturn').hidden=true;titleBase();};
 const loopBase=loop;loop=function(t=0){oakTick(performance.now());loopBase(t);};
 // Reset the timer's anchor on focus changes so background time is never counted.
 for(const event of ['blur','focus'])window.addEventListener(event,()=>{if(oakIntro)oakIntro.lastAt=null;});
 document.addEventListener('visibilitychange',()=>{if(oakIntro)oakIntro.lastAt=null;});
 const hpBase=pokemonMaxHP;pokemonMaxHP=function(level,dex=null){return Math.round(hpBase(level,dex)*oakPartnerBonus(dex));};
 $('compactCredits').insertAdjacentHTML('beforeend','<p>Professor Oak portrait and Pokémon laboratory: original pixel art created with OpenAI image generation for this fan project.</p>');
}
