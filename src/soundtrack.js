// Offline recordings use Web Audio loop points and scheduled gain transitions.
// Local script assets also load when the Windows build is opened via file://.
const FRLG_SOUNDTRACK=__FRLG_SOUNDTRACK__;
const FRLG_TOWNS={'PALLET TOWN':6,'VIRIDIAN CITY':15,'PEWTER CITY':15,'CERULEAN CITY':50,'VERMILION CITY':35,'LAVENDER TOWN':38,'CELADON CITY':40,'FUCHSIA CITY':50,'SAFFRON CITY':15,'CINNABAR ISLAND':55,'INDIGO PLATEAU':69};
const FRLG_ROUTES={'VIRIDIAN FOREST':17,'MT. MOON':34,"DIGLETT'S CAVE":17,'ROCK TUNNEL':34,'POKÉMON TOWER':39,'SAFARI ZONE':30,'POWER PLANT':56,'SEAFOAM ISLANDS':17,'VICTORY ROAD':34,'CERULEAN CAVE':45,'INDIGO GATE':69};
for(let n=1;n<=25;n++)FRLG_ROUTES['ROUTE '+n]=n<=2?13:n>=11&&n<=15?48:n===23?69:n>=19&&n<=21?52:n>=16&&n<=18?37:32;
let soundtrackSettings={mode:'auto',track:3},soundtrackForeground=true,soundtrackNativeActive=true,soundtrackEpoch=0,soundtrackStatus='ready',soundtrackPoll=null;
let soundtrackVoice=null,soundtrackVoices=new Set(),soundtrackBus=null,soundtrackDuck=null,fanfareBus=null;
let soundtrackLoading=null,soundtrackLoadChain=Promise.resolve(),soundtrackCache=new Map(),soundtrackLoads=new Map(),soundtrackReceivers=new Map();
let soundtrackFanfareVoice=null,soundtrackFanfareQueue=[],soundtrackFanfareEpoch=0,soundtrackFanfareLoading=false,soundtrackOwner=null;
function normalizeSoundtrack(raw){return {mode:raw?.mode==='manual'?'manual':'auto',track:FRLG_SOUNDTRACK.tracks.some(t=>t.number===raw?.track)?raw.track:3};}
function soundtrackContext(){
 if(productionCredits.open)return {key:'credits',number:73};
 if(isShown('championFinale'))return {key:'hall-of-fame',number:72};
 if(isShown('studioIntro')||isShown('titleScreen'))return {key:'title',number:3};
 if(oakIntro)return {key:'oak:'+oakIntro.step,number:oakIntro.step==='welcome'?5:8};
 if(isShown('oakBattleLesson'))return {key:'tutorial',number:4};
 if(legendaryActive())return {key:'legendary:'+save.legendary.active.dex,number:+save.legendary.active.dex===150?68:53};
 if(isGymBattle()){
   const n=+save.gymBattle.gymIndex;
   return {key:'battle:'+n,number:n===12?70:n>=13&&n<=18?11:27};
 }
 const node=isAdventureMode()&&save?.routeChain?routeChainNode():null;
 const town=save?.townStop?.active?(save.townStop.cityName||node?.city):node?.type==='town'?node.city:null;
 if(town)return {key:'town:'+town,number:FRLG_TOWNS[town.toUpperCase()]||15};
 const route=node?.type==='route'?node.route:currentRoute();
 return {key:'route:'+route,number:FRLG_ROUTES[String(route).toUpperCase()]||13};
}
function soundtrackIndex(number){return Math.max(0,MUSIC_TRACKS.findIndex(t=>t.number===number));}
function soundtrackCanPlay(){return musicEnabled&&currentTrack>=0&&soundtrackForeground&&!document.hidden;}
function soundtrackRamp(param,value,seconds=.08){const now=audioCtx.currentTime;param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(value,now+seconds);}
function soundtrackBuses(){
 if(!audioCtx||soundtrackBus)return;
 soundtrackBus=audioCtx.createGain();soundtrackDuck=audioCtx.createGain();fanfareBus=audioCtx.createGain();
 soundtrackBus.connect(soundtrackDuck);soundtrackDuck.connect(masterGain);fanfareBus.connect(masterGain);
 soundtrackBus.gain.value=.65*comfortSettings.musicVolume/100;fanfareBus.gain.value=sfxEnabled?.75*comfortSettings.sfxVolume/100:0;
}
function soundtrackEvict(){
 let bytes=[...soundtrackCache.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0);
 for(const [n,b] of soundtrackCache){
   if(soundtrackCache.size<=3&&bytes<=64*1024*1024)break;
   soundtrackCache.delete(n);bytes-=b.length*b.numberOfChannels*4;
 }
}
function soundtrackLoad(track){
 if(soundtrackCache.has(track.number)){const b=soundtrackCache.get(track.number);soundtrackCache.delete(track.number);soundtrackCache.set(track.number,b);return Promise.resolve(b);}
 if(soundtrackLoads.has(track.number))return soundtrackLoads.get(track.number);
 // Decode serially: rapid travel cannot allocate an album's worth of buffers.
 const load=soundtrackLoadChain.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{
   const script=document.createElement('script');let received=false;
   const timeout=window.setTimeout(()=>finish(Error('Audio load timeout')),15000);
   function finish(error,buffer){window.clearTimeout(timeout);script.remove();soundtrackReceivers.delete(track.number);error?reject(error):resolve(buffer);}
   soundtrackReceivers.set(track.number,encoded=>{
     received=true;
     try{const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
       audioCtx.decodeAudioData(bytes.buffer).then(b=>{
         if(track.loop){
           const start=Math.round(track.loopStart*b.sampleRate),end=Math.min(b.length,Math.round(track.loopEnd*b.sampleRate)),count=Math.min(start,Math.round(.02*b.sampleRate));
           // Repair codec/resampler edge padding after decoding, without changing
           // the length of a musical phrase. The actual loop is sample scheduled.
           for(let ch=0;ch<b.numberOfChannels;ch++){const pcm=b.getChannelData(ch);for(let i=0;i<count;i++){const w=i/(count-1);pcm[end-count+i]=pcm[end-count+i]*(1-w)+pcm[start-count+1+i]*w;}}
         }
         soundtrackCache.set(track.number,b);soundtrackEvict();finish(null,b);
       },finish);
     }catch(error){finish(error);}
   });
   script.src=track.file;script.onerror=()=>finish(Error('Audio file unavailable'));script.onload=()=>{if(!received)finish(Error('Invalid audio asset'));};document.head.appendChild(script);
 }));
 soundtrackLoadChain=load;soundtrackLoads.set(track.number,load);load.then(()=>soundtrackLoads.delete(track.number),()=>soundtrackLoads.delete(track.number));return load;
}
function soundtrackStopVoice(voice,fade=0){
 if(!voice||(voice.stopping&&fade))return;voice.stopping=true;
 if(fade)soundtrackRamp(voice.gain.gain,0,fade);
 try{voice.source.stop(audioCtx.currentTime+fade);}catch{}
 if(!fade){soundtrackVoices.delete(voice);voice.source.disconnect();voice.gain.disconnect();}
}
function soundtrackPosition(){
 if(!soundtrackVoice||!audioCtx)return 0;
 const t=audioCtx.currentTime-soundtrackVoice.started,track=soundtrackVoice.track;
 return track.loop&&t>=track.loopEnd?track.loopStart+(t-track.loopStart)%(track.loopEnd-track.loopStart):t;
}
function soundtrackStart(track,buffer,epoch){
 if(epoch!==soundtrackEpoch||!soundtrackCanPlay())return;
 soundtrackBuses();
 // At most the current and outgoing BGM voices remain connected.
 for(const v of soundtrackVoices)if(v!==soundtrackVoice)soundtrackStopVoice(v,0);
 const old=soundtrackVoice,source=audioCtx.createBufferSource(),gain=audioCtx.createGain();
 source.buffer=buffer;source.loop=track.loop;source.loopStart=Math.round(track.loopStart*buffer.sampleRate)/buffer.sampleRate;source.loopEnd=Math.min(buffer.duration,Math.round(track.loopEnd*buffer.sampleRate)/buffer.sampleRate);
 source.connect(gain);gain.connect(soundtrackBus);gain.gain.value=old?0:1;
 const voice={source,gain,track,started:audioCtx.currentTime,stopping:false};soundtrackVoice=voice;soundtrackVoices.add(voice);
 source.onended=()=>{soundtrackVoices.delete(voice);source.disconnect();gain.disconnect();if(soundtrackVoice===voice&&!voice.stopping){soundtrackStatus='finished';soundtrackLabel();}};
 source.start();if(old){soundtrackRamp(gain.gain,1,.65);soundtrackStopVoice(old,.65);}soundtrackStatus='playing';soundtrackLabel();
}
function soundtrackResume(){
 if(!soundtrackCanPlay()||!audioCtx||soundtrackLoading||['missing','finished'].includes(soundtrackStatus))return;
 if(soundtrackVoice&&!soundtrackVoice.stopping&&soundtrackVoice.track.number===MUSIC_TRACKS[currentTrack].number)return;
 const epoch=soundtrackEpoch,track=MUSIC_TRACKS[currentTrack];soundtrackStatus='loading';
 const request=soundtrackLoad(track);soundtrackLoading=request;
 request.then(buffer=>soundtrackStart(track,buffer,epoch),()=>{if(epoch===soundtrackEpoch){soundtrackStatus='missing';soundtrackLabel();}}).finally(()=>{if(soundtrackLoading===request)soundtrackLoading=null;if(epoch!==soundtrackEpoch)soundtrackResume();});
}
function soundtrackLifecycle(active,native=false){
 if(native)soundtrackNativeActive=!!active;
 soundtrackForeground=!!active&&soundtrackNativeActive;
 if(!soundtrackForeground){soundtrackCancelFanfares();if(audioCtx?.state==='running')audioCtx.suspend().catch(()=>{});}
 else if(!document.hidden){if(audioCtx?.state==='suspended')audioCtx.resume().catch(()=>{});soundtrackResume();}
}
function soundtrackLabel(){
 const track=MUSIC_TRACKS[currentTrack>=0?currentTrack:soundtrackIndex(soundtrackSettings.track)];if(!track)return;
 const suffix=soundtrackStatus==='missing'?' · FILE UNAVAILABLE — SELECT AGAIN':soundtrackStatus==='finished'?' · COMPLETE':'';
 const label=musicEnabled?`♪ ${soundtrackSettings.mode==='manual'?'MANUAL · ':''}${track.name.toUpperCase()}${suffix}`:'♪ MUSIC OFF';
 if($('nowPlaying')&&$('nowPlaying').textContent!==label)$('nowPlaying').textContent=label;
 if($('titleTrackName'))$('titleTrackName').textContent=track.name.toUpperCase();
 if($('soundtrackMode'))$('soundtrackMode').value=soundtrackSettings.mode;
 if($('soundtrackTrack'))$('soundtrackTrack').value=String(track.number);
 updateTrackButton();
}
function soundtrackCancelFanfares(){
 soundtrackFanfareEpoch++;soundtrackFanfareQueue=[];soundtrackFanfareLoading=false;
 if(soundtrackFanfareVoice){try{soundtrackFanfareVoice.stop();}catch{}soundtrackFanfareVoice=null;}
 if(soundtrackDuck)soundtrackRamp(soundtrackDuck.gain,1,.2);
}
function soundtrackFanfare(kind){
 if(!sfxEnabled||comfortSettings.sfxVolume===0||!soundtrackForeground||document.hidden)return;
 const number={victory:90,badge:29,evolution:31,capture:54}[kind];if(!number)return;
 ensureAudio();if(!audioCtx)return;
 if(soundtrackOwner!==save){soundtrackCancelFanfares();soundtrackOwner=save;}
 // Coalesce repeated captures; retain distinct rewards without a growing backlog.
 if(!soundtrackFanfareQueue.some(x=>x.number===number))soundtrackFanfareQueue.push({number,owner:save});
 soundtrackFanfareQueue=soundtrackFanfareQueue.slice(-3);soundtrackNextFanfare();
}
function soundtrackNextFanfare(){
 if(soundtrackFanfareVoice||soundtrackFanfareLoading||!soundtrackFanfareQueue.length)return;
 const cue=soundtrackFanfareQueue.shift();if(cue.owner!==save){soundtrackNextFanfare();return;}
 const epoch=soundtrackFanfareEpoch,track=FRLG_SOUNDTRACK.fanfares.find(t=>t.number===cue.number);soundtrackFanfareLoading=true;
 soundtrackLoad(track).then(buffer=>{
   if(epoch!==soundtrackFanfareEpoch||cue.owner!==save||!sfxEnabled||!soundtrackForeground||document.hidden)return;
   soundtrackBuses();const source=audioCtx.createBufferSource();source.buffer=buffer;source.connect(fanfareBus);soundtrackFanfareVoice=source;
   soundtrackRamp(soundtrackDuck.gain,.18,.08);
   source.onended=()=>{source.disconnect();if(soundtrackFanfareVoice!==source)return;soundtrackFanfareVoice=null;if(!soundtrackFanfareQueue.length)soundtrackRamp(soundtrackDuck.gain,1,.3);soundtrackNextFanfare();};source.start();
 }).catch(()=>{}).finally(()=>{if(epoch===soundtrackFanfareEpoch){soundtrackFanfareLoading=false;if(!soundtrackFanfareVoice)soundtrackNextFanfare();}});
}
function soundtrackChoose(mode,number){
 ensureAudio();soundtrackSettings=normalizeSoundtrack({mode,track:number??soundtrackSettings.track});
 if(mode==='manual'){musicEnabled=true;$('musicBtn').textContent='MUSIC: ON';}
 if(soundtrackStatus==='missing'||soundtrackStatus==='finished')stopMusic();
 classicalAutoSelectMusic();soundtrackLabel();saveComfort();
}
function initializeSoundtrack(){
 stopMusic();MUSIC_TRACKS.splice(0,MUSIC_TRACKS.length,...FRLG_SOUNDTRACK.tracks);
 window.KantoMusicAsset=(number,data)=>{soundtrackReceivers.get(number)?.(data);};
 document.querySelectorAll('.footer').forEach(el=>{el.textContent=el.textContent.replace('CLASSICAL CHIPTUNE SOUNDTRACK: TITLE + 8 GYMS + VICTORY','MUSIC: POKÉMON FIRERED & LEAFGREEN — SUPER MUSIC COLLECTION');});
 const baseAudio=applyComfortAudio;applyComfortAudio=function(){baseAudio();soundtrackBuses();if(soundtrackBus){soundtrackRamp(soundtrackBus.gain,.65*comfortSettings.musicVolume/100);soundtrackRamp(fanfareBus.gain,sfxEnabled?.75*comfortSettings.sfxVolume/100:0);}if(!sfxEnabled||comfortSettings.sfxVolume===0)soundtrackCancelFanfares();};
 const baseEnsure=ensureAudio;ensureAudio=function(){if(!soundtrackForeground||document.hidden)return;baseEnsure();soundtrackBuses();soundtrackResume();};
 stopMusic=function(){
   if(musicTimer)clearInterval(musicTimer);musicTimer=null;if(introTimeout)clearTimeout(introTimeout);introTimeout=null;
   soundtrackEpoch++;for(const voice of soundtrackVoices)soundtrackStopVoice(voice);soundtrackVoice=null;currentTrack=-1;musicStep=0;soundtrackStatus='ready';
 };
 playMusicTrack=function(index){
   if(!musicEnabled)return;
   const safe=soundtrackSettings.mode==='manual'?soundtrackIndex(soundtrackSettings.track):Math.max(0,Math.min(MUSIC_TRACKS.length-1,Number(index)||0));
   if(currentTrack===safe){soundtrackResume();return;}
   soundtrackEpoch++;currentTrack=safe;soundtrackStatus='ready';soundtrackLabel();soundtrackResume();
 };
 classicalTrackLengthLabel=track=>track.loop?'Seamless loop':'Full ending';
 classicalCurrentContextKey=()=>soundtrackContext().key;
 classicalManualStillApplies=()=>soundtrackSettings.mode==='manual';
 classicalAutoSelectMusic=function(){if(!musicEnabled)return;classicalManualTrackLocked=soundtrackSettings.mode==='manual';playMusicTrack(soundtrackIndex(classicalManualTrackLocked?soundtrackSettings.track:soundtrackContext().number));};
 classicalContextChangedAutoSwitch=()=>classicalAutoSelectMusic();updateMusicForGym=()=>classicalAutoSelectMusic();playIntroThenGym=()=>classicalAutoSelectMusic();
 toggleMusic=function(){musicEnabled=!musicEnabled;$('musicBtn').textContent=`MUSIC: ${musicEnabled?'ON':'OFF'}`;if(musicEnabled)classicalAutoSelectMusic();else stopMusic();soundtrackLabel();saveComfort();};
 updateTrackButton=function(){const i=currentTrack>=0?currentTrack:soundtrackIndex(soundtrackSettings.track),btn=$('trackBtn');if(btn){btn.textContent=`TRACK: ${i+1}/${MUSIC_TRACKS.length} ▶`;btn.title='Next track · switches to Manual mode';}};
 const old=$('trackBtn'),button=old.cloneNode(true);old.replaceWith(button);
 classicalManualCycleTrack=function(event){if(event){event.preventDefault();event.stopImmediatePropagation();}soundtrackChoose('manual',MUSIC_TRACKS[(currentTrack+1)%MUSIC_TRACKS.length].number);};
 button.addEventListener('click',classicalManualCycleTrack,true);cycleMusicTrack=()=>classicalManualCycleTrack();
 const baseSfx=toggleSfx;toggleSfx=function(){baseSfx();applyComfortAudio();};
 soundCatch=()=>soundtrackFanfare('capture');soundEvo=()=>soundtrackFanfare('evolution');
 document.addEventListener('visibilitychange',()=>soundtrackLifecycle(!document.hidden));window.addEventListener('blur',()=>soundtrackLifecycle(false));window.addEventListener('focus',()=>soundtrackLifecycle(true));
 const activate=()=>{soundtrackForeground=soundtrackNativeActive;ensureAudio();classicalAutoSelectMusic();};document.addEventListener('pointerdown',activate);document.addEventListener('keydown',activate);
 soundtrackOwner=save;soundtrackPoll=setInterval(()=>{if(soundtrackOwner!==save||isShown('titleScreen')){soundtrackCancelFanfares();soundtrackOwner=save;}classicalAutoSelectMusic();},400);
 soundtrackLabel();
}
function initializeSoundtrackUI(){
 $('compactAudio').insertAdjacentHTML('beforeend',`<label class="soundtrack-field" for="soundtrackMode">Music mode<select id="soundtrackMode"><option value="auto">Auto · follow the adventure</option><option value="manual">Manual · keep my track</option></select></label><label class="soundtrack-field" for="soundtrackTrack">Choose a track<select id="soundtrackTrack">${MUSIC_TRACKS.map(t=>`<option value="${t.number}">${t.name}</option>`).join('')}</select></label><p class="tiny">Choosing a track turns on Manual mode. Auto follows towns, routes and battles. Fanfares use sound-effects volume. Left/right changes a selection.</p>`);
 $('soundtrackMode').onchange=()=>soundtrackChoose($('soundtrackMode').value,MUSIC_TRACKS[currentTrack>=0?currentTrack:0].number);
 $('soundtrackTrack').onchange=()=>soundtrackChoose('manual',Number($('soundtrackTrack').value));soundtrackLabel();
}
