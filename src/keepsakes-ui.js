let nicknameDraft=null,scrapbookScope='team',scrapbookPage=0,keepsakesReady=false,scrapbookReturnDex=null;
function keepsakeDate(value){return value===null?'Date not recorded':new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
function keepsakeRibbons(k){return k.ribbons.map(id=>`<span class="keepsake-ribbon ${id}" title="${id==='starter'?'Your first partner. This ribbon stays through evolution.':id==='oak-partner'?'Oak’s special lab partner. +20% HP, damage and EXP, including after evolution.':'Cleared a three-round Battle Tower set as a participating partner. Stays through evolution.'}"><span aria-hidden="true">${id==='starter'?'◆':'★'}</span> ${KEEPSAKE_RIBBONS[id]}</span>`).join('');}
function keepsakeOrigin(k){const verb={starter:'Met',caught:'Caught',quest:'Reward received',reward:'Reward received',legendary:'Befriended',legacy:'Met'}[k.method];return `${verb}: ${k.location||'Location not recorded'}${k.metLevel!==null?' · Lv.'+k.metLevel:''}`;}
function keepsakeInfo(k){return `<div class="keepsake-ribbons">${keepsakeRibbons(k)}</div><p>${escapeControlsText(keepsakeOrigin(k))}<br>${escapeControlsText(keepsakeDate(k.metAt))}</p>${k.evolutionPath.length>1?`<p class="keepsake-evolution">${k.evolutionPath.map(d=>escapeControlsText(BYDEX[d].name)).join(' → ')}</p>`:''}`;}
function renderScrapbook(){
 if(!keepsakesReady)return;normalizeKeepsakes(save);
 const owned=scrapbookScope==='team'?save.team:(save.pc||[]),pages=Math.max(1,Math.ceil(owned.length/6));scrapbookPage=Math.min(scrapbookPage,pages-1);
 $('scrapbookTeam').textContent=`TEAM · ${save.team.length}`;$('scrapbookPC').textContent=`BILL’S PC · ${save.pc?.length||0}`;
 $('scrapbookTeam').setAttribute('aria-pressed',String(scrapbookScope==='team'));$('scrapbookPC').setAttribute('aria-pressed',String(scrapbookScope==='pc'));
 $('scrapbookPages').textContent=`PAGE ${scrapbookPage+1} / ${pages}`;$('scrapbookPrevious').disabled=scrapbookPage===0;$('scrapbookNext').disabled=scrapbookPage===pages-1;
 $('scrapbookGrid').innerHTML=owned.slice(scrapbookPage*6,scrapbookPage*6+6).map(d=>{
   const e=save.collection[d],k=e.keepsake;return `<article class="scrapbook-card"><div class="scrapbook-profile"><canvas width="96" height="96" data-scrapbook-art="${d}" aria-hidden="true"></canvas><div><h4>${escapeControlsText(pokemonName(d))}</h4><span>#${String(d).padStart(3,'0')} ${escapeControlsText(BYDEX[d].name)} · Lv.${e.level}</span>${save.buddy===d?'<b class="scrapbook-active">ACTIVE PARTNER</b>':''}</div></div>${keepsakeInfo(k)}<button data-scrapbook-view="${d}">VIEW & NICKNAME</button></article>`;
 }).join('')||`<p class="scrapbook-empty">${scrapbookScope==='team'?'Choose a starter to begin your scrapbook.':'No Pokémon in Bill’s PC yet.'}</p>`;
 $('scrapbookGrid').querySelectorAll('[data-scrapbook-art]').forEach(c=>drawPortrait(c,BYDEX[+c.dataset.scrapbookArt],false));
 $('scrapbookGrid').querySelectorAll('[data-scrapbook-view]').forEach(b=>b.onclick=()=>{scrapbookReturnDex=+b.dataset.scrapbookView;openDexDetail(scrapbookReturnDex);});
}
function renderKeepsakeDetail(dex){
 if(!ownsKeepsake(dex))return;normalizeKeepsakes(save);const k=save.collection[dex].keepsake;
 $('dexDetailTitle').textContent=`${k.nickname?k.nickname+' · ':''}No.${dexPad(dex)} ${BYDEX[dex].name.toUpperCase()}`;
 let card=$('pokemonKeepsakeDetail');if(!card){card=document.createElement('div');card.id='pokemonKeepsakeDetail';card.className='dex-info-card full';$('dexDetailBody').querySelector('.dex-info-grid').prepend(card);}
 card.innerHTML=`<h3>Partner keepsakes</h3>${keepsakeInfo(k)}`;
}
function openNicknameEditor(dex){
 if(!ownsKeepsake(dex)||practiceSession||save.bossTest||gameOver)return false;
 normalizeKeepsakes(save);requestAutoPause();clearHeldInput();
 nicknameDraft={dex,original:save.collection[dex].keepsake.nickname,lower:false,focus:$('pokemonNickname')||document.activeElement};
 $('nicknameSpecies').textContent=`#${String(dex).padStart(3,'0')} ${BYDEX[dex].name.toUpperCase()}`;
 $('nicknameInput').value=nicknameDraft.original;$('nicknameStatus').textContent='';updateNicknameDraft();drawPortrait($('nicknamePortrait'),BYDEX[dex],false);
 $('nicknameKeys').querySelectorAll('button').forEach(b=>b.textContent=b.dataset.nicknameKey);
 $('nicknameCase').textContent='LOWERCASE';setModal('nicknameModal',true);resetMenuFocus($('nicknameModal'));return true;
}
function updateNicknameDraft(){
 const input=$('nicknameInput');input.value=input.value.replace(/[^A-Za-z0-9 .!'-]/g,'').slice(0,12);$('nicknameCount').textContent=`${input.value.length} / 12`;
 $('nicknamePreview').textContent=input.value.trim()||BYDEX[nicknameDraft.dex].name;
}
function nicknameKey(key){
 if(!nicknameDraft)return;
 const input=$('nicknameInput');
 if(key==='case'){nicknameDraft.lower=!nicknameDraft.lower;$('nicknameKeys').querySelectorAll('button').forEach(b=>b.textContent=nicknameDraft.lower?b.dataset.nicknameKey.toLowerCase():b.dataset.nicknameKey);$('nicknameCase').textContent=nicknameDraft.lower?'UPPERCASE':'LOWERCASE';return;}
 input.value=key==='clear'?'':key==='delete'?input.value.slice(0,-1):(input.value+(key==='space'?' ':nicknameDraft.lower?key.toLowerCase():key)).slice(0,12);updateNicknameDraft();$('nicknameStatus').textContent='';
}
function closeNicknameEditor(){
 const focus=nicknameDraft?.focus;nicknameDraft=null;setModal('nicknameModal',false);clearHeldInput();resetMenuFocus(menuRoot());if(focus?.isConnected)focusMenuElement(focus,menuRoot());
}
function saveNickname(){
 const draft=nicknameDraft;if(!draft||!ownsKeepsake(draft.dex)||practiceSession||save.bossTest||gameOver)return false;
 updateNicknameDraft();const k=save.collection[draft.dex].keepsake,name=$('nicknameInput').value.trim(),previous=k.nickname;
 // A trial has a return checkpoint; updating both prevents a nickname reverting on exit.
 const checkpoint=save.legendary?.active?.returnSnapshot?.save.collection?.[draft.dex],oldCheckpoint=checkpoint?clonePlain(checkpoint.keepsake):null;
 k.nickname=name;if(checkpoint)checkpoint.keepsake=clonePlain(k);
 if(!saveRunProgress('Nickname',true)){k.nickname=previous;if(checkpoint){if(oldCheckpoint)checkpoint.keepsake=oldCheckpoint;else delete checkpoint.keepsake;}$('nicknameStatus').textContent='Could not save. Your previous name is unchanged. Free storage or resolve Save Backups recovery, then try again.';return false;}
 renderTeam();renderBadges();renderDex();refreshKeepsakePcNames();collectionApply('pc');if(isShown('fieldMenuModal'))renderFieldMenu();renderKeepsakeDetail(draft.dex);closeNicknameEditor();return true;
}
const keepsakeDetailBase=openDexDetail;
openDexDetail=function(dex){keepsakeDetailBase(dex);if(!ownsKeepsake(dex))return;renderKeepsakeDetail(+dex);const button=document.createElement('button');button.id='pokemonNickname';button.className='dex-detail-action';button.textContent='NICKNAME';button.disabled=!!practiceSession||!!save.bossTest||gameOver;button.title=button.disabled?'Nicknames can be edited in your active campaign.':'Choose a nickname with the controller keypad or keyboard.';button.onclick=()=>openNicknameEditor(+dex);$('dexDetailClose2').before(button);};
const keepsakeBadgeBase=renderBadges;
renderBadges=function(){keepsakeBadgeBase();renderScrapbook();};
const keepsakePcBase=renderBillsPC;
function refreshKeepsakePcNames(){for(const canvas of document.querySelectorAll('[data-pc-team-portrait],[data-pc-box-portrait]')){const d=+(canvas.dataset.pcTeamPortrait||canvas.dataset.pcBoxPortrait);const name=canvas.parentElement.querySelector('.pc-card-name');if(name)name.textContent=pokemonIdentityLabel(d)+(save.buddy===d?' ★':'');}}
renderBillsPC=function(){keepsakePcBase();refreshKeepsakePcNames();};
const keepsakeCloseDetailBase=closeDexDetail;
closeDexDetail=function(){keepsakeCloseDetailBase();if(scrapbookReturnDex!==null){const d=scrapbookReturnDex;scrapbookReturnDex=null;resetMenuFocus(menuRoot());focusMenuElement($('scrapbookGrid').querySelector(`[data-scrapbook-view="${d}"]`),menuRoot());}};
const keepsakeBackBase=menuBack;
menuBack=function(){if(menuRoot()?.id==='nicknameModal'){closeNicknameEditor();return;}keepsakeBackBase();};
const keepsakePauseBase=pauseDialogOpen;
pauseDialogOpen=function(){return isShown('nicknameModal')||keepsakePauseBase();};
const keepsakeClearBase=clearControlsScreens;
clearControlsScreens=function(){nicknameDraft=null;scrapbookReturnDex=null;scrapbookScope='team';scrapbookPage=0;setModal('nicknameModal',false);keepsakeClearBase();};
const keepsakeNavigateBase=navigateMenu;
navigateMenu=function(direction){
 if(menuRoot()?.id==='nicknameModal'&&['up','down'].includes(direction)){
   const keys=[...$('nicknameKeys').children],rows=[[$('nicknameInput')],...Array.from({length:4},(_,i)=>keys.slice(i*10,i*10+10)),[...$('nicknameEditActions').children],[$('nicknameSave'),$('nicknameCancel')]];
   const row=rows.findIndex(r=>r.includes(document.activeElement));if(row>=0){const col=rows[row].indexOf(document.activeElement),next=(row+(direction==='up'?-1:1)+rows.length)%rows.length;focusMenuElement(rows[next][Math.min(rows[next].length-1,Math.floor((col+.5)/rows[row].length*rows[next].length))],$('nicknameModal'));return;}
 }
 keepsakeNavigateBase(direction);
};
function initializeKeepsakes(){
 $('trainerCardSummary').insertAdjacentHTML('afterend',`<section id="teamScrapbook" aria-labelledby="scrapbookTitle"><header><div><span class="scrapbook-eyebrow">YOUR JOURNEY, ONE PARTNER AT A TIME</span><h3 id="scrapbookTitle">TEAM SCRAPBOOK</h3></div><div class="scrapbook-tabs"><button id="scrapbookTeam" aria-pressed="true">TEAM</button><button id="scrapbookPC" aria-pressed="false">BILL’S PC</button></div></header><div id="scrapbookGrid"></div><footer><button id="scrapbookPrevious">PREVIOUS</button><span id="scrapbookPages"></span><button id="scrapbookNext">NEXT</button></footer></section>`);
 document.body.insertAdjacentHTML('beforeend',`<div id="nicknameModal" class="controls-modal" role="dialog" aria-modal="true" aria-labelledby="nicknameTitle" aria-hidden="true"><div class="controls-card nickname-card"><header><canvas id="nicknamePortrait" width="96" height="96" aria-hidden="true"></canvas><div><span id="nicknameSpecies"></span><h2 id="nicknameTitle">A NAME OF THEIR OWN</h2><p id="nicknamePreview"></p></div></header><label class="nickname-label" for="nicknameInput">NICKNAME <span id="nicknameCount"></span></label><input id="nicknameInput" type="text" maxlength="12" autocomplete="off" spellcheck="false" aria-describedby="nicknameHelp"><p id="nicknameHelp">Up to 12 letters, numbers or . ! ' - · Leave blank to use the species name.</p><div id="nicknameKeys">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!'-".split('').map((k,i)=>`<button data-nickname-key="${escapeControlsText(k)}" ${i===0?'data-nav-default':''}>${escapeControlsText(k)}</button>`).join('')}</div><div id="nicknameEditActions"><button data-nickname-edit="space">SPACE</button><button data-nickname-edit="delete">DELETE</button><button data-nickname-edit="clear">CLEAR</button><button data-nickname-edit="case" id="nicknameCase">LOWERCASE</button></div><p id="nicknameStatus" role="status" aria-live="polite"></p><div class="nickname-final-actions"><button id="nicknameSave">SAVE NICKNAME</button><button id="nicknameCancel">CANCEL</button></div><p class="nickname-hint">D-PAD: choose a key · A: type / select · B: cancel<br>Keyboard typing is also supported. Changes save only when you choose Save.</p></div></div>`);
 navModalIds.splice(navModalIds.indexOf('dexDetailModal'),0,'nicknameModal');
 $('nicknameInput').addEventListener('input',updateNicknameDraft);
 $('nicknameKeys').querySelectorAll('button').forEach(b=>b.onclick=()=>nicknameKey(b.dataset.nicknameKey));$('nicknameEditActions').querySelectorAll('button').forEach(b=>b.onclick=()=>nicknameKey(b.dataset.nicknameEdit));
 $('nicknameSave').onclick=saveNickname;$('nicknameCancel').onclick=closeNicknameEditor;
 for(const [id,scope] of [['scrapbookTeam','team'],['scrapbookPC','pc']])$(id).onclick=()=>{scrapbookScope=scope;scrapbookPage=0;renderScrapbook();};
 for(const [id,dir] of [['scrapbookPrevious',-1],['scrapbookNext',1]])$(id).onclick=()=>{scrapbookPage+=dir;renderScrapbook();repairMenuFocus($('badgePanel'));};
 keepsakesReady=true;renderBadges();
}
