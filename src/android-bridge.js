// Build 1.7.5 Android: use Android KeyEvent/MotionEvent input as the sole pad source.
// Keyboard input remains independent. Browser distributions never execute this adapter.
function initializeAndroidBridge(){
 if(!window.KantoHost)return;
 let nativePad=null,faceLayout=KantoHost.faceLayout(),testing=false,testSeen=new Set(),testStart=false;
 if(!['standard','swapped'].includes(faceLayout))faceLayout='standard';
 const baseReadPad=readPad;
 firstGamepad=()=>nativePad;
 readPad=function(gp){
   if(!gp||faceLayout==='standard')return baseReadPad(gp);
   const buttons=gp.buttons.slice();[buttons[0],buttons[1]]=[buttons[1],buttons[0]];[buttons[2],buttons[3]]=[buttons[3],buttons[2]];
   return baseReadPad({...gp,buttons});
 };
 document.querySelector('.options-grid').insertAdjacentHTML('afterbegin',`<div class="options-card" id="androidOptions"><h3>RETROID CONTROLLER</h3><p>Start: pause / resume · Select: Inventory<br>D-pad / left stick: move and soft drop<br>A / R1: clockwise · X / L1: counterclockwise<br>B / Y / R2: hard drop · L2: Hold<br>A: select · B: back</p><label>FACE BUTTON MAPPING <select id="androidFaceLayout"><option value="standard">STANDARD ANDROID A/B/X/Y</option><option value="swapped">SWAP A ↔ B AND X ↔ Y</option></select></label><p class="tiny">Match this setting to your Retroid's controller mode. Swapping also swaps confirm/back. Hold delay and repeat interval are adjustable below. Start + Select opens the restart confirmation.</p><button id="androidTestController" class="smallbtn">TEST CONTROLLER</button><p id="androidDisplayInfo" class="tiny"></p></div>`);
 $('androidFaceLayout').value=faceLayout;
 $('androidFaceLayout').addEventListener('change',()=>{clearHeldInput();faceLayout=$('androidFaceLayout').value;KantoHost.setFaceLayout(faceLayout)});
 document.body.insertAdjacentHTML('beforeend','<div class="controls-modal" id="androidControllerTest" role="dialog" aria-modal="true" aria-labelledby="androidTestTitle" aria-hidden="true"><div class="controls-card"><h2 id="androidTestTitle">CONTROLLER TEST</h2><p>Press each button, move both sticks, and squeeze both triggers. Lit labels record what Android has received. No game actions run here.</p><p id="androidTestDevice"></p><pre id="androidTestState" style="white-space:pre-wrap;line-height:1.7"></pre><p>Press START to return to Options. L2 holds a piece in gameplay. L3, R3 and the right stick are detected here but have no gameplay action.</p><button id="androidTestClose">BACK TO OPTIONS</button></div></div>');
 navModalIds.unshift('androidControllerTest');
 const basePauseDialog=pauseDialogOpen;
 pauseDialogOpen=()=>testing||basePauseDialog();
 const baseMenuBack=menuBack;
 const closeTest=()=>{testing=false;setModal('androidControllerTest',false);clearHeldInput();inputContext=undefined;resetMenuFocus(menuRoot())};
 menuBack=function(){if(testing){closeTest();return}baseMenuBack()};
 const basePoll=pollGamepad;
 pollGamepad=function(t){
   if(!testing){basePoll(t);return;}
   const start=gamepadButtonDown(nativePad,9);
   if(start&&!testStart){testStart=true;closeTest();return;}
   testStart=start;padHeld=readPad(nativePad);padPrevious={...padHeld};clearHeldInput();
 };
 const labels=['A','B','X','Y','L1','R1','L2','R2','SELECT','START','L3','R3','UP','DOWN','LEFT','RIGHT','MODE'];
 function renderTest(){
   $('androidTestDevice').textContent=nativePad?nativePad.id:'No controller detected. Press a button to connect.';
   const pressed=[];
   nativePad?.buttons.forEach((b,i)=>{if(b.pressed){testSeen.add(labels[i]);pressed.push(labels[i])}});
   nativePad?.axes.forEach((v,i)=>{if(v<-.45)testSeen.add(['LS ←','LS ↑','RS ←','RS ↑'][i]);if(v>.45)testSeen.add(['LS →','LS ↓','RS →','RS ↓'][i])});
   $('androidTestState').textContent='HELD: '+(pressed.join(' · ')||'—')+'\nSTICKS: '+(nativePad?.axes||[]).map(v=>v.toFixed(2)).join(' / ')+'\nTRIGGERS: '+[6,7].map(i=>(nativePad?.buttons[i]?.value||0).toFixed(2)).join(' / ')+'\n\nSEEN: '+[...testSeen].join(' · ');
 }
 $('androidTestController').addEventListener('click',()=>{requestAutoPause();clearHeldInput();testSeen.clear();testing=true;testStart=gamepadButtonDown(nativePad,9);setModal('androidControllerTest',true);renderTest();resetMenuFocus($('androidControllerTest'))});
 $('androidTestClose').addEventListener('click',closeTest);
 // Use SAF for downloads; the browser download attribute does not save a Blob in Android WebView.
 downloadBackupFile=function(backup,name){KantoHost.exportBackup(JSON.stringify(backup,null,2),name)};
 const baseExport=exportPortableBackup;
 $('backupExport').removeEventListener('click',baseExport);
 exportPortableBackup=function(){
   try{const backup=capturePortableBackup();downloadBackupFile(backup,`Kanto-Tetris-backup-${backup.exportedAt.replace(/[:.]/g,'-')}.json`);$('backupMessage').textContent='Choose a folder and save the JSON backup in Android’s file picker.';return true;}
   catch(error){$('backupMessage').textContent=error.message;reportSave('export',false,'Backup export failed');return false;}
 };
 $('backupExport').addEventListener('click',exportPortableBackup);
 // Native controller events do not grant WebView's file-input user activation.
 // Open SAF directly, then use the same validated preview and confirmation flow.
 const choose=$('backupChoose'),nativeChoose=choose.cloneNode(true);choose.replaceWith(nativeChoose);
 nativeChoose.addEventListener('click',()=>KantoHost.importBackup());
 window.KantoAndroid={
   pad(packet){
     nativePad=packet?{id:String(packet.id),index:0,connected:true,mapping:'standard',buttons:Array.from({length:17},(_,i)=>{const value=Math.max(0,Math.min(1,Number(packet.buttons?.[i])||0));return {value,pressed:value>.55}}),axes:Array.from({length:4},(_,i)=>Math.max(-1,Math.min(1,Number(packet.axes?.[i])||0)))}:null;
     if(testing)renderTest();
     // Process every native transition, including press/release pairs between animation frames.
     pollGamepad(performance.now());
     if(packet?.buttons?.some(v=>v>.55)&&gameWindowFocused){ensureAudio();if(audioCtx?.state==='suspended')audioCtx.resume();}
   },
   lifecycle(active){
     soundtrackLifecycle(active,true);
     gameWindowFocused=!!active;if(oakIntro)oakIntro.lastAt=null;keyboardPressed.clear();clearHeldInput();
     if(!active){requestAutoPause();if(save?.starter&&!save.bossTest&&!gameOver&&!portabilityTransitionBusy())saveRunProgress('Android background',true);if(audioCtx?.state==='running')audioCtx.suspend();}
     else{last=performance.now();enforceAutoPause();if(audioCtx?.state==='suspended')audioCtx.resume();}
   },
   display(display){applyKantoAndroidDisplay(display);compactFit();$('androidDisplayInfo').textContent=`AUTO LANDSCAPE • ${display.width} × ${display.height} • ${display.width/display.height>=1.6?'16:9':'4:3'} layout`;},
   back(){if(testing){closeTest();return;}if(isShown('titleScreen')||isShown('studioIntro')){KantoHost.exit();return;}if(menuRoot())menuBack();else openMainMenu();},
   exportResult(ok,message){$('backupMessage').textContent=message;reportSave('export',ok,message);},
   importResult(text,error){
     if(!isShown('backupModal'))return;
     if(error){$('backupMessage').textContent=error;return;}
     return previewBackupFile(new File([text],'Kanto-Tetris-backup.json',{type:'application/json'}));
   }
 };
 KantoAndroid.display(JSON.parse(KantoHost.display()));
}
