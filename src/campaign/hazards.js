// Owns normal/Elite hazard scheduling and mandatory piece delivery.
function updateGymLeaderSpecials(delta){
 if(isTowerBattle()){updateTowerHazards(delta);return;}
 if(isRocketBattle()){updateRocketHazards(delta);return;}
 if(isStoryBattle()){updateStoryHazards(delta);return;}
 if(isEliteBattle()){
 if(paused||gameOver||isGymTransition())return;
 const b=save.gymBattle,e=ELITE_FOUR[b.gymIndex-8];
 if(b.eliteVeil>0){b.eliteVeil=Math.max(0,b.eliteVeil-delta);if(!b.eliteVeil)drawNext();}
 if(b.eliteWarning>0){b.eliteWarning=Math.max(0,b.eliteWarning-delta);if(!b.eliteWarning)leagueTriggerHazard();return;}
 b.specialTimer=(b.specialTimer||0)+delta;
 if(b.specialTimer>=e.interval-3000){b.specialTimer=0;b.eliteWarning=3000;flashMessage(`${e.hazard} IN 3 SECONDS`,e.effectText);}

 return;
 }
 if(paused||gameOver||!isGymBattle()||isGymTransition())return;
 const gb=save.gymBattle;
 if(isSabrinaBattle()&&sabrinaSpinActive()){
   tickSabrinaPsychicSpin(delta);
   return;
 }
 gb.specialTimer=(gb.specialTimer||0)+delta;
 if((gb.shockTimer||0)>0)gb.shockTimer=Math.max(0,(gb.shockTimer||0)-delta);
 if((gb.flameWarningTimer||0)>0){
   gb.flameWarningTimer=Math.max(0,(gb.flameWarningTimer||0)-delta);
   if(gb.flameWarningTimer===0&&isBlaineBattle())eruptBlaineFlameColumn();
 }
 if((gb.quakeWarningTimer||0)>0){
   gb.quakeWarningTimer=Math.max(0,(gb.quakeWarningTimer||0)-delta);
   if(gb.quakeWarningTimer===0&&isGiovanniBattle())triggerGiovanniEarthquake();
 }
 if(isBrockBattle()){
   while(gb.specialTimer>=BROCK_STONE_INTERVAL_MS){gb.specialTimer-=BROCK_STONE_INTERVAL_MS;queueBrockStoneDrop();}
 }else if(isMistyBattle()){
   while(gb.specialTimer>=MISTY_TIDE_INTERVAL_MS){gb.specialTimer-=MISTY_TIDE_INTERVAL_MS;applyMistyTide();}
 }else if(isSurgeBattle()){
   while(gb.specialTimer>=SURGE_SHOCK_INTERVAL_MS){gb.specialTimer-=SURGE_SHOCK_INTERVAL_MS;triggerSurgeShock();}
 }else if(isErikaBattle()){
   while(gb.specialTimer>=ERIKA_OVERGROWTH_INTERVAL_MS){gb.specialTimer-=ERIKA_OVERGROWTH_INTERVAL_MS;applyErikaOvergrowth();}
 }else if(isKogaBattle()){
   while(gb.specialTimer>=KOGA_SPIKE_INTERVAL_MS){gb.specialTimer-=KOGA_SPIKE_INTERVAL_MS;applyKogaPoisonSpikes();}
 }else if(isSabrinaBattle()){
   if(gb.specialTimer>=SABRINA_SPIN_INTERVAL_MS)triggerSabrinaPsychicSpin();
 }else if(isBlaineBattle()){
   while(gb.specialTimer>=BLAINE_FLAME_INTERVAL_MS){gb.specialTimer-=BLAINE_FLAME_INTERVAL_MS;if(!(gb.flameWarningTimer>0))startBlaineFlameWarning();}
 }else if(isGiovanniBattle()){
   while(gb.specialTimer>=GIOVANNI_QUAKE_INTERVAL_MS){gb.specialTimer-=GIOVANNI_QUAKE_INTERVAL_MS;if(!(gb.quakeWarningTimer>0))startGiovanniEarthquakeWarning();}
 }
}

function nextViewerHidden(){
 if(isTowerBattle())return save.gymBattle.eliteVeil>0;
 if(isRocketBattle())return save.gymBattle.eliteVeil>0;
 if(isEliteBattle())return save.gymBattle.gymIndex===10;return isSabrinaBattle()}

function pullPendingGymSpecialPiece(){
 if(isTowerBattle()){if(!(save.gymBattle.pendingHazards>0))return null;save.gymBattle.pendingHazards--;return {...makeBrockStonePiece(),type:towerActive().round===0?'X':'G'};}
 if(isRocketBattle()){if(!(save.gymBattle.pendingHazards>0))return null;save.gymBattle.pendingHazards--;return makeBrockStonePiece();}
 if(isEliteBattle()&&save.gymBattle.gymIndex===10){if(!(save.gymBattle.pendingHazards>0))return null;save.gymBattle.pendingHazards--;return {...makeBrockStonePiece(),type:"G"};}
 if(!isBrockBattle())return null;
 const gb=save.gymBattle;
 if(!gb?.pendingHazards)return null;
 gb.pendingHazards--;
 return makeBrockStonePiece();
}
