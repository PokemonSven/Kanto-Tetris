// Adventure identity is saved with the run. Flavor answers never affect mechanics.
function normalizedTrainer(raw){
 const name=typeof raw?.name==='string'?raw.name.replace(/[^A-Za-z0-9 '-]/g,'').trim().slice(0,12):'';
 return {version:1,name:name||'RED',favorite:BYDEX[raw?.favorite]?+raw.favorite:null,outing:['forest','sea','mountain','city'].includes(raw?.outing)?raw.outing:null,expMode:raw?.expMode==='active'?'active':'team',introComplete:raw?.introComplete===true,tutorialSeen:raw?.tutorialSeen===true};
}
function trainerProfile(){return save.trainer||(save.trainer=normalizedTrainer(null));}
function adventureTeamEXP(){return !isAdventureMode()||trainerProfile().expMode!=='active';}
function oakPartnerBonus(dex){return [25,26].includes(+dex)&&save?.collection?.[String(dex)]?.oakPartner===true?1.2:1;}
function awardTetrisTrainingXP(){
 if(practiceSession||Math.max(0,save.adventureRecoveryLines||0)>0||!save.team?.length)return 0;
 const bike=v10XpMultiplier(),active=save.buddy;let recipients=0,total=0;
 for(const dex of save.team.slice()){
   if(!adventureTeamEXP()&&dex!==active)continue;
   const entry=ensurePokemonProgress(save.collection[String(dex)],5,dex);if(!entry)continue;
   const result=pewterFixApplyXPToDex(dex,Math.max(4,Math.round(xpToNextLevel(entry.level)*.09*bike)),'TETRIS TRAINING',dex===active);
   if(result.appliedXP){recipients++;total+=result.appliedXP;}
 }
 if(recipients){feed.unshift(`TETRIS ${adventureTeamEXP()?'TEAM SHARE':'ACTIVE TRAINING'} • ${recipients} POKÉMON GAINED TRAINING XP`);feed=feed.slice(0,12);}
 return total;
}
function validateTrainerSave(s){
 if(s.trainer!==undefined){const t=s.trainer;backupAssert(backupObject(t)&&t.version===1&&typeof t.name==='string'&&/^[A-Za-z0-9 '-]{1,12}$/.test(t.name)&&t.name.trim().length>0&&(t.favorite===null||backupDex(t.favorite))&&(t.outing===null||['forest','sea','mountain','city'].includes(t.outing))&&['team','active'].includes(t.expMode)&&typeof t.introComplete==='boolean'&&typeof t.tutorialSeen==='boolean','Invalid trainer profile.');}
 let gifts=0;
 for(const [dex,e] of Object.entries(s.collection||{}))if(e.oakPartner!==undefined){backupAssert(typeof e.oakPartner==='boolean'&&[25,26].includes(+dex),'Invalid Oak partner.');if(e.oakPartner)gifts++;}
 backupAssert(gifts<=1,'Only one Oak partner can be owned.');
}
