// Test-only harness, injected into the real game closure by serve-controls-review.cjs.
// It drives native KeyboardEvents and navigator.getGamepads snapshots; no production test hooks.
musicEnabled=false;sfxEnabled=false;stopMusic();
let qaPad=null;
Object.defineProperty(navigator,"getGamepads",{configurable:true,value:()=>qaPad?[qaPad]:[]});
document.body.insertAdjacentHTML("beforeend",'<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run controls regression suite</button><pre id="qaResults">Ready</pre></aside>');
const qaResults=[];
function qaAssert(ok,message){if(!ok)throw new Error(message)}
function qaFrame(ms=1){qaNow+=ms;pollGamepad(qaNow)}
function qaConnect(){qaPad={index:0,id:"QA Standard Controller",mapping:"standard",connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};qaFrame()}
function qaButtons(indices=[]){qaPad.buttons.forEach((b,i)=>{b.pressed=indices.includes(i);b.value=Number(b.pressed)});qaFrame()}
function qaTap(...indices){qaButtons(indices);qaButtons([])}
function qaKey(code,repeat=false){window.dispatchEvent(new KeyboardEvent("keydown",{code,key:code.startsWith("Key")?code.slice(3).toLowerCase():code==="Space"?" ":code,bubbles:true,cancelable:true,repeat}))}
function qaUp(code){window.dispatchEvent(new KeyboardEvent("keyup",{code,bubbles:true}))}
function qaPress(code){qaKey(code);qaUp(code);qaFrame()}
function qaSelect(selector){
 // Navigate with D-pad through focusable DOM order; no direct activation of target.
 const target=document.querySelector(selector);qaAssert(target&&!target.disabled,"Target unavailable: "+selector);
 const original=document.activeElement,queue=[{el:original,path:[]}],visited=new Set();let route=null;
 // Discover a shortest spatial focus path, then replay it using controller snapshots.
 while(queue.length){const next=queue.shift();if(next.el===target){route=next.path;break}if(visited.has(next.el))continue;visited.add(next.el);
   for(const [dir,button] of [["up",12],["down",13],["left",14],["right",15]]){if(next.el.matches('select,input[type="range"]')&&["left","right"].includes(dir))continue;next.el.focus();navigateMenu(dir);const el=document.activeElement;if(!visited.has(el))queue.push({el,path:[...next.path,button]})}
 }
 original.focus();if(route)for(const button of route)qaTap(button);
 qaAssert(document.activeElement===target,"Controller cannot reach "+selector+"; focused "+document.activeElement.id);
 qaTap(0);
}
function qaSetup(){
 Object.defineProperty(document,"hidden",{configurable:true,value:false});gameWindowFocused=true;
 qaPad=null;padIdentity=null;padHeld={};padPrevious={};padBlocked.clear();keyboardPressed.clear();inputContext=undefined;
 clearControlsScreens();document.querySelectorAll(".show,.leader-clickthrough,.badge-clickthrough").forEach(el=>el.classList.remove("show","leader-clickthrough","badge-clickthrough"));
 controls={...DEFAULT_CONTROLS};movementSettings={delay:170,rate:78};$("movementDelay").value=170;$("movementRate").value=78;
 document.querySelector('[data-elite-test="2"]').click();beginGymFight();
 board=emptyBoard();current=piece("T");current.x=3;current.y=0;dropCounter=0;last=qaNow;
 qaFrame();qaAssert(!paused&&inputCanPlay(),"Agatha setup failed");
}
async function qaTest(name,fn){try{qaSetup();await fn();qaResults.push({name,result:"PASS"})}catch(e){qaResults.push({name,result:"FAIL",error:e.message})}$("qaResults").textContent=JSON.stringify(qaResults,null,2);await new Promise(resolve=>setTimeout(resolve,0))}
$('qaRun').addEventListener('click',async()=>{
 $('qaRun').disabled=true;
 const storageBefore=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
 await qaTest('Keyboard soft drop survives no-controller polling',()=>{qaKey("ArrowDown");const y=current.y;for(let i=0;i<20;i++)qaFrame();qaAssert(downHeld&&current.y===y,"Keyboard hold reset or repeated tap");qaUp("ArrowDown");qaAssert(!downHeld,"Keyboard release stuck")});
 await qaTest('Both input sources retain their own soft-drop hold',()=>{qaConnect();qaKey("ArrowDown");qaButtons([13]);qaUp("ArrowDown");qaAssert(downHeld,"Keyboard release cancelled pad");qaButtons([]);qaAssert(!downHeld,"Pad release stuck");qaKey("ArrowDown");qaFrame();qaAssert(downHeld,"Neutral controller cancelled keyboard");qaUp("ArrowDown")});
 await qaTest('Keyboard hard drop, pause, restart ignore repeated keydown',()=>{
   qaKey("Space");const state=JSON.stringify({board,current,score});for(let i=0;i<8;i++)qaKey("Space",true);qaAssert(JSON.stringify({board,current,score})===state,"Held Space locked multiple pieces");qaUp("Space");
   qaKey("KeyP");qaAssert(paused,"P did not pause");qaKey("KeyP",true);qaAssert(paused,"Repeated P resumed");qaUp("KeyP");qaPress("KeyP");qaAssert(!paused,"P release/repress did not resume");
   qaKey("KeyR");qaAssert(isShown("controlsConfirm"),"R did not prompt");qaKey("KeyR",true);qaAssert(isShown("controlsConfirm")&&save.bossTest,"Held R reset run");qaUp("KeyR");qaPress("Escape");qaAssert(save.bossTest,"Restart cancellation changed run");
 });
 await qaTest('Adjustable keyboard delay and repeat rate use game frames',()=>{
   movementSettings={delay:100,rate:35};qaKey("ArrowLeft");qaAssert(current.x===2,"Initial left did not move");qaFrame(99);qaAssert(current.x===2,"Repeated before delay");qaFrame(1);qaAssert(current.x===1,"Delay not applied");qaFrame(34);qaAssert(current.x===1,"Repeated before interval");qaFrame(1);qaAssert(current.x===0,"Repeat interval not applied");qaUp("ArrowLeft");
 });
 await qaTest('Opposite directions cancel and release restores remaining source',()=>{qaConnect();qaKey("ArrowLeft");qaButtons([15]);const x=current.x;qaFrame(500);qaAssert(current.x===x,"Opposing sources moved");qaUp("ArrowLeft");qaAssert(current.x===x+1,"Pad direction did not survive release")});
 await qaTest('CCW and CW are inverse for keyboard and controller',()=>{
   const matrix=JSON.stringify(current.matrix);qaPress("KeyZ");qaAssert(JSON.stringify(current.matrix)!==matrix,"Z did not rotate CCW");qaPress("ArrowUp");qaAssert(JSON.stringify(current.matrix)===matrix,"CW did not invert CCW");
   qaConnect();qaTap(2);qaTap(0);qaAssert(JSON.stringify(current.matrix)===matrix,"X/A rotation mismatch");qaTap(4);qaTap(5);qaAssert(JSON.stringify(current.matrix)===matrix,"LB/RB rotation mismatch");
 });
 await qaTest('Pad hard drop is one-shot across newly spawned pieces',()=>{qaConnect();qaButtons([1]);const state=JSON.stringify({board,current,score});qaFrame(1000);qaFrame(1000);qaAssert(JSON.stringify({board,current,score})===state,"Held B dropped multiple pieces")});
 await qaTest('Hold across pause/resume must be released; A does not rotate on resume',()=>{
   qaConnect();qaKey("ArrowDown");qaTap(9);qaAssert(paused&&!downHeld,"Pause did not release keyboard");qaKey("ArrowDown",true);const matrix=JSON.stringify(current.matrix);qaButtons([0]);qaAssert(!paused,"A did not resume");qaFrame(100);qaAssert(!downHeld&&JSON.stringify(current.matrix)===matrix,"Held input leaked through resume");qaButtons([]);qaUp("ArrowDown");
 });
 await qaTest('Controller disconnect pauses; reconnect cannot trigger held actions',()=>{
   qaConnect();qaButtons([13]);qaPad=null;qaFrame();qaAssert(paused&&!downHeld,"Disconnect did not pause");
   qaConnect();qaButtons([0]);qaButtons([]);qaAssert(!paused,"Reconnect could not resume");
   qaPad=null;qaFrame();qaPad={index:0,id:"New pad",connected:true,mapping:"standard",axes:[0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===0,value:i===0?1:0}))};qaFrame();qaAssert(paused,"Held A on connect resumed");qaButtons([]);qaTap(0);qaAssert(!paused,"Released/repressed A failed");
 });
 await qaTest('Blur clears held keyboard and controller movement',()=>{qaConnect();qaKey("ArrowDown");window.dispatchEvent(new Event("blur"));qaAssert(paused&&!downHeld,"Blur did not clear hold");window.dispatchEvent(new Event("focus"));qaTap(0);qaAssert(!paused&&!downHeld,"Blur hold resumed");qaUp("ArrowDown")});
 await qaTest('Pause controls and repeat settings are controller reachable and persist',()=>{
   qaConnect();qaTap(9);qaSelect("#pauseControls");qaAssert($("optionsPanel").classList.contains("active"),"Controls did not open");qaSelect("#movementDelay");qaAssert(movementSettings.delay!==170,"A did not adjust setting");qaAssert(JSON.parse(localStorage.getItem(REPEAT_KEY)).delay===movementSettings.delay,"Setting not persisted");qaTap(1);qaAssert(isShown("overlay")&&paused,"Back from options resumed unexpectedly");
 });
 await qaTest('View opens team; controller selects partner and uses potion while paused',()=>{
   qaConnect();const dex=save.team[0];save.collection[String(dex)].currentHP=10;qaTap(8);qaAssert(isShown("fieldMenuModal")&&paused,"View did not open team");qaSelect(`[data-field-partner="${dex}"]`);qaAssert(save.buddy===dex,"Partner did not change");qaSelect('[data-field-item="0"]');qaAssert(save.collection[String(dex)].currentHP>10&&save.items.length===2&&paused,"Potion failed or resumed battle");qaTap(1);qaAssert(isShown("overlay")&&paused,"Team Back did not return to pause");
 });
 await qaTest('Fainted partners and passive/locked items cannot be selected',()=>{
   save.collection[String(save.team[0])].currentHP=0;save.items=["greatball","pokeball","potion"];openFieldMenu();
   qaAssert(document.querySelector(`[data-field-partner="${save.team[0]}"]`).disabled,"Fainted partner enabled");qaAssert(document.querySelector('[data-field-item="0"]').disabled&&document.querySelector('[data-field-item="1"]').disabled,"Unavailable items enabled");
 });
 await qaTest('Controller completes title mode, difficulty, and starter choices',()=>{
   clearControlsScreens();studioIntroSeen=true;restartRun();qaConnect();qaSelect("#titleAdventureNewBtn");qaSelect('[data-slot-new="1"]');qaAssert(isShown("oakIntroModal"),"Oak did not open");qaOakJourney('easy');qaSelect('[data-oak-action="starter"][data-oak-value="7"]');if(isShown("controlsConfirm"))qaSelect("#controlsConfirmYes");qaAssert(save.starter===7&&runMode==="adventure"&&adventureDifficulty==="easy","Wrong mode/difficulty/starter");
 });
 await qaTest('New-game confirmation defaults to Cancel and B preserves saved slot',()=>{
   save.bossTest=false;saveRunProgress("QA",true);const before=localStorage.getItem(ADVENTURE_RUN_SAVE_KEY);clearControlsScreens();studioIntroSeen=true;restartRun();qaConnect();qaSelect("#titleAdventureNewBtn");qaSelect('[data-slot-new="1"]');qaOakJourney('normal');qaSelect('[data-oak-action="starter"][data-oak-value="1"]');qaAssert(isShown("controlsConfirm")&&document.activeElement.id==="controlsConfirmCancel","Confirmation did not default to Cancel");qaTap(1);qaAssert(localStorage.getItem(ADVENTURE_RUN_SAVE_KEY)===before&&isShown("oakIntroModal"),"B overwrote slot or lost menu");
 });
 await qaTest('Boss-test restart replays Agatha without touching saved slots',()=>{
   const a=localStorage.getItem(ADVENTURE_RUN_SAVE_KEY),r=localStorage.getItem(RUN_SAVE_KEY);qaConnect();qaTap(8,9);qaAssert(isShown("controlsConfirm"),"Restart chord did not prompt");qaSelect("#controlsConfirmYes");qaAssert(save.bossTest&&save.gymBattle.gymIndex===10&&isShown("gymIntroModal"),"Wrong boss restart");qaAssert(localStorage.getItem(ADVENTURE_RUN_SAVE_KEY)===a&&localStorage.getItem(RUN_SAVE_KEY)===r,"Boss restart touched save");
 });
 await qaTest('Adventure restart remains a draft until a new starter is confirmed',()=>{
   save.bossTest=false;adventureDifficulty="hard";saveRunProgress("QA",true);const other=localStorage.getItem(RUN_SAVE_KEY),dex=localStorage.getItem(DEX_KEY);qaConnect();qaTap(9);qaSelect("#pauseRestart");qaAssert(oakIntro&&pendingAdventureSlot===1&&runMode==="adventure"&&adventureDifficulty==="hard","Restart did not open the same slot draft");qaAssert(localStorage.getItem(ADVENTURE_RUN_SAVE_KEY)&&localStorage.getItem(RUN_SAVE_KEY)===other&&localStorage.getItem(DEX_KEY)===dex,"Restart changed stored data");cancelOakIntroduction();
 });
 await qaTest('Save & Return to Title round-trips board, partner, score, and mode',()=>{
   save.bossTest=false;score=1234;board[19][0]="T";const state=()=>JSON.stringify({board,current:pieceStateSafe(current),nextPiece:pieceStateSafe(nextPiece),bag,buddy:save.buddy,score});const before=state();qaConnect();qaTap(9);qaSelect("#pauseSaveExit");qaAssert(isShown("titleScreen")&&!save.starter,"Did not return to title");qaSelect("#titleAdventureNewBtn");qaSelect("#adventureContinue1");qaAssert(state()===before&&runMode==="adventure"&&paused,"Saved board/pieces/bag/partner/score did not round trip");qaSelect(isShown("gymIntroModal")?"#gymIntroBtn":"#overlayBtn");qaAssert(!paused&&state()===before,"Loaded run could not resume intact");
 });
 await qaTest('Failed save keeps live run open and reports failure',()=>{
   save.bossTest=false;togglePause();const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error("QA storage failure")};try{saveAndReturnToTitle();qaAssert(save.starter&&paused&&!isShown("titleScreen")&&$("overlayText").textContent.includes("SAVE FAILED"),"Failed save lost live run")}finally{Storage.prototype.setItem=original}
 });
 await qaTest('Sven PC deposit/withdraw and Back use controller only',()=>{
   qaConnect();qaTap(8);qaSelect("#fieldSven");qaSelect('[data-deposit-item="0"]');qaAssert(save.items.length===2,"Deposit failed");qaSelect('[data-withdraw-item="superpotion"]');qaAssert(save.items.length===3,"Withdraw failed");qaTap(1);qaAssert(isShown("fieldMenuModal")&&paused,"Sven Back failed");
 });
 await qaTest('Bill PC selects boxed Pokémon, swaps slot, and returns to team',()=>{
   save.gymBattle=null;save.pc=[25];save.collection["25"]=bossTestPokemonEntry(30,25);qaConnect();qaTap(8);qaSelect("#fieldBills");qaAssert(isShown("billsPcModal"),"Bill PC failed to open");qaSelect('[data-pc-select="25"]');qaSelect('#dexDetailTeamBtn');qaSelect('[data-pc-swap-slot="0"]');qaSelect('#controlsConfirmYes');qaAssert(save.team[0]===25,"PC swap failed");qaTap(1);qaAssert(isShown("fieldMenuModal"),"Bill PC Back failed");
 });
 await qaTest('Bill PC deposits a party member and withdraws into the empty slot',()=>{
   save.gymBattle=null;save.pc=[];const dex=save.team[0];qaConnect();qaTap(8);qaSelect("#fieldBills");qaSelect(`[data-pc-deposit="${dex}"]`);qaAssert(!save.team.includes(dex)&&save.pc.includes(dex),"PC deposit failed");qaSelect(`[data-pc-select="${dex}"]`);qaSelect('#dexDetailTeamBtn');qaSelect('[data-pc-swap-slot="5"]');qaSelect('#controlsConfirmYes');qaAssert(save.team.length===6&&save.team[5]===dex&&!save.pc.includes(dex),"Empty-slot withdrawal failed");
 });
 await qaTest('Town menu round-trip retains town; shop and heal are controller reachable',()=>{
   save.gymBattle=null;routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);qaConnect();qaAssert(isShown("townModal"),"Town setup failed");qaSelect("#townTeamItems");qaSelect("#fieldSven");qaTap(1);qaTap(1);qaAssert(isShown("townModal")&&paused,"Town context lost after PC");
   const targets=navElements($("townModal"));qaAssert(targets.some(b=>b.id==="townCenterBtn")&&targets.some(b=>b.closest("#townShopGrid")),"Heal or shop missing");
   const money=save.money;const shop=targets.find(b=>b.closest("#townShopGrid"));if(shop){qaSelect('#townShopGrid button:not(:disabled)');qaAssert(save.money<money,"Shop purchase failed")}
 });
 await qaTest('Held confirm cannot skip a new menu or starter choice',()=>{
   clearControlsScreens();studioIntroSeen=true;restartRun();qaConnect();qaSelect("#titleAdventureNewBtn");qaSelect('[data-slot-new="1"]');
   document.querySelector('[data-oak-value="name"]').focus();qaButtons([0]);const step=oakIntro.step;qaFrame(500);qaFrame(500);qaAssert(oakIntro.step===step&&!save.starter,"Held A skipped new screen");qaButtons([]);
 });
 await qaTest('All enabled menu actions are reachable by controller graph',()=>{
   // Explore actual directional focus transitions; no click activation needed.
   openFieldMenu();const root=menuRoot(),elements=navElements(root),reached=new Set(),queue=[elements[0]];
   while(queue.length){const el=queue.shift();if(reached.has(el))continue;reached.add(el);for(const dir of ["up","down","left","right"]){el.focus();navigateMenu(dir);if(!reached.has(document.activeElement))queue.push(document.activeElement)}}
   qaAssert(elements.every(el=>reached.has(el)),"Unreachable field controls: "+elements.filter(el=>!reached.has(el)).map(navKey));
 });
 await qaTest('Old custom key mappings migrate without collisions',()=>{
   localStorage.setItem(CONTROLS_KEY,JSON.stringify({left:"KeyZ",right:"KeyC",down:"KeyV",rotate:"KeyX",drop:"Space",pause:"KeyP",restart:"KeyR"}));const migrated=loadControls();qaAssert(migrated.left==="KeyZ"&&migrated.right==="KeyC"&&migrated.down==="KeyV","Old mappings lost");qaAssert(new Set(Object.values(migrated)).size===Object.keys(migrated).length,"Duplicate bindings after migration");
 });
 await qaTest('Controller stick movement uses configured repeat and cancels on release',()=>{
   qaConnect();movementSettings={delay:100,rate:35};qaPad.axes[0]=-1;qaFrame();qaAssert(current.x===2,"Stick did not move");qaFrame(99);qaAssert(current.x===2,"Stick repeated too early");qaFrame(1);qaAssert(current.x===1,"Stick delay incorrect");qaFrame(35);qaAssert(current.x===0,"Stick repeat incorrect");qaPad.axes[0]=0;qaFrame();qaFrame(1000);qaAssert(current.x===0,"Released stick repeated");
 });
 await qaTest('Keyboard team/item shortcuts and Escape return to pause',()=>{
   qaPress("KeyC");qaAssert(isShown("fieldMenuModal")&&paused,"C did not open team");qaPress("Escape");qaPress("KeyP");qaAssert(!paused,"Could not return to play");qaPress("KeyV");qaAssert(isShown("fieldMenuModal")&&document.activeElement.hasAttribute("data-field-item"),"V did not focus usable item: "+JSON.stringify({focus:document.activeElement?.outerHTML,items:$("fieldItems").innerText,hp:save.team.map(d=>[d,save.collection[d].currentHP,pokemonMaxHP(save.collection[d].level,d)])}));
 });
 await qaTest('Rogue new run can be chosen and started entirely by controller',()=>{
   clearControlsScreens();studioIntroSeen=true;restartRun();qaConnect();qaSelect("#titleNewRunBtn");qaSelect("#rogueStart");if(isShown("controlsConfirm"))qaSelect("#controlsConfirmYes");qaSelect('[data-starter="1"]');qaAssert(save.starter===1&&runMode==="rogue","Rogue starter path failed");
 });
 await qaTest('Town healing and Gym challenge work after returning from team menu',()=>{
   save.gymBattle=null;save.badges=[];save.encounterDefeated=false;routeChainShowTownAtCursor(routeChainCityCursorByGym(0));save.collection[String(save.buddy)].currentHP=10;qaConnect();qaSelect("#townTeamItems");qaTap(1);qaSelect("#townCenterBtn");qaAssert(save.collection[String(save.buddy)].currentHP>10,"Town did not heal");qaSelect("#townChallengeBtn");qaAssert(isShown("gymIntroModal"),"Gym challenge did not open");qaSelect("#gymIntroBtn");qaNow+=1;loop(qaNow);qaAssert(!paused&&isGymBattle(),"Old team-menu pause latch stopped Gym start");
 });
 await qaTest('Town training and continue actions are controller navigable',()=>{
   save.gymBattle=null;save.encounterDefeated=false;routeChainShowTownAtCursor(routeChainCityCursorByGym(0));qaConnect();qaSelect("#townSkipBtn");qaAssert(!isShown("townModal")&&routeChainIsRoute(),"Town training did not start");
   routeChainShowTownAtCursor(routeChainCityCursorByGym(0));qaFrame();qaSelect("#townContinueBtn");qaAssert(!isShown("townModal")&&routeChainIsRoute(),"Town continue did not start route");
 });
 await qaTest('Fly destinations have controller buttons and preserve Back to town',()=>{
   save.gymBattle=null;routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);qaConnect();qaSelect("#townTeamItems");qaSelect("#fieldFly");qaAssert(isShown("flyModal"),"Fly menu did not open");qaAssert(navElements($("flyModal")).some(b=>b.closest("#flyDestinations")),"No available destination controls");qaTap(1);qaAssert(isShown("fieldMenuModal"),"Fly Back lost field menu");qaTap(1);qaAssert(isShown("townModal"),"Fly Back lost town");
 });
 await qaTest('Touch movement controls are absent',()=>{qaAssert(!document.querySelector('.mobile [data-action]'),"Touch controls shipped")});
 await qaTest('Long team-menu pause freezes Agatha timers and excludes idle debt',()=>{
   qaNow+=4000;loop(qaNow);const hp=save.collection[String(save.buddy)].currentHP;qaPress("KeyC");const state=JSON.stringify({board,current,battle:save.gymBattle});qaNow+=300000;loop(qaNow);qaAssert(paused&&save.collection[String(save.buddy)].currentHP===hp&&JSON.stringify({board,current,battle:save.gymBattle})===state,"Team menu advanced battle");qaPress("Escape");qaPress("KeyP");qaNow+=5000;loop(qaNow);qaAssert(save.collection[String(save.buddy)].currentHP===hp,"Menu pause accrued idle damage");
 });
 for(const key of Object.keys(localStorage))if(!storageBefore.has(key))localStorage.removeItem(key);
 for(const [key,value] of storageBefore)localStorage.setItem(key,value);
 $('qaResults').textContent=JSON.stringify({passed:qaResults.filter(r=>r.result==="PASS").length,total:qaResults.length,tests:qaResults},null,2);
 $('qaRun').textContent="Controls tests complete";
});

function qaOakJourney(diff){
 qaSelect('[data-oak-value="name"]');qaSelect('[data-oak-action="name"]');qaSelect('[data-oak-action="favorite"]');qaSelect('[data-oak-action="outing"]');qaSelect('[data-oak-action="difficulty"][data-oak-value="'+diff+'"]');qaSelect('[data-oak-action="exp"][data-oak-value="team"]');qaSelect('[data-oak-value="tutorial"]');qaSelect('[data-oak-value="starterTalk"]');qaSelect('[data-oak-value="choose"]');
}
