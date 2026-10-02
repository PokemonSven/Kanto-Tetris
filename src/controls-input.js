// Build 1.7.2: independent input sources, merged only for movement.
const REPEAT_KEY="kanto_tetris_movement_v1";
const REPEAT_DELAYS=[80,100,150,170,200,250,300];
const REPEAT_RATES=[25,35,50,65,78,100,150];
let movementSettings=loadMovementSettings();
let keyboardHeld={left:false,right:false,down:false};
const keyboardPressed=new Set();
let padHeld={},padPrevious={},padBlocked=new Set(),padIdentity=null;
let movementRepeat={direction:0,next:0,down:false};
let menuRepeat={direction:null,next:0};
let inputContext=undefined;
function loadMovementSettings(){
 try{const x=JSON.parse(localStorage.getItem(REPEAT_KEY)||"{}");return {delay:REPEAT_DELAYS.includes(x.delay)?x.delay:170,rate:REPEAT_RATES.includes(x.rate)?x.rate:78}}
 catch{return {delay:170,rate:78}}
}
function saveMovementSettings(){try{localStorage.setItem(REPEAT_KEY,JSON.stringify(movementSettings))}catch{}movementRepeat={direction:0,next:0,down:false}}
function clearHeldInput(){
 keyboardHeld={left:false,right:false,down:false};downHeld=false;
 movementRepeat={direction:0,next:0,down:false};menuRepeat={direction:null,next:0};
 for(const [action,held] of Object.entries(padHeld))if(held)padBlocked.add(action);
}
function firstGamepad(){try{return Array.from(navigator.getGamepads?.()||[]).find(gp=>gp?.connected)||null}catch{return null}}
function gamepadButtonDown(gp,index){const b=gp?.buttons?.[index];return !!(b&&(b.pressed||b.value>.55))}
function readPad(gp){
 const b=i=>gamepadButtonDown(gp,i),x=gp?.axes?.[0]||0,y=gp?.axes?.[1]||0;
 return {left:b(14)||x<-.45,right:b(15)||x>.45,up:b(12)||y<-.45,down:b(13)||y>.45,
 rotate:b(0)||b(5),rotateCCW:b(2)||b(4),drop:b(1)||b(3)||b(7),pause:b(9),party:b(8),restart:b(8)&&b(9),confirm:b(0),back:b(1)};
}
function inputCanPlay(){return !!save?.starter&&!paused&&!gameOver&&!isGymTransition()&&!gameOutsidePlayView()&&!pauseDialogOpen()&&!controlsLocked()}
function syncInputContext(){
 const root=menuRoot(),context=root|| (inputCanPlay()?"play":"blocked");
 if(context!==inputContext){clearHeldInput();inputContext=context;resetMenuFocus(root)}
 if(root)repairMenuFocus(root);
 return root;
}
function applyMovement(t){
 if(!inputCanPlay()){downHeld=false;movementRepeat={direction:0,next:0,down:false};return}
 const pad=action=>padHeld[action]&&!padBlocked.has(action);
 const left=keyboardHeld.left||pad("left"),right=keyboardHeld.right||pad("right");
 const direction=Number(!!right)-Number(!!left);
 if(direction!==movementRepeat.direction){movementRepeat.direction=direction;movementRepeat.next=t+movementSettings.delay;if(direction)move(direction)}
 else if(direction&&t>=movementRepeat.next){move(direction);movementRepeat.next=t+movementSettings.rate}
 downHeld=!!(keyboardHeld.down||pad("down"))&&!sabrinaSpinActive();
 if(downHeld&&!movementRepeat.down)soft(true);
 movementRepeat.down=downHeld;
}
function performGameAction(action){
 if(action==="pause"){togglePause();return}
 if(action==="restart"){requestRestart();return}
 if(action==="party"||action==="items"){openFieldMenu(action==="items");return}
 if(!inputCanPlay())return;
 if(action==="rotate")rotate();else if(action==="rotateCCW")rotate(-1);else if(action==="drop")hard();
}
function pollGamepad(t){
 const gp=firstGamepad(),identity=gp?`${gp.index}:${gp.id}`:null;
 const raw=readPad(gp),changed=identity!==padIdentity;
 if(changed){
   const disconnected=padIdentity!==null;padIdentity=identity;padPrevious={...raw};padBlocked.clear();
   if(disconnected&&save?.starter)requestAutoPause();
   for(const [key,held] of Object.entries(raw))if(held)padBlocked.add(key);
 }
 padHeld=raw;
 for(const key of padBlocked)if(!raw[key])padBlocked.delete(key);
 // Snapshot every action, even in menus, so one press cannot leak across screens.
 const edges={};for(const key of Object.keys(raw))edges[key]=raw[key]&&!padPrevious[key]&&!padBlocked.has(key);
 padPrevious={...raw};
 const status=$("gamepadStatus");if(status){const label=gp?`CONNECTED: ${gp.id}${gp.mapping==="standard"?"":" • CHECK DEVICE BUTTON MAPPING"}`:"CONNECT A CONTROLLER AND PRESS A BUTTON.";if(status.textContent!==label)status.textContent=label}
 const root=syncInputContext();
 if(document.hidden||!gameWindowFocused)return;
 if(edges.restart&&save?.starter&&!isGymTransition()){requestRestart();return}
 if(root){
   if(pendingRemapAction){if(edges.back){pendingRemapAction=null;renderControlPanels("REMAPPING CANCELLED.")}return}
   const dir=raw.up&&!raw.down?"up":raw.down&&!raw.up?"down":raw.left&&!raw.right?"left":raw.right&&!raw.left?"right":null;
   if(!dir||padBlocked.has(dir))menuRepeat={direction:null,next:0};
   else if(dir!==menuRepeat.direction||t>=menuRepeat.next){navigateMenu(dir);menuRepeat.next=t+(dir===menuRepeat.direction?130:280);menuRepeat.direction=dir}
   if(edges.back||edges.pause)menuBack();else if(edges.confirm)activateMenu();
   applyMovement(t);return;
 }
 for(const action of ["pause","party","rotate","rotateCCW","drop"])if(edges[action]){performGameAction(action);if(menuRoot())break}
 applyMovement(t);
}
function handleControlsKeydown(e){
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 const code=eventCode(e),action=controlActionForEvent(e),root=syncInputContext();
 if(!root&&!action)return;
 // Menu handling is captured before legacy scene key listeners and native button activation.
 e.stopImmediatePropagation();
 const typing=e.target?.matches?.('input:not([type="range"]):not([type="checkbox"]),textarea');
 if(typing&&root&&!pendingRemapAction&&!['Escape','Tab'].includes(code))return;
 e.preventDefault();
 if(e.repeat||keyboardPressed.has(code))return;
 keyboardPressed.add(code);
 if(pendingRemapAction){if(code==="Escape"){pendingRemapAction=null;renderControlPanels("REMAPPING CANCELLED.")}else setControl(pendingRemapAction,code);return}
 if(root){
   if(code==="Escape"||action==="pause"){menuBack();return}
   if(code==="Tab"){navigateMenu(e.shiftKey?"previous":"next");return}
   const direction={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"}[code];
   if(direction){navigateMenu(direction);return}
   if(code==="Enter"||code==="Space"){activateMenu();return}
   if(action==="restart")requestRestart();
   return;
 }
 if(action in keyboardHeld){keyboardHeld[action]=true;applyMovement(performance.now())}else performGameAction(action);
}
function handleControlsKeyup(e){
 keyboardPressed.delete(eventCode(e));const action=controlActionForEvent(e);
 if(action in keyboardHeld){keyboardHeld[action]=false;applyMovement(performance.now())}
}
