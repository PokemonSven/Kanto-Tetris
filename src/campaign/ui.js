// One owner for visible town actions. All input sources activate the same buttons.
function initializeCampaignUI(){
 for(const id of ['townContinueBtn','townSkipBtn','townChallengeBtn','townCenterBtn']){const old=$(id);if(old)old.replaceWith(old.cloneNode(true));}
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('#townContinueBtn,#townSkipBtn,#townChallengeBtn,#townCenterBtn,#gymIntroBtn,#trainingGymBtn');
   if(!button||button.disabled||button.hidden||!button.getClientRects().length||gameOutsidePlayView())return;
   if(button.id==='trainingGymBtn'){
     if(!isAdventureMode()&&!isGymBattle()&&save.trainingMode?.campaignTraining){
       event.preventDefault();event.stopImmediatePropagation();const index=save.trainingMode.returnTownIndex;
       save.trainingMode=null;flyRouteOverride=null;showTownStop(index);persist();
     }
     return;
   }
   const root=menuRoot(),expected=button.id==='gymIntroBtn'?'gymIntroModal':'townModal';if(root?.id!==expected)return;
   if(button.id==='gymIntroBtn'){event.preventDefault();event.stopImmediatePropagation();beginGymFight();return;}
   const stop=save.townStop;if(!stop?.active)return;
   const actions=stop.chainTown
     ?{townContinueBtn:()=>routeChainContinueFromTownCursor(stop.chainCursor),townSkipBtn:()=>routeChainTrainFromTownCursor(stop.chainCursor),townChallengeBtn:()=>routeChainChallengeTownGym(),townCenterBtn:()=>routeChainHealTown()}
     :{townContinueBtn:()=>continueFromCurrentTown(),townSkipBtn:()=>isAdventureMode()?startLocalTownTrainingFromButton():campaignRogueTraining(stop.gymIndex),townChallengeBtn:()=>challengeTownGym(),townCenterBtn:()=>townHealAndChallenge()};
   event.preventDefault();event.stopImmediatePropagation();
   if(button.id!=='townCenterBtn'){autoPauseRequested=false;clearHeldInput();last=performance.now();}
   actions[button.id]();
 },true);
}
