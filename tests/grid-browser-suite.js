musicEnabled=false;sfxEnabled=false;stopMusic();const eqResults=[],eqErrors=[];let qaPad=null;
window.addEventListener('error',e=>eqErrors.push(e.message));
document.body.insertAdjacentHTML('beforeend','<aside id="qaPanel" style="position:fixed;inset:8px;z-index:999999;background:white;color:black;overflow:auto;padding:16px;font:14px monospace"><button id="qaRun">Run Battle Tower QA</button><button id="qaGary">Preview Gary</button><button id="qaReward">Preview Rogue rewards</button><button id="qaFinale">Preview Champion finale</button><pre id="qaResults">Ready</pre></aside>');
function eqAssert(v,m){if(!v)throw Error(m)}
function eqSetup(mode='adventure',starter=1){
 if(practiceSession)exitPractice();if(productionCredits.open)finishProductionCredits();clearControlsScreens();cancelCampaignTransition();qaCampaignTimers.length=0;clearTimeout(showMilestoneMoment.timer);gymVictoryClickthroughActive=false;
 document.querySelectorAll('.show,.leader-clickthrough,.badge-clickthrough').forEach(e=>e.classList.remove('show','leader-clickthrough','badge-clickthrough'));document.querySelector('.app').inert=false;
 Object.defineProperty(document,'hidden',{configurable:true,value:false});gameWindowFocused=true;autoPauseRequested=false;pendingEeveeEvolution=null;keyboardPressed.clear();qaPad=null;padIdentity=null;padHeld={};padPrevious={};padBlocked.clear();inputContext=undefined;
 bossTestPrepareRun(0);save.bossTest=false;save.gymBattle=null;runMode=mode;adventureDifficulty='normal';save.journey={version:1,rivals:[],starterChoice:starter,championDefeated:false,legacyClear:false};save.starter=starter;
 save.team=[starter,9,65,68,131,112].filter((x,i,a)=>a.indexOf(x)===i);save.buddy=9;save.collection={};save.team.forEach(d=>save.collection[d]=bossTestPokemonEntry(65,d));save.badges=[];save.league={next:0,cleared:false,hallOfFame:[]};save.leagueSchema=1;
 save.questActive=[];save.questDone=[];save.trainingMode=null;save.items=[];save.pc=[];save.svenPcItems=[];save.money=0;save.townStop=null;
 if(mode==='rogue'){pendingRogueConfig={seed:'QA-SEED',difficulty:'normal'};initializeExpeditionRun();}
 syncStoryTrainers();board=emptyBoard();current=piece('T');current.y=0;nextPiece=piece('J');bag=['O','S','Z','I','L'];score=1000;runLines=0;gym=1;gymLines=0;paused=false;gameOver=false;last=qaNow;resetPieceMotion();clearControlsScreens();hideOverlay();
}
function eqTown(i){save.badges=Array.from({length:[1,3,8][i]},(_,n)=>n);const c=i===2?LEAGUE_TOWN_CURSOR:routeChainCityCursorByGym([1,3][i]);routeChainShowTownAtCursor(c);return c;}
function eqChampion(){save.badges=[0,1,2,3,4,5,6,7];save.journey.rivals=[0,1,2];save.league={next:4,cleared:false,hallOfFame:[]};routeChainShowTownAtCursor(LEAGUE_TOWN_CURSOR);startEliteBattle();$('gymIntroBtn').disabled=false;beginGymFight();}
function eqDrain(){while(qaCampaignTimers.length){const t=qaCampaignTimers.shift();if(!t.cancelled)t.fn();}}
function eqWin(){let n=0;while(isGymBattle()&&!practiceSession?.result&&n++<7){defeatGymPokemon(save.encounterDex);eqDrain();menuRoot();}eqAssert(n<8,'Battle failed to end');}
function eqOffer(gymIndex=0){save.badges=Array.from({length:gymIndex+1},(_,i)=>i);routeChainShowTownAtCursor(routeChainCityCursorByGym(gymIndex));queueRogueReward(gymIndex);showRogueRewards();}
function eqPad(indices){if(!qaPad){qaPad={id:'Expansion QA',index:0,connected:true,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]};pollGamepad(++qaNow);}qaPad.buttons.forEach((b,i)=>{b.pressed=indices.includes(i);b.value=Number(b.pressed)});pollGamepad(++qaNow)}
function eqTap(i){eqPad([i]);eqPad([])}
async function eqCase(name,fn){try{eqSetup();await fn();eqAssert(!eqErrors.length,eqErrors.join(';'));eqResults.push({name,result:'PASS'});}catch(e){eqResults.push({name,result:'FAIL',error:e.stack});eqErrors.length=0;}$('qaResults').textContent=JSON.stringify(eqResults,null,2);await new Promise(r=>setTimeout(r,0));}
$('qaRun').textContent='Run grid QA';$('qaGary').textContent='Preview grid';$('qaReward').textContent='Preview blocks';$('qaFinale').remove();
function gridSetup(){eqSetup();current=null;comfortSettings.grid=true;comfortSettings.ghost='normal';compactFit();drawBoard();}
function gridMetrics(){const r=canvas.getBoundingClientRect();return {viewport:[innerWidth,innerHeight],ratio:boardPixelRatio(),canvas:[canvas.width,canvas.height],rect:{x:r.x,y:r.y,width:r.width,height:r.height}};}
function gridScan(){
 const w=canvas.width,h=canvas.height,p=ctx.getImageData(0,0,w,h).data;
 const bg=Array.from(p.slice(0,4)),same=i=>bg.every((v,k)=>p[i+k]===v);
 function runs(length,index){const found=[];let begin=-1;for(let i=0;i<=length;i++){const marked=i<length&&!same(index(i)*4);if(marked&&begin<0)begin=i;if(!marked&&begin>=0){found.push({start:begin,width:i-begin});begin=-1;}}return found;}
 const vertical=runs(w,x=>2*w+x),horizontal=runs(h,y=>y*w+2);
 eqAssert(vertical.length===9&&horizontal.length===19,'Wrong number of internal lines');
 const cell=vertical[0].start,line=vertical[0].width;
 eqAssert(vertical.every((r,i)=>r.start===(i+1)*cell&&r.width===line)&&horizontal.every((r,i)=>r.start===(i+1)*cell&&r.width===line),'Uneven spacing or thickness');
 eqAssert(w===cell*10&&h===cell*20,'Edge cells differ from inner cells');
 const colors=new Set();for(let i=0;i<p.length;i+=4){eqAssert(p[i+3]===255,'Transparent/antialiased background');colors.add(p.slice(i,i+4).join(','));}eqAssert(colors.size===2,'Grid has blended edge pixels');
 return {cell,line,vertical:vertical.length,horizontal:horizontal.length};
}
function gridPreview(blocks=false){gridSetup();if(blocks){for(let x=0;x<10;x++)board[19][x]=['I','O','T','J','L','S','Z','I','T','L'][x];current=piece('T');current.y=5;drawBoard();}paused=true;updateHUD();drawKantoMap();clearTimeout(captureFlashTimer);setModal('capture',false);$('qaPanel').hidden=true;}
$('qaGary').onclick=()=>gridPreview();$('qaReward').onclick=()=>gridPreview(true);
$('qaRun').onclick=async()=>{
 eqResults.length=0;$('qaRun').disabled=true;const stored=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),comfort={...comfortSettings};let metrics;
 try{
  await eqCase('All 200 cells are square, equally spaced, with identical solid grid lines',()=>{gridSetup();metrics={...gridMetrics(),...gridScan()};});
  await eqCase('Canvas maps one-to-one to screen pixels and starts on a pixel boundary',()=>{gridSetup();const m=gridMetrics(),r=m.rect;eqAssert(Math.abs(r.width*m.ratio-canvas.width)<.05&&Math.abs(r.height*m.ratio-canvas.height)<.05,'Canvas is being stretched');eqAssert(Math.abs(r.x*m.ratio-Math.round(r.x*m.ratio))<.04&&Math.abs(r.y*m.ratio-Math.round(r.y*m.ratio))<.04,'Fractional origin');eqAssert(r.x>=0&&r.y>=0&&r.x+r.width<=innerWidth+1&&r.y+r.height<=innerHeight+1,'Board clipped');});
  await eqCase('Fractional display densities retain exact spacing and uniform line weight',()=>{gridSetup();const base=boardPixelRatio;try{for(const ratio of [.8,1,1.25,1.5,1.75,2,2.625]){boardPixelRatio=()=>ratio;compactFit();drawBoard();gridScan();}}finally{boardPixelRatio=base;compactFit();drawBoard();}});
  await eqCase('Each locked block renders identically in every column and row',()=>{gridSetup();comfortSettings.grid=false;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)board[y][x]='T';drawBoard();const cell=canvas.width/COLS,first=ctx.getImageData(0,0,cell,cell).data;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const p=ctx.getImageData(x*cell,y*cell,cell,cell).data;eqAssert(p.every((v,i)=>v===first[i]),'Different block geometry at '+x+','+y);}});
  await eqCase('Grid toggle removes every line without changing the board background',()=>{gridSetup();comfortSettings.grid=false;drawBoard();const p=ctx.getImageData(0,0,canvas.width,canvas.height).data;eqAssert(p.every((v,i)=>v===p[i%4]),'Grid pixels remained');});
  await eqCase('Reduce Motion preserves static pixel alignment and disables board shaking',()=>{gridSetup();const before=document.body.classList.contains('comfort-still');try{document.body.classList.add('comfort-still');compactFit();drawBoard();const m=gridMetrics();eqAssert(Math.abs(m.rect.x*m.ratio-Math.round(m.rect.x*m.ratio))<.04&&Math.abs(m.rect.y*m.ratio-Math.round(m.rect.y*m.ratio))<.04,'Reduced motion removed alignment');eqAssert(getComputedStyle(canvas).animationName==='none','Board still animates');gridScan();}finally{document.body.classList.toggle('comfort-still',before);}});
  await eqCase('Gym themes use the same exact grid and drawing never changes game state',()=>{gridSetup();for(const index of [0,5,6,7]){save.gymBattle=campaignNewBattle(index);const before=JSON.stringify({board,current,save});drawBoard();gridScan();eqAssert(JSON.stringify({board,current,save})===before,'Rendering mutated gameplay');}});
  await eqCase('Fire warning reaches the last row and drawing restores its transform',()=>{gridSetup();save.gymBattle=campaignNewBattle(6);save.gymBattle.flameWarningTimer=1000;save.gymBattle.flameColumn=2;drawBoard();const cell=canvas.width/10,a=ctx.getImageData(cell*2+cell/2,canvas.height-5,1,1).data,b=ctx.getImageData(cell*3+cell/2,canvas.height-5,1,1).data;eqAssert(a.some((v,i)=>v!==b[i]),'Fire warning does not reach bottom');const t=ctx.getTransform();eqAssert(t.a===1&&t.d===1&&t.e===0&&t.f===0,'Canvas transform leaked');});
 }finally{comfortSettings=comfort;for(const k of Object.keys(localStorage))if(!stored.has(k))localStorage.removeItem(k);for(const [k,v]of stored)localStorage.setItem(k,v);}
 $('qaResults').textContent=JSON.stringify({version:'1.8.11',metrics,passed:eqResults.filter(t=>t.result==='PASS').length,failed:eqResults.filter(t=>t.result==='FAIL').length,tests:eqResults},null,2);$('qaRun').disabled=false;
};
