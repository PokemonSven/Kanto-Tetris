// Runs before any saved state is read. A pending journal means a prior import
// did not finish; restore its exact previous values before normal autosaves start.
const BACKUP_FORMAT="kanto-tetris-backup",BACKUP_VERSION=2;
// Slot 1 keeps the original key: existing saves need no destructive migration.
const ADVENTURE_SLOT_KEYS=['tetrisCatchKanto150_adventureSave_v1','kanto_tetris_adventure_slot2_v1','kanto_tetris_adventure_slot3_v1'];
let activeAdventureSlot=1,pendingAdventureSlot=null;
function adventureSlotKey(slot=activeAdventureSlot){if(!Number.isInteger(slot)||slot<1||slot>3)throw Error('Invalid Adventure slot.');return ADVENTURE_SLOT_KEYS[slot-1];}
const ROGUE_RECORDS_KEY="kanto_tetris_rogue_records_v1";
const AUDIO_PREF_KEY="kanto_tetris_audio_v1";
const RECOVERY_KEY="kanto_tetris_import_recovery_v1";
const PORTABLE_KEYS=["tetrisCatchKanto150_adventureSave_v1",RUN_SAVE_KEY,DEX_KEY,CONTROLS_KEY,
 "kanto_tetris_movement_v1",AUDIO_PREF_KEY,"tetrisCatchKanto150_userSpriteCrops_v12_customPokemonSprites","tetrisCatchKanto150_userLeaderCrops_v1",ROGUE_RECORDS_KEY,...ADVENTURE_SLOT_KEYS.slice(1)];
let portabilityStorageLocked=false,portabilityStartupMessage="",portabilityBusy=false;
function portableStorageRead(){return Object.fromEntries(PORTABLE_KEYS.map(key=>[key,localStorage.getItem(key)]))}
function portableWriteValue(key,value){
 if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);
 if(localStorage.getItem(key)!==value)throw new Error("Browser storage did not retain the change.");
}
function portableRawValid(raw){
 return raw&&typeof raw==="object"&&!Array.isArray(raw)&&Object.keys(raw).length===PORTABLE_KEYS.length&&
 PORTABLE_KEYS.every(key=>Object.hasOwn(raw,key)&&(raw[key]===null||(typeof raw[key]==="string"&&raw[key].length<=2097152)));
}
function readRecoveryRecord(){
 const text=localStorage.getItem(RECOVERY_KEY);if(!text)return null;
 if(text.length>4194304)throw new Error("Recovery copy is too large.");
 const record=JSON.parse(text);
 const optional=[ROGUE_RECORDS_KEY,...ADVENTURE_SLOT_KEYS.slice(1)],raw=record?.previous;
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&Object.keys(raw).every(k=>PORTABLE_KEYS.includes(k))&&PORTABLE_KEYS.filter(k=>!optional.includes(k)).every(k=>Object.hasOwn(raw,k)))for(const key of optional)if(!Object.hasOwn(raw,key))raw[key]=null;
 if(record?.version!==1||!Number.isFinite(record.createdAt)||!['pending','ready'].includes(record.state)||!portableRawValid(record.previous))throw new Error("Recovery copy is invalid.");
 return record;
}
function restoreRawValues(raw){
 let failure=null;
 for(const key of PORTABLE_KEYS)try{portableWriteValue(key,raw[key])}catch(error){failure=error}
 if(failure)throw failure;
}
function recoverInterruptedImport(){
 try{
   const record=readRecoveryRecord();if(record?.state!=="pending")return;
   portabilityStorageLocked=true;restoreRawValues(record.previous);
   record.state="ready";portableWriteValue(RECOVERY_KEY,JSON.stringify(record));
   portabilityStorageLocked=false;portabilityStartupMessage="Interrupted import recovered. Previous saves restored.";
 }catch(error){portabilityStorageLocked=true;portabilityStartupMessage="Storage recovery needs attention. Autosaves are paused; open Backups to retry recovery.";}
}
recoverInterruptedImport();
function portableTransaction(next){
 if(portabilityStorageLocked)throw new Error("Restore the recovery copy before importing again.");
 if(!portableRawValid(next))throw new Error("Invalid storage transaction.");
 const previous=portableStorageRead(),record={version:1,createdAt:Date.now(),state:"pending",previous};
 // Failure here leaves all normal slots untouched.
 const journal=JSON.stringify(record);if(journal.length>4194304)throw Error('Recovery copy is too large. Export a backup before replacing saves.');
 portableWriteValue(RECOVERY_KEY,journal);
 portabilityStorageLocked=true;
 try{
   restoreRawValues(next);
   record.state="ready";portableWriteValue(RECOVERY_KEY,JSON.stringify(record));
   portabilityStorageLocked=false;
 }catch(error){
   try{restoreRawValues(previous);record.state="ready";portableWriteValue(RECOVERY_KEY,JSON.stringify(record));portabilityStorageLocked=false}
   catch{ /* The pending durable journal remains for the next startup/recovery attempt. */ }
   throw new Error(portabilityStorageLocked?"Import failed. Recovery is retained; autosaves are paused until recovery succeeds.":"Import failed. Previous saves were restored; nothing was imported.");
 }
}

