// BASE: grid-browser-suite.js
$('qaRun').textContent='Run offline and stress audit';$('qaGary').textContent='Preview offline badges';$('qaReward').remove();$('qaFinale').remove();
$('qaGary').onclick=()=>{eqSetup();save.badges=[0,1,2,3,4,5,6,7];renderBadges();openMainMenu();$('mainBadges').click();$('qaPanel').hidden=true;};
function auditState(){
 eqAssert(board.length===ROWS&&board.every(r=>r.length===COLS&&r.every(v=>v===''||Object.hasOwn(ENERGY_THEME,v))),'Invalid board cells');
 eqAssert(Number.isFinite(score)&&score>=0&&Number.isInteger(runLines)&&runLines>=0,'Invalid score/lines');
 const state=tetrisState();eqAssert(state.lockElapsed>=0&&state.lockElapsed<=TETRIS_LOCK_MS&&state.lockResets>=0&&state.lockResets<=TETRIS_LOCK_RESETS,'Lock budget escaped bounds');
 if(current&&!gameOver)eqAssert(!collides(current),'Live piece overlaps settled cells');
}
$('qaRun').onclick=async()=>{
 eqResults.length=0;$('qaRun').disabled=true;let actions=0,attempts=0;
 await eqCase('Badges decode and render with external network assets blocked',async()=>{await fanBadgeSheet.decode();eqAssert(fanBadgeReady&&!fanBadgeError,'Badge art unavailable');for(let n=0;n<8;n++){const c=document.createElement('canvas');c.width=96;c.height=78;drawBadge(c,n,false);const p=c.getContext('2d').getImageData(0,0,96,78).data;eqAssert(p.some((v,i)=>i%4===3&&v>0),'Badge is blank '+n)}});
 await eqCase('Title, map and Pokémon sprites decode without network access',async()=>{for(const img of [document.querySelector('#titleScreen img'),pixelMapImage,fanSpriteSheet]){await img.decode();eqAssert(img.naturalWidth>0,'Missing packaged image')}});
 await eqCase('Every default Gym Leader portrait decodes offline',async()=>{for(const src of CUSTOM_GYM_LEADER_ART){const img=new Image();img.src=src;await img.decode();eqAssert(img.naturalWidth>0,'Missing leader portrait')}});
 await eqCase('Handheld text scale follows the active display profile',()=>{if(!document.documentElement.classList.contains('kanto-handheld'))return;openMainMenu();const wide=matchMedia('(min-width:1600px)').matches;eqAssert(parseFloat(getComputedStyle($('mainResume')).fontSize)===(wide?36:32),'Action text scale did not follow viewport');eqAssert(parseFloat(getComputedStyle($('mainMenuModal')).fontSize)===(wide?32:28),'Body text scale did not follow viewport');});
 await eqCase('Nickname help remains readable on the handheld display',()=>{if(!document.documentElement.classList.contains('kanto-handheld'))return;openDexDetail(1);openNicknameEditor(1);eqAssert(parseFloat(getComputedStyle($('nicknameHelp')).fontSize)>=28,'Nickname help fell below the handheld text size');});
 for(const level of [1,8,15])await eqCase('Randomized movement, Hold, pause and retry stress at level '+level,async()=>{
  openPractice();$('practiceEncounter').value='-1';$('practiceSpeed').value=String(level);$('practiceGoal').value='0';$('practiceStart').click();eqAssert(practiceIsFree(),'Free Practice did not begin');
  const keys=[...ADVENTURE_SLOT_KEYS,RUN_SAVE_KEY],persisted=JSON.stringify(keys.map(k=>localStorage.getItem(k)));
  let seed=0x57b0+level;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2200;i++){
   if(practiceSession.result){startPracticeAttempt();attempts++;}
   const action=Math.floor(rnd()*8);
   if(action===0)move(-1);else if(action===1)move(1);else if(action===2)rotate(1);else if(action===3)rotate(-1);else if(action===4)holdPiece();else if(action===5)soft();else if(action===6)hard();else{
    const before=JSON.stringify([board,current,score]);paused=true;move(1);rotate();soft();hard();holdPiece();advanceTetrisGravity(60000);eqAssert(JSON.stringify([board,current,score])===before,'Paused input changed play');paused=false;
   }
   advanceTetrisGravity(16);auditState();actions++;
   if(i%100===0)await new Promise(r=>window.setTimeout(r,0));
  }
  exitPractice();eqAssert(JSON.stringify(keys.map(k=>localStorage.getItem(k)))===persisted,'Stress Practice changed saved campaign');
 });
 $('qaPanel').hidden=false;$('qaRun').disabled=false;$('qaResults').textContent=JSON.stringify({passed:eqResults.filter(t=>t.result==='PASS').length,failed:eqResults.filter(t=>t.result==='FAIL').length,viewport:[innerWidth,innerHeight],actions,attempts,tests:eqResults},null,2);
};
