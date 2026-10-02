// Presentation-only map. Route-chain cursors and save data remain authoritative.
const KANTO_PIXEL_MAP=__KANTO_MAP_DATA__;
const KANTO_PIXEL_MAP_ART='__KANTO_MAP_ART__';
const KANTO_PIKACHU_RUN_ART='__KANTO_PIKACHU_RUN__',KANTO_PIKACHU_SIT_ART='__KANTO_PIKACHU_SIT__';
let pixelMapPikachuRun=null,pixelMapPikachuSit=null;
function pixelMapLoadSprite(src){
 return new Promise(resolve=>{const img=new Image();img.onerror=()=>resolve(null);img.onload=()=>{
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
  // The original indexed GBA sheets use palette entry zero as transparency.
  const data=g.getImageData(0,0,c.width,c.height),p=data.data,key=[p[0],p[1],p[2]];
  for(let i=0;i<p.length;i+=4)if(p[i]===key[0]&&p[i+1]===key[1]&&p[i+2]===key[2])p[i+3]=0;
  g.putImageData(data,0,0);resolve(c);
 };img.src=src;});
}
const pixelMapPikachuReady=Promise.all([pixelMapLoadSprite(KANTO_PIKACHU_RUN_ART),pixelMapLoadSprite(KANTO_PIKACHU_SIT_ART)]).then(([run,sit])=>{
 pixelMapPikachuRun=run;pixelMapPikachuSit=sit;if(pixelMapReady){drawKantoMap();drawFlyMap();}return !!(run&&sit);
});
const pixelMapImage=new Image(),pixelMapLayers=new Map();
let pixelMapLoaded=false,pixelMapFailed=false,pixelMapLabels=true,pixelMapReady=false;
const pixelMapArtReady=new Promise(resolve=>{
 pixelMapImage.onload=()=>{pixelMapLoaded=true;pixelMapLayers.clear();resolve(true);if(pixelMapReady){drawKantoMap();drawFlyMap();}};
 pixelMapImage.onerror=()=>{pixelMapFailed=true;resolve(false);if(pixelMapReady){drawKantoMap();drawFlyMap();}};
});
const PIXEL_MAP_TOWN_LABELS={
 'INDIGO PLATEAU':[38,38],'PEWTER CITY':[62,64],'CERULEAN CITY':[170,54],'LAVENDER TOWN':[214,88],
 'CELADON CITY':[137,90],'SAFFRON CITY':[170,90],'VERMILION CITY':[170,124],'FUCHSIA CITY':[148,153],
 'VIRIDIAN CITY':[60,109],'PALLET TOWN':[60,142],'CINNABAR ISLAND':[60,180]
};
const PIXEL_MAP_AREA_LABELS={
 'VIRIDIAN FOREST':[60,85],'MT. MOON':[115,34],'VICTORY ROAD':[22,58],'CERULEAN CAVE':[147,27],
 "DIGLETT'S CAVE":[191,102],'ROCK TUNNEL':[213,38],'POWER PLANT':[225,67],'POKEMON TOWER':[222,73],
 'SAFARI ZONE':[148,126],'SEAFOAM ISLANDS':[106,177],'INDIGO GATE':[23,95]
};
function pixelMapKey(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").toUpperCase();}
function pixelMapLocation(name){
 const key=pixelMapKey(name);
 return [...KANTO_PIXEL_MAP.cities,...KANTO_PIXEL_MAP.routes].find(n=>pixelMapKey(n.name||n.route)===key)||null;
}
function pixelMapTargetKey(t){return pixelMapKey(t.kind==='city'?(ROUTE_CHAIN_NODES[t.chainCursor]?.city||t.display||t.name):t.route);}
function pixelMapCurrentLocation(){
 const stop=save?.townStop;
 if(stop?.active){
  const name=ROUTE_CHAIN_NODES[stop.chainCursor]?.city||stop.cityName;
  const town=pixelMapLocation(name)||KANTO_PIXEL_MAP.cities.find(c=>pixelMapKey(c.name).startsWith(pixelMapKey(GYMS[stop.gymIndex]?.city||'~')));
  if(town)return town;
 }
 return pixelMapLocation(currentRoute());
}
function pixelMapFitFly(){
 const stage=$('pixelMapStage'),canvas=$('flyMapCanvas');if(!stage||!canvas)return;
 const w=stage.clientWidth-22,h=stage.clientHeight-22;if(w<=0||h<=0)return;
 const width=Math.floor(Math.min(w,h*240/190));
 canvas.style.width=width+'px';canvas.style.height=(width*190/240)+'px';
}
function pixelMapBase(width,height){
 const key=width+'x'+height;if(pixelMapLayers.has(key))return pixelMapLayers.get(key);
 const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');
 g.imageSmoothingEnabled=false;
 if(pixelMapLoaded)g.drawImage(pixelMapImage,0,0,width,height);
 else{
  g.fillStyle='#78a974';g.fillRect(0,0,width,height);g.save();g.scale(width/240,height/190);
  g.fillStyle='#347dae';g.fillRect(0,156,240,34);
  for(const s of [...KANTO_PIXEL_MAP.segments,...KANTO_PIXEL_MAP.branches]){g.beginPath();s.points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.strokeStyle=s.type==='water'?'#7ee5ff':'#efd798';g.lineWidth=2;g.stroke();}g.restore();
 }
 pixelMapLayers.set(key,c);return c;
}
function pixelMapLabel(g,text,x,y,size,color){
 g.font='bold '+size+'px monospace';g.textAlign='center';g.textBaseline='middle';
 g.lineJoin='round';g.lineWidth=.95;g.strokeStyle='#18362b';g.strokeText(text,x,y);g.fillStyle=color;g.fillText(text,x,y);
}
function pixelMapPlayer(g,active){
 const x=Math.round(active.x),y=Math.round(active.y),town=!!active.name;
 const frame=town||comfortSettings.reducedMotion?0:Math.floor(performance.now()/110)%2;
 const sheet=town?pixelMapPikachuSit:pixelMapPikachuRun;if(!sheet)return {mode:'loading',frame:0};
 g.save();g.imageSmoothingEnabled=false;g.fillStyle='#10252c80';g.beginPath();g.ellipse(x,y,5,1.5,0,0,Math.PI*2);g.fill();
 if(town)g.drawImage(sheet,0,0,16,16,x-8,y-14,16,16);
 else g.drawImage(sheet,(4+frame)*32,0,32,32,x-16,y-28-frame,32,32);
 g.restore();return {mode:town?'sitting':comfortSettings.reducedMotion?'idle':'running',frame};
}
function pixelMapAnimate(){
 if(!pixelMapReady||document.hidden||comfortSettings.reducedMotion||pixelMapCurrentLocation()?.name)return;
 if(isShown('flyModal'))drawFlyMap();
 else if(!pauseDialogOpen()&&!isGymBattle()&&!legendaryActive()&&$('kantoMap').getClientRects().length)drawKantoMap();
}
function pixelMapRender(canvas,large){
 if(!canvas)return;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(pixelMapBase(canvas.width,canvas.height),0,0);
 const active=pixelMapCurrentLocation(),activeKey=pixelMapKey(active?.name||active?.route),targets=flyTargets();
 g.save();g.scale(canvas.width/240,canvas.height/190);
 for(const t of targets){
  const city=t.kind==='city',key=pixelMapTargetKey(t),selected=key===activeKey,hover=large&&flyHoverTarget&&pixelMapTargetKey(flyHoverTarget)===key;
  const color=selected?'#94fff0':t.available?(city?'#ee907b':'#ffdf88'):'#a4b8ab';
  g.fillStyle=color;g.strokeStyle='#203c30';g.lineWidth=large?.6:.5;
  if(city){const r=large?1.7:1.4;g.fillRect(t.x-r,t.y-r,r*2,r*2);g.strokeRect(t.x-r,t.y-r,r*2,r*2);}
  else{g.beginPath();g.arc(t.x,t.y,large?1.1:.7,0,Math.PI*2);g.fill();g.stroke();}
  if(hover){g.strokeStyle='#fff4a7';g.lineWidth=.9;g.strokeRect(t.x-3.6,t.y-3.6,7.2,7.2);}
 }
 if(large&&pixelMapLabels){
  for(const t of targets){const key=pixelMapTargetKey(t),city=t.kind==='city',loc=pixelMapLocation(key);
   const pos=city?PIXEL_MAP_TOWN_LABELS[key]:PIXEL_MAP_AREA_LABELS[key]||[t.x+3,t.y-2];
   if(pos)pixelMapLabel(g,city?loc.name:loc?.label||t.name||t.route,pos[0],pos[1],city?2.7:2.35,t.available?'#fffbd8':'#dce6d4');
  }
 }
 const marker=active?pixelMapPlayer(g,active):null;
 g.restore();canvas.dataset.mapArt=pixelMapLoaded?'ready':pixelMapFailed?'fallback':'loading';canvas.dataset.location=active?.name||active?.route||'';
 canvas.dataset.markerMotion=marker?.mode||'none';canvas.dataset.markerFrame=String(marker?.frame||0);
 canvas.setAttribute('aria-label',(large?'Kanto Fly map. ':'Kanto minimap. ')+(active?'Pikachu '+(active.name?'sitting':'running')+' at '+canvas.dataset.location+'.':'')+(large?' Use the destination buttons to fly.':''));
}
function initializePixelMap(){
 if(pixelMapReady)return;pixelMapReady=true;
 const baseTargets=flyTargets,baseMini=drawKantoMap,baseTravel=travelToFlyTarget,baseFlyInfo=updateFlyInfo,baseDestinations=renderFlyDestinations;
 flyTargets=function(){
  const byKey=new Map();
  for(const t of baseTargets()){
   const key=pixelMapTargetKey(t),loc=pixelMapLocation(key);if(!loc)continue;
   const next={...t,x:loc.x,y:loc.y,mapKey:key},old=byKey.get(key);
   if(!old||(!old.available&&t.available)||(old.available===t.available&&(t.chainCursor??-1)>(old.chainCursor??-1)))byKey.set(key,next);
  }
  // Display every geographic route, even when the campaign has no Fly stop for it.
  // Route 11 has encounters in the existing game but no Adventure chain cursor.
  for(const loc of [...KANTO_PIXEL_MAP.cities,...KANTO_PIXEL_MAP.routes]){
   const key=pixelMapKey(loc.name||loc.route);if(!byKey.has(key))byKey.set(key,{kind:loc.name?'city':'route',name:loc.name||loc.label,display:loc.name,route:loc.route,x:loc.x,y:loc.y,index:-1,available:false,referenceOnly:true,mapKey:key});
  }
  return [...byKey.values()];
 };
 drawKantoMap=function(){
  if(isGymBattle()||legendaryActive())return baseMini();
  pixelMapRender($('kantoMap'),false);$('mapTitle').textContent='KANTO MAP';
  const place=pixelMapCurrentLocation();if(place)$('mapRouteText').textContent=place.name||place.route;
 };
 drawFlyMap=function(){pixelMapFitFly();pixelMapRender($('flyMapCanvas'),true);};
 flyCanvasPoint=function(ev){
  const c=$('flyMapCanvas'),r=c.getBoundingClientRect(),sx=r.width/c.offsetWidth,sy=r.height/c.offsetHeight;
  return {x:(ev.clientX-r.left-c.clientLeft*sx)*240/(c.clientWidth*sx),y:(ev.clientY-r.top-c.clientTop*sy)*190/(c.clientHeight*sy)};
 };
 flyHitTargetAt=function(x,y){
  if(x<0||y<0||x>240||y>190)return null;
  let best=null,distance=Infinity;
  for(const t of flyTargets()){const d=Math.hypot(x-t.x,y-t.y);if(d<=5&&d<distance){best=t;distance=d;}}
  return best;
 };
 travelToFlyTarget=function(t){
  if(!t||isGymBattle()||legendaryActive()||isGymTransition())return;
  const fresh=flyTargets().find(n=>pixelMapTargetKey(n)===pixelMapTargetKey(t));
  if(!fresh?.available||fresh.referenceOnly)return;
  return baseTravel(fresh);
 };
 updateFlyInfo=function(){
  const info=$('flyMapInfo'),t=flyHoverTarget;if(!info)return;
  if(!t){info.textContent=pixelMapFailed?'Map art could not load. Location markers are still available.':'Choose a visited marker or destination to fly. Gray places are unavailable.';return;}
  if(t.referenceOnly){info.textContent=(t.display||t.route)+' · Shown for orientation. Fly is unavailable here.';$('flyMapCanvas').style.cursor='default';return;}
  if(t.kind==='city'&&![LEAGUE_TOWN_CURSOR].includes(t.chainCursor)){
   info.textContent=t.available?'Fly to '+(t.display||t.name)+'. Select its marker or destination button.':(t.display||t.name)+' has not been visited in this Adventure run yet.';
   $('flyMapCanvas').style.cursor=t.available?'pointer':'not-allowed';return;
  }
  return baseFlyInfo();
 };
 renderFlyDestinations=function(){
  baseDestinations();const list=$('flyDestinations');if(!list)return;
  flyTargets().forEach((t,i)=>{const b=list.children[i];if(b)b.textContent=(t.display||t.route||t.name)+(t.referenceOnly?' · MAP ONLY':t.available?'':' · NOT VISITED');});
  list.scrollTop=0;
 };
 const c=$('flyMapCanvas');c.width=960;c.height=760;c.setAttribute('aria-label','Kanto region map. Use the destination buttons to select with a keyboard or controller.');
 const stage=document.createElement('div');stage.id='pixelMapStage';c.before(stage);stage.append(c);
 const legend=document.createElement('div');legend.id='pixelMapLegend';legend.textContent='◆ VISITED   ◇ UNVISITED';stage.append(legend);
 const labels=document.createElement('button');labels.id='pixelMapLabels';labels.className='pc-close';labels.textContent='LABELS: ON';labels.setAttribute('aria-pressed','true');
 labels.onclick=()=>{pixelMapLabels=!pixelMapLabels;labels.textContent='LABELS: '+(pixelMapLabels?'ON':'OFF');labels.setAttribute('aria-pressed',String(pixelMapLabels));drawFlyMap();};$('flyCloseBtn').before(labels);
 $('flyModal').classList.add('pixel-map-modal');$('flyTitle').textContent='FLY · KANTO';
 $('flyTitle').nextElementSibling.textContent='Select a visited place. Use the destination list with D-pad / arrows and A / Enter.';
 $('flyMapInfo').setAttribute('aria-live','polite');
 $('flyDestinations').addEventListener('focusin',ev=>{
  const i=[...$('flyDestinations').children].indexOf(ev.target);const t=flyTargets()[i];if(!t)return;
  flyHoverTarget=t;drawFlyMap();updateFlyInfo();ev.target.scrollIntoView({block:'nearest'});
 });
 c.addEventListener('click',ev=>{const p=flyCanvasPoint(ev);flyHoverTarget=flyHitTargetAt(p.x,p.y);drawFlyMap();updateFlyInfo();},true);
 if(typeof ResizeObserver==='function')new ResizeObserver(pixelMapFitFly).observe(stage);
 window.addEventListener('resize',pixelMapFitFly);
 pixelMapImage.src=KANTO_PIXEL_MAP_ART;
 setInterval(pixelMapAnimate,110);
 drawKantoMap();
}
