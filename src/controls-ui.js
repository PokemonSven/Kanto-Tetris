// Build 1.7.2 menus. Everything stays inside the offline game's closure.
let fieldItemUse=false,fieldReturnTown=false,utilityReturn=null,confirmCallback=null,confirmFocus=null;
let menuFocus={root:null,key:null,index:0};
const navModalIds=["controlsConfirm","productionCredits","eeveeChoiceModal","dexDetailModal","flyModal","billsPcModal","oakGuideModal","cropEditorModal","fieldMenuModal","bossTestModal","adventureDifficultyModal","starterModal","townModal","gymIntroModal","titleScreen","studioIntro"];
function isShown(id){return !!$(id)?.classList.contains("show")}
function setModal(id,open){const el=$(id);el?.classList.toggle("show",open);el?.setAttribute("aria-hidden",String(!open))}
function escapeControlsText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function selectGamePanel(id){
 document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
 document.querySelectorAll(".tabs .tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
}
function menuRoot(){
 if(utilityReturn){
   const open=utilityReturn.panel?$(utilityReturn.id)?.classList.contains("active"):isShown(utilityReturn.id);
   if(!open){utilityReturn=null;setModal("fieldMenuModal",true);renderFieldMenu()}
 }
 const moment=$("momentModal");
 if(moment?.classList.contains("badge-clickthrough")||moment?.classList.contains("leader-clickthrough")){
   if(!$("momentContinue")){const button=document.createElement("button");button.id="momentContinue";button.className="choice";button.textContent="CONTINUE • A / ENTER";$("momentCard").appendChild(button)}
   return moment;
 }
 for(const id of navModalIds)if(isShown(id)){
   if(id==="fieldMenuModal"){$("fieldSaveExit").disabled=runActionBusy();$("fieldRestart").disabled=runActionBusy()}
   return $(id);
 }
 const panel=document.querySelector(".panel.active");
 if(panel&&panel.id!=="gamePanel")return panel;
 if(isShown("overlay")){refreshPauseActions();return $("overlay")}
 return null;
}
function navKey(el){return el.id||JSON.stringify(el.dataset)+":"+el.tagName+":"+(el.getAttribute("name")||el.textContent.trim().slice(0,50))}
function navElements(root){
 if(!root)return [];
 root.querySelectorAll('.moncard[data-dex]:not([role="button"])').forEach(el=>{el.tabIndex=0;el.setAttribute("role","button");el.setAttribute("aria-label",el.getAttribute("title")||"Pokédex entry")});
 return [...root.querySelectorAll('button,a[href],select,input,textarea,[role="button"]')].filter(el=>!el.disabled&&el.getAttribute("aria-disabled")!=="true"&&!el.closest('[hidden],[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");
}
function focusMenuElement(el,root){
 if(!el)return;
 el.focus({preventScroll:true});el.scrollIntoView({block:"nearest",inline:"nearest"});
 menuFocus={root,key:navKey(el),index:navElements(root).indexOf(el)};
}
function resetMenuFocus(root){
 menuFocus={root,key:null,index:0};if(!root)return;
 const all=navElements(root),current=all.includes(document.activeElement)?document.activeElement:null;
 focusMenuElement(root.querySelector('[data-nav-default]:not(:disabled)')||current||all[0],root);
 if(root.id==="overlay")root.scrollIntoView({block:"center",inline:"nearest"});
}
function repairMenuFocus(root){
 const focused=document.activeElement;
 if(root&&root===menuFocus.root&&root.contains(focused)&&!focused.disabled&&navKey(focused)===menuFocus.key&&focused.getClientRects().length)return;
 const all=navElements(root);if(!all.length)return;
 if(all.includes(document.activeElement)){menuFocus={root,key:navKey(document.activeElement),index:all.indexOf(document.activeElement)};return}
 focusMenuElement(all.find(el=>navKey(el)===menuFocus.key)||all[Math.min(menuFocus.index,all.length-1)]||all[0],root);
}
function changeMenuValue(el,delta){
 if(el?.tagName==="SELECT"){
   const options=[...el.options].filter(o=>!o.disabled),i=options.indexOf(el.selectedOptions[0]);
   if(!options.length)return;el.value=options[(i+delta+options.length)%options.length].value;el.dispatchEvent(new Event("change",{bubbles:true}));return true;
 }
 if(el?.matches('input[type="range"]')){el.value=String(Math.min(+el.max,Math.max(+el.min,+el.value+delta*(+el.step||1))));el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return true}
 return false;
}
function navigateMenu(direction){
 const root=menuRoot();repairMenuFocus(root);const all=navElements(root);if(!all.length)return;
 const current=document.activeElement,index=all.indexOf(current),delta=["left","up","previous"].includes(direction)?-1:1;
 if(["left","right"].includes(direction)&&changeMenuValue(current,delta))return;
 // Spatial navigation follows rows/columns; a linear fallback keeps every control reachable.
 if(["left","right","up","down"].includes(direction)&&index>=0){
   const a=current.getBoundingClientRect(),x=a.x+a.width/2,y=a.y+a.height/2,horizontal=["left","right"].includes(direction);
   const candidates=all.filter(el=>el!==current).map(el=>{const b=el.getBoundingClientRect(),dx=b.x+b.width/2-x,dy=b.y+b.height/2-y;return {el,along:(horizontal?dx:dy)*delta,across:Math.abs(horizontal?dy:dx)}}).filter(p=>p.along>4).sort((a,b)=>(a.along+a.across*3)-(b.along+b.across*3));
   if(candidates.length){focusMenuElement(candidates[0].el,root);return}
 }
 focusMenuElement(all[(index+delta+all.length)%all.length],root);
}
function activateMenu(){
 const root=menuRoot();repairMenuFocus(root);const el=document.activeElement;if(!navElements(root).includes(el))return;
 if(changeMenuValue(el,1))return;el.click();
}
function menuBack(){
 const root=menuRoot();if(!root)return;
 if(pendingRemapAction){pendingRemapAction=null;renderControlPanels("REMAPPING CANCELLED.");return}
 const close={controlsConfirm:cancelControlsConfirm,fieldMenuModal:closeFieldMenu,productionCredits:finishProductionCredits,
   dexDetailModal:closeDexDetail,flyModal:closeFlyMap,billsPcModal:closeBillsPC,oakGuideModal:closeOakGuide,
   cropEditorModal:cropClose,bossTestModal:bossTestClose,adventureDifficultyModal:closeAdventureDifficulty};
 if(close[root.id]){close[root.id]();return}
 if(root.id==="overlay"){if(!gameOver)togglePause();return}
 if(root.id==="townModal"){openFieldMenu();return}
 if(root.id==="starterModal"){showTitleScreen();return}
 if(root.classList.contains("panel")){selectGamePanel("gamePanel");pendingRemapAction=null;enforceAutoPause();menuRoot();return}
 // Starter evolution and battle introductions need an explicit choice/confirmation.
}
function showControlsConfirm(title,message,action,label="CONFIRM"){
 clearHeldInput();confirmFocus=document.activeElement;confirmCallback=action;
 $("controlsConfirmTitle").textContent=title;$("controlsConfirmText").textContent=message;$("controlsConfirmYes").textContent=label;
 setModal("controlsConfirm",true);resetMenuFocus($("controlsConfirm"));
 if(save?.starter)paused=true;
}
function cancelControlsConfirm(){setModal("controlsConfirm",false);confirmCallback=null;if(confirmFocus?.isConnected)confirmFocus.focus();}
function runActionBusy(){return isGymTransition()||(!isGymBattle()&&!!save?.encounterDefeated)||gymVictoryClickthroughActive||["productionCredits","eeveeChoiceModal","starterModal","titleScreen","gymIntroModal"].some(isShown)}
function requestRestart(){
 if(!save?.starter||runActionBusy()||isShown("controlsConfirm"))return;
 if(isAdventureMode()&&!save.bossTest&&!practiceSession){requestAutoPause();beginAdventureSlot(activeAdventureSlot);return;}
 requestAutoPause();
 const mode=runMode,difficulty=adventureDifficulty,test=!!save.bossTest,boss=save.gymBattle?.gymIndex??save.bossTestGymIndex??0;
 showControlsConfirm(test?"RESTART TEST BATTLE?":"RESTART THIS RUN?",test?"Replay this boss with its prepared team. Your saved runs stay safe.":`Start ${mode==="adventure"?"Adventure":"Rogue"} again from starter selection${mode==="adventure"?` on ${difficulty} difficulty`:""}. This replaces this mode's live run and saved progress. Your permanent Pokédex and the other mode's save stay safe.`,()=>{
   clearControlsScreens();
   if(test){if(boss>=8)document.querySelector(`[data-elite-test="${boss-8}"]`)?.click();else bossTestPrepareRun(boss)}
   else{try{localStorage.removeItem(activeRunSaveKey(mode))}catch{}resetStateForMode(mode,difficulty)}
 },"RESTART");
}
function clearControlsScreens(){
 clearHeldInput();utilityReturn=null;fieldReturnTown=false;autoPauseRequested=false;confirmCallback=null;
 for(const id of ["controlsConfirm","fieldMenuModal","oakGuideModal","billsPcModal","flyModal","dexDetailModal","townModal","gymIntroModal"])setModal(id,false);
 selectGamePanel("gamePanel");
}
function saveAndReturnToTitle(){
 if(!save?.starter||runActionBusy()){ $("overlayText").textContent="FINISH THE CURRENT TRANSITION BEFORE SAVING AND LEAVING.";return}
 if(!save.bossTest&&!saveRunProgress("Save & Return to Title",false)){
   $("overlayText").textContent="SAVE FAILED. YOUR RUN IS STILL OPEN. CHECK BROWSER STORAGE AND TRY AGAIN.";
   if(isShown("fieldMenuModal"))$("fieldStatus").textContent="SAVE FAILED. YOUR RUN IS STILL OPEN.";return;
 }
 clearControlsScreens();studioIntroSeen=true;restartRun();
}
function refreshPauseActions(){
 const actions=$("pauseActions");if(!actions)return;
 actions.hidden=!paused||gameOver||!save?.starter||$("overlayBtn").textContent!=="RESUME";
 $("pauseSaveExit").textContent=save?.bossTest?"RETURN TO TITLE (TEST)":"SAVE & RETURN TO TITLE";
 $("pauseSaveExit").disabled=runActionBusy();$("pauseRestart").disabled=runActionBusy();
}
function openControlsPanel(){requestAutoPause();selectGamePanel("optionsPanel");renderControlPanels();renderSaveControls();}
function openFieldMenu(itemsFirst=false){
 if(!save?.starter||gameOver||isGymTransition()||isShown("controlsConfirm")||isShown("gymIntroModal")||eeveeChoiceIsOpen())return;
 fieldReturnTown=isShown("townModal");if(fieldReturnTown)setModal("townModal",false);
 requestAutoPause();hideOverlay();setModal("fieldMenuModal",true);renderFieldMenu();
 resetMenuFocus($("fieldMenuModal"));
 if(itemsFirst)focusMenuElement($("fieldItems").querySelector("button:not(:disabled)"),$("fieldMenuModal"));
}
function closeFieldMenu(){
 setModal("fieldMenuModal",false);
 if(fieldReturnTown){fieldReturnTown=false;if(!gameOutsidePlayView())autoPauseRequested=false;setModal("townModal",true);renderTownStop()}
 else enforceAutoPause();
}
function openFieldUtility(id,panel,fn){
 setModal("fieldMenuModal",false);utilityReturn={id,panel};fn();
 menuRoot();
}
function fieldItemBlocked(id){
 if(ITEMS[id]?.passive||giovanniItemsDisabled()||isGymTransition())return true;
 if((id==="pokeball"||id==="masterball")&&(fieldReturnTown||isGymBattle()||!save.encounterDex||save.encounterDefeated))return true;
 if(id==="pokeball"&&temporaryPokeballBonus()>0)return true;
 if((id==="potion"||id==="superpotion")&&!v10PotionTarget())return true;
 if(id==="revive"&&!bestReviveTargetDex())return true;
 if(id==="rarecandy"&&(!v10RareCandyTarget()||save.collection[String(v10RareCandyTarget())].level>=currentLevelCap()))return true;
 if(id==="oakwatch"&&((isAdventureMode()&&adventureDifficulty==="easy")||itemBadgeCount()<=0||save.oakWatchActive))return true;
 return false;
}
function renderFieldMenu(){
 if(!$("fieldTeam")||!save?.starter)return;
 $("fieldTeam").innerHTML=save.team.map(dex=>{const entry=ensurePokemonProgress(save.collection[String(dex)],5,dex),active=save.buddy===dex;return `<button class="field-partner ${active?"selected":""}" data-field-partner="${dex}" aria-pressed="${active}" ${entry.currentHP<=0?"disabled":""}><canvas width="64" height="64" data-field-portrait="${dex}"></canvas><b>${escapeControlsText(BYDEX[dex].name.toUpperCase())}${active?" ★ ACTIVE":""}</b><small>LV.${entry.level} • ${entry.currentHP<=0?"FAINTED":`HP ${entry.currentHP}/${pokemonMaxHP(entry.level,dex)}`}</small></button>`}).join("");
 $("fieldTeam").querySelectorAll("[data-field-portrait]").forEach(c=>drawPortrait(c,BYDEX[+c.dataset.fieldPortrait],false));
 $("fieldTeam").querySelectorAll("[data-field-partner]").forEach(b=>b.addEventListener("click",()=>{setActiveTeamMember(+b.dataset.fieldPartner);renderFieldMenu();$("fieldStatus").textContent=`${BYDEX[save.buddy].name.toUpperCase()} IS NOW YOUR ACTIVE PARTNER.`}));
 $("fieldItems").innerHTML=save.items.map((id,index)=>{const item=ITEMS[id];if(!item)return "";const passive=!!item.passive,blocked=fieldItemBlocked(id),target=["potion","superpotion"].includes(id)?v10PotionTarget():id==="revive"?bestReviveTargetDex():id==="rarecandy"?v10RareCandyTarget():null;return `<button data-field-item="${index}" ${blocked?"disabled":""}><b>${escapeControlsText(item.name.toUpperCase())}</b><small>${escapeControlsText(item.short)} • ${passive?"PASSIVE":blocked?"UNAVAILABLE":target?`USE ON ${escapeControlsText(BYDEX[target].name.toUpperCase())}`:"USE"}</small></button>`}).join("")||'<p>No carried items. Visit a shop or Sven’s PC.</p>';
 $("fieldItems").querySelectorAll("[data-field-item]").forEach(b=>b.addEventListener("click",()=>{
   const previous=feed[0];fieldItemUse=true;
   try{consumeItemAt(+b.dataset.fieldItem)}finally{fieldItemUse=false;paused=true}
   renderFieldMenu();$("fieldStatus").textContent=feed[0]!==previous?feed[0]:"ITEM COULD NOT BE USED RIGHT NOW.";
 }));
 $("fieldBills").disabled=isGymBattle();
 updateFlyButton();$("fieldFly").disabled=!isAdventureMode()||!!$("flyBtn")?.disabled;
 $("fieldSaveExit").textContent=save.bossTest?"RETURN TO TITLE (TEST)":"SAVE & RETURN TO TITLE";
 $("fieldSaveExit").disabled=runActionBusy();$("fieldRestart").disabled=runActionBusy();
 $("fieldStatus").textContent="BATTLE PAUSED • SELECT A CONSCIOUS PARTNER. POTIONS HEAL THE CONSCIOUS TEAM MEMBER MISSING THE MOST HP.";
}
function renderFlyDestinations(){
 const list=$("flyDestinations");if(!list)return;
 list.innerHTML="";
 for(const target of flyTargets()){
   const button=document.createElement("button");button.textContent=(target.display||target.name||target.label||target.route||"DESTINATION")+(target.available?"":" • NOT VISITED");button.disabled=!target.available;
   button.addEventListener("click",()=>travelToFlyTarget(target));list.appendChild(button);
 }
}
function initializeControlsUI(){
 document.head.insertAdjacentHTML("beforeend",`<style>
 button:focus,select:focus,input:focus,a:focus,[role=button]:focus{outline:4px solid #ec7b17!important;outline-offset:3px;box-shadow:0 0 0 7px #fff8dc!important}
 .controls-modal{position:fixed;inset:0;z-index:45;display:none;place-items:center;background:#071821e8;padding:16px;overflow:auto}.controls-modal.show{display:grid}
 #controlsConfirm{z-index:120}.controls-card{width:min(780px,96vw);max-height:92vh;overflow:auto;background:#fff8dc;border:7px double #071821;padding:20px;color:#071821}
 .controls-card h2{margin:0 0 12px}.controls-card h3{margin:18px 0 8px}.controls-card p{line-height:1.6}
 .controls-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.controls-card button,#pauseActions button,#partnerSelectBtn,.menu-return,#flyDestinations button{border:3px solid #071821;background:#e0f8cf;color:#071821;padding:10px;font-family:inherit;font-weight:700;font-size:12px;line-height:1.5;cursor:pointer}
 .controls-card button small{display:block;font-size:11px;margin-top:5px;line-height:1.5}.controls-card button:disabled{opacity:.45;cursor:default}.field-partner canvas{display:block;margin:auto;image-rendering:pixelated}.field-partner.selected{background:#ffe18a}
 #fieldStatus{font-size:12px;min-height:2.8em;padding:10px;background:#e0f8cf}#pauseActions{display:grid;gap:8px;margin-top:10px}#pauseActions[hidden]{display:none}#overlay{overflow:auto}#overlay.show{z-index:25}#overlay>div{width:100%}#overlay .choice{width:100%}
 #partnerSelectBtn{display:block;grid-column:1/-1;width:100%;margin:10px 0}.menu-return{margin:10px 0}#flyDestinations{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
 #momentContinue{position:relative;z-index:2;display:block;margin:12px auto}#momentModal:not(.badge-clickthrough):not(.leader-clickthrough) #momentContinue{display:none}
 .repeat-options{display:flex;gap:16px;flex-wrap:wrap;padding:12px 0}.repeat-options label{display:grid;gap:6px}.repeat-options select{font:inherit;padding:8px}
 @media(max-height:600px){.controls-modal{padding:6px}.controls-card{max-height:96vh;padding:12px}.field-partner canvas{width:40px;height:40px}.controls-card h3{margin:8px 0}.controls-card button{padding:6px}}
 @media(max-width:550px){.controls-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 </style>`);
 document.body.insertAdjacentHTML("beforeend",`<div class="controls-modal" id="controlsConfirm" role="dialog" aria-modal="true" aria-labelledby="controlsConfirmTitle" aria-hidden="true"><div class="controls-card"><h2 id="controlsConfirmTitle"></h2><p id="controlsConfirmText"></p><div class="controls-grid"><button id="controlsConfirmCancel" data-nav-default>CANCEL</button><button id="controlsConfirmYes">CONFIRM</button></div><p>A / ENTER: SELECT • B / ESC: CANCEL</p></div></div>
 <div class="controls-modal" id="fieldMenuModal" role="dialog" aria-modal="true" aria-labelledby="fieldTitle" aria-hidden="true"><div class="controls-card"><h2 id="fieldTitle">TEAM & ITEMS</h2><p>D-PAD / ARROWS: MOVE • A / ENTER: SELECT • B / ESC: BACK</p><h3>ACTIVE PARTNER</h3><div class="controls-grid" id="fieldTeam"></div><h3>CARRIED ITEMS</h3><div class="controls-grid" id="fieldItems"></div><p id="fieldStatus" aria-live="polite"></p><div class="controls-grid"><button id="fieldBills">BILL’S PC</button><button id="fieldSven">SVEN’S PC</button><button id="fieldDex">POKéDEX</button><button id="fieldBadges">BADGES</button><button id="fieldFly">FLY</button><button id="fieldOak">OAK’S GUIDE</button><button id="fieldControls">CONTROLS</button><button id="fieldSaveExit">SAVE & RETURN TO TITLE</button><button id="fieldRestart">RESTART…</button><button id="fieldBack">BACK</button></div></div></div>`);
 $("controlsConfirmCancel").addEventListener("click",cancelControlsConfirm);
 $("controlsConfirmYes").addEventListener("click",()=>{const action=confirmCallback;setModal("controlsConfirm",false);confirmCallback=null;action?.()});
 $("overlayBtn").insertAdjacentHTML("afterend",'<div id="pauseActions" hidden><button id="pauseSaveExit">SAVE & RETURN TO TITLE</button><button id="pauseControls">CONTROLS</button><button id="pauseTeam">TEAM & ITEMS</button><button id="pauseRestart">RESTART…</button><small>A / ENTER: SELECT • B / START / ESC: RESUME</small></div>');
 $("pauseSaveExit").addEventListener("click",saveAndReturnToTitle);$("pauseControls").addEventListener("click",openControlsPanel);$("pauseTeam").addEventListener("click",()=>openFieldMenu());$("pauseRestart").addEventListener("click",requestRestart);
 $("buddyName").closest(".buddy")?.insertAdjacentHTML("beforeend",'<button id="partnerSelectBtn">CHANGE PARTNER / ITEMS • C / VIEW</button>');
 if(!$("partnerSelectBtn"))$("pauseBtn").insertAdjacentHTML("beforebegin",'<button id="partnerSelectBtn">CHANGE PARTNER / ITEMS • C / VIEW</button>');
 $("partnerSelectBtn").addEventListener("click",()=>openFieldMenu());
 $("fieldBack").addEventListener("click",closeFieldMenu);$("fieldSaveExit").addEventListener("click",saveAndReturnToTitle);$("fieldRestart").addEventListener("click",requestRestart);
 const utilities={fieldBills:["billsPcModal",false,openBillsPC],fieldSven:["svenPcPanel",true,openSvensPcPanel],fieldDex:["dexPanel",true,()=>{selectGamePanel("dexPanel");renderDex()}],fieldBadges:["badgePanel",true,()=>{selectGamePanel("badgePanel");renderBadges()}],fieldFly:["flyModal",false,()=>{openFlyMap();renderFlyDestinations()}],fieldOak:["oakGuideModal",false,openOakGuide],fieldControls:["optionsPanel",true,openControlsPanel]};
 for(const [id,args] of Object.entries(utilities))$(id).addEventListener("click",()=>openFieldUtility(...args));
 document.querySelector(".town-actions").insertAdjacentHTML("beforeend",'<button class="town-action" id="townTeamItems">TEAM, ITEMS & MENU</button>');$("townTeamItems").addEventListener("click",()=>openFieldMenu());
 for(const id of ["optionsPanel","dexPanel","badgePanel","svenPcPanel"]){const button=document.createElement("button");button.className="menu-return";button.textContent="BACK • B / ESC";button.addEventListener("click",menuBack);$(id).prepend(button)}
 $("flyMapInfo")?.insertAdjacentHTML("afterend",'<div id="flyDestinations" aria-label="Fly destinations"></div>');
 $("flyBtn")?.addEventListener("click",renderFlyDestinations);
 $("controlRemapList").insertAdjacentHTML("afterend",`<div class="repeat-options"><label>HOLD DELAY<select id="movementDelay">${REPEAT_DELAYS.map(v=>`<option value="${v}">${v} ms</option>`).join("")}</select></label><label>REPEAT INTERVAL<select id="movementRate">${REPEAT_RATES.map(v=>`<option value="${v}">${v} ms</option>`).join("")}</select></label></div><p class="tiny">Applies to keyboard and controller horizontal movement. Lower values repeat sooner / faster. Menu arrows select; left/right changes a setting. Keyboard bindings require a keyboard to remap.</p>`);
 for(const [id,key] of [["movementDelay","delay"],["movementRate","rate"]]){$(id).value=movementSettings[key];$(id).addEventListener("change",e=>{movementSettings[key]=+e.target.value;saveMovementSettings()})}
 $("resetControlsBtn").addEventListener("click",()=>{movementSettings={delay:170,rate:78};saveMovementSettings();$("movementDelay").value=170;$("movementRate").value=78;clearHeldInput()});
 $("restartBtn").textContent="RESTART…";
}
