// Local visual QA only. Never embedded in the release.
musicEnabled=false;sfxEnabled=false;stopMusic();
document.body.insertAdjacentHTML('beforeend','<aside id="qaScene" style="position:fixed;left:6px;top:6px;z-index:999999;background:white;padding:8px;display:grid;gap:6px;font:12px monospace"><button id="qaRoute">Route scene</button><button id="qaAgatha">Agatha scene</button><button id="qaFrame">Hide QA toolbar</button></aside>');
function compactSceneReset(){clearControlsScreens();document.querySelectorAll('.show,.badge-clickthrough,.leader-clickthrough').forEach(e=>e.classList.remove('show','badge-clickthrough','leader-clickthrough'));gameWindowFocused=true;autoPauseRequested=false;clearHeldInput();}
function compactRouteScene(){
 compactSceneReset();save=freshRun();runMode='adventure';adventureDifficulty='normal';save.bossTest=false;save.starter=4;save.buddy=4;save.team=[4,19];save.collection={'4':bossTestPokemonEntry(8,4),'19':bossTestPokemonEntry(4,19)};save.collection['4'].currentHP=78;save.collection['19'].currentHP=63;save.collection['19'].levelXP=7;save.money=125;save.items=['potion','pokeball'];
 save.routeChain={cursor:1,mode:'story',lines:10,visitedCursors:[1]};save.encounterDex=16;save.encounterLevel=4;save.encounterMaxHP=75;save.encounterHP=46;save.encounterDefeated=false;
 score=2010;runLines=10;gym=1;gymLines=10;gameOver=false;board=emptyBoard();current=piece('S');current.x=3;current.y=3;nextPiece=piece('J');
 ['JJJ.....ZZ','JT..OO.ZZ.','JLL.OO.SSS','JJL.IIIISS'].forEach((r,i)=>board[16+i]=[...r].map(x=>x==='.'?'':x));
 paused=true;autoPauseRequested=false;hideOverlay();updateHUD();drawNext();drawBoard();
}
$('qaRoute').onclick=compactRouteScene;
$('qaAgatha').onclick=()=>{compactSceneReset();document.querySelector('[data-elite-test="2"]').click();beginGymFight();paused=true;autoPauseRequested=false;hideOverlay();updateHUD();drawNext();drawBoard()};
$('qaFrame').onclick=()=>{$('qaScene').hidden=true;autoPauseRequested=false;paused=true;hideOverlay();document.activeElement?.blur()};
compactRouteScene();

