// Run-owned identity. Duplicate catches still award EXP; they never rename a partner.
const KEEPSAKE_RIBBONS={starter:'STARTER RIBBON','oak-partner':'OAK’S PARTNER','tower-easy':'TOWER RIBBON · EASY','tower-normal':'TOWER RIBBON · NORMAL','tower-hard':'TOWER RIBBON · HARD'};
function ownsKeepsake(dex,run=save){return (run.team||[]).includes(+dex)||(run.pc||[]).includes(+dex);}
function pokemonName(dex,run=save){return ownsKeepsake(dex,run)&&run.collection?.[dex]?.keepsake?.nickname||BYDEX[dex]?.name||'POKÉMON';}
function pokemonIdentityLabel(dex){const name=pokemonName(dex),species=BYDEX[dex].name;return name===species?species:`${name} (${species})`;}
function newKeepsake(dex,entry,method='legacy',location=null){
 return {version:1,nickname:'',originDex:+dex,method,location,metAt:Number.isFinite(entry.obtained)?entry.obtained:null,metLevel:method==='legacy'?null:entry.level,ribbons:[],evolutionPath:[+dex]};
}
function normalizeKeepsakes(run,mode=runMode){
 const owned=[...new Set([...(run.team||[]),...(run.pc||[])])];
 // Old saves kept starter/evolution flags, but never recorded wild catch locations.
 for(const dex of owned){
   const e=run.collection?.[dex];if(!e)continue;
   if(!e.keepsake){
     let source=null,path=[];
     for(const [key,candidate] of Object.entries(run.collection||{})){
       if(!candidate.starter)continue;let d=+key,chain=[d];
       while(d!==dex&&run.collection[d]?.evolvedTo&&chain.length<4){d=+run.collection[d].evolvedTo;if(chain.includes(d))break;chain.push(d);}
       if(d===dex){source=candidate;path=chain;break;}
     }
     e.keepsake=newKeepsake(dex,e);
     if(source){e.keepsake.originDex=path[0];e.keepsake.evolutionPath=path;e.keepsake.method='starter';e.keepsake.location=mode==='adventure'?'PALLET TOWN · OAK’S LAB':'ROGUE EXPEDITION START';e.keepsake.metAt=Number.isFinite(source.obtained)?source.obtained:null;e.keepsake.ribbons.push('starter');}
   }
   if(e.oakPartner===true&&!e.keepsake.ribbons.includes('oak-partner'))e.keepsake.ribbons.push('oak-partner');
 }
 return run;
}
function recordPokemonKeepsake(dex,method,location=null,level=null){
 const e=save.collection[dex];if(!e)return;
 // A previously evolved-away species is a fresh catch, not the departed partner.
 const k=e.keepsake=newKeepsake(dex,e,method,location||save.townStop?.cityName||currentRoute());
 k.metAt=Date.now();if(level!==null)k.metLevel=level;
 if(method==='starter')k.ribbons.push('starter');
 if(e.oakPartner===true)k.ribbons.push('oak-partner');
 return k;
}
function transferPokemonKeepsake(fromDex,target,entry,targetEntry,sourceHadOak){
 const source=entry.keepsake||newKeepsake(fromDex,entry),resident=targetEntry.keepsake;
 // Special partners and starters retain their original identity when ordinary catches merge into them.
 const keepResident=!sourceHadOak&&resident&&(targetEntry.oakPartner===true||resident.ribbons.includes('starter')&&!source.ribbons.includes('starter'));
 const k=clonePlain(keepResident?resident:source);
 if(!keepResident){if(!k.nickname&&resident?.nickname)k.nickname=resident.nickname;if(k.evolutionPath[k.evolutionPath.length-1]!==target)k.evolutionPath.push(target);}
 k.ribbons=[...new Set([...k.ribbons,...(resident?.ribbons||[]),...source.ribbons])];
 if(targetEntry.oakPartner&&!k.ribbons.includes('oak-partner'))k.ribbons.push('oak-partner');
 targetEntry.keepsake=k;
 // Historical species data is retained by the engine, but identity travels only once.
 delete entry.keepsake;delete entry.starter;
}
function validateKeepsakeSave(run){
 for(const [dex,e] of Object.entries(run.collection||{})){
   if(e.keepsake===undefined)continue;const k=e.keepsake;
   backupAssert(backupObject(k)&&k.version===1&&typeof k.nickname==='string'&&/^[A-Za-z0-9 .!'-]{0,12}$/.test(k.nickname)&&k.nickname===k.nickname.trim()&&backupDex(k.originDex)&&['starter','caught','quest','reward','legendary','legacy'].includes(k.method)&&(k.location===null||typeof k.location==='string'&&k.location.length>0&&k.location.length<=100&&!/[\x00-\x1f<>]/.test(k.location))&&(k.metAt===null||backupInteger(k.metAt,0,8.64e15))&&(k.metLevel===null||backupInteger(k.metLevel,1,100))&&backupArray(k.ribbons,5,r=>Object.hasOwn(KEEPSAKE_RIBBONS,r))&&backupUnique(k.ribbons)&&backupArray(k.evolutionPath,4,backupDex)&&k.evolutionPath.length>0&&backupUnique(k.evolutionPath)&&k.evolutionPath[0]===k.originDex&&k.evolutionPath[k.evolutionPath.length-1]===+dex,'Invalid Pokémon keepsake.');
   backupAssert(!k.ribbons.includes('oak-partner')||e.oakPartner===true,'Oak’s Partner badge requires the lab partner.');
 }
}
