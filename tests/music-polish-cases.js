clearInterval(soundtrackPoll);
const audioWait=ms=>new Promise(r=>window.setTimeout(r,ms));
async function audioUntil(test,label){for(let i=0;i<300;i++){if(test())return;await audioWait(50);}throw Error('Timed out: '+label+' '+soundtrackStatus);}
async function audioPlaying(){await audioUntil(()=>soundtrackStatus==='playing'&&soundtrackVoice?.track.number===MUSIC_TRACKS[currentTrack].number&&soundtrackPosition()>.03,'playback');}
async function audioCase(name,fn){musicEnabled=false;stopMusic();soundtrackCancelFanfares();await eqCase(name,async()=>{soundtrackSettings={mode:'auto',track:3};classicalManualTrackLocked=false;oakIntro=null;save.legendary={version:1,cleared:[],caught:[],active:null};save.tower=null;save.routeChain={cursor:1,lines:0,mode:'story',visitedCursors:[1]};soundtrackForeground=true;comfortSettings.musicVolume=100;comfortSettings.sfxVolume=100;sfxEnabled=true;musicEnabled=true;ensureAudio();await fn();});}
window.nativeAudioFocus=()=>{$('mainOptions').click();syncInputContext();focusMenuElement($('trackBtn'),$('optionsPanel'));};
window.nativeAudioState=()=>({position:soundtrackPosition(),paused:audioCtx?.state!=='running',status:soundtrackStatus});
$('qaRun').textContent='Run music polish QA';$('qaGary').textContent='Preview music options';$('qaReward').textContent='Preview town music';$('qaFinale').remove();
function audioDemo(town=false){
 eqSetup();musicEnabled=true;sfxEnabled=true;soundtrackSettings={mode:'auto',track:3};soundtrackForeground=true;save.legendary={version:1,cleared:[],caught:[],active:null};save.routeChain={cursor:1,lines:0,mode:'story',visitedCursors:[1]};
 if(town)routeChainShowTownAtCursor(0);else routeChainStartAtCursor(routeChainCursorForRoute('ROUTE 9'),'training',null);
 clearControlsScreens();paused=true;hideOverlay();compactFit();drawBoard();drawNext();updateHUD();$('qaPanel').hidden=true;openMainMenu();$('mainOptions').click();ensureAudio();classicalAutoSelectMusic();
 $('musicBtn').textContent='MUSIC: ON';$('sfxBtn').textContent='SFX: ON';
}
$('qaGary').onclick=()=>audioDemo();$('qaReward').onclick=()=>audioDemo(true);
async function audioCues(fn){const base=soundtrackFanfare,cues=[];soundtrackFanfare=k=>cues.push(k);try{await fn(cues);}finally{soundtrackFanfare=base;}}
$('qaRun').onclick=async()=>{
 $('qaRun').disabled=true;eqResults.length=0;const stored=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
 try{
 await audioCase('All 42 local assets decode; loops render across the boundary without gaps',async()=>{
   const rows=[];
   for(const track of [...FRLG_SOUNDTRACK.tracks,...FRLG_SOUNDTRACK.fanfares]){
     const buffer=await soundtrackLoad(track);eqAssert(buffer.duration>3&&buffer.numberOfChannels===2,'Invalid recording '+track.number);
     let difference=0;
     if(track.loop){
       const rate=buffer.sampleRate,start=Math.round(track.loopStart*rate),end=Math.min(buffer.length,Math.round(track.loopEnd*rate)),count=Math.round(rate*.25),lead=Math.round(rate*.05);
       eqAssert(end>start&&end<=buffer.length,'Loop outside decoded audio');
       const offline=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(2,count,rate),source=offline.createBufferSource();source.buffer=buffer;source.loop=true;source.loopStart=start/rate;source.loopEnd=end/rate;source.connect(offline.destination);source.start(0,(end-lead)/rate);
       const rendered=await offline.startRendering();
       for(let ch=0;ch<2;ch++){const got=rendered.getChannelData(ch),pcm=buffer.getChannelData(ch);eqAssert(Math.abs(pcm[end-1]-pcm[start])<.00001,'Codec join '+track.number);for(let i=lead+2;i<count;i++)difference=Math.max(difference,Math.abs(got[i]-pcm[start+i-lead]));}
       eqAssert(difference<.002,'Discontinuous loop '+track.number+' '+difference);
     }
     const bytes=[...soundtrackCache.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0);eqAssert(soundtrackCache.size<=3&&bytes<=64*1024*1024,'Unbounded decode cache');
     rows.push({number:track.number,seconds:buffer.duration,loop:track.loop,renderDifference:difference});
   }
   eqAssert(rows.length===42,'Asset count');$('qaResults').dataset.tracks=JSON.stringify(rows);
 });
 await audioCase('Every town, route and battle context resolves to a packaged track',()=>{
   for(let i=0;i<ROUTE_CHAIN_NODES.length;i++){const node=ROUTE_CHAIN_NODES[i];save.routeChain.cursor=i;save.townStop=null;const n=soundtrackContext().number,expected=node.type==='town'?FRLG_TOWNS[node.city.toUpperCase()]:FRLG_ROUTES[node.route.toUpperCase()];eqAssert(expected===n&&MUSIC_TRACKS.some(t=>t.number===n),'Unmapped location '+i);}
   for(let n=0;n<=21;n++){save.gymBattle={active:true,gymIndex:n};eqAssert(soundtrackContext().number===(n===12?70:n>=13&&n<=18?11:27),'Battle '+n);}save.gymBattle=null;
   for(const dex of [144,145,146,150]){save.legendary.active={dex,phase:'trial'};eqAssert(soundtrackContext().number===(dex===150?68:53),'Legendary '+dex);}
 });
 await audioCase('Town transitions crossfade and rapid travel keeps only the final selection',async()=>{
   playMusicTrack(soundtrackIndex(6));await audioPlaying();const old=soundtrackVoice;await soundtrackLoad(MUSIC_TRACKS[soundtrackIndex(15)]);
   playMusicTrack(soundtrackIndex(15));await audioPlaying();eqAssert(soundtrackVoice!==old&&old.stopping&&soundtrackVoices.size===2,'No crossfade');
   for(const n of [27,38,50,13])playMusicTrack(soundtrackIndex(n));await audioPlaying();await audioWait(750);
   eqAssert(soundtrackVoices.size===1&&soundtrackVoice.track.number===13&&musicTimer===null,'Stale/overlapping music');
 });
 await audioCase('Normal HUD updates do not restart the current track',async()=>{
   classicalAutoSelectMusic();await audioPlaying();const v=soundtrackVoice,t=soundtrackPosition();for(let i=0;i<10;i++)updateHUD();await audioWait(80);eqAssert(soundtrackVoice===v&&soundtrackPosition()>t,'HUD restarted audio');
 });
 await audioCase('Named selection persists through travel, mute and saved preferences',async()=>{
   $('soundtrackTrack').value='38';$('soundtrackTrack').dispatchEvent(new Event('change'));await audioPlaying();
   save.routeChain.cursor=routeChainCursorForRoute('ROUTE 3');classicalContextChangedAutoSwitch();updateHUD();eqAssert(soundtrackVoice.track.number===38&&soundtrackSettings.mode==='manual','Manual changed on travel');
   toggleMusic();toggleMusic();await audioPlaying();eqAssert(soundtrackVoice.track.number===38,'Mute reset selection');
   saveComfort();soundtrackSettings={mode:'auto',track:3};applyStoredPreferences();eqAssert(soundtrackSettings.mode==='manual'&&soundtrackSettings.track===38,'Preference not restored');
   $('soundtrackMode').value='auto';$('soundtrackMode').dispatchEvent(new Event('change'));await audioPlaying();eqAssert(soundtrackVoice.track.number===32,'Auto did not follow route');
 });
 await audioCase('Legacy preferences and backups remain compatible; malformed music choices reject',()=>{
   const legacy={music:true,sfx:true,comfort:{...comfortSettings}};localStorage.setItem(AUDIO_PREF_KEY,JSON.stringify(legacy));applyStoredPreferences();eqAssert(soundtrackSettings.mode==='auto','Old preferences did not default to Auto');
   clearControlsScreens();save.encounterDefeated=false;for(const k of [...ADVENTURE_SLOT_KEYS,RUN_SAVE_KEY])localStorage.removeItem(k);const backup=capturePortableBackup(false);delete backup.data.preferences.audio.soundtrack;validateBackup(backup);
   backup.data.preferences.audio.soundtrack={mode:'manual',track:999};let rejected=false;try{validateBackup(backup);}catch{rejected=true;}eqAssert(rejected,'Invalid track imported');
   backup.data.preferences.audio.soundtrack={mode:'manual',track:38};validateBackup(backup);eqAssert(JSON.parse(backupToStorage(backup)[AUDIO_PREF_KEY]).soundtrack.track===38,'Backup lost selection');
 });
 await audioCase('Controller selection changes exactly once and audio controls fit the screen',()=>{
   const readPad=firstGamepad;firstGamepad=()=>qaPad;try{
   clearControlsScreens();openMainMenu();$('mainOptions').click();eqPad([]);focusMenuElement($('soundtrackTrack'),$('optionsPanel'));const i=$('soundtrackTrack').selectedIndex;eqTap(15);eqAssert($('soundtrackTrack').selectedIndex===(i+1)%38,'D-pad track selection');
   focusMenuElement($('trackBtn'),$('optionsPanel'));const before=currentTrack;eqTap(0);eqAssert(currentTrack===(before+1)%38,'A double-selected');
   for(const id of ['soundtrackMode','soundtrackTrack']){focusMenuElement($(id),$('optionsPanel'));const r=$(id).getBoundingClientRect();eqAssert(r.width>50&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,'Clipped '+id);}
   }finally{firstGamepad=readPad;}
 });
 await audioCase('Music and fanfare volume/mute remain independent',async()=>{
   classicalAutoSelectMusic();await audioPlaying();comfortSettings.musicVolume=0;applyComfortAudio();await audioWait(120);eqAssert(soundtrackBus.gain.value===0,'Music volume');
   comfortSettings.sfxVolume=50;applyComfortAudio();await audioWait(120);eqAssert(Math.abs(fanfareBus.gain.value-.375)<.001,'Fanfare volume');
   toggleMusic();soundtrackFanfare('capture');await audioUntil(()=>soundtrackFanfareVoice,'Fanfare with music off');eqAssert(!musicEnabled&&sfxEnabled,'SFX linked to music mute');toggleSfx();eqAssert(!soundtrackFanfareVoice&&!soundtrackFanfareQueue.length,'SFX mute left fanfare');
 });
 await audioCase('Fanfares duck music and restore it after the complete cue',async()=>{
   classicalAutoSelectMusic();await audioPlaying();const v=soundtrackVoice;soundtrackFanfare('victory');await audioUntil(()=>soundtrackFanfareVoice,'Victory cue');await audioWait(120);eqAssert(Math.abs(soundtrackDuck.gain.value-.18)<.01,'No duck');
   await audioUntil(()=>!soundtrackFanfareVoice&&!soundtrackFanfareLoading,'Cue finished');await audioWait(350);eqAssert(soundtrackDuck.gain.value===1&&soundtrackVoice===v,'Music did not restore without restart');
 });
 await audioCase('Repeated events have bounded queues and changing runs cancels pending cues',async()=>{
   for(let i=0;i<30;i++)soundtrackFanfare('capture');eqAssert(soundtrackFanfareQueue.length<=1,'Repeated capture backlog');soundtrackFanfare('evolution');soundtrackFanfare('badge');eqAssert(soundtrackFanfareQueue.length<=3,'Queue unbounded');
   soundtrackCancelFanfares();await audioWait(250);eqAssert(!soundtrackFanfareVoice&&!soundtrackFanfareQueue.length,'Cancelled cue returned');
 });
 await audioCase('Background suspends the clock and foreground continues at its prior position',async()=>{
   classicalAutoSelectMusic();await audioPlaying();soundtrackLifecycle(false);await audioUntil(()=>audioCtx.state==='suspended','Background pause');const t=soundtrackPosition();await audioWait(200);eqAssert(soundtrackPosition()===t,'Clock advanced in background');soundtrackLifecycle(true);await audioUntil(()=>soundtrackPosition()>t+.05,'Resume');
 });
 await audioCase('Only successful catches and completed evolutions play their fanfares',()=>audioCues(async cues=>{
   const random=gameRandom;try{gameRandom=()=>.999999;catchWild(16);eqAssert(!cues.includes('capture'),'Failed catch celebrated');gameRandom=()=>0;catchWild(16);eqAssert(cues.filter(x=>x==='capture').length===1,'Successful catch missing');}finally{gameRandom=random;}
   const entry=save.collection[1];eqAssert(!evolve(1,{to:[]},entry)&&!cues.includes('evolution'),'Rejected evolution celebrated');eqAssert(evolve(1,{to:[2]},entry),'Evolution failed');eqAssert(cues.filter(x=>x==='evolution').length===1,'Evolution cue count');
 }));
 await audioCase('Gym win and badge acceptance each play once; losses do not celebrate',()=>audioCues(async cues=>{
   startGymBattle(0);loadGymPokemon(GYMS[0].team.length-1);save.encounterDefeated=true;save.encounterHP=0;completeGymBattle();completeGymBattle();eqAssert(cues.filter(x=>x==='victory').length===1,'Victory count');
   $('momentModal').click();await audioUntil(()=>$('momentModal').classList.contains('badge-clickthrough'),'Badge screen');$('momentModal').click();await audioUntil(()=>cues.includes('badge'),'Badge fanfare');eqAssert(cues.filter(x=>x==='badge').length===1,'Badge count '+cues.join());awardBadge(0);eqAssert(cues.filter(x=>x==='badge').length===1,'Duplicate badge cue');
   clearControlsScreens();startGymBattle(1);campaignLoss('stack');eqAssert(cues.filter(x=>x==='victory').length===1,'Loss celebrated');
 }));
 await audioCase('Rocket storage failure waits for a successful commit before victory music',()=>audioCues(async cues=>{
   save.badges=[0,1];save.rocketStory={version:1,accepted:false,completed:[],researchLines:0,choices:[],completedAt:[]};routeChainShowTownAtCursor(rocketTownCursor(0));eqAssert(startRocketBattle(0,'careful'),'Rocket start');loadGymPokemon(GYMS[16].team.length-1);save.encounterDefeated=true;save.encounterHP=0;
   try{portabilityStorageLocked=true;completeGymBattle();eqAssert(!cues.includes('victory'),'Unsaved victory celebrated');}finally{portabilityStorageLocked=false;}
   completeRocketBattle();completeRocketBattle();eqAssert(cues.filter(x=>x==='victory').length===1,'Rocket retry cue count');
 }));
 await audioCase('Missing assets reject cleanly and a valid selection still plays',async()=>{
   let rejected=false;try{await soundtrackLoad({number:99,file:'music/frlg-99.js'});}catch{rejected=true;}eqAssert(rejected,'Missing file accepted');playMusicTrack(soundtrackIndex(6));await audioPlaying();
 });
 await audioCase('Credits retain their complete ending instead of looping a fragment',()=>{const credits=MUSIC_TRACKS[soundtrackIndex(73)];eqAssert(!credits.loop&&credits.seconds>250,'Credits truncated');});
 }finally{musicEnabled=false;stopMusic();soundtrackCancelFanfares();portabilityStorageLocked=false;for(const k of Object.keys(localStorage))if(!stored.has(k))localStorage.removeItem(k);for(const [k,v] of stored)localStorage.setItem(k,v);}
 $('qaResults').textContent=JSON.stringify({version:'1.8.13',passed:eqResults.filter(t=>t.result==='PASS').length,failed:eqResults.filter(t=>t.result==='FAIL').length,viewport:[innerWidth,innerHeight],tracks:JSON.parse($('qaResults').dataset.tracks||'[]'),tests:eqResults},null,2);$('qaRun').disabled=false;
};
