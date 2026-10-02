// Adventure profile selection and replacement. All gameplay writes use activeRunSaveKey().
function readAdventureSlot(slot){
 const raw=localStorage.getItem(adventureSlotKey(slot));if(raw===null)return {raw,run:null,error:null};
 try{const run=portableStoredRun(raw,'adventure');checkBackupTree(run);validateBackupRun(run,'adventure');return {raw,run,error:null};}
 catch(error){return {raw,run:null,error:error.message};}
}
function renderAdventureSlots(message=''){
 const esc=escapeControlsText;
 $('adventureSlotsStatus').textContent=message||(portabilityStorageLocked?'Storage recovery is pending. Open Save Backups to restore the retained saves before continuing.':'Each journey has its own trainer, difficulty, team, quests and story. Pokédex registrations and audio/controller preferences are shared.');
 $('adventureSlotCards').innerHTML=[1,2,3].map(slot=>{
   let entry;try{entry=readAdventureSlot(slot);}catch{return `<article class="adventure-slot"><h3>SLOT ${slot}</h3><p>Storage unavailable. Open Save Backups for recovery.</p></article>`;}
   const {run,raw,error}=entry;
   if(raw===null)return `<article class="adventure-slot slot-empty"><span class="slot-number">SLOT ${slot}</span><div class="slot-empty-mark" aria-hidden="true">+</div><h3>A NEW JOURNEY</h3><p>Meet Professor Oak, choose a partner and make this Adventure your own.</p><button id="adventureNew${slot}" data-slot-new="${slot}" class="slot-primary">START NEW ADVENTURE</button></article>`;
   if(error)return `<article class="adventure-slot"><span class="slot-number">SLOT ${slot}</span><h3>SAVE UNAVAILABLE</h3><p>${esc(error)}</p><p>Your original save is retained. Check Save Backups before replacing it.</p><button id="adventureReplace${slot}" data-slot-new="${slot}">REPLACE THIS SLOT…</button></article>`;
   const d=snapshotDescription(run,'adventure'),trainer=normalizedTrainer(run.save.trainer);
   return `<article class="adventure-slot"><span class="slot-number">SLOT ${slot} · ${esc(run.adventureDifficulty.toUpperCase())}</span><h3>${esc(trainer.name)}</h3><p class="slot-location">${esc(d.location)}</p><p class="slot-badges">${esc(d.badges)}</p><div class="slot-team" aria-label="${esc(d.team)}">${run.save.team.map(dex=>{const entry=run.save.collection[dex];return `<div><canvas width="96" height="96" data-slot-mon="${dex}" aria-label="${esc(BYDEX[dex].name)}"></canvas><span>${esc(entry.keepsake?.nickname||BYDEX[dex].name)}</span><small>LV. ${entry.level}</small></div>`;}).join('')}</div><p class="slot-date">LAST PLAYED<br>${esc(d.date)}</p><div class="slot-actions"><button id="adventureContinue${slot}" data-slot-continue="${slot}" class="slot-primary">CONTINUE</button><button id="adventureReplace${slot}" data-slot-new="${slot}">NEW ADVENTURE…</button></div></article>`;
 }).join('');
 for(const c of $('adventureSlotCards').querySelectorAll('[data-slot-mon]'))drawPortrait(c,BYDEX[+c.dataset.slotMon],false);
 if(portabilityStorageLocked||portabilityBusy)for(const b of $('adventureSlotCards').querySelectorAll('button'))b.disabled=true;
 const first=$('adventureSlotCards').querySelector('[data-slot-continue]')||$('adventureSlotCards').querySelector('button');if(first)first.setAttribute('data-nav-default','');
}
function retainAdventureBeforeSelection(){
 if(save?.starter&&!save.bossTest&&!gameOver&&!saveRunProgress('Before choosing an Adventure',true))return false;
 return true;
}
function openAdventureSlots(retainLive=true){
 if(practiceSession)return;
 // Never change the active destination merely by browsing a card or an Oak draft.
 const retained=!retainLive||retainAdventureBeforeSelection();
 clearControlsScreens();pendingAdventureSlot=null;setModal('titleScreen',false);hideOverlay();paused=true;clearHeldInput();
 setModal('adventureSlotsModal',true);renderAdventureSlots(retained?'':'The current run could not be saved. Free browser storage and retry before switching profiles.');
 for(const b of $('adventureSlotCards').querySelectorAll('button'))b.disabled=!retained||portabilityStorageLocked||portabilityBusy;
 resetMenuFocus($('adventureSlotsModal'));
}
function closeAdventureSlots(){pendingAdventureSlot=null;setModal('adventureSlotsModal',false);showTitleScreen();resetMenuFocus($('titleScreen'));}
function beginAdventureSlot(slot){
 if(practiceSession||portabilityBusy||portabilityStorageLocked){renderAdventureSlots('Storage recovery is pending. Open Save Backups before starting a new Adventure.');return false;}
 adventureSlotKey(slot);if(!retainAdventureBeforeSelection()){renderAdventureSlots('Save failed. Your current run is still open; retry after freeing storage.');return false;}
 pendingAdventureSlot=slot;setModal('adventureSlotsModal',false);startOakIntroduction();return true;
}
function continueAdventureSlot(slot){
 if(practiceSession||portabilityBusy||portabilityStorageLocked)return false;
 const entry=readAdventureSlot(slot);if(!entry.run){renderAdventureSlots('This slot cannot be continued. Open Save Backups to recover it.');return false;}
 if(!retainAdventureBeforeSelection()){renderAdventureSlots('The current run could not be saved. Switching was cancelled.');return false;}
 const previous=activeAdventureSlot;activeAdventureSlot=slot;pendingAdventureSlot=null;
 if(loadRunProgress('Adventure slots','adventure')){setModal('adventureSlotsModal',false);return true;}
 activeAdventureSlot=previous;setModal('adventureSlotsModal',true);renderAdventureSlots('This save could not be loaded. No other slot was changed.');return false;
}
function commitAdventureSlot(draft,dex,confirmed=false,expectedRaw=undefined){
 const slot=pendingAdventureSlot||activeAdventureSlot,key=adventureSlotKey(slot);
 let existing;try{existing=localStorage.getItem(key);}catch{ $('oakDialogue').textContent='Storage is unavailable. Your saved Adventures are unchanged. Please retry.';return false;}
 if(existing!==null&&!confirmed){
   draft.lastAt=null;let name='saved trainer';try{name=normalizedTrainer(JSON.parse(existing).save?.trainer).name;}catch{}
   showControlsConfirm(`REPLACE ADVENTURE SLOT ${slot}?`,`Replace ${name} with ${draft.name} and ${BYDEX[dex].name}? Only Slot ${slot} will change. Other Adventures and Rogue stay safe; the previous saves will be kept in Save Backups → Restore Previous Saves.`,()=>commitAdventureSlot(draft,dex,true,existing),'REPLACE & BEGIN');return false;
 }
 const previousSlot=activeAdventureSlot,previousDex=new Set(metaDex);
 try{
   backupAssert(!portabilityStorageLocked&&!portabilityBusy,'Storage recovery is pending. Open Save Backups before starting.');
   backupAssert(expectedRaw===undefined||existing===expectedRaw,'This slot changed. Review it again before replacing it.');
   portabilityBusy=true;buildOakAdventure(draft,dex);const snapshot=runSnapshot();validateBackupRun(snapshot,'adventure');portabilityBusy=false;
   const next=portableStorageRead();backupAssert(next[key]===existing,'This slot changed. Review it again before replacing it.');next[key]=JSON.stringify(snapshot);next[DEX_KEY]=JSON.stringify([...metaDex].sort((a,b)=>a-b));
   portableTransaction(next);activeAdventureSlot=slot;pendingAdventureSlot=null;
   reportSave('run',true,`Adventure Slot ${slot} saved • ${normalizedTrainer(save.trainer).name}`);renderSaveControls();renderTeam();renderBadges();return true;
 }catch(error){
   // A failed first save must not leave a new live run able to overwrite an old slot.
   portabilityBusy=true;metaDex=previousDex;activeAdventureSlot=previousSlot;restartRun();portabilityBusy=false;
   pendingAdventureSlot=slot;oakIntro=draft;setModal('titleScreen',false);setModal('oakIntroModal',true);renderOakIntro();
   $('oakDialogue').textContent=`Adventure not started: ${error.message} Your previous save is retained. Retry choosing a starter, or return to Save Slots.`;
   reportSave('run',false,'Adventure save failed — previous saves retained');return false;
 }finally{portabilityBusy=false;}
}
function deleteAdventureSlot(){
 if(practiceSession||portabilityBusy||portabilityStorageLocked)return false;
 try{
   const next=portableStorageRead();next[adventureSlotKey()]=null;portableTransaction(next);
   clearControlsScreens();studioIntroSeen=true;restartRun();openAdventureSlots();reportSave('run',true,'Adventure slot deleted • previous saves available in Backups');return true;
 }catch(error){renderSaveControls(`DELETE FAILED: ${error.message}`);reportSave('run',false,'Delete failed — save retained');return false;}
}
function initializeAdventureSlots(){
 document.body.insertAdjacentHTML('beforeend',`<div id="adventureSlotsModal" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="adventureSlotsTitle"><div class="adventure-slots-card"><header><div><small>PROFESSOR OAK’S TRAINER FILES</small><h2 id="adventureSlotsTitle">CHOOSE YOUR ADVENTURE</h2></div><button id="adventureSlotsBack">BACK • B / ESC</button></header><p id="adventureSlotsStatus" role="status"></p><div id="adventureSlotCards"></div><footer><span>D-PAD / ARROWS · CHOOSE &nbsp; A / ENTER · SELECT</span><button id="adventureSlotsBackups">SAVE BACKUPS</button></footer></div></div>`);
 navModalIds.splice(navModalIds.indexOf('titleScreen'),0,'adventureSlotsModal');
 $('adventureSlotCards').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.slotContinue)continueAdventureSlot(+b.dataset.slotContinue);if(b.dataset.slotNew)beginAdventureSlot(+b.dataset.slotNew);};
 $('adventureSlotsBack').onclick=closeAdventureSlots;$('adventureSlotsBackups').onclick=openBackupManager;
 $('titleAdventureNewBtn').textContent='ADVENTURE MODE';$('titleAdventureContinueBtn').hidden=true;
 const startBase=startTitleGame;startTitleGame=function(mode='auto',confirmed=false){if(mode==='adventure-new'||mode==='adventure-continue')return openAdventureSlots();return startBase(mode,confirmed);};
 const backBase=menuBack;menuBack=function(){if(menuRoot()?.id==='adventureSlotsModal')return closeAdventureSlots();return backBase();};
 const pauseBase=pauseDialogOpen;pauseDialogOpen=function(){return isShown('adventureSlotsModal')||pauseBase();};
 const clearBase=clearControlsScreens;clearControlsScreens=function(){setModal('adventureSlotsModal',false);clearBase();};
 const titleBase=showTitleScreen;showTitleScreen=function(){pendingAdventureSlot=null;setModal('adventureSlotsModal',false);titleBase();};
 const deleteBase=deleteRunSave;deleteRunSave=function(){return isAdventureMode()?deleteAdventureSlot():deleteBase();};
 const renderBase=renderSaveControls;renderSaveControls=function(message){renderBase(message);if(isAdventureMode()){
   const label=`SLOT ${activeAdventureSlot} · ${normalizedTrainer(save?.trainer).name}`;
   $('saveRunBtn').textContent=`SAVE ADVENTURE ${label}`;$('loadRunBtn').textContent=`LOAD ADVENTURE ${label}`;$('deleteRunSaveBtn').textContent=`DELETE ADVENTURE ${label}`;
 }refreshContinueCards();};
 const closeBackupBase=closeBackupManager;closeBackupManager=function(){closeBackupBase();if(isShown('adventureSlotsModal')){renderAdventureSlots();resetMenuFocus($('adventureSlotsModal'));}};
 // The original listener captured the old close function; use the current slot-aware path.
 $('backupClose').removeEventListener('click',closeBackupBase);$('backupClose').addEventListener('click',closeBackupManager);
 renderSaveControls();
}
