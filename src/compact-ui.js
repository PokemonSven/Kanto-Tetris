// Build 1.7.4: approved layout, with the existing engine and storage unchanged.
let compactReady=false,compactReturn=null,compactTown=false;
function compactFit(){
 const landscape=innerWidth>700;
 document.querySelector('.dex-shell')?.classList.toggle('fullscreen-game',landscape&&$('gamePanel').classList.contains('active'));
 // The side panels share the remaining width; the board keeps square cells.
 const available=Math.max(200,landscape?Math.min(innerHeight-20,(innerWidth-540)*2):Math.min(innerHeight-200,(innerWidth-76)*2));
 const ratio=boardPixelRatio(),cell=Math.max(1,Math.floor(available*ratio/ROWS+1e-7));
 const height=cell*ROWS/ratio;
 document.documentElement.style.setProperty('--board-h',height+'px');
 fitBoardRaster(cell,ratio);
}
function compactRefreshMenu(){
 if(!compactReady)return;
 const busy=!save?.starter||gameOver||runActionBusy();
 $('mainResume').textContent=compactTown?'RETURN TO TOWN':'RESUME GAME';
 for(const id of ['mainInventory','mainQuests','mainBills','mainSven','mainOak','mainSaveExit','mainRestart'])$(id).disabled=busy;
 $('mainResume').disabled=!save?.starter||gameOver;
 $('mainBills').disabled=busy||isGymBattle();
 updateFlyButton();$('mainFly').disabled=busy||!isAdventureMode()||$('flyBtn').disabled||$('flyBtn').hidden;
 $('mainTravel').hidden=$('trainingGymBtn').hidden;
 $('mainTravel').disabled=busy||$('trainingGymBtn').disabled;
 $('mainTravel').textContent=$('trainingGymBtn').textContent;
 $('mainTravel').title=$('trainingGymBtn').title;
 $('mainSaveExit').textContent=save?.bossTest?'RETURN TO TITLE (TEST)':'SAVE & RETURN TO TITLE';
}
function openMainMenu(){
 if(gameOver||isGymTransition()||['controlsConfirm','gymIntroModal','eeveeChoiceModal','starterModal','titleScreen','studioIntro','productionCredits'].some(isShown))return;
 compactTown=compactTown||isShown('townModal');
 if(compactTown)setModal('townModal',false);
 utilityReturn=null;compactReturn=null;setModal('fieldMenuModal',false);
 selectGamePanel('gamePanel');requestAutoPause();hideOverlay();clearHeldInput();
 $('mainMenuStatus').textContent='';setModal('mainMenuModal',true);compactRefreshMenu();resetMenuFocus($('mainMenuModal'));
}
function closeMainMenu(resume=false){
 clearHeldInput();setModal('mainMenuModal',false);compactReturn=null;
 if(compactTown){compactTown=false;autoPauseRequested=false;setModal('townModal',true);renderTownStop();resetMenuFocus($('townModal'));return}
 if(resume&&save?.starter&&!gameOver){paused=true;autoPauseRequested=false;togglePause()}
 else enforceAutoPause();
}
function compactOpen(id,panel,action){
 setModal('mainMenuModal',false);compactReturn={id,panel};action();
 const open=panel?$(id)?.classList.contains('active'):isShown(id);
 if(!open){compactReturn=null;setModal('mainMenuModal',true);compactRefreshMenu()}
 resetMenuFocus(menuRoot());
}
const compactMenuRootBase=menuRoot;
menuRoot=function(){
 // Existing Inventory submenus keep their own return target first.
 const root=compactMenuRootBase();
 if(compactReturn){
   const open=compactReturn.panel?$(compactReturn.id)?.classList.contains('active'):isShown(compactReturn.id);
   const nested=utilityReturn||['controlsConfirm','backupModal','dexDetailModal','billsPcModal','flyModal','oakGuideModal','cropEditorModal'].some(id=>id!==compactReturn.id&&isShown(id));
   if(!open&&!nested){
     compactReturn=null;
     if(save?.starter&&!gameOver&&!isShown('titleScreen')&&!isShown('starterModal')&&!isShown('gymIntroModal')&&!isShown('townModal')){
       hideOverlay();setModal('mainMenuModal',true);compactRefreshMenu();return $('mainMenuModal');
     }
   }
 }
 return root;
};
const compactMenuBackBase=menuBack;
menuBack=function(){
 const root=menuRoot();
 if(root?.id==='mainMenuModal'){closeMainMenu(true);return}
 if(['questsModal','uiCreditsModal'].includes(root?.id)){
   setModal(root.id,false);
   if(root.id==='uiCreditsModal'&&$('optionsPanel').classList.contains('active'))resetMenuFocus($('optionsPanel'));
   else {menuRoot();resetMenuFocus(menuRoot());enforceAutoPause()}
   return;
 }
 compactMenuBackBase();menuRoot();
};
const compactPauseDialogBase=pauseDialogOpen;
pauseDialogOpen=function(){return compactPauseDialogBase()||['mainMenuModal','questsModal','uiCreditsModal'].some(isShown)};
const compactClearScreensBase=clearControlsScreens;
clearControlsScreens=function(){compactReturn=null;compactTown=false;for(const id of ['mainMenuModal','questsModal','uiCreditsModal'])setModal(id,false);compactClearScreensBase()};
const compactTravelBase=travelToFlyTarget;
travelToFlyTarget=function(target){if(target?.available){compactReturn=null;compactTown=false;setModal('mainMenuModal',false)}return compactTravelBase(target)};
const compactSaveExitBase=saveAndReturnToTitle;
saveAndReturnToTitle=function(){compactSaveExitBase();if(isShown('mainMenuModal')&&save?.starter)$('mainMenuStatus').textContent=$('overlayText').textContent};

// Keep six consistent cards, without replacing focused DOM nodes on every HUD tick.
let compactTeamSignature='';
renderTeam=function(){
 const grid=$('teamGrid');if(!grid)return;
 $('teamCount').textContent=`${save.team.length}/6`;
 const cap=currentLevelCap(),rows=save.team.map(dex=>{const e=ensurePokemonProgress(save.collection[String(dex)],5,dex);return {dex,e,max:pokemonMaxHP(e.level,dex),para:surgeParalysisRemaining(dex)}});
 const signature=JSON.stringify([save.buddy,cap,rows.map(({dex,e,max,para})=>[dex,e.level,e.levelXP,e.currentHP,max,para,pokemonName(dex)])]);
 if(signature===compactTeamSignature&&grid.children.length===6){
   // Sprites can finish loading or receive a crop edit without stats changing.
   grid.querySelectorAll('[data-team-portrait]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.teamPortrait],false));return;
 }
 compactTeamSignature=signature;
 grid.innerHTML=Array.from({length:6},(_,i)=>{
   const row=rows[i];if(!row)return `<div class="team-slot empty"><span>EMPTY SLOT ${i+1}</span></div>`;
   const {dex,e,max,para}=row,active=save.buddy===dex,hp=Math.max(0,Math.min(max,e.currentHP)),pct=hp/max*100,need=xpToNextLevel(e.level),capped=e.level>=cap,xp=Math.min(need,e.levelXP||0),name=escapeControlsText(pokemonName(dex).toUpperCase());
   return `<button type="button" class="team-slot ${active?'active':''} ${hp<=0?'fainted':''}" data-team-dex="${dex}" aria-label="View ${name}, level ${e.level}${active?', active partner':''}, HP ${hp} of ${max}" aria-pressed="${active}">
   ${active?'<span class="compact-active">ACTIVE</span>':''}<canvas width="64" height="64" data-team-portrait="${dex}" aria-hidden="true"></canvas>
   <span class="compact-mon-name">${name} <small>Lv.${e.level}</small></span>
   <span class="team-bar-row"><span>HP</span><span class="team-bar" role="meter" aria-label="${name} health" aria-valuenow="${hp}" aria-valuemin="0" aria-valuemax="${max}"><i class="${pct<=0?'ko':pct<=25?'low':pct<=50?'mid':''}" style="width:${pct}%"></i></span><span>${hp}/${max}</span></span>
   <span class="team-bar-row"><span>EXP</span><span class="team-bar team-exp" role="meter" aria-label="${name} experience" aria-valuenow="${capped?need:xp}" aria-valuemin="0" aria-valuemax="${need}"><i style="width:${capped?100:xp/need*100}%"></i></span><span>${capped?'CAP '+cap:xp+'/'+need}</span></span>
   ${hp<=0||para?`<span class="status-tag">${hp<=0?'FAINTED':'PARALYZED · '+para}</span>`:''}</button>`;
 }).join('');
 grid.querySelectorAll('[data-team-portrait]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.teamPortrait],false));
 grid.querySelectorAll('[data-team-dex]').forEach(b=>b.addEventListener('click',()=>openDexDetail(+b.dataset.teamDex)));
};
const compactDexDetailBase=openDexDetail;
openDexDetail=function(dex){
 requestAutoPause();clearHeldInput();compactDexDetailBase(dex);
 const e=save?.collection?.[String(dex)],info=$('dexDetailBody')?.querySelector('.dex-info-grid');
 if(e&&info){
   const need=xpToNextLevel(e.level),cap=currentLevelCap(),plan=save.encounterDex&&!save.encounterDefeated?v25AttackPlan(+dex,save.encounterDex,e.level,v25OpponentLevel()):null;
   const card=document.createElement('div');card.className='dex-info-card full';card.id='compactBattleDetails';
   card.innerHTML=`<h3>Level & Battle Strike</h3>${oakPartnerBonus(dex)>1?'<p class="oak-origin">OAK’S LAB PARTNER ★ +20% damage, maximum HP and EXP gain. This bond survives evolution.</p>':''}<p>LV.${e.level} • ${e.level>=cap?'LEVEL CAP '+cap:`EXP ${e.levelXP||0}/${need} • CAP ${cap}`}<br>Clear lines to attack. Doubles, triples and Tetrises hit harder.${plan?`<br>${plan.type.toUpperCase()} • ${v25EffectLabel(plan.raw)} against ${BYDEX[save.encounterDex].name.toUpperCase()}.`:''}${save.buddy===+dex?`<br>CURRENT COMBO ${battleV25.combo||0}`:''}</p>`;
   info.prepend(card);
   if(e.currentHP<=0){$('dexDetailTeamBtn').disabled=true;$('dexDetailTeamBtn').textContent='FAINTED'}
 }
 if($('dexDetailClose2'))$('dexDetailClose2').textContent='BACK';resetMenuFocus($('dexDetailModal'));
};
const compactFieldRenderBase=renderFieldMenu;
renderFieldMenu=function(){
 compactFieldRenderBase();if(!compactReady||!save?.starter)return;
 $('walletMoney').textContent=save.money.toLocaleString();
 if(!save.items.length)$('fieldItems').innerHTML='';
 for(let i=save.items.length;i<MAX_ITEM_SLOTS;i++)$('fieldItems').insertAdjacentHTML('beforeend',`<div class="inventory-empty">EMPTY SLOT ${i+1}</div>`);
};
const compactHudBase=updateHUD;
updateHUD=function(){compactHudBase();if(compactReady&&isShown('mainMenuModal'))compactRefreshMenu()};

// The Trainer Card keeps the existing badge screen and its controller return path.
const compactBadgesBase=renderBadges;
renderBadges=function(){
 compactBadgesBase();const card=$('trainerCardSummary');if(!card)return;
 const profile=trainerProfile();
 const fields=[['TRAINER',profile.name],['FAVORITE',profile.favorite?BYDEX[profile.favorite].name.toUpperCase():'—'],['EXP',adventureTeamEXP()?'TEAM':'ACTIVE ONLY'],['MODE',runMode==='rogue'?'ROGUE':'ADVENTURE'],['LOCATION',$('routeName').textContent],['SCORE',score.toLocaleString()],['LINES',runLines.toLocaleString()],['POKÉDEX',metaDex.size+' / 150'],['MONEY','$'+(save.money||0).toLocaleString()],['TEAM',save.team.map(d=>pokemonName(d).toUpperCase()).filter(Boolean).join(' · ')||'CHOOSE A STARTER']];
 card.innerHTML=fields.map(([label,value])=>`<div${label==='TEAM'?' class="trainer-card-team"':''}><dt>${label}</dt><dd>${escapeControlsText(value)}</dd></div>`).join('');
};

function initializeCompactUI(){
 const layout=document.querySelector('.game-layout'),oldTrainer=document.querySelector('.trainer-column'),boardFrame=$('game').closest('.screen-frame'),right=document.querySelector('.third');
 const archive=document.createElement('div');archive.id='legacyHudState';archive.hidden=true;archive.setAttribute('aria-hidden','true');document.body.appendChild(archive);
 document.querySelector('.brand small').remove();
 archive.append(document.querySelector('.tabs'));
 document.querySelector('.header').insertAdjacentHTML('beforeend','<button class="tab" id="mainMenuBtn" aria-haspopup="dialog">≡ MENU</button>');
 const play=document.createElement('section');play.className='play-column';play.setAttribute('aria-label','Tetris playfield');
 const trainer=document.createElement('div');trainer.className='screen-frame compact-trainer';trainer.innerHTML='<div class="screen"><div class="compact-data"><div class="compact-numbers"></div></div><div class="compact-next"><b>NEXT</b></div></div>';
 const data=trainer.querySelector('.compact-data');for(const id of ['score','lines'])trainer.querySelector('.compact-numbers').append($(id).closest('.stat'));
 const progress=$('gymProgress').parentElement;data.append($('routeName').parentElement,progress);trainer.querySelector('.compact-next').append($('next'));
 boardFrame.classList.add('compact-board-frame');archive.append($('itemWallet'));
 play.append(trainer,boardFrame);layout.prepend(play);
 const mapFrame=$('kantoMap').closest('.screen-frame'),teamFrame=$('teamGrid').closest('.screen-frame');mapFrame.classList.add('compact-map');teamFrame.classList.add('compact-team');
 mapFrame.querySelector('.screen').insertAdjacentHTML('beforeend','<nav class="compact-quick-actions" aria-label="Game shortcuts"><button class="smallbtn" id="quickDex">POKÉDEX</button><button class="smallbtn" id="quickTrainer">TRAINER CARD</button><button class="smallbtn" id="quickInventory">INVENTORY</button><button class="smallbtn" id="quickMenu" aria-haspopup="dialog">MENU</button></nav>');
 $('badgePanel').querySelector('h2').textContent='TRAINER CARD';
 $('badgePanel').querySelector('.dex-head small').textContent='YOUR JOURNEY · KANTO LEAGUE BADGES';
 $('badgeGrid').insertAdjacentHTML('beforebegin','<dl id="trainerCardSummary" class="trainer-card-summary"></dl>');
 archive.append($('caughtCount').parentElement,document.querySelector('.team-help'));
 archive.append(oldTrainer);
 const options=$('optionsPanel').querySelector('.options-grid');
 options.insertAdjacentHTML('afterbegin','<div class="options-card compact-audio"><h3>AUDIO</h3><div id="compactAudio"></div></div><div class="options-card"><h3>DISPLAY & RUN</h3><p class="tiny">Fits 4:3 and 16:9 controller displays automatically, including 1280 × 960 and 1920 × 1080. Resize the window or use your device fullscreen mode.</p><div id="compactRunInfo" class="compact-run-info"></div><div class="compact-options-links"><button class="smallbtn" id="optionsQuests">QUESTS</button><button class="smallbtn" id="optionsCredits">CREDITS</button><button class="smallbtn" id="cropEditorBtn">SPRITE EDITOR</button></div></div>');
 $('compactAudio').append(document.querySelector('.music-controls'),$('nowPlaying'));
 $('saveRunStatus').parentElement.append($('portableSaveStatus'));
 $('compactRunInfo').append($('speedText'),$('modeStatus'));
 document.body.insertAdjacentHTML('beforeend',`<div id="mainMenuModal" class="controls-modal" role="dialog" aria-modal="true" aria-labelledby="mainMenuTitle" aria-hidden="true"><div class="controls-card compact-dialog"><h2 id="mainMenuTitle">MENU</h2><div class="compact-menu-grid">
 <button id="mainResume" class="primary" data-nav-default>RESUME GAME</button><button id="mainInventory">INVENTORY</button><button id="mainQuests">QUESTS</button><button id="mainDex">POKéDEX</button><button id="mainBadges">BADGES</button><button id="mainBills">BILL'S PC</button><button id="mainSven">SVEN'S PC</button><button id="mainTravel">TRAVEL</button><button id="mainFly">FLY</button><button id="mainOak">PROFESSOR OAK</button><button id="mainOptions">OPTIONS</button><button id="mainBackups">SAVE BACKUPS</button><button id="mainSaveExit">SAVE & RETURN TO TITLE</button><button id="mainRestart">RESTART…</button></div><p id="mainMenuStatus" role="status"></p><p class="menu-hint">D-PAD / ARROWS: MOVE • A / ENTER: SELECT • B / ESC: RESUME</p></div></div>
 <div id="questsModal" class="controls-modal" role="dialog" aria-modal="true" aria-labelledby="questsTitle" aria-hidden="true"><div class="controls-card compact-dialog"><h2 id="questsTitle">QUESTS</h2><div id="compactQuests"></div><button id="questsBack" class="dialog-back">BACK</button></div></div>
 <div id="uiCreditsModal" class="controls-modal" role="dialog" aria-modal="true" aria-labelledby="uiCreditsTitle" aria-hidden="true"><div class="controls-card compact-dialog"><h2 id="uiCreditsTitle">CREDITS</h2><p>Development, game design and playtesting: Sam.<br>ChatGPT Wrangler: Steve.</p><div id="compactCredits"></div><button id="uiCreditsBack" class="dialog-back">BACK TO OPTIONS</button></div></div>`);
 $('compactQuests').append($('questBoard'));
 document.querySelectorAll('.dex-shell>.art-credit,.dex-shell>.footer').forEach(el=>$('compactCredits').append(el));
 $('fieldTitle').textContent='INVENTORY';$('fieldTitle').append(document.querySelector('#itemWallet .money-pill'));
 $('fieldTitle').insertAdjacentHTML('afterend','<p class="inventory-info">Carry up to three items. Passive bonuses work while carried; overflow goes to Sven’s PC.</p>');
 $('fieldControls').textContent='OPTIONS';
 $('pauseTeam').textContent='INVENTORY';$('pauseActions').insertAdjacentHTML('beforeend','<button id="pauseMainMenu">MENU & QUESTS</button>');
 navModalIds.splice(navModalIds.indexOf('fieldMenuModal'),0,'uiCreditsModal','questsModal','mainMenuModal');
 const quests=()=>{requestAutoPause();renderQuestBoard();setModal('questsModal',true);resetMenuFocus($('questsModal'))};
 $('mainMenuBtn').addEventListener('click',openMainMenu);$('pauseMainMenu').addEventListener('click',openMainMenu);$('mainResume').addEventListener('click',()=>closeMainMenu(true));
 const actions={mainInventory:['fieldMenuModal',false,()=>openFieldMenu()],mainQuests:['questsModal',false,quests],mainDex:['dexPanel',true,()=>{selectGamePanel('dexPanel');renderDex()}],mainBadges:['badgePanel',true,()=>{selectGamePanel('badgePanel');renderBadges()}],mainBills:['billsPcModal',false,openBillsPC],mainSven:['svenPcPanel',true,openSvensPcPanel],mainFly:['flyModal',false,()=>{openFlyMap();renderFlyDestinations()}],mainOak:['oakGuideModal',false,openOakGuide],mainOptions:['optionsPanel',true,openControlsPanel],mainBackups:['backupModal',false,openBackupManager]};
 for(const [id,args] of Object.entries(actions))$(id).addEventListener('click',()=>compactOpen(...args));
 $('mainBadges').textContent='TRAINER CARD';$('fieldBadges').textContent='TRAINER CARD';
 for(const [id,target] of [['quickDex','mainDex'],['quickTrainer','mainBadges'],['quickInventory','mainInventory'],['quickMenu',null]])$(id).addEventListener('click',()=>{openMainMenu();if(target&&isShown('mainMenuModal'))$(target).click()});
 $('mainTravel').addEventListener('click',()=>{setModal('mainMenuModal',false);compactReturn=null;compactTown=false;$('trainingGymBtn').click();enforceAutoPause();resetMenuFocus(menuRoot())});
 $('mainSaveExit').addEventListener('click',saveAndReturnToTitle);$('mainRestart').addEventListener('click',requestRestart);
 $('questsBack').addEventListener('click',menuBack);$('uiCreditsBack').addEventListener('click',menuBack);
 $('optionsQuests').addEventListener('click',quests);$('optionsCredits').addEventListener('click',()=>{requestAutoPause();setModal('uiCreditsModal',true);resetMenuFocus($('uiCreditsModal'))});
 document.head.append($('compactUIStyles'));
 compactReady=true;compactFit();window.addEventListener('resize',compactFit);window.visualViewport?.addEventListener('resize',compactFit);
}
