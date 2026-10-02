// An explicit, visible town/battle action is also permission to resume after focus loss.
// Without this, the auto-pause latch survives Brock's badge sequence and re-pauses Route 3.
function initializeVictoryUI(){
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('#townContinueBtn,#townSkipBtn,#townChallengeBtn,#townCenterBtn,#gymIntroBtn');
   if(!button||button.disabled||button.hidden||!button.getClientRects().length||gameOutsidePlayView())return;
   const root=menuRoot(),expected=button.id==='gymIntroBtn'?'gymIntroModal':'townModal';
   if(root?.id!==expected)return;
   if(button.id!=='townCenterBtn'){autoPauseRequested=false;clearHeldInput();last=performance.now();}
   // Older Android WebViews run legacy target listeners before later target-capture
   // listeners. Handle route-chain actions on the ancestor first so a legacy
   // town callback cannot clear townStop before the current route callback runs.
   if(save?.townStop?.chainTown){
     const actions={townContinueBtn:()=>routeChainContinueFromTownCursor(save.townStop.chainCursor),townSkipBtn:()=>routeChainTrainFromTownCursor(save.townStop.chainCursor),townChallengeBtn:()=>routeChainChallengeTownGym(),townCenterBtn:()=>routeChainHealTown()};
     const action=actions[button.id];
     if(action){event.preventDefault();event.stopImmediatePropagation();action();}
   }
 },true);
}
