const BACKUP_MAX_BYTES=2097152;
function backupAssert(condition,message){if(!condition)throw new Error(message)}
function backupObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value)}
function backupNumber(value,min=0,max=1e12){return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max}
function backupInteger(value,min=0,max=1e12){return Number.isInteger(value)&&backupNumber(value,min,max)}
function backupDex(value){return backupInteger(value,1,150)&&!!BYDEX[value]}
function backupArray(value,max,test){return Array.isArray(value)&&value.length<=max&&value.every(test)}
function backupUnique(value){return new Set(value).size===value.length}
function checkBackupTree(value){
 let nodes=0;
 function visit(v,depth){
   backupAssert(++nodes<=100000&&depth<=24,"Backup is too complex.");
   if(v===null||typeof v==="boolean")return;
   if(typeof v==="string"){backupAssert(v.length<=4096&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),"Backup contains unsupported text.");return}
   if(typeof v==="number"){backupAssert(Number.isFinite(v)&&Math.abs(v)<=8.64e15,"Backup contains an invalid number.");return}
   backupAssert(typeof v==="object","Backup contains an unsupported value.");
   if(Array.isArray(v)){backupAssert(v.length<=10000,"Backup list is too large.");for(const x of v)visit(x,depth+1)}
   else for(const [key,x] of Object.entries(v)){backupAssert(!["__proto__","constructor","prototype"].includes(key)&&key.length<=120,"Backup contains an unsafe field.");visit(x,depth+1)}
 }
 visit(value,0);
}
function validateBackupPiece(p,label){
 if(p===null)return;
 backupAssert(backupObject(p)&&Object.hasOwn(ENERGY_THEME,p.type),`${label}: invalid piece type.`);
 backupAssert(backupArray(p.matrix,4,r=>backupArray(r,4,v=>v===0||v===1))&&p.matrix.length>=1&&p.matrix[0].length>=1&&p.matrix.every(r=>r.length===p.matrix[0].length)&&p.matrix.some(r=>r.includes(1)),`${label}: invalid piece matrix.`);
 backupAssert(backupInteger(p.x,-4,10)&&backupInteger(p.y,-4,20),`${label}: invalid piece position.`);
 if(p.baseType!==undefined&&p.baseType!==null)backupAssert(Object.hasOwn(SHAPES,p.baseType),`${label}: invalid base shape.`);
 if(p.specialRockfall!==undefined)backupAssert(typeof p.specialRockfall==="boolean",`${label}: invalid hazard flag.`);
}
function validateBackupRun(run,mode){
 if(run===null)return;
 const prefix=mode==="adventure"?"Adventure":"Rogue";
 backupAssert(backupObject(run)&&run.version===1&&run.mode===mode,`${prefix}: unsupported save version or mode.`);
 backupAssert(backupInteger(run.savedAt,1,8.64e15)&&['easy','normal','hard'].includes(run.adventureDifficulty),`${prefix}: invalid date or difficulty.`);
 const s=run.save;backupAssert(backupObject(s)&&backupDex(s.starter)&&!s.bossTest,`${prefix}: missing starter or test-only run.`);
 backupAssert(backupArray(s.team,6,backupDex)&&s.team.length>0&&backupUnique(s.team)&&s.team.includes(s.buddy),`${prefix}: invalid active team.`);
 backupAssert(backupArray(s.pc,150,backupDex)&&backupUnique(s.pc)&&!s.pc.some(d=>s.team.includes(d)),`${prefix}: invalid PC.`);
 backupAssert(backupArray(s.badges,8,n=>backupInteger(n,0,7))&&backupUnique(s.badges),`${prefix}: invalid badges.`);
 backupAssert(backupObject(s.collection)&&Object.keys(s.collection).length<=150,`${prefix}: invalid collection.`);
 for(const [dex,e] of Object.entries(s.collection)){
   backupAssert(String(+dex)===dex&&backupDex(+dex)&&backupObject(e),`${prefix}: invalid Pokémon record.`);
   backupAssert(backupInteger(e.level,1,100)&&backupNumber(e.currentHP,0,100000),`${prefix}: invalid Pokémon level or HP.`);
   for(const key of ['xp','levelXP','moveCharge','catches','obtained'])if(e[key]!==undefined)backupAssert(backupNumber(e[key],0,key==='obtained'?8.64e15:1e12),`${prefix}: invalid Pokémon progress.`);
 }
 backupAssert([...s.team,...s.pc,s.starter].every(d=>Object.hasOwn(s.collection,String(d))),`${prefix}: team/PC Pokémon missing from collection.`);
 backupAssert(backupArray(s.items,MAX_ITEM_SLOTS,id=>Object.hasOwn(ITEMS,id))&&backupArray(s.svenPcItems,10000,id=>Object.hasOwn(ITEMS,id))&&backupNumber(s.money),`${prefix}: invalid inventory.`);
 backupAssert(backupObject(s.stats)&&Object.values(s.stats).every(v=>backupNumber(v)),`${prefix}: invalid statistics.`);
 for(const key of ['questActive','questDone'])backupAssert(backupArray(s[key],200,v=>typeof v==="string"),`${prefix}: invalid quests.`);
 backupAssert(backupObject(s.questProgress),`${prefix}: invalid quest progress.`);
 if(s.encounterDex!==null)backupAssert(backupDex(s.encounterDex),`${prefix}: invalid encounter.`);
 for(const key of ['encounterHP','encounterMaxHP','encounterTetrises','adventureRecoveryLines'])if(s[key]!==undefined)backupAssert(backupNumber(s[key]),`${prefix}: invalid encounter progress.`);
 for(const key of ['townStop','trainingMode','routeChain','league','gymBattle'])if(s[key]!==undefined&&s[key]!==null)backupAssert(backupObject(s[key]),`${prefix}: invalid ${key}.`);
 if(s.gymBattle){backupAssert(backupInteger(s.gymBattle.gymIndex,0,GYMS.length-1)&&backupInteger(s.gymBattle.teamIndex,0,GYMS[s.gymBattle.gymIndex].team.length-1),`${prefix}: invalid boss progress.`);}
 if(s.routeChain){backupAssert(backupInteger(s.routeChain.cursor,0,ROUTE_CHAIN_NODES.length-1),`${prefix}: invalid route.`);if(s.routeChain.visitedCursors!==undefined)backupAssert(backupArray(s.routeChain.visitedCursors,200,n=>backupInteger(n,0,ROUTE_CHAIN_NODES.length-1)),`${prefix}: invalid visited routes.`)}
 if(s.league){backupAssert(backupInteger(s.league.next,0,4)&&backupArray(s.league.hallOfFame,1000,backupObject),`${prefix}: invalid League progress.`)}
 if(s.townStop?.shopStock!==undefined)backupAssert(backupArray(s.townStop.shopStock,3,id=>Object.hasOwn(ITEMS,id)),`${prefix}: invalid shop.`);
 backupAssert(backupInteger(run.gym,1,12)&&backupNumber(run.gymLines)&&backupNumber(run.score)&&backupInteger(run.runLines),`${prefix}: invalid score/progress.`);
 backupAssert(backupArray(run.board,ROWS,row=>backupArray(row,COLS,v=>v===""||Object.hasOwn(ENERGY_THEME,v))&&row.length===COLS)&&run.board.length===ROWS,`${prefix}: invalid board.`);
 validateBackupPiece(run.current,prefix);validateBackupPiece(run.nextPiece,prefix);
 backupAssert(backupArray(run.bag,7,t=>Object.hasOwn(SHAPES,t))&&backupArray(run.feed,12,t=>typeof t==="string"),`${prefix}: invalid piece queue or feed.`);
 if(run.combatState!==undefined){
   const c=run.combatState;
   backupAssert(backupObject(c)&&backupNumber(c.activeTime,0,1e12)&&backupObject(c.battle),`${prefix}: invalid combat clock.`);
   for(const key of ['lastClearAt','lastIdleStrikeAt','combo','lastClearGap','lastHitPower'])if(c.battle[key]!==undefined)backupAssert(backupNumber(c.battle[key],-1e12,1e12),`${prefix}: invalid combat timing.`);
   if(c.battle.b2bTetris!==undefined)backupAssert(typeof c.battle.b2bTetris==='boolean',`${prefix}: invalid combat chain.`);
 }
 validateExpansionSave(s);
 if(s.gymBattle?.gymIndex>=16)backupAssert(mode==='adventure','Rocket checkpoints require Adventure.');
 if(s.tower?.active)backupAssert(mode==='adventure'&&s.tower.active.difficulty===run.adventureDifficulty,'Tower checkpoint difficulty mismatch.');
 if(s.legendary?.active)backupAssert(s.legendary.active.returnSnapshot.mode===mode,'Legendary checkpoint mode mismatch.');
 if(s.tetris!==undefined){
   const t=s.tetris;backupAssert(backupObject(t)&&(t.hold===null||typeof t.hold==='string'&&Object.hasOwn(SHAPES,t.hold))&&typeof t.used==='boolean',`${prefix}: invalid Hold piece.`);
   backupAssert(backupNumber(t.lockElapsed,0,TETRIS_LOCK_MS)&&backupInteger(t.lockResets,0,TETRIS_LOCK_RESETS),`${prefix}: invalid lock timing.`);
 }
}
function validateBackupCrops(crops,maxId){
 backupAssert(backupObject(crops)&&Object.keys(crops).length<=150,"Invalid sprite preferences.");
 for(const [key,crop] of Object.entries(crops)){
   backupAssert(/^\d+$/.test(key)&&+key>=0&&+key<=maxId&&backupObject(crop),"Invalid sprite crop.");
   for(const field of ['x','y','w','h'])backupAssert(backupNumber(crop[field],field==='w'||field==='h'?1:0,20000),"Invalid sprite crop dimensions.");
   for(const field of ['refW','refH'])if(crop[field]!==undefined)backupAssert(backupNumber(crop[field],1,20000),"Invalid sprite reference size.");
 }
}
function validateBackup(value){
 checkBackupTree(value);
 backupAssert(backupObject(value)&&value.format===BACKUP_FORMAT,"This is not a Kanto Tetris backup.");
 backupAssert(value.version===1||value.version===BACKUP_VERSION,"Unsupported backup version. Use a compatible Kanto Tetris build.");
 backupAssert(typeof value.exportedAt==="string"&&/^\d{4}-\d{2}-\d{2}T/.test(value.exportedAt)&&Number.isFinite(Date.parse(value.exportedAt)),"Invalid backup date.");
 const data=value.data;backupAssert(backupObject(data),"Backup data is missing.");
 if(value.version===1)validateBackupRun(data.adventure,"adventure");
 else {backupAssert(Array.isArray(data.adventures)&&data.adventures.length===3,'Backup must contain exactly three Adventure slots.');for(const run of data.adventures)validateBackupRun(run,'adventure');}
 validateBackupRun(data.rogue,"rogue");
 if(data.rogueRecords!==undefined)validateRogueRecords(data.rogueRecords);
 backupAssert(backupArray(data.pokedex,150,backupDex)&&backupUnique(data.pokedex),"Invalid permanent Pokédex registrations.");
 const p=data.preferences;backupAssert(backupObject(p)&&backupObject(p.controls),"Invalid control preferences.");
 // 1.7.7 and earlier have no Hold binding. Allocate it without replacing a custom key.
 if(!Object.hasOwn(p.controls,'hold')&&Object.keys(p.controls).length===Object.keys(DEFAULT_CONTROLS).length-1){
   p.controls.hold=['ShiftLeft','ShiftRight','KeyH','KeyQ','KeyE','KeyF','KeyG','KeyJ','KeyK','KeyL','KeyU','KeyI'].find(key=>!Object.values(p.controls).includes(key));
 }
 backupAssert(Object.keys(p.controls).length===Object.keys(DEFAULT_CONTROLS).length,"Invalid control preferences.");
 // KeyboardEvent.code can contain device-specific keys; preserve those bindings.
 backupAssert(Object.keys(DEFAULT_CONTROLS).every(k=>typeof p.controls[k]==="string"&&/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(p.controls[k]))&&backupUnique(Object.values(p.controls)),"Invalid or duplicate key bindings.");
 backupAssert(backupObject(p.movement)&&REPEAT_DELAYS.includes(p.movement.delay)&&REPEAT_RATES.includes(p.movement.rate),"Invalid movement preferences.");
 backupAssert(backupObject(p.audio)&&typeof p.audio.music==="boolean"&&typeof p.audio.sfx==="boolean","Invalid audio preferences.");
 if(p.audio.soundtrack!==undefined)backupAssert(backupObject(p.audio.soundtrack)&&['auto','manual'].includes(p.audio.soundtrack.mode)&&FRLG_SOUNDTRACK.tracks.some(t=>t.number===p.audio.soundtrack.track),'Invalid soundtrack preference.');
 if(p.comfort!==undefined)validateComfort(p.comfort);
 validateBackupCrops(p.spriteCrops,150);validateBackupCrops(p.leaderCrops,11);
 return value;
}
function parseBackup(text){backupAssert(typeof text==="string"&&new Blob([text]).size<=BACKUP_MAX_BYTES,"Backup exceeds the 2 MB limit.");let value;try{value=JSON.parse(text)}catch{throw new Error("The file is not valid JSON. Choose a complete exported backup.")}return validateBackup(value)}

