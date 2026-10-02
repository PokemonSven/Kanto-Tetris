// Presentation preferences do not change battle rules or handling.
const COMFORT_DEFAULTS={musicVolume:100,sfxVolume:100,reducedMotion:false,reducedFlashes:false,highContrast:false,grid:true,ghost:'normal'};
let comfortSettings={...COMFORT_DEFAULTS};
function normalizeComfort(raw){
 const out={...COMFORT_DEFAULTS};
 if(!raw||typeof raw!=='object')return out;
 for(const key of ['musicVolume','sfxVolume'])if(Number.isFinite(raw[key]))out[key]=Math.max(0,Math.min(100,Math.round(raw[key])));
 for(const key of ['reducedMotion','reducedFlashes','highContrast','grid'])if(typeof raw[key]==='boolean')out[key]=raw[key];
 if(['off','normal','strong'].includes(raw.ghost))out.ghost=raw.ghost;
 return out;
}
function validateComfort(raw){
 backupAssert(backupObject(raw),'Invalid comfort preferences.');
 for(const key of ['musicVolume','sfxVolume'])backupAssert(backupInteger(raw[key],0,100),'Invalid comfort volume.');
 for(const key of ['reducedMotion','reducedFlashes','highContrast','grid'])backupAssert(typeof raw[key]==='boolean','Invalid comfort display preference.');
 backupAssert(['off','normal','strong'].includes(raw.ghost),'Invalid landing ghost preference.');
}
function applyComfortAudio(){
 if(musicGain)musicGain.gain.value=.46*comfortSettings.musicVolume/100;
 if(sfxGain)sfxGain.gain.value=.38*comfortSettings.sfxVolume/100;
}
function applyComfort(){
 for(const [key,cls] of [['reducedMotion','comfort-still'],['reducedFlashes','comfort-calm'],['highContrast','comfort-contrast']])document.body.classList.toggle(cls,comfortSettings[key]);
 applyComfortAudio();
 for(const key of Object.keys(COMFORT_DEFAULTS)){
   const input=$('comfort-'+key);if(!input)continue;
   if(input.type==='checkbox')input.checked=comfortSettings[key];else input.value=comfortSettings[key];
   const value=$('comfort-value-'+key);if(value)value.textContent=comfortSettings[key]+'%';
 }
 tetrisHUDKey='';if(current){drawBoard();drawNext();renderTetrisHUD();}
}
function saveComfort(){storePreference(AUDIO_PREF_KEY,{music:musicEnabled,sfx:sfxEnabled,comfort:comfortSettings,soundtrack:{...soundtrackSettings}},'Audio & comfort settings');}
function drawComfortCell(c,x,y,type,size,alpha){
 const colors={I:'#00d9ee',O:'#ffe34b',T:'#c879ff',S:'#50db7d',Z:'#ff727e',J:'#72a5ff',L:'#ffae4f',X:'#bcc1cd',G:'#f4edff'},px=x*size,py=y*size;
 c.save();c.globalAlpha=alpha;c.fillStyle=colors[type]||'#ffffff';c.fillRect(px+1,py+1,size-2,size-2);c.strokeStyle='#101c2c';c.lineWidth=2;c.strokeRect(px+1.5,py+1.5,size-3,size-3);
 // Letters distinguish pieces without requiring colour recognition, including hazards.
 c.fillStyle='#101c2c';c.font=`bold ${Math.max(8,Math.floor(size*.47))}px monospace`;c.textAlign='center';c.textBaseline='middle';c.fillText(type,px+size/2,py+size/2);c.restore();
}
function initializeComfort(){
 const rows=[['musicVolume','Music volume'],['sfxVolume','Sound effects volume']].map(([key,label])=>`<label class="comfort-row" for="comfort-${key}">${label}<output id="comfort-value-${key}"></output><input id="comfort-${key}" type="range" min="0" max="100" step="5"></label>`).join('');
 const toggles=[['reducedMotion','Reduce motion','Stops screen shake, spins and floating damage animation.'],['reducedFlashes','Reduce flashes','Removes brightness flashes and decorative sparkles.'],['highContrast','Distinct blocks','High contrast colours and letter markings.'],['grid','Board grid','Show cell guides on the playfield.']].map(([key,label,help])=>`<label class="comfort-toggle"><input type="checkbox" id="comfort-${key}"><span>${label}<small>${help}</small></span></label>`).join('');
 $('optionsPanel').querySelector('.options-grid').insertAdjacentHTML('afterbegin',`<section class="options-card" id="comfortSettings"><h3>COMFORT</h3>${rows}${toggles}<label class="comfort-row" for="comfort-ghost">Landing ghost<select id="comfort-ghost"><option value="normal">Normal</option><option value="strong">Stronger outline</option><option value="off">Off</option></select></label><p class="tiny">Visual settings keep boss rules, warning text and input locks intact. Left/right adjusts values; A toggles checkboxes.</p><button id="comfortReset" class="smallbtn">RESET COMFORT SETTINGS</button></section>`);
 for(const key of Object.keys(COMFORT_DEFAULTS)){
   const input=$('comfort-'+key);input.addEventListener(input.type==='range'?'input':'change',()=>{
     comfortSettings[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;applyComfort();saveComfort();
   });
 }
 $('comfortReset').onclick=()=>{comfortSettings={...COMFORT_DEFAULTS};applyComfort();saveComfort();};applyComfort();
}
