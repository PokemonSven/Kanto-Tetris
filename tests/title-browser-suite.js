// BASE: grid-browser-suite.js
$('qaRun').textContent='Check title layout';$('qaGary').textContent='Preview title';$('qaReward').textContent='Preview saved title';$('qaFinale').remove();
function titlePreview(saved=false){
 eqSetup('rogue');studioIntroSeen=true;studioIntroRunning=false;clearTimeout(studioIntroTimer);
 if(saved){save.team=[71,105,115,122,28,45];save.collection={};save.team.forEach(d=>save.collection[d]=bossTestPokemonEntry(65,d));save.buddy=71;save.starter=71;saveRunProgress('Title QA',true);}
 else localStorage.removeItem(activeRunSaveKey('rogue'));
 clearControlsScreens();hideOverlay();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));
 showTitleScreen();syncInputContext();$('qaPanel').hidden=true;
}
function titleInside(el,parent){const r=el.getBoundingClientRect(),p=parent?parent.getBoundingClientRect():{left:0,top:0,right:innerWidth,bottom:innerHeight};eqAssert(r.width>0&&r.height>0&&r.left>=p.left-1&&r.top>=p.top-1&&r.right<=p.right+1&&r.bottom<=p.bottom+1,'Clipped: '+(el.id||el.className));}
function titleGeometry(){
 const art=document.querySelector('#titleScreen img'),frame=art.getBoundingClientRect(),ratio=art.naturalWidth/art.naturalHeight;
 return {viewport:[innerWidth,innerHeight],image:[art.naturalWidth,art.naturalHeight],painted:[Math.min(frame.width,frame.height*ratio),Math.min(frame.height,frame.width/ratio)],buttons:navElements($('titleScreen')).map(b=>({id:b.id,font:getComputedStyle(b).fontSize,height:b.getBoundingClientRect().height})),menuScroll:document.querySelector('#titleScreen .title-menu').scrollHeight};
}
$('qaGary').onclick=()=>titlePreview();$('qaReward').onclick=()=>titlePreview(true);
$('qaRun').onclick=async()=>{
 eqResults.length=0;$('qaRun').disabled=true;
 for(const saved of [false,true]){
  const label=saved?'Saved run':'Fresh title';
  await eqCase(label+': full artwork loads and fits without cropping',async()=>{titlePreview(saved);const img=document.querySelector('#titleScreen img');await img.decode();eqAssert(img.naturalWidth===1024&&img.naturalHeight===572,'Wrong title asset');eqAssert(getComputedStyle(img).objectFit==='contain','Image may be cropped');titleInside(img);const g=titleGeometry();eqAssert(g.painted[0]>=innerWidth*.45&&g.painted[1]>=innerHeight*.28,'Artwork too small');titleInside(document.querySelector('#titleScreen .title-card'));});
  await eqCase(label+': menu labels fit and all actions stay visible',()=>{titlePreview(saved);const menu=document.querySelector('#titleScreen .title-menu'),img=document.querySelector('#titleScreen .title-hero-art').getBoundingClientRect(),m=menu.getBoundingClientRect();eqAssert(m.left>=img.right-1||m.top>=img.bottom-1,'Menu overlaps artwork');for(const b of navElements($('titleScreen'))){titleInside(b,menu);titleInside(b);eqAssert(b.scrollWidth<=b.clientWidth+1,'Text overflows '+b.id);if(document.documentElement.classList.contains('kanto-handheld')){eqAssert(parseFloat(getComputedStyle(b).fontSize)>=32,'Handheld text too small');eqAssert(b.getBoundingClientRect().height>=72,'Handheld target too small');}}eqAssert(menu.scrollWidth<=menu.clientWidth+1,'Horizontal overflow');});
  await eqCase(label+': controller can reach every title action',()=>{titlePreview(saved);const buttons=navElements($('titleScreen'));for(const b of buttons){focusMenuElement(b,$('titleScreen'));titleInside(b);titleInside(b,document.querySelector('#titleScreen .title-menu'));}});
 }
 await eqCase('Adventure selector opens and returns to the new title',()=>{titlePreview();$('titleAdventureNewBtn').click();eqAssert(isShown('adventureSlotsModal'),'Adventure did not open');menuBack();eqAssert(isShown('titleScreen'),'Back did not return');});
 $('qaPanel').hidden=false;$('qaRun').disabled=false;$('qaResults').textContent=JSON.stringify({passed:eqResults.filter(t=>t.result==='PASS').length,failed:eqResults.filter(t=>t.result==='FAIL').length,geometry:titleGeometry(),tests:eqResults},null,2);
};
