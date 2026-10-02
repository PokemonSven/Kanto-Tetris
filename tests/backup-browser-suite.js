// Injected only by the loopback QA server, in the real game closure.
musicEnabled=false;sfxEnabled=false;stopMusic();
document.body.insertAdjacentHTML('beforeend','<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run backup regression suite</button><button id="qaPreview">Show sample import preview</button><pre id="qaResults">Ready</pre></aside>');
const qaResults=[];let qaFixture=null;
function qaAssert(ok,msg){if(!ok)throw new Error(msg)}
function qaClone(v){return JSON.parse(JSON.stringify(v))}
function qaStorage(){return JSON.stringify(portableStorageRead())}
function qaReset(){
 Object.defineProperty(document,'hidden',{configurable:true,value:false});gameWindowFocused=true;autoPauseRequested=false;portabilityStorageLocked=false;portabilityBusy=false;saveFailures.clear();
 clearControlsScreens();document.querySelectorAll('.show,.leader-clickthrough,.badge-clickthrough').forEach(el=>el.classList.remove('show','leader-clickthrough','badge-clickthrough'));
 backupCandidate=null;backupPreviewKind=null;localStorage.removeItem(RECOVERY_KEY);save=freshRun();studioIntroSeen=true;restartRun();
}
function qaMakeFixture(){
 qaReset();document.querySelector('[data-elite-test="2"]').click();beginGymFight();save.bossTest=false;
 const adventure=runSnapshot();const rogue=qaClone(adventure);rogue.mode='rogue';rogue.adventureDifficulty='normal';rogue.save.gymBattle=null;rogue.save.badges=[0,1];rogue.save.league={next:0,cleared:false,hallOfFame:[]};rogue.save.routeChain={cursor:1,mode:'story',lines:3,visitedCursors:[0,1]};rogue.score=999;
 const data={adventure,rogue,pokedex:[1,6,7,9,25,94],preferences:portablePrefs(),rogueRecords:[]};data.preferences.audio={music:false,sfx:false};
 return {format:BACKUP_FORMAT,version:1,build:'1.7.3',exportedAt:new Date().toISOString(),data};
}
function qaInstall(backup){restoreRawValues(backupToStorage(backup));metaDex=loadMetaDex();applyStoredPreferences();qaReset();metaDex=loadMetaDex();applyStoredPreferences()}
async function qaTest(name,fn){try{qaReset();await fn();qaResults.push({name,result:'PASS'})}catch(error){qaResults.push({name,result:'FAIL',error:error.message})}$("qaResults").textContent=JSON.stringify(qaResults,null,2);await new Promise(resolve=>setTimeout(resolve,0))}
function qaReject(mutator){const x=qaClone(qaFixture);mutator(x);let failed=false;try{validateBackup(x)}catch{failed=true}qaAssert(failed,'Invalid backup accepted')}
$('qaRun').addEventListener('click',async()=>{
 $('qaRun').disabled=true;const before=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
 try{qaFixture=qaMakeFixture();validateBackup(qaFixture)}catch(error){$('qaResults').textContent='Fixture invalid: '+error.message;$('qaRun').disabled=false;return}
 await qaTest('One versioned file round-trips both modes, Pokédex, and all preferences',()=>{qaInstall(qaFixture);const file=capturePortableBackup();const parsed=parseBackup(JSON.stringify(file)),expected=qaClone(qaFixture);expected.data.preferences.audio.soundtrack={mode:'auto',track:3};qaAssert(parsed.version===2&&JSON.stringify(parsed.data.adventures[0])===JSON.stringify(qaFixture.data.adventure)&&['rogue','pokedex','preferences','rogueRecords'].every(k=>JSON.stringify(parsed.data[k])===JSON.stringify(expected.data[k])),'Round-trip data changed')});
 await qaTest('Export includes current paused progress without replacing the other mode',()=>{
   qaInstall(qaFixture);loadRunProgress('QA','adventure');beginGymFight();score=4321;openBackupManager();const b=capturePortableBackup();qaAssert(b.data.adventures[0].score===4321&&b.data.rogue.score===999,'Live progress or other mode lost');
 });
 await qaTest('Boss Test export preserves ordinary save slots',()=>{qaInstall(qaFixture);document.querySelector('[data-elite-test="2"]').click();beginGymFight();qaAssert(capturePortableBackup().data.adventures[0].save.bossTest===false,'Export replaced normal save with test')});
 await qaTest('Reject wrong format, future versions, missing mode, and invalid date',()=>{qaReject(x=>x.format='other');qaReject(x=>x.version=99);qaReject(x=>delete x.data.rogue);qaReject(x=>x.exportedAt='not a date');qaReject(x=>x.data.rogue.mode='adventure')});
 await qaTest('Reject malformed JSON and oversized files',()=>{for(const text of ['{"format":',' '.repeat(BACKUP_MAX_BYTES+1)]){let failed=false;try{parseBackup(text)}catch{failed=true}qaAssert(failed,'Malformed/oversized JSON accepted')}});
 await qaTest('Reject unsafe keys and markup without changing storage',()=>{const before=qaStorage();const x=qaClone(qaFixture);x.data.rogue.save.questProgress=JSON.parse('{"__proto__":{"polluted":true}}');let failed=false;try{validateBackup(x)}catch{failed=true}qaAssert(failed,'Prototype key accepted');qaReject(x=>x.data.rogue.feed=['<img src=x onerror=alert(1)>']);qaAssert(before===qaStorage()&&!({}).polluted,'Validation changed storage/prototype')});
 await qaTest('Reject broken Pokémon, team, badges, inventory, board and battle state',()=>{
   qaReject(x=>x.data.adventure.save.team=[999]);qaReject(x=>delete x.data.adventure.save.collection['9']);qaReject(x=>x.data.rogue.save.badges=[0,0]);qaReject(x=>x.data.rogue.save.items=['invalid']);qaReject(x=>x.data.rogue.board=[]);qaReject(x=>x.data.adventure.save.gymBattle.teamIndex=99);qaReject(x=>x.data.adventure.current.matrix=[[]]);
 });
 await qaTest('Reject invalid preferences and duplicate bindings',()=>{qaReject(x=>x.data.preferences.controls.left=x.data.preferences.controls.right);qaReject(x=>x.data.preferences.movement.rate=0);qaReject(x=>x.data.preferences.audio.music='yes');qaReject(x=>x.data.preferences.spriteCrops={'7':{x:0,y:0,w:-1,h:20}})});
 await qaTest('Preview exposes both modes, badges, teams and dates without mutation',async()=>{
   qaInstall(qaFixture);const before=qaStorage();openBackupManager();await previewBackupFile(new File([JSON.stringify(qaFixture)],'backup.json',{type:'application/json'}));const text=$('backupPreview').textContent;qaAssert(text.includes('Adventure')&&text.includes('Rogue')&&text.includes('8 / 8')&&text.includes('Blastoise')&&text.includes('EXPORTED'),'Preview metadata missing');qaAssert(before===qaStorage()&&!$('backupApply').hidden,'Preview mutated saves or no import action');
 });
 await qaTest('Cancel import confirmation preserves the current saves',async()=>{
   qaInstall(qaFixture);const before=qaStorage();openBackupManager();await previewBackupFile(new File([JSON.stringify(qaFixture)],'backup.json'));requestBackupApply();qaAssert(document.activeElement.id==='controlsConfirmCancel','Cancel is not default');cancelControlsConfirm();qaAssert(before===qaStorage()&&isShown('backupModal'),'Cancellation changed saves');
 });
 await qaTest('Import applies both slots/preferences, retains previous state and returns to title',()=>{
   qaInstall(qaFixture);const before=qaStorage(),next=qaClone(qaFixture);next.data.rogue.score=123456;next.data.preferences.movement.rate=35;next.data.pokedex=[25];openBackupManager();backupCandidate=next;backupPreviewKind='import';qaAssert(commitBackupCandidate(),'Import failed: '+$('backupMessage').textContent);qaAssert(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)).score===123456&&movementSettings.rate===35&&metaDex.size===1,'Imported state not applied');qaAssert(JSON.stringify(readRecoveryRecord().previous)===before&&isShown('titleScreen')&&!save.starter,'Previous state or title reset missing');
 });
 await qaTest('Recovery restores exact prior slots, Pokédex and preferences',()=>{
   qaInstall(qaFixture);const before=qaStorage();const next=qaClone(qaFixture);next.data.rogue=null;portableTransaction(backupToStorage(next));openBackupManager();previewRecovery();qaAssert(commitBackupCandidate(),'Recovery failed');qaAssert(qaStorage()===before&&isShown('titleScreen'),'Recovery changed old data');
 });
 await qaTest('Empty backup slots clear those slots intentionally and are recoverable',()=>{
   qaInstall(qaFixture);const x=qaClone(qaFixture);x.data.adventure=null;x.data.rogue=null;x.data.pokedex=[];portableTransaction(backupToStorage(x));qaAssert(localStorage.getItem(RUN_SAVE_KEY)===null&&localStorage.getItem(ADVENTURE_RUN_SAVE_KEY)===null,'Empty slots not cleared');qaAssert(readRecoveryRecord().previous[RUN_SAVE_KEY]!==null,'Cleared slots lack recovery');
 });
 await qaTest('Full storage while retaining recovery leaves all original slots untouched',()=>{
   qaInstall(qaFixture);const before=qaStorage(),original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RECOVERY_KEY)throw new Error('QA quota');return original.call(this,k,v)};let failed=false;
   try{portableTransaction(backupToStorage(qaFixture))}catch{failed=true}finally{Storage.prototype.setItem=original}
   qaAssert(failed&&qaStorage()===before&&!portabilityStorageLocked,'Quota failure changed saved slots');
 });
 await qaTest('Mid-import failure rolls back every slot and retains recovery',()=>{
   qaInstall(qaFixture);const before=qaStorage(),original=Storage.prototype.setItem;let count=0;Storage.prototype.setItem=function(k,v){if(++count===4)throw new Error('QA mid-write failure');return original.call(this,k,v)};
   const next=qaClone(qaFixture);next.data.rogue.score=8888;let failed=false;try{portableTransaction(backupToStorage(next))}catch{failed=true}finally{Storage.prototype.setItem=original}
   qaAssert(failed&&qaStorage()===before&&!portabilityStorageLocked&&readRecoveryRecord().state==='ready','Rollback was incomplete');
 });
 await qaTest('Interrupted import recovers before normal reads and autosaves',()=>{
   qaInstall(qaFixture);const previous=portableStorageRead();localStorage.setItem(RECOVERY_KEY,JSON.stringify({version:1,createdAt:Date.now(),state:'pending',previous}));localStorage.removeItem(RUN_SAVE_KEY);localStorage.setItem(DEX_KEY,'[]');recoverInterruptedImport();qaAssert(JSON.stringify(portableStorageRead())===JSON.stringify(previous)&&!portabilityStorageLocked&&readRecoveryRecord().state==='ready','Startup recovery failed');
 });
 await qaTest('Persistent rollback failure locks autosave until recovery succeeds',()=>{
   qaInstall(qaFixture);const before=qaStorage(),original=Storage.prototype.setItem;let broken=false;Storage.prototype.setItem=function(k,v){if(k===DEX_KEY)broken=true;if(broken)throw new Error('QA persistent failure');return original.call(this,k,v)};
   try{portableTransaction(backupToStorage(qaFixture))}catch{}finally{Storage.prototype.setItem=original}
   qaAssert(portabilityStorageLocked&&!saveRunProgress('QA',true),'Autosave not locked');recoverInterruptedImport();qaAssert(!portabilityStorageLocked&&qaStorage()===before,'Recovery retry did not restore slots');
 });
 await qaTest('Run save success/failure is visible and clears after a successful retry',()=>{
   qaInstall(qaFixture);loadRunProgress('QA','adventure');beginGymFight();saveRunProgress('QA',true);qaAssert($('portableSaveStatus').dataset.state==='saved','No success indicator');const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('QA denied')};try{qaAssert(!saveRunProgress('QA',true),'Failed save reported success');qaAssert($('portableSaveStatus').dataset.state==='failed','No failure indicator')}finally{Storage.prototype.setItem=original}saveRunProgress('QA',true);qaAssert($('portableSaveStatus').dataset.state==='saved','Retry did not clear failure');
 });
 await qaTest('Continue cards show locations, badges, team and timestamps',()=>{
   qaInstall(qaFixture);renderSaveControls();openAdventureSlots();const a=$('adventureContinue1').closest('article').textContent,r=$('titleContinueBtn').textContent;qaAssert(a.includes('AGATHA')&&a.includes('8 / 8')&&a.includes('Blastoise')&&a.includes(new Date(qaFixture.data.adventure.savedAt).toLocaleString()),'Adventure card incomplete');qaAssert(r.includes('2 / 8')&&r.includes('CONTINUE ROGUE'),'Rogue card incomplete');
 });
 await qaTest('Corrupt native slot is unavailable rather than an unsafe Continue button',()=>{
   localStorage.setItem(RUN_SAVE_KEY,'{"broken":true}');refreshContinueCards();qaAssert($('titleContinueBtn').disabled&&$('titleContinueBtn').textContent.includes('UNAVAILABLE'),'Corrupt slot offered Continue');
 });
 await qaTest('Closing a preview ignores a delayed file read',async()=>{
   openBackupManager();let resolve;const read=previewBackupFile({size:200,text:()=>new Promise(r=>resolve=r)});closeBackupManager();resolve(JSON.stringify(qaFixture));await read;qaAssert(!backupCandidate&&!isShown('backupModal'),'Late file read revived cancelled preview');
 });
 await qaTest('Backups modal freezes combat and is reachable through controller menu handling',()=>{
   qaInstall(qaFixture);loadRunProgress('QA','adventure');beginGymFight();openBackupManager();const boardBefore=JSON.stringify(board),hp=save.collection[String(save.buddy)].currentHP;qaNow+=300000;loop(qaNow);qaAssert(paused&&!v25BattleActive()&&JSON.stringify(board)===boardBefore&&save.collection[String(save.buddy)].currentHP===hp,'Backup modal advanced combat');qaAssert(menuRoot().id==='backupModal','Controller menu root ignored backup');menuBack();qaAssert(!isShown('backupModal')&&paused,'Controller Back resumed gameplay');
 });
 await qaTest('Export action creates a named JSON download containing both modes',async()=>{
   if(window.KantoHost){
     qaInstall(qaFixture);openBackupManager();const original=downloadBackupFile;let captured;
     downloadBackupFile=(backup,name)=>{captured={backup,name}};
     try{qaAssert(exportPortableBackup(),'Export action failed')}finally{downloadBackupFile=original}
     qaAssert(captured.name.startsWith('Kanto-Tetris-backup-')&&captured.name.endsWith('.json'),'Native filename incorrect');
     const parsed=parseBackup(JSON.stringify(captured.backup));qaAssert(parsed.data.adventures[0]&&parsed.data.rogue,'Native export missing a mode');return;
   }
   qaInstall(qaFixture);openBackupManager();const create=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;let blob,filename;
   URL.createObjectURL=function(value){blob=value;return create.call(this,value)};HTMLAnchorElement.prototype.click=function(){filename=this.download};
   try{qaAssert(exportPortableBackup(),'Export action failed')}finally{URL.createObjectURL=create;HTMLAnchorElement.prototype.click=click}
   qaAssert(filename.startsWith('Kanto-Tetris-backup-')&&filename.endsWith('.json')&&blob.type==='application/json','Download metadata incorrect');const b=parseBackup(await blob.text());qaAssert(b.data.adventures[0]&&b.data.rogue,'Downloaded JSON missing a mode');
 });
 await qaTest('Native file-input change produces a validated preview',async()=>{
   openBackupManager();const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(qaFixture)],'qa.json',{type:'application/json'}));$('backupFile').files=transfer.files;$('backupFile').dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,20));qaAssert(backupCandidate?.version===1&&!$('backupApply').hidden,'File input was not connected to preview');
 });
 await qaTest('Import into empty storage restores non-default bindings, crops, audio and movement',()=>{
   const x=qaClone(qaFixture);x.data.preferences.controls.left='KeyA';x.data.preferences.controls.right='KeyD';x.data.preferences.movement={delay:100,rate:35};x.data.preferences.spriteCrops={'25':{x:10,y:20,w:30,h:40}};x.data.preferences.leaderCrops={'0':{x:2,y:3,w:50,h:60,refW:1000,refH:1000}};
   for(const key of PORTABLE_KEYS)localStorage.removeItem(key);openBackupManager();backupCandidate=x;backupPreviewKind='import';qaAssert(commitBackupCandidate(),'Empty-origin import failed');qaAssert(PORTABLE_KEYS.every(k=>portableStorageRead()[k]===backupToStorage(x)[k])&&controls.left==='KeyA'&&movementSettings.rate===35&&!musicEnabled&&userSpriteCrops['25'].x===10,'Full import differed from export');
 });
 await qaTest('Current live run is retained for recovery before import',()=>{
   qaInstall(qaFixture);loadRunProgress('QA','adventure');beginGymFight();score=8765;openBackupManager();backupCandidate=qaClone(qaFixture);backupPreviewKind='import';qaAssert(commitBackupCandidate(),'Live import failed');qaAssert(JSON.parse(readRecoveryRecord().previous[ADVENTURE_RUN_SAVE_KEY]).score===8765,'Recovery missed paused live progress');
 });
 for(const key of Object.keys(localStorage))if(!before.has(key))localStorage.removeItem(key);for(const [key,value] of before)localStorage.setItem(key,value);
 portabilityStorageLocked=false;portabilityBusy=false;
 $('qaResults').textContent=JSON.stringify({passed:qaResults.filter(x=>x.result==='PASS').length,total:qaResults.length,tests:qaResults},null,2);$('qaRun').textContent='Backup tests complete';
});
$('qaPreview').addEventListener('click',async()=>{if(!qaFixture)qaFixture=qaMakeFixture();qaReset();openBackupManager();await previewBackupFile(new File([JSON.stringify(qaFixture)],'sample.json'));$('qaPanel').hidden=true;});
