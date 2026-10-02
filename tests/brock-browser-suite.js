// Real KO timers and real victory callbacks. Runs only on an isolated QA origin.
musicEnabled=false;sfxEnabled=false;stopMusic();
const qaErrors=[];window.addEventListener('error',e=>qaErrors.push(e.message));
document.body.insertAdjacentHTML('beforeend','<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run Brock victory regression</button><pre id="qaResults">Ready</pre></aside>');
const qaResults=[];let qaPad=null;
Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>qaPad?[qaPad]:[]});
function qaAssert(ok,message){if(!ok)throw new Error(message)}
function qaTick(){loop(++qaNow)}
function qaTap(i){qaPad.buttons[i]={pressed:true,value:1};qaTick();qaPad.buttons[i]={pressed:false,value:0};qaTick()}
function qaKey(code){window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code==='Enter'?'Enter':code,bubbles:true,cancelable:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));qaTick()}
function qaWait(ms){return new Promise(r=>setTimeout(r,ms))}
function qaLog(name){qaResults.push({name,result:'PASS',paused,town:clonePlain(save.townStop),route:clonePlain(save.routeChain),errors:qaErrors.slice()});$('qaResults').textContent=JSON.stringify(qaResults,null,2)}
async function qaSetup(mode='adventure'){
 clearControlsScreens();document.querySelectorAll('.show,.badge-clickthrough,.leader-clickthrough').forEach(e=>e.classList.remove('show','badge-clickthrough','leader-clickthrough'));
 Object.defineProperty(document,'hidden',{configurable:true,value:false});gameWindowFocused=true;autoPauseRequested=false;
 bossTestPrepareRun(0);save.bossTest=false;runMode=mode;save.routeChain={cursor:5,mode:'story',lines:0,visitedCursors:[1,4,5]};beginGymFight();
 qaPad={id:'QA Brock Controller',index:0,connected:true,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]};padIdentity=null;inputContext=undefined;qaTick();
 qaAssert(isGymBattle()&&!paused,'Brock battle did not start');
}
$('qaRun').onclick=async()=>{
 $('qaRun').disabled=true;const before=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
 try{
  for(const input of ['keyboard','controller','pointer','blur','quest']){
   await qaSetup();
   if(input==='quest'){save.questDone=SIDE_QUESTS.slice(0,5).map(q=>q.id);save.questActive=['pewter_proof','team_builder'];save.questProgress={};}
   const count=GYMS[0].team.length;
   for(let i=0;i<count;i++){
    qaAssert(save.gymBattle?.teamIndex===i,'Wrong opponent index '+i);save.encounterHP=1;
    board=emptyBoard();board[19].fill('I');board[19][4]='';board[19][5]='';current=piece('O');current.x=4;current.y=0;hard();
    qaAssert(save.encounterDefeated&&paused,'Line clear did not defeat opponent '+i);
    await qaWait(i<count-1?950:1050);qaTick();qaAssert(!qaErrors.length,qaErrors.join('; '));
   }
   qaAssert(gymVictoryClickthroughActive&&$('momentModal').classList.contains('leader-clickthrough'),'Leader victory missing');
   if(input==='blur'){window.dispatchEvent(new Event('blur'));qaNow+=60000;qaTick();window.dispatchEvent(new Event('focus'));qaTick();}
   qaLog(input+': final KO opens Brock dialogue');
   if(input==='keyboard')qaKey('Enter');else if(input==='controller')qaTap(0);else $('momentContinue').click();
   await qaWait(220);qaTick();qaAssert($('momentModal').classList.contains('badge-clickthrough'),'Badge acceptance missing');qaLog(input+': accepts Boulder Badge');
   if(input==='keyboard')qaKey('Enter');else if(input==='controller')qaTap(0);else $('momentContinue').click();
   await qaWait(170);qaTick();
   qaAssert(isShown('townModal')&&save.townStop?.gymIndex===0&&save.badges.includes(0),'Did not return to Pewter');qaAssert(!qaErrors.length,qaErrors.join('; '));qaLog(input+': returns to Pewter');
   $('townContinueBtn').click();qaTick();qaAssert(!isShown('townModal')&&!paused&&inputCanPlay(),'Next route blocked');qaAssert(save.routeChain.cursor===6&&routeChainIsRoute()&&currentRoute()==='ROUTE 3','Story route did not advance to Route 3');qaLog(input+': Route 3 playable');
   saveRunProgress('Brock QA',true);const saved=localStorage.getItem(ADVENTURE_RUN_SAVE_KEY);qaAssert(saved&&JSON.parse(saved).save.badges.includes(0),'Badge progress not saved');qaLog(input+': saves route and badge');
  }
 }catch(error){qaResults.push({result:'FAIL',error:error.message,errors:qaErrors,phase:{paused,gymBattle:save.gymBattle,town:save.townStop,route:save.routeChain,modal:$('momentModal').className,title:$('momentTitle').textContent,focused:document.activeElement?.id}})}
 finally{for(const k of Object.keys(localStorage))if(!before.has(k))localStorage.removeItem(k);for(const [k,v] of before)localStorage.setItem(k,v)}
 $('qaResults').textContent=JSON.stringify({passed:qaResults.filter(x=>x.result==='PASS').length,failed:qaResults.filter(x=>x.result==='FAIL').length,tests:qaResults},null,2);$('qaResults').dataset.complete='true';
};
