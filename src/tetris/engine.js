// Piece movement, Hold and gravity have one owner. Campaign transitions call spawn().
const TETRIS_ROW_MS=[650,550,460,380,300,233,183,133,100,83,67,50,42,33,25];
const TETRIS_MAX_LEVEL=15,TETRIS_NORMAL_MAX_LEVEL=8,TETRIS_HARD_MAX_LEVEL=12;
const TETRIS_SPEED_RULESET='badge-v1';
const TETRIS_LOCK_MS=500,TETRIS_LOCK_RESETS=15;
let motionPiece=null,tetrisHUDKey='';
function tetrisState(){
 if(!save.tetris)save.tetris={hold:null,used:false,lockElapsed:0,lockResets:0};
 return save.tetris;
}
function cleanTetrisState(raw){
 return {hold:raw?.hold&&Object.hasOwn(SHAPES,raw.hold)?raw.hold:null,used:raw?.used===true,
 lockElapsed:Math.max(0,Math.min(TETRIS_LOCK_MS,Number(raw?.lockElapsed)||0)),lockResets:Math.max(0,Math.min(TETRIS_LOCK_RESETS,Math.floor(Number(raw?.lockResets)||0)))};
}
function campaignSpeedDifficulty(){return isAdventureMode()?adventureDifficulty:save.rogue?.difficulty||'normal';}
function campaignSpeedCap(){return campaignSpeedDifficulty()==='hard'?TETRIS_HARD_MAX_LEVEL:TETRIS_NORMAL_MAX_LEVEL;}
function normalPracticeLevel(boss){return Math.min(TETRIS_NORMAL_MAX_LEVEL,Math.max(1,boss+1));}
function badgeSpeedLevel(){
 if(isAdventureMode()&&adventureDifficulty==='easy')return 1;
 const badges=Math.min(8,new Set((save.badges||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<8)).size);
 return Math.min(campaignSpeedCap(),1+badges*(campaignSpeedDifficulty()==='hard'?2:1));
}
function tetrisLevel(){
 if(practiceSession)return Math.min(TETRIS_MAX_LEVEL,practiceSession.config.level||normalPracticeLevel(practiceSession.config.boss));
 // Travel, training, bosses, rematches and legendary trials share earned-badge progression.
 return badgeSpeedLevel();
}
function effectiveTetrisLevel(){return Math.max(1,tetrisLevel()-(save.oakWatchActive?2:0));}
function speed(){
 if(legendaryActive())return TETRIS_ROW_MS[tetrisLevel()-1];
 if(practiceSession)return TETRIS_ROW_MS[tetrisLevel()-1];
 const adventure=isAdventureMode(),easy=adventure&&adventureDifficulty==='easy',minimum=TETRIS_ROW_MS[campaignSpeedCap()-1];
 const difficulty=adventure?1:rogueGravityMultiplier(),bike=easy?1:v10SpeedBikeMultiplier();
 return Math.max(minimum,TETRIS_ROW_MS[effectiveTetrisLevel()-1]/(difficulty*bike*adventureManualSpeedMultiplier()));
}
function speedMultiplier(){return BASE_DROP_MS/speed();}
function resetPieceMotion(reset=true){
 motionPiece=current;dropCounter=0;
 if(reset){const s=tetrisState();s.lockElapsed=0;s.lockResets=0;}
}
function spawn(deferTopout=false){
 const forced=pullPendingGymSpecialPiece();
 if(forced){current=forced;feed.unshift(isTowerBattle()?'TOWER HAZARD! MANDATORY '+(forced.type==='G'?'GHOST':'STONE')+' BRICK.':forced.type==='G'?'GHOST DROP! AGATHA FORCED A FAST FALLING GHOST BRICK.':isRocketBattle()?'RELAY SURGE! A FAST FALLING STONE WAS RELEASED.':'STONE DROP! BROCK FORCED A FAST FALLING GREY BOULDER BLOCK.');feed=feed.slice(0,12);}
 else{current=nextPiece||piece(take());current.x=Math.floor(COLS/2)-Math.ceil(current.matrix[0].length/2);nextPiece=piece(take());}
 current.y=-1;tetrisState().used=false;resetPieceMotion();drawNext();renderTetrisHUD();
 if(!deferTopout&&collides(current))endGame();
}
function holdBlockedReason(){
 if(current?.specialRockfall||current?.type==='X'||current?.type==='G'||save.gymBattle?.pendingHazards>0)return 'HAZARD';
 if(tetrisState().used)return 'USED';
 if(controlsLocked()||sabrinaSpinActive())return 'LOCKED';
 return '';
}
function holdPiece(){
 if(!inputCanPlay()||!current||holdBlockedReason()||!Object.hasOwn(SHAPES,current.type))return false;
 const state=tetrisState(),outgoing=current.type,incoming=state.hold;
 if(incoming){current=piece(incoming);resetPieceMotion();}
 else spawn(true);
 state.hold=outgoing;state.used=true;
 if(practiceSession)practiceSession.holds++;
 // Holding is not a line clear: enemy pressure, hazards, combo and HP are unchanged.
 drawNext();renderTetrisHUD();drawBoard();if(collides(current))endGame();return true;
}
function grounded(){return !!current&&collides(current,0,1);}
function adjustLockAfterMove(wasGrounded){
 const s=tetrisState();if(wasGrounded&&s.lockResets<TETRIS_LOCK_RESETS){s.lockElapsed=0;s.lockResets++;}
}
function move(dx){
 if(paused||gameOver||controlsLocked()||!current)return;
 const before=grounded();if(!collides(current,dx,0)){current.x+=dx;adjustLockAfterMove(before);}
}
function rotate(direction=1){
 if(paused||gameOver||controlsLocked()||sabrinaSpinActive()||!current||current.type==='O')return;
 const before=grounded(),r=direction<0?rotateM(rotateM(rotateM(current.matrix))):rotateM(current.matrix);
 for(const dx of [0,-1,1,-2,2])if(!collides(current,dx,0,r)){current.matrix=r;current.x+=dx;adjustLockAfterMove(before);beep(240,.025);return;}
}
function soft(manual=true){
 if(paused||gameOver||!current||(manual&&(controlsLocked()||sabrinaSpinActive())))return;
 if(!collides(current,0,1)){current.y++;if(manual){score+=adventureScoreValue(1);updateHUD();}}
 else if(current.specialRockfall)lock();
 dropCounter=0;
}
function hard(){
 if(paused||gameOver||!current||controlsLocked()||sabrinaSpinActive())return;
 let distance=0;while(!collides(current,0,1)){current.y++;distance++;}
 score+=adventureScoreValue(distance*2);beep(150,.035);lock();dropCounter=0;
}
function lock(){
 if(!current)return 0;
 if(practiceSession&&!current.specialRockfall)practiceSession.pieces++;
 merge();const cleared=(legendaryActive()?clearLegendaryLines():practiceIsFree()?clearPracticeLines():clearLines())||0;
 practiceAfterLock(cleared);
 if(isKogaBattle()&&!paused&&!gameOver)kogaPoisonTick();
 if(!townStopIsOpen()&&!gameOver&&!(legendaryActive()&&save.legendary.active.phase!=='trial'))spawn();if(practiceSession)updateHUD();return cleared;
}
function advanceTetrisGravity(delta){
 if(!current||paused||gameOver)return;
 if(motionPiece!==current)resetPieceMotion();
 const elapsed=Math.max(0,Math.min(100,delta)),before=grounded(),s=tetrisState();
 const forced=current.specialRockfall,interval=forced?Math.min(BROCK_STONE_DROP_MS,speed()):(downHeld?Math.max(4,speed()/20):speed());
 dropCounter+=elapsed;let rows=0;
 while(dropCounter>=interval&&rows<32&&!grounded()){
   current.y++;rows++;dropCounter-=interval;
   if(downHeld&&!forced)score+=adventureScoreValue(1);
 }
 if(rows&&downHeld&&!forced)updateHUD();
 if(grounded()){
   dropCounter=0;
   // A forced brick retains its immediate landing/lock behavior.
   if(forced){lock();return;}
   if(before)s.lockElapsed+=elapsed;
   if(s.lockElapsed>=TETRIS_LOCK_MS)lock();
 }
}

function renderTetrisHUD(){
 const label=$('tetrisSpeedLevel');if(label)label.textContent=tetrisLevel();
 const hold=$('holdPiece');if(!hold)return;
 const state=tetrisState(),reason=holdBlockedReason(),key=[state.hold,reason,tetrisLevel(),speed(),save.badges.length,save.oakWatchActive].join(':');if(key===tetrisHUDKey)return;tetrisHUDKey=key;
 const ctx=hold.getContext('2d');ctx.clearRect(0,0,hold.width,hold.height);
 if(state.hold){const m=SHAPES[state.hold],size=Math.floor(hold.width/6),ox=(hold.width-m[0].length*size)/2,oy=(hold.height-m.length*size)/2;ctx.save();ctx.translate(ox,oy);m.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(ctx,x,y,state.hold,size)}));ctx.restore();}
 $('holdStatus').textContent=reason||'READY';hold.parentElement.classList.toggle('hold-unavailable',!!reason);
 hold.setAttribute('aria-label',`Held piece: ${state.hold||'empty'}. ${reason||'Hold ready'}.`);
 const status=$('tetrisSpeedInfo');if(status)status.textContent=`SPEED LEVEL ${tetrisLevel()} • ${Math.round(speed())} ms per row${save.oakWatchActive?' • OAK’S WATCH: −2 LEVELS':''}. Speed levels rise only when you earn a new badge, never from line clears or entering a battle. Normal starts at 1, adds 1 per badge and caps at 8 (133 ms/row). Hard starts at 1, adds 2 per badge and caps at 12 (50 ms/row). Both caps apply after speed modifiers. Adventure Easy stays at level 1 (650 ms/row); its manual speed/score slider remains available. Legendary trials use your badge level. Rogue uses the same badge steps/caps and its existing difficulty modifiers. Practice uses its explicitly selected drill speed. Soft drop is up to 20×; forced hazard bricks retain their fast fall. Grounded pieces have 0.5 seconds to lock, with at most 15 movement/rotation resets. Hard drop locks immediately.`;
}
function initializeTetrisUI(){
 const screen=document.querySelector('.compact-trainer>.screen');
 // Keep all previews and trainer data to the left, freeing the board's full height.
 $('next').width=240;$('next').height=160;
 screen.insertAdjacentHTML('afterbegin','<div class="compact-hold"><b>HOLD</b><canvas id="holdPiece" width="240" height="160" role="img"></canvas><small id="holdStatus">READY</small></div>');
 screen.querySelector('.compact-numbers').insertAdjacentHTML('beforeend','<div class="stat"><span class="k">LV</span><b class="v" id="tetrisSpeedLevel">1</b></div>');
 const layout=document.querySelector('.game-layout'),left=document.createElement('section');
 left.className='compact-left';left.setAttribute('aria-label','Trainer data, previews and team');
 layout.prepend(left);left.append(screen.parentElement,document.querySelector('.compact-team'));
 const panelBase=selectGamePanel;selectGamePanel=function(id){panelBase(id);compactFit();};
 $('optionsPanel').querySelector('.options-grid').insertAdjacentHTML('beforeend','<div class="options-card"><h3>HOLD & SPEED</h3><p class="tiny">Hold: Shift (remappable) / L2. Once per piece, available again after locking. Forced stone/ghost bricks and queued hazards block Hold. Hold never resets enemy timers. Agatha and Sabrina still hide NEXT.</p><p class="tiny" id="tetrisSpeedInfo"></p></div>');
 renderTetrisHUD();
 compactFit();
}
