// Build 1.7.4: one portable file, preview before import, and one retained recovery copy.
let backupCandidate=null,backupPreviewKind=null,backupReadToken=0;
const saveFailures=new Map();
function reportSave(channel,ok,message){
 if(ok)saveFailures.delete(channel);else saveFailures.set(channel,message);
 const el=$("portableSaveStatus");if(!el)return;
 const failed=saveFailures.size>0,text=failed?[...saveFailures.values()][0]:message;
 el.dataset.state=failed?"failed":ok?"saved":"ready";el.textContent=text;el.title=`${text} • ${new Date().toLocaleTimeString()}`;
}
function storePreference(key,value,label){
 if(portabilityBusy)return false;
 try{if(portabilityStorageLocked)throw new Error("Recovery required");portableWriteValue(key,JSON.stringify(value));reportSave(key,true,`${label} saved`);return true}
 catch{reportSave(key,false,`${label} save failed — check browser storage`);return false}
}
function portablePrefs(){return {controls:{...controls},movement:{...movementSettings},audio:{music:musicEnabled,sfx:sfxEnabled,soundtrack:{...soundtrackSettings}},comfort:{...comfortSettings},spriteCrops:clonePlain(userSpriteCrops),leaderCrops:clonePlain(userLeaderCrops)}}
function portableStoredRun(raw,mode){
 if(raw===null)return null;let run;
 try{run=JSON.parse(raw)}catch{throw new Error(`${mode}: existing save is unreadable. Restore a recovery copy before exporting.`)}
 // Old native saves used the same snapshot version before mode fields were added.
 if(run.mode===undefined)run.mode=mode;
 if(run.adventureDifficulty===undefined)run.adventureDifficulty="normal";
 return run;
}
function portabilityTransitionBusy(){if(isRocketBattle()&&rocketScene?.pending)return false;return isGymTransition()||gymVictoryClickthroughActive||["productionCredits","eeveeChoiceModal","gymIntroModal"].some(isShown)||!!(save?.starter&&!isGymBattle()&&save.encounterDefeated)}
function capturePortableBackup(includeLive=true){
 backupAssert(!practiceSession,"Leave Practice before exporting saves.");
 backupAssert(!portabilityTransitionBusy(),"Finish the current battle transition before making a backup.");
 const data={adventures:ADVENTURE_SLOT_KEYS.map(key=>portableStoredRun(localStorage.getItem(key),'adventure')),rogue:portableStoredRun(localStorage.getItem(RUN_SAVE_KEY),"rogue"),pokedex:[...metaDex].sort((a,b)=>a-b),preferences:portablePrefs(),rogueRecords:readRogueRecords()};
 if(includeLive&&save?.starter&&!save.bossTest&&!gameOver){if(isAdventureMode())data.adventures[activeAdventureSlot-1]=runSnapshot();else data.rogue=runSnapshot();}
 const backup={format:BACKUP_FORMAT,version:BACKUP_VERSION,build:"1.7.4",exportedAt:new Date().toISOString(),data};
 validateBackup(backup);backupAssert(new Blob([JSON.stringify(backup,null,2)]).size<=BACKUP_MAX_BYTES,"Backup exceeds the 2 MB limit.");return backup;
}
function backupToStorage(backup){
 const d=validateBackup(backup).data,p=d.preferences;
 const adventures=backup.version===1?[d.adventure]:d.adventures;
 return Object.fromEntries([
   ...ADVENTURE_SLOT_KEYS.map((key,i)=>[key,backup.version===1&&i>0?localStorage.getItem(key):adventures[i]===null?null:JSON.stringify(adventures[i])]),
   [RUN_SAVE_KEY,d.rogue===null?null:JSON.stringify(d.rogue)],
   [DEX_KEY,JSON.stringify(d.pokedex)],[CONTROLS_KEY,JSON.stringify(p.controls)],
   [REPEAT_KEY,JSON.stringify(p.movement)],[AUDIO_PREF_KEY,JSON.stringify({...p.audio,comfort:normalizeComfort(p.comfort)})],
   [USER_SPRITE_CROPS_KEY,JSON.stringify(p.spriteCrops)],[USER_LEADER_CROPS_KEY,JSON.stringify(p.leaderCrops)],[ROGUE_RECORDS_KEY,JSON.stringify(d.rogueRecords||[])]
 ]);
}
function downloadBackupFile(backup,name){
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;a.hidden=true;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function exportPortableBackup(){
 try{
   const backup=capturePortableBackup();downloadBackupFile(backup,`Kanto-Tetris-backup-${backup.exportedAt.replace(/[:.]/g,"-")}.json`);
   $("backupMessage").textContent="Backup download requested. Keep the JSON file for importing on another browser or device.";
 }catch(error){$("backupMessage").textContent=error.message;reportSave("export",false,"Backup export failed");return false}
 reportSave("export",true,"Backup download requested");return true;
}
function snapshotDescription(run,mode){
 if(!run)return {title:mode==="adventure"?"Adventure":"Rogue",location:"Empty slot",badges:"0 / 8 badges",team:"No saved team",date:"No save",empty:true};
 const s=run.save,battle=s.gymBattle;let location="Kanto";
 if(s.tower?.active)location=`Battle Tower • Round ${s.tower.active.round+1}/3 • ${{prep:'Team preparation',battle:'In battle',recap:'Run recap'}[s.tower.active.stage]}`;
 else if(battle&&GYMS[battle.gymIndex])location=`${GYMS[battle.gymIndex].leader} battle • Pokémon ${battle.teamIndex+1}/${GYMS[battle.gymIndex].team.length}`;
 else if(s.townStop?.active)location=s.townStop.city||GYMS[s.townStop.gymIndex]?.city||"Town";
 else if(s.routeChain){const node=ROUTE_CHAIN_NODES[s.routeChain.cursor];location=node?.city||node?.route||"Kanto route";if(s.routeChain.mode==="training")location+=" • training"}
 else location=GYMS[Math.max(0,(run.gym||1)-1)]?.route||"Kanto route";
 return {title:mode==="adventure"?`Adventure • ${run.adventureDifficulty}`:"Rogue",location,badges:`${s.badges.length} / 8 badges${s.league?.next?` • Elite Four ${s.league.next}/4`:""}`,team:s.team.map(d=>`${d===s.buddy?"★ ":""}${BYDEX[d].name} Lv.${s.collection[String(d)].level}`).join(" · "),date:new Date(run.savedAt).toLocaleString(),empty:false};
}
function backupCardHTML(run,mode){
 const d=snapshotDescription(run,mode),esc=escapeControlsText;
 return `<article class="backup-card"><strong>${esc(d.title)}</strong><span>${esc(d.location)}</span><span>${esc(d.badges)}</span><span>${esc(d.team)}</span><small>${esc(d.date)}</small></article>`;
}
function backupAdventureCards(backup){
 const runs=backup.version===1?[backup.data.adventure]:backup.data.adventures;
 return runs.map((run,i)=>`<section><h3>ADVENTURE SLOT ${i+1}${run?' · '+escapeControlsText(normalizedTrainer(run.save.trainer).name):''}</h3>${backupCardHTML(run,'adventure')}</section>`).join('');
}
function refreshContinueCards(){
 const adventure=$('titleAdventureContinueBtn');if(adventure){adventure.hidden=true;adventure.style.display='none';}
 for(const [mode,id] of [["rogue","titleContinueBtn"]]){
   const button=$(id);if(!button)continue;
   try{
     const run=portableStoredRun(localStorage.getItem(activeRunSaveKey(mode)),mode);
     if(!run){button.style.display="none";button.disabled=true;continue}
     checkBackupTree(run);validateBackupRun(run,mode);const d=snapshotDescription(run,mode);
     button.style.display="block";button.disabled=false;
     button.innerHTML=`<b>CONTINUE ${mode==="adventure"?"ADVENTURE MODE":"ROGUE RUN"}</b><small>${escapeControlsText(d.location)} • ${escapeControlsText(d.badges)}</small><small>${escapeControlsText(d.team)}</small><small>${mode==="adventure"?escapeControlsText(run.adventureDifficulty.toUpperCase())+" • ":""}${escapeControlsText(d.date)}</small>`;
   }catch{button.style.display="block";button.disabled=true;button.textContent=`${mode.toUpperCase()} SAVE UNAVAILABLE — OPEN BACKUPS`}
 }
 if($("titleHelp"))$("titleHelp").textContent="D-PAD / ARROWS: CHOOSE • A / ENTER: SELECT • BACKUPS MOVE SAVES BETWEEN BROWSERS";
}
function refreshRecoveryControls(){
 try{const record=readRecoveryRecord();$("backupRecover").disabled=!record;$("backupRecover").textContent=record?`RESTORE PREVIOUS SAVES • ${new Date(record.createdAt).toLocaleString()}`:"NO RECOVERY COPY YET"}
 catch{$("backupRecover").disabled=true;$("backupMessage").textContent="Recovery copy is unreadable. Your existing slots have not been changed."}
}
function openBackupManager(){
 if(portabilityTransitionBusy())return;
 if(save?.starter)requestAutoPause();clearHeldInput();
 backupCandidate=null;backupPreviewKind=null;$("backupPreview").innerHTML="";$("backupApply").hidden=true;
 $("backupMessage").textContent=portabilityStartupMessage||"One JSON backup includes all three Adventures, Rogue, permanent Pokédex registrations, and global preferences. Version 2 imports replace all slots; empty slots in the file clear those slots. Legacy version 1 imports replace only Adventure Slot 1 and Rogue, keeping Slots 2 and 3.";
 setModal("backupModal",true);refreshRecoveryControls();resetMenuFocus($("backupModal"));
}
function closeBackupManager(){backupReadToken++;backupCandidate=null;backupPreviewKind=null;setModal("backupModal",false);if(save?.starter)enforceAutoPause()}
async function previewBackupFile(file){
 const token=++backupReadToken;backupCandidate=null;backupPreviewKind=null;$("backupApply").hidden=true;$("backupPreview").innerHTML="";
 if(!file)return;
 try{
   backupAssert(file.size>0&&file.size<=BACKUP_MAX_BYTES,"Choose a JSON backup no larger than 2 MB.");
   const text=await file.text();if(token!==backupReadToken||!isShown("backupModal"))return;
   const candidate=parseBackup(text);backupCandidate=candidate;backupPreviewKind="import";
   $("backupPreview").innerHTML=`<p>EXPORTED ${escapeControlsText(new Date(candidate.exportedAt).toLocaleString())} • BACKUP VERSION ${candidate.version}</p><div class="backup-cards">${backupAdventureCards(candidate)}${backupCardHTML(candidate.data.rogue,"rogue")}</div><p>${candidate.data.pokedex.length} permanent Pokédex registrations • Global controls, audio and display preferences included.</p>`;
   $("backupMessage").textContent=candidate.version===1?"Legacy file validated. Replaces Adventure Slot 1, Rogue, Pokédex and global preferences. Adventure Slots 2 and 3 stay unchanged. Your current saves will be retained for recovery.":"File validated. Review all three Adventures and Rogue. Import replaces every slot, Pokédex and global preferences. Your current saves will be retained for recovery.";
   $("backupApply").hidden=false;$("backupApply").textContent="IMPORT THIS BACKUP…";
 }catch(error){if(token===backupReadToken)$("backupMessage").textContent=`NOT IMPORTED: ${error.message}`}
}
function previewRecovery(){
 backupReadToken++;backupCandidate=null;backupPreviewKind=null;$("backupApply").hidden=true;
 try{
   const record=readRecoveryRecord();backupAssert(record,"There is no recovery copy yet.");
   backupCandidate=record;backupPreviewKind="recovery";
   let html=`<p>PREVIOUS SAVES RETAINED ${escapeControlsText(new Date(record.createdAt).toLocaleString())}</p><div class="backup-cards">`;
   for(const [key,mode,label] of [...ADVENTURE_SLOT_KEYS.map((k,i)=>[k,'adventure',`ADVENTURE SLOT ${i+1}`]),[RUN_SAVE_KEY,'rogue','ROGUE']]){
     try{const run=portableStoredRun(record.previous[key],mode);if(run){checkBackupTree(run);validateBackupRun(run,mode)}html+=`<section><h3>${label}${run&&mode==='adventure'?' · '+escapeControlsText(normalizedTrainer(run.save.trainer).name):''}</h3>${backupCardHTML(run,mode)}</section>`}
     catch{html+=`<article class="backup-card">${label}: original raw save retained; preview unavailable.</article>`}
   }
   $("backupPreview").innerHTML=html+'</div>';
   $("backupMessage").textContent="Restore all saves from before the last import, Adventure replacement or deletion, including Pokédex and global preferences. This replaces the current state; export it first to keep it.";
   $("backupApply").hidden=false;$("backupApply").textContent="RESTORE PREVIOUS SAVES…";
 }catch(error){$("backupMessage").textContent=error.message}
}
function applyStoredPreferences(){
 comfortSettings={...COMFORT_DEFAULTS};soundtrackSettings=normalizeSoundtrack(null);
 controls=loadControls();movementSettings=loadMovementSettings();
 try{const audio=JSON.parse(localStorage.getItem(AUDIO_PREF_KEY)||"null");if(audio&&typeof audio.music==="boolean"&&typeof audio.sfx==="boolean"){musicEnabled=audio.music;sfxEnabled=audio.sfx;comfortSettings=normalizeComfort(audio.comfort);soundtrackSettings=normalizeSoundtrack(audio.soundtrack)}}catch{}
 applyComfort();
 userSpriteCrops=loadUserCropSet(USER_SPRITE_CROPS_KEY);userLeaderCrops=loadUserCropSet(USER_LEADER_CROPS_KEY);
 $("musicBtn").textContent=`MUSIC: ${musicEnabled?"ON":"OFF"}`;$("sfxBtn").textContent=`SFX: ${sfxEnabled?"ON":"OFF"}`;
 if(!musicEnabled)stopMusic();else classicalAutoSelectMusic();soundtrackLabel();
 if($("movementDelay"))$("movementDelay").value=movementSettings.delay;if($("movementRate"))$("movementRate").value=movementSettings.rate;
 renderControlPanels();
}
function finishPortableImport(){
 backupReadToken++;backupCandidate=null;backupPreviewKind=null;
 setModal("backupModal",false);setModal("fieldMenuModal",false);utilityReturn=null;fieldReturnTown=false;clearControlsScreens();
 activeAdventureSlot=1;pendingAdventureSlot=null;metaDex=loadMetaDex();applyStoredPreferences();studioIntroSeen=true;restartRun();refreshContinueCards();
 saveFailures.clear();portabilityStartupMessage="";reportSave("import",true,"Saves restored • choose Continue");
}
function commitBackupCandidate(){
 const candidate=backupCandidate,kind=backupPreviewKind;if(!candidate||portabilityBusy)return false;
 try{
   backupAssert(!portabilityTransitionBusy(),"Finish the current battle transition before importing.");
   if(kind==="import"){
     validateBackup(candidate);
     backupAssert(!portabilityStorageLocked,"Restore the pending recovery copy first.");
     // Capture the paused live run into its ordinary slot before retaining that slot.
     if(save?.starter&&!save.bossTest&&!gameOver)backupAssert(saveRunProgress("before import",true),"Could not retain the current run. Import cancelled.");
     portabilityBusy=true;portableTransaction(backupToStorage(candidate));
   }else if(kind==="recovery"){
     const record=readRecoveryRecord();backupAssert(record&&JSON.stringify(record)===JSON.stringify(candidate),"Recovery changed. Preview it again.");
     portabilityBusy=true;portabilityStorageLocked=true;
     record.state="pending";portableWriteValue(RECOVERY_KEY,JSON.stringify(record));
     restoreRawValues(record.previous);record.state="ready";portableWriteValue(RECOVERY_KEY,JSON.stringify(record));portabilityStorageLocked=false;
   }else return false;
   finishPortableImport();return true;
 }catch(error){$("backupMessage").textContent=error.message;reportSave("import",false,error.message);refreshRecoveryControls();return false}
 finally{portabilityBusy=false}
}
function requestBackupApply(){
 if(!backupCandidate)return;
 const message=backupPreviewKind==='recovery'?'Replace all three Adventures, Rogue, Pokédex and global preferences with the retained previous state?':backupCandidate.version===1?'Replace Adventure Slot 1, Rogue, Pokédex and global preferences? Slots 2 and 3 stay unchanged. A recovery copy of the current saves will be kept.':'Replace all three Adventures, Rogue, Pokédex and global preferences? Empty slots in the file clear those slots. A recovery copy of the current saves will be kept.';
 showControlsConfirm(backupPreviewKind==="recovery"?"RESTORE PREVIOUS SAVES?":"IMPORT THIS BACKUP?",message,commitBackupCandidate,backupPreviewKind==="recovery"?"RESTORE":"IMPORT");
}
function initializeSavePortability(){
 document.head.insertAdjacentHTML('beforeend',`<style>
 #portableSaveStatus{font:700 11px/1.4 monospace;padding:5px 9px;border:2px solid #315348;background:#e0f8cf;color:#173b28;max-width:100%;overflow-wrap:anywhere}#portableSaveStatus[data-state=failed]{background:#ffe0d6;color:#8b1e13;border-color:#8b1e13}
 .title-start small{display:block;font-size:10px;line-height:1.6;margin-top:5px;font-weight:normal}.title-card{max-height:94vh;overflow:auto}.backup-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.backup-card{border:2px solid #17334a;background:#e0f8cf;padding:12px;overflow-wrap:anywhere}.backup-card>*{display:block;font-size:12px;line-height:1.5;margin:5px 0}.backup-actions{display:flex;flex-wrap:wrap;gap:10px}.backup-actions [hidden]{display:none}#backupMessage{font-size:13px;line-height:1.6}#backupModal{z-index:105}#backupPreview p{font-size:12px}@media(max-width:600px){.backup-cards{grid-template-columns:1fr}}
 </style>`);
 $("musicBtn").parentElement.insertAdjacentHTML('afterend','<div id="portableSaveStatus" role="status" aria-live="polite" data-state="ready">SAVE READY</div>');
 document.body.insertAdjacentHTML('beforeend','<div id="backupModal" class="controls-modal" role="dialog" aria-modal="true" aria-labelledby="backupTitle" aria-hidden="true"><div class="controls-card"><h2 id="backupTitle">SAVE BACKUPS</h2><p id="backupMessage" role="status"></p><div class="backup-actions"><button id="backupExport">EXPORT ALL SAVES</button><button id="backupChoose">CHOOSE BACKUP FILE</button><button id="backupRecover">RESTORE PREVIOUS SAVES</button><button id="backupClose">BACK</button></div><input id="backupFile" type="file" accept=".json,application/json" hidden><div id="backupPreview"></div><div class="backup-actions"><button id="backupApply" hidden>IMPORT THIS BACKUP…</button></div></div></div>');
 $("backupExport").addEventListener("click",exportPortableBackup);$("backupChoose").addEventListener("click",()=>{$("backupFile").value="";$("backupFile").click()});
 $("backupFile").addEventListener("change",e=>previewBackupFile(e.target.files?.[0]));$("backupRecover").addEventListener("click",previewRecovery);$("backupClose").addEventListener("click",closeBackupManager);$("backupApply").addEventListener("click",requestBackupApply);
 for(const [parent,id] of [[document.querySelector('#titleScreen .title-actions'),"titleBackups"],[$("saveRunStatus").parentElement,"optionsBackups"],[$("pauseActions"),"pauseBackups"],[$("fieldBack").parentElement,"fieldBackups"]]){
   const b=document.createElement("button");b.id=id;b.textContent="SAVE BACKUPS";b.className=id==="titleBackups"?"title-start":"menu-return";b.addEventListener("click",openBackupManager);(parent||$("titleHelp").parentElement).appendChild(b);
 }
 for(const id of ['musicBtn','sfxBtn','trackBtn'])$(id)?.addEventListener('click',()=>queueMicrotask(saveComfort));
 applyStoredPreferences();refreshContinueCards();
 if(portabilityStartupMessage)reportSave("recovery",!portabilityStorageLocked,portabilityStartupMessage);
}

persistMetaDex=function(){if(practiceSession)return false;return storePreference(DEX_KEY,[...metaDex].sort((a,b)=>a-b),"Pokédex")};
persistControls=function(){return storePreference(CONTROLS_KEY,controls,"Controls")};
saveMovementSettings=function(){storePreference(REPEAT_KEY,movementSettings,"Movement preferences");movementRepeat={direction:0,next:0,down:false}};
saveUserCropSet=function(key,data){return storePreference(key,data||{},"Sprite preferences")};
const portabilityRenderSaveBase=renderSaveControls;
renderSaveControls=function(message){portabilityRenderSaveBase(message);refreshContinueCards()};

