/* Kanto Tetris — Classical Chiptune Soundtrack Override
   Public-domain classical melodies arranged for this fan prototype.
   Loaded after game-base.html so the existing game logic stays untouched. */
(() => {
  const TRACKS = [
    {name:"Mozart • Eine kleine Nachtmusik", role:"TITLE", bpm:148, beats:128, build:buildMozart},
    {name:"Grieg • In the Hall of the Mountain King", role:"BROCK", bpm:152, beats:128, build:buildMountain},
    {name:"Saint-Saëns • Aquarium", role:"MISTY", bpm:116, beats:96, build:buildAquarium},
    {name:"Vivaldi • Summer: Presto", role:"LT. SURGE", bpm:176, beats:108, build:buildSummer},
    {name:"Tchaikovsky • Waltz of the Flowers", role:"ERIKA", bpm:168, beats:144, build:buildWaltz},
    {name:"J.S. Bach • Toccata & Fugue in D Minor", role:"KOGA", bpm:144, beats:128, build:buildToccata},
    {name:"Beethoven • Moonlight Sonata III", role:"SABRINA", bpm:172, beats:128, build:buildMoonlight},
    {name:"Vivaldi • Winter: Allegro non molto", role:"BLAINE", bpm:164, beats:128, build:buildWinter},
    {name:"Mozart • Requiem: Dies Irae", role:"GIOVANNI", bpm:152, beats:128, build:buildDiesIrae},
    {name:"Beethoven • Ode to Joy", role:"VICTORY", bpm:138, beats:128, build:buildOde}
  ];
  const WAVES=["pulse25","pulse50","pulse125","triangle","sine"];
  const NOTE_BASE={C:0,"C#":1,DB:1,D:2,"D#":3,EB:3,E:4,F:5,"F#":6,GB:6,G:7,"G#":8,AB:8,A:9,"A#":10,BB:10,B:11};
  let timeline=null,eventIndex=0,loopStart=0,scheduler=null,filter=null;
  const pulseCache={};

  function note(v){
    if(typeof v==="number")return v;if(!v||v==="R")return null;
    const m=String(v).toUpperCase().replace("♯","#").replace("♭","B").match(/^([A-G](?:#|B)?)(-?\d+)$/);
    if(!m)return null;return 12*(Number(m[2])+1)+NOTE_BASE[m[1]];
  }
  function add(list,b,n,d,a=.08,w=0,p=0,v=.0){const nn=note(n);if(nn!=null)list.push([b,0,nn,d,a,w,p,v])}
  function drum(list,b,t,a=.05){list.push([b,1,t,a])}
  function motif(list,start,seq,a=.1,w=0,p=.18,v=.01,transpose=0){
    let b=start;for(const x of seq){const n=x[0],d=x[1];if(n!=="R"&&n!=null)add(list,b,note(n)+transpose,d,a,w,p,v);b+=d}return b;
  }
  function arp(list,bar,chord,meter=4,a=.038,w=1,p=-.25,oct=0){
    const pat=meter===3?[0,1,2,1,2,1]:[0,1,2,1,0,1,2,1],step=meter/pat.length,base=bar*meter;
    for(let i=0;i<pat.length;i++)add(list,base+i*step,note(chord[pat[i]])+oct,step*.78,a,w,p);
  }
  function bass(list,bar,root,meter=4,a=.06){
    const b=bar*meter,r=note(root);
    if(meter===3){add(list,b,r,1.3,a,3,0);add(list,b+1.5,r+7,.7,a*.72,3,0)}
    else{add(list,b,r,1.75,a,3,0);add(list,b+2,r+7,1.65,a*.82,3,0)}
  }
  function beatDrums(list,bar,meter=4,style="standard"){
    const b=bar*meter;
    if(meter===3){drum(list,b,0,.07);drum(list,b+1,2,.022);drum(list,b+2,1,.043);drum(list,b+2,2,.022);return}
    if(style==="storm"||style==="march"){
      drum(list,b,0,style==="storm"?.085:.09);drum(list,b+1,1,.05);drum(list,b+2,0,.075);drum(list,b+3,1,.055);
      for(let x=0;x<4;x+=.5)drum(list,b+x,2,.019);
    }else{
      drum(list,b,0,.065);drum(list,b+2,1,.042);for(const x of [1,3])drum(list,b+x,2,.018);
    }
  }
  function finalize(list){return list.sort((a,b)=>a[0]-b[0])}

  function buildMozart(){
    const l=[],prog=[["G4","B4","D5"],["G4","B4","D5"],["C4","E4","G4"],["D4","F#4","A4"],["G4","B4","D5"],["E4","G4","B4"],["A3","C4","E4"],["D4","F#4","A4"]];
    const a=[["G5",1],["R",.5],["D5",.5],["G5",1],["R",.5],["D5",.5],["G5",.5],["D5",.5],["G5",.5],["B5",.5],["D6",1],["R",1],["C6",1],["R",.5],["A5",.5],["C6",1],["R",.5],["A5",.5],["C6",.5],["A5",.5],["F#5",.5],["A5",.5],["D5",1],["R",1]];
    const b=[["A5",1.5],["G5",.25],["F#5",.25],["E5",.5],["R",.5],["B5",.5],["R",.5],["G5",.5],["R",.5],["E5",.5],["R",.5],["A5",.5],["R",.5],["F#5",1.5],["E5",.25],["D5",.25],["C#5",.5],["R",.5],["G5",.5],["R",.5],["F#5",2],["E5",1],["R",1]];
    for(let i=0;i<32;i++){arp(l,i,prog[i%8],4,.034,1,-.28);bass(l,i,prog[i%8][0],4,.05);beatDrums(l,i,4,"light")}
    for(const st of [0,16])motif(l,st,a,.115,0,.18,.012);for(const st of [8,24])motif(l,st,b,.105,0,.18,.01);
    for(const st of [20,28])motif(l,st,[["G6",.5],["F#6",.5],["E6",.5],["D6",.5],["C6",.5],["B5",.5],["A5",.5],["G5",.5]],.028,2,-.12,0);
    return finalize(l);
  }
  function buildMountain(){
    const l=[],m=[["B4",.5],["C#5",.5],["D5",.5],["E5",.5],["F#5",.5],["D5",.5],["F#5",1],["F5",.5],["C#5",.5],["F5",1],["E5",.5],["C5",.5],["E5",1],["B4",.5],["C#5",.5],["D5",.5],["E5",.5],["F#5",.5],["D5",.5],["F#5",.5],["B5",.5],["A5",.5],["F#5",.5],["D5",.5],["F#5",.5],["A5",1],["R",1]];
    const roots=["B2","B2","D3","B2","B2","D3","F#2","F#2"];
    for(let i=0;i<32;i++){bass(l,i,roots[i%8],4,i<16?.057:.07);beatDrums(l,i,4,"march");for(let q=0;q<4;q++)add(l,i*4+q+.5,note(roots[i%8])+12,.22,.018+(i/32)*.008,1,-.25)}
    for(let block=0;block<4;block++){const st=block*8,tr=block===2?7:0;motif(l,st,m,.082+block*.012,0,.2,.008,tr);if(block>=1)motif(l,st,m,.023,2,-.18,0,tr+12)}return finalize(l);
  }
  function buildAquarium(){
    const l=[],m=[["D5",1],["A5",1],["G#5",.5],["A5",.5],["C6",1],["B5",1],["A5",1],["E6",1],["D#6",.5],["E6",.5],["C6",1],["B5",1],["G5",1],["F#5",1],["E5",1],["R",1]],prog=[["A3","C4","E4"],["F3","A3","C4"],["D3","F3","A3"],["E3","G#3","B3"],["C3","E3","G3"],["D3","F3","A3"]];
    for(let i=0;i<24;i++){const c=prog[i%6];arp(l,i,c,4,.026,2,-.3,12);bass(l,i,c[0],4,.038);const pat=[0,1,2,1,2,1,0,1];for(let j=0;j<8;j++)add(l,i*4+j*.5,note(c[pat[j]])+24,.22,.011,1,.3);if(i%2===0)drum(l,i*4+3.5,2,.011)}
    for(const st of [0,8,16])motif(l,st,m,.067,0,.12,.025,st===8?5:0);return finalize(l);
  }
  function buildSummer(){
    const l=[],prog=[["G3","Bb3","D4"],["F3","A3","C4"],["Eb3","G3","Bb3"],["D3","F#3","A3"]],m=[];
    for(const hi of ["G6","F6","Eb6","D6"]){m.push([hi,.25]);for(let i=0;i<5;i++)m.push(["G4",.25])}m.push(...[["G5",.25],["A5",.25],["Bb5",.25],["C6",.25],["D6",.25],["Eb6",.25],["F6",.25],["G6",.25],["F6",.25],["Eb6",.25],["D6",.25],["C6",.25]]);
    for(let i=0;i<36;i++){const c=prog[i%4],base=i*3,pat=[0,1,2,1,0,1,2,1,0,1,2,1];for(let j=0;j<12;j++)add(l,base+j*.25,note(c[pat[j]])+12,.18,.027,1,-.24);add(l,base,c[0],2.65,.053,3,0);drum(l,base,0,.08);drum(l,base+1.5,1,.05);for(let x=0;x<3;x+=.5)drum(l,base+x,2,.018)}
    for(const st of [0,27,54,81])motif(l,st,m,.062+(st/81)*.012,0,.2,.008,st>=54?12:0);return finalize(l);
  }
  function buildWaltz(){
    const l=[],m=[["A5",1],["F#5",.5],["E5",.5],["D5",1],["F#5",1],["A5",1],["D6",1],["C#6",1],["B5",.5],["A5",.5],["F#5",1],["E5",1],["D5",1],["A4",1],["D5",1],["F#5",1],["A5",1],["G5",.5],["F#5",.5],["E5",1],["C#5",1],["D5",2],["R",1]],prog=[["D3","F#3","A3"],["A2","C#3","E3"],["G2","B2","D3"],["D3","F#3","A3"],["B2","D3","F#3"],["E3","G3","B3"],["A2","C#3","E3"],["D3","F#3","A3"]];
    for(let i=0;i<48;i++){const c=prog[i%8],b=i*3;add(l,b,c[0],1.2,.052,3,0);for(const q of [1,2]){add(l,b+q,note(c[1])+12,.62,.027,1,-.18);add(l,b+q,note(c[2])+12,.62,.023,1,.05)}beatDrums(l,i,3)}for(const st of [0,36,72,108])motif(l,st,m,.065,0,.18,.012,st===72?5:0);return finalize(l);
  }
  function buildToccata(){
    const l=[],m=[["A5",.5],["G5",.25],["A5",1],["R",.25],["G5",.25],["F5",.25],["E5",.25],["D5",.5],["C#5",.25],["D5",1],["R",.5],["A4",.5],["D5",.5],["F5",.5],["A5",.5],["C6",.5],["D6",1],["C#6",.5],["D6",.5],["A5",1],["R",1]],prog=[["D3","F3","A3"],["C#3","E3","G3"],["Bb2","D3","F3"],["A2","C#3","E3"]];
    for(let i=0;i<32;i++){const c=prog[i%4];arp(l,i,c,4,.03,2,-.3,12);bass(l,i,c[0],4,.058);beatDrums(l,i,4,"light")}for(const st of [0,32,64,96]){motif(l,st,m,.082,0,.18,.008,st%64===0?0:12);motif(l,st+16,[["D5",.5],["A5",.5],["F5",.5],["D6",.5],["C#6",.5],["A5",.5],["G5",.5],["E5",.5],["F5",.5],["D5",.5],["C#5",.5],["A4",.5],["D5",2]],.046,1,-.16,0)}return finalize(l);
  }
  function buildMoonlight(){
    const l=[],prog=[["C#3","E3","G#3"],["A2","C#3","E3"],["F#2","A2","C#3"],["G#2","B2","D#3"]],m=[["G#5",1],["C#6",1],["E6",1],["D#6",1],["C#6",.5],["B5",.5],["A5",1],["G#5",1],["F#5",1],["E5",1],["D#5",1],["C#5",1]];
    for(let i=0;i<32;i++){const c=prog[i%4],b=i*4,pat=[0,1,2,0,1,2,1,2,0,1,2,0,1,2,1,2];for(let j=0;j<16;j++)add(l,b+j*.25,note(c[pat[j]])+24,.19,.032,0,j%2?-.05:-.24);add(l,b,c[0],3.5,.052,3,0);beatDrums(l,i,4,"storm")}for(const st of [0,32,64,96])motif(l,st,m,.047,1,.28,.015,st>=64?12:0);return finalize(l);
  }
  function buildWinter(){
    const l=[],gust=[["C6",.25],["Ab6",.25],["G6",.25],["F6",.25],["E6",.25],["F6",.25],["C6",.25],["Ab6",.25],["G6",.25],["F6",.25],["E6",.25],["F6",.25],["C6",.25],["Bb5",.25],["Ab5",.25],["G5",.25]],roots=["F3","Db3","Eb3","C3"];
    for(let i=0;i<32;i++){bass(l,i,roots[i%4],4,.05);beatDrums(l,i,4,"storm");const sh=i%4===0?"Bb5":i%4===1?"Ab5":i%4===2?"Db5":"C5";for(let j=0;j<8;j++)add(l,i*4+j*.5,sh,.3,.034,2,-.18,.018)}for(const st of [16,48,80,112])motif(l,st,gust,.058,0,.25,.01,st>=80?12:0);return finalize(l);
  }
  function buildDiesIrae(){
    const l=[],prog=[["D3","F3","A3"],["Bb2","D3","F3"],["G2","Bb2","D3"],["A2","C#3","E3"]],m=[["D5",1],["D5",.5],["D5",.5],["C#5",1],["D5",1],["F5",1],["E5",1],["D5",1],["C#5",1],["D5",.5],["E5",.5],["F5",.5],["G5",.5],["A5",1],["G5",1],["F5",1],["E5",1]];
    for(let i=0;i<32;i++){const c=prog[i%4];bass(l,i,c[0],4,.065);beatDrums(l,i,4,"march");for(let j=0;j<8;j++)add(l,i*4+j*.5,note(c[(j>>1)%3])+12,.34,.023,1,-.25)}for(const st of [0,32,64,96]){motif(l,st,m,.078,0,.18,.007,st>=64?12:0);for(let i=0;i<12;i++)add(l,st+24+i*.125,note("D5")+i,.09,.028,2,-.1)}return finalize(l);
  }
  function buildOde(){
    const l=[],m=[["F#5",1],["F#5",1],["G5",1],["A5",1],["A5",1],["G5",1],["F#5",1],["E5",1],["D5",1],["D5",1],["E5",1],["F#5",1],["F#5",1.5],["E5",.5],["E5",2],["F#5",1],["F#5",1],["G5",1],["A5",1],["A5",1],["G5",1],["F#5",1],["E5",1],["D5",1],["D5",1],["E5",1],["F#5",1],["E5",1.5],["D5",.5],["D5",2]],prog=[["D3","F#3","A3"],["A2","C#3","E3"],["D3","F#3","A3"],["A2","C#3","E3"],["G2","B2","D3"],["D3","F#3","A3"],["A2","C#3","E3"],["D3","F#3","A3"]];
    for(let i=0;i<32;i++){const c=prog[i%8];arp(l,i,c,4,.032,1,-.25);bass(l,i,c[0],4,.05);beatDrums(l,i,4,"standard")}for(const st of [0,32,64,96]){motif(l,st,m,.077,0,.2,.008,st>=64?12:0);if(st>=32)motif(l,st,m,.021,2,-.18,0,st===32?7:0)}return finalize(l);
  }

  const baseEnsureAudio=ensureAudio;
  ensureAudio=function(){
    baseEnsureAudio();
    if(audioCtx&&!filter&&musicGain&&masterGain){
      try{musicGain.disconnect()}catch{}
      filter=audioCtx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=5000;filter.Q.value=.45;
      musicGain.gain.value=.29;musicGain.connect(filter);filter.connect(masterGain);
    }
    return audioCtx;
  };
  function pulseWave(duty){
    ensureAudio();const key=String(duty);if(pulseCache[key])return pulseCache[key];
    const real=new Float32Array(41),imag=new Float32Array(41);
    for(let n=1;n<real.length;n++){real[n]=(2/(Math.PI*n))*Math.sin(2*Math.PI*n*duty);imag[n]=(2/(Math.PI*n))*(1-Math.cos(2*Math.PI*n*duty))}
    return pulseCache[key]=audioCtx.createPeriodicWave(real,imag,{disableNormalization:false});
  }
  function chipNote(midi,dur,delay,wave,gain,pan,vib){
    if(!musicEnabled)return;ensureAudio();if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+Math.max(0,delay);
    if(wave==="pulse25")o.setPeriodicWave(pulseWave(.25));else if(wave==="pulse125")o.setPeriodicWave(pulseWave(.125));else if(wave==="pulse50")o.type="square";else o.type=wave;
    o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),t);
    const at=Math.min(.012,dur*.16),rel=Math.min(.04,dur*.28);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+at);g.gain.setValueAtTime(Math.max(.0002,gain),Math.max(t+at,t+dur-rel));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    if(vib){const lo=audioCtx.createOscillator(),lg=audioCtx.createGain();lo.frequency.value=5.1;lg.gain.value=vib*16;lo.connect(lg);lg.connect(o.detune);lo.start(t);lo.stop(t+dur+.02)}
    o.connect(g);if(audioCtx.createStereoPanner){const p=audioCtx.createStereoPanner();p.pan.value=Math.max(-.6,Math.min(.6,pan||0));g.connect(p);p.connect(musicGain)}else g.connect(musicGain);o.start(t);o.stop(t+dur+.025);
  }
  function noise(delay,dur,gain,pan=.1){
    ensureAudio();if(!audioCtx||!musicEnabled)return;const len=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),b=audioCtx.createBuffer(1,len,audioCtx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const s=audioCtx.createBufferSource(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;s.buffer=b;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(g);if(audioCtx.createStereoPanner){const p=audioCtx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(musicGain)}else g.connect(musicGain);s.start(t);s.stop(t+dur);
  }
  function kick(delay,gain){ensureAudio();if(!audioCtx||!musicEnabled)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type="sine";o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(48,t+.13);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+.16)}
  function playDrum(type,delay,gain){if(type===0)kick(delay,gain);else if(type===1){noise(delay,.105,gain,-.1);chipNote(45,.065,delay,"triangle",gain*.28,-.1,0)}else noise(delay,.04,gain,.15)}
  function runScheduler(){
    if(!musicEnabled||currentTrack<0||!timeline||!audioCtx)return;const tr=TRACKS[currentTrack],beat=60/tr.bpm,loop=tr.beats*beat,now=audioCtx.currentTime;
    if(now>loopStart+loop+.4){loopStart+=Math.max(1,Math.floor((now-loopStart)/loop))*loop;eventIndex=0}
    const horizon=now+.26;let guard=0;
    while(guard++<700){if(eventIndex>=timeline.length){eventIndex=0;loopStart+=loop}const e=timeline[eventIndex],when=loopStart+e[0]*beat;if(when>horizon)break;eventIndex++;if(when<now-.03)continue;const delay=Math.max(0,when-now);if(e[1]===0)chipNote(e[2],Math.max(.035,e[3]*beat*.88),delay,WAVES[e[5]]||"pulse25",e[4],e[6],e[7]);else playDrum(e[2],delay,e[3])}
  }
  stopMusic=function(){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(scheduler){clearInterval(scheduler);scheduler=null}if(introTimeout){clearTimeout(introTimeout);introTimeout=null}timeline=null;eventIndex=0;currentTrack=-1;
  };
  updateTrackButton=function(){const b=$("trackBtn");if(!b)return;const i=currentTrack>=0?currentTrack:0;b.textContent=`TRACK: ${i+1}/${TRACKS.length} ▶`;b.title=`Current track: ${TRACKS[i].name}. Click for next track.`};
  playMusicTrack=function(index,restart=false){
    if(!musicEnabled)return;ensureAudio();if(!audioCtx)return;const i=Math.max(0,Math.min(TRACKS.length-1,index));if(currentTrack===i&&!restart&&scheduler){updateTrackButton();return}if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(scheduler){clearInterval(scheduler);scheduler=null}
    currentTrack=i;timeline=TRACKS[i].build();eventIndex=0;loopStart=audioCtx.currentTime+.035;const name=TRACKS[i].name.toUpperCase();if($("nowPlaying"))$("nowPlaying").textContent=`♪ ${name}`;if($("titleTrackName"))$("titleTrackName").textContent=name;updateTrackButton();runScheduler();scheduler=setInterval(runScheduler,75);
  };
  cycleMusicTrack=function(){ensureAudio();if(!musicEnabled){musicEnabled=true;$("musicBtn").textContent="MUSIC: ON"}playMusicTrack(currentTrack<0?0:(currentTrack+1)%TRACKS.length,true)};
  updateMusicForGym=function(){if(!musicEnabled)return;if(save&&save.badges&&save.badges.length>=8)playMusicTrack(9);else playMusicTrack(Math.max(1,Math.min(8,gym)))};
  playIntroThenGym=function(){if(!musicEnabled)return;if($("titleScreen")?.classList.contains("show")||$("studioIntro")?.classList.contains("show"))playMusicTrack(0);else updateMusicForGym()};
  toggleMusic=function(){musicEnabled=!musicEnabled;$("musicBtn").textContent=`MUSIC: ${musicEnabled?"ON":"OFF"}`;if(musicEnabled)playIntroThenGym();else{stopMusic();if($("nowPlaying"))$("nowPlaying").textContent="♪ MUSIC OFF";updateTrackButton()}};

  const originalChooseStarter=chooseStarter;
  chooseStarter=function(dex){originalChooseStarter(dex);if(save&&save.starter)updateMusicForGym()};
  const originalLoadRunProgress=loadRunProgress;
  loadRunProgress=function(...args){const ok=originalLoadRunProgress(...args);if(ok)updateMusicForGym();return ok};
  const originalStartGymBattle=startGymBattle;
  startGymBattle=function(index){originalStartGymBattle(index);if(isGymBattle()&&musicEnabled)playMusicTrack(index+1)};
  const originalCompleteGymBattle=completeGymBattle;
  completeGymBattle=function(){originalCompleteGymBattle();if(save&&save.badges&&save.badges.length>=8&&musicEnabled)playMusicTrack(9,true)};

  if($("trackBtn"))$("trackBtn").textContent="TRACK: 1/10 ▶";
  if($("nowPlaying"))$("nowPlaying").textContent="♪ MOZART • EINE KLEINE NACHTMUSIK";
  if($("titleTrackName"))$("titleTrackName").textContent="MOZART • EINE KLEINE NACHTMUSIK";
  document.querySelectorAll(".footer").forEach(el=>{if(el.textContent.includes("ORIGINAL CHIPTUNE MUSIC"))el.textContent=el.textContent.replace(/ORIGINAL CHIPTUNE MUSIC: INTRO \+ 8 GYM THEMES/,"CLASSICAL CHIPTUNE SOUNDTRACK: TITLE + 8 GYMS + VICTORY")});
})();
