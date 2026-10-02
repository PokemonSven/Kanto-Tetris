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
clearInterval(soundtrackPoll);
const audioWait=ms=>new Promise(r=>window.setTimeout(r,ms));
async function audioUntil(test,label){for(let i=0;i<160;i++){if(test())return;await audioWait(50);}throw Error('Timed out: '+label+' '+soundtrackStatus);}
async function audioPlaying(){await audioUntil(()=>!soundtrackAudio.paused&&soundtrackAudio.currentTime>.03,'playback');}
async function audioCase(name,fn){musicEnabled=false;stopMusic();await eqCase(name,async()=>{classicalManualTrackLocked=false;classicalManualContextKey='';oakIntro=null;save.legendary={active:null};save.tower=null;save.routeChain={cursor:1,lines:0,mode:'story',visitedCursors:[1]};soundtrackForeground=true;comfortSettings.musicVolume=100;musicEnabled=true;await fn();});}
window.nativeAudioFocus=()=>{$('mainOptions').click();syncInputContext();focusMenuElement($('trackBtn'),$('optionsPanel'));};
$('qaRun').textContent='Run soundtrack QA';$('qaGary').textContent='Preview soundtrack';$('qaReward').textContent='Preview town music';$('qaFinale').remove();
function audioDemo(town=false){
 eqSetup();musicEnabled=true;classicalManualTrackLocked=false;soundtrackForeground=true;
 save.routeChain={cursor:1,lines:0,mode:'story',visitedCursors:[1]};save.legendary={active:null};
 if(town)routeChainShowTownAtCursor(0);else routeChainStartAtCursor(routeChainCursorForRoute('ROUTE 9'),'training',null);
 clearControlsScreens();paused=true;hideOverlay();compactFit();drawBoard();drawNext();updateHUD();
 $('qaPanel').hidden=true;openMainMenu();classicalAutoSelectMusic();
}
$('qaGary').onclick=()=>audioDemo();$('qaReward').onclick=()=>audioDemo(true);
$('qaRun').onclick=async()=>{
 $('qaRun').disabled=true;eqResults.length=0;
 await audioCase('Every packaged album track loads, decodes and advances offline',async()=>{
   const rows=[];
   for(let i=0;i<MUSIC_TRACKS.length;i++){
     playMusicTrack(i);await audioPlaying();rows.push({number:MUSIC_TRACKS[i].number,duration:soundtrackAudio.duration});
     eqAssert(soundtrackAudio.duration>20&&Number.isFinite(soundtrackAudio.duration),'Invalid duration: '+MUSIC_TRACKS[i].name);
     eqAssert(new URL(soundtrackAudio.currentSrc).origin===location.origin,'Remote music source');
   }
   $('qaResults').dataset.tracks=JSON.stringify(rows);
   eqAssert(rows.length===38&&document.querySelectorAll('audio').length===1,'Track count or overlapping players');
 });
 await audioCase('All campaign towns and routes resolve to packaged music',()=>{
   for(let i=0;i<ROUTE_CHAIN_NODES.length;i++){
     const node=ROUTE_CHAIN_NODES[i];save.routeChain.cursor=i;save.townStop=null;
     const number=soundtrackContext().number,expected=node.type==='town'?FRLG_TOWNS[node.city.toUpperCase()]:FRLG_ROUTES[node.route.toUpperCase()];
     eqAssert(expected&&number===expected,'Unmapped location '+JSON.stringify(node));
     eqAssert(MUSIC_TRACKS.some(t=>t.number===number),'Missing recording '+number);
   }
   for(let n=1;n<=25;n++)eqAssert(FRLG_ROUTES['ROUTE '+n],'Route '+n);
 });
 await audioCase('GBA town sharing and cave themes are correct',()=>{
   eqAssert(FRLG_TOWNS['VIRIDIAN CITY']===15&&FRLG_TOWNS['SAFFRON CITY']===15,'Pewter arrangement');
   eqAssert(FRLG_TOWNS['CERULEAN CITY']===50&&FRLG_TOWNS['FUCHSIA CITY']===50,'Fuchsia arrangement');
   eqAssert(FRLG_ROUTES['SEAFOAM ISLANDS']===17&&FRLG_ROUTES['CERULEAN CAVE']===45&&FRLG_ROUTES['VICTORY ROAD']===34,'Cave tracks');
 });
 await audioCase('Gym, Elite Four, Champion, rival, Rocket and Tower themes',()=>{
   for(let n=0;n<=21;n++){save.gymBattle={active:true,gymIndex:n};eqAssert(soundtrackContext().number===(n===12?70:n>=13&&n<=18?11:27),'Battle '+n);}
 });
 await audioCase('Legendary birds and Mewtwo get their dedicated recordings',()=>{
   for(const dex of [144,145,146,150]){save.legendary.active={dex,phase:'trial'};eqAssert(soundtrackContext().number===(dex===150?68:53),'Legendary '+dex);}
 });
 await audioCase('Title, Oak, tutorial, Hall of Fame and credits themes',()=>{
   setModal('titleScreen',true);eqAssert(soundtrackContext().number===3,'Title');setModal('titleScreen',false);
   oakIntro={step:'welcome'};eqAssert(soundtrackContext().number===5,'Welcome');oakIntro.step='choose';eqAssert(soundtrackContext().number===8,'Lab');oakIntro=null;
   setModal('oakBattleLesson',true);eqAssert(soundtrackContext().number===4,'Tutorial');setModal('oakBattleLesson',false);
   setModal('championFinale',true);eqAssert(soundtrackContext().number===72,'Hall of Fame');setModal('championFinale',false);
   productionCredits.open=true;eqAssert(soundtrackContext().number===73,'Credits');productionCredits.open=false;
 });
 await audioCase('Track button selects once and remains locked through HUD updates',async()=>{
   classicalAutoSelectMusic();await audioPlaying();const old=currentTrack;
   $('trackBtn').click();eqAssert(currentTrack===(old+1)%MUSIC_TRACKS.length,'Track skipped: '+old+' -> '+currentTrack+' / '+$('trackBtn').outerHTML);const chosen=currentTrack;
   updateHUD();updateHUD();eqAssert(currentTrack===chosen&&classicalManualTrackLocked,'Manual overridden');
   save.routeChain.cursor=routeChainCursorForRoute('ROUTE 3');classicalAutoSelectMusic();eqAssert(!classicalManualTrackLocked&&MUSIC_TRACKS[currentTrack].number===32,'Travel did not restore auto');
 });
 await audioCase('HUD updates do not restart music and rapid travel uses only the last track',async()=>{
   classicalAutoSelectMusic();await audioPlaying();soundtrackAudio.currentTime=10;updateHUD();eqAssert(soundtrackAudio.currentTime>=9.9,'HUD restart');
   for(const n of [6,27,50,38,13])playMusicTrack(soundtrackIndex(n));await audioPlaying();
   eqAssert(MUSIC_TRACKS[currentTrack].number===13&&soundtrackAudio.currentSrc.endsWith('/frlg-13.mp3')&&musicTimer===null,'Stale track or synth scheduler');
 });
 await audioCase('Music mute and volume are independent of sound effects',async()=>{
   classicalAutoSelectMusic();await audioPlaying();const effects=sfxEnabled;
   comfortSettings.musicVolume=0;applyComfortAudio();eqAssert(soundtrackAudio.volume===0,'Zero volume');
   comfortSettings.musicVolume=50;applyComfortAudio();eqAssert(Math.abs(soundtrackAudio.volume-.325)<.001,'Half volume');
   $('musicBtn').click();eqAssert(!musicEnabled&&soundtrackAudio.paused&&sfxEnabled===effects,'Mute affected effects');
   $('musicBtn').click();await audioPlaying();eqAssert(musicEnabled&&sfxEnabled===effects,'Unmute');
 });
 await audioCase('Background pauses and foreground resumes at the same position',async()=>{
   classicalAutoSelectMusic();await audioPlaying();soundtrackAudio.currentTime=8;
   if(window.KantoAndroid)KantoAndroid.lifecycle(false);else soundtrackLifecycle(false);
   const time=soundtrackAudio.currentTime;await audioWait(200);eqAssert(soundtrackAudio.paused&&Math.abs(soundtrackAudio.currentTime-time)<.05,'Background audio');
   if(window.KantoAndroid)KantoAndroid.lifecycle(true);else soundtrackLifecycle(true);
   await audioUntil(()=>soundtrackAudio.currentTime>time+.05,'resume');
 });
 await audioCase('Seeking and end-of-track repeat work with packaged MP3 files',async()=>{
   playMusicTrack(soundtrackIndex(6));await audioPlaying();soundtrackAudio.currentTime=soundtrackAudio.duration-.18;
   await audioUntil(()=>soundtrackAudio.currentTime<2&&!soundtrackAudio.paused,'repeat');eqAssert(soundtrackAudio.loop,'Loop disabled');
 });
 await audioCase('Missing file reports clearly and the next valid track recovers',async()=>{
   playMusicTrack(0);soundtrackAudio.src='music/frlg-99.mp3';soundtrackAudio.load();await audioUntil(()=>soundtrackStatus==='missing','missing status');
   eqAssert($('nowPlaying').textContent.includes('UNAVAILABLE'),'Missing file hidden');playMusicTrack(soundtrackIndex(6));await audioPlaying();
 });
 await audioCase('Local audio server supports ranges and rejects traversal',async()=>{
   if(location.protocol==='file:')return;
   const t=MUSIC_TRACKS[0],part=await fetch(t.file,{headers:{Range:'bytes=5-14'}});
   const partSize=(await part.arrayBuffer()).byteLength;eqAssert(part.status===206&&partSize===10&&part.headers.get('Content-Range').startsWith('bytes 5-14/'),'Range: '+part.status+' bytes='+partSize+' '+JSON.stringify([...part.headers]));
   const suffix=await fetch(t.file,{headers:{Range:'bytes=-10'}}).catch(e=>{throw Error('Suffix fetch: '+e.message)});eqAssert(suffix.status===206&&(await suffix.arrayBuffer()).byteLength===10,'Suffix range');
   let invalidRejected=false;try{const invalid=await fetch(t.file,{headers:{Range:'bytes=999999999-'}});invalidRejected=invalid.status===416;}catch(e){invalidRejected=e instanceof TypeError;}eqAssert(invalidRejected,'Invalid range');
   const bad=await fetch('music/not-a-track.mp3');eqAssert(bad.status===403,'Unexpected asset permitted');
 });
 musicEnabled=false;stopMusic();$('qaResults').textContent=JSON.stringify({passed:eqResults.filter(t=>t.result==='PASS').length,failed:eqResults.filter(t=>t.result==='FAIL').length,viewport:[innerWidth,innerHeight],tracks:JSON.parse($('qaResults').dataset.tracks||'[]'),tests:eqResults},null,2);$('qaRun').disabled=false;
};
