// 1.7.6: shared collection filters and deliberate PC preview/confirmation.
let collectionToolsReady=false,collectionKeyboardTarget=null,collectionReturnFocus=null,pcPreviewDex=null;
const collectionFilters={dex:{name:'',type:'all',status:'all',sort:'number'},pc:{name:'',type:'all',status:'all',sort:'number'}};
function collectionNormalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function collectionMatches(dex,scope){
 const f=collectionFilters[scope],mon=BYDEX[dex],entry=save.collection[String(dex)];if(!mon)return false;
 const query=collectionNormalize(f.name);
 if(query&&!collectionNormalize(mon.name).includes(query)&&!collectionNormalize(pokemonName(dex)).includes(query)&&!String(dex).padStart(3,'0').includes(query))return false;
 if(f.type!=='all'&&!v25Types(dex).includes(f.type))return false;
 if(f.status==='missing'&&dexIsUnlocked(dex))return false;
 if(f.status==='registered'&&!dexIsUnlocked(dex))return false;
 if(f.status==='owned'&&!save.team.includes(dex)&&!save.pc?.includes(dex))return false;
 if(f.status==='healthy'&&!(entry?.currentHP>0))return false;
 if(f.status==='fainted'&&!(entry&&entry.currentHP<=0))return false;
 return true;
}
function collectionSort(a,b,scope){
 const sort=collectionFilters[scope].sort;
 if(sort==='name')return BYDEX[a].name.localeCompare(BYDEX[b].name)||a-b;
 if(sort==='levelHigh'||sort==='levelLow'){
   const x=save.collection[String(a)]?.level,y=save.collection[String(b)]?.level;
   if(x==null||y==null)return x==null&&y==null?a-b:x==null?1:-1;
   return (sort==='levelHigh'?y-x:x-y)||a-b;
 }
 return a-b;
}
function collectionApply(scope){
 if(!collectionToolsReady)return;
 const grid=$(scope==='dex'?'dexGrid':'pcBoxGrid'),selector=scope==='dex'?'[data-dex]':'[data-pc-box-dex]';
 const dexOf=el=>+(scope==='dex'?el.dataset.dex:el.dataset.pcBoxDex);
 const cards=[...grid.querySelectorAll(selector)].sort((a,b)=>collectionSort(dexOf(a),dexOf(b),scope));let count=0;
 for(const card of cards){card.hidden=!collectionMatches(dexOf(card),scope);if(!card.hidden)count++;grid.append(card)}
 $(scope+'FilterCount').textContent=`${count} / ${cards.length} ${scope==='dex'?'SPECIES':'BOXED POKéMON'}`;
 $(scope+'FilterEmpty').hidden=count>0||(!cards.length&&scope==='pc');
}
function collectionFilterChange(scope){
 const f=collectionFilters[scope];for(const key of ['name','type','status','sort'])f[key]=$(scope+'Filter'+key).value;
 if(scope==='pc'){pcSelectedDex=null;renderBillsPC()}else collectionApply(scope);
}
function collectionToolbar(scope){
 const types=[...new Set(MONS.flatMap(m=>v25Types(m.dex)))].sort();
 return `<div class="collection-tools" id="${scope}Filters"><label>NAME / NICKNAME / NUMBER<input id="${scope}Filtername" type="search" maxlength="32" autocomplete="off" placeholder="Species, nickname or #" aria-label="${scope==='dex'?'Pokédex':'PC'} name or number"></label><button id="${scope}NameKeys" type="button">NAME KEYPAD</button><label>TYPE<select id="${scope}Filtertype"><option value="all">ALL TYPES</option>${types.map(t=>`<option value="${t}">${t.toUpperCase()}</option>`).join('')}</select></label><label>${scope==='dex'?'REGISTRATION':'HEALTH'}<select id="${scope}Filterstatus">${(scope==='dex'?[['all','ALL SPECIES'],['registered','REGISTERED'],['missing','MISSING SPECIES'],['owned','IN THIS RUN']]:[['all','ALL HEALTH'],['healthy','HEALTHY'],['fainted','FAINTED']]).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label>SORT<select id="${scope}Filtersort"><option value="number">DEX NUMBER</option><option value="name">NAME A–Z</option><option value="levelHigh">LEVEL: HIGH FIRST</option><option value="levelLow">LEVEL: LOW FIRST</option></select></label><button id="${scope}FilterReset">RESET</button><span id="${scope}FilterCount" role="status"></span></div><p id="${scope}FilterEmpty" class="collection-empty" hidden>No matches. Change the filters or choose Reset.</p>`;
}
function collectionCloseKeyboard(){
 setModal('collectionKeyboard',false);const target=collectionKeyboardTarget;collectionKeyboardTarget=null;
 resetMenuFocus(menuRoot());if(target)focusMenuElement($(target+'NameKeys'),menuRoot());
}
function collectionOpenKeyboard(scope){
 collectionKeyboardTarget=scope;requestAutoPause();clearHeldInput();$('collectionKeyboardValue').textContent=collectionFilters[scope].name||'Enter a name';setModal('collectionKeyboard',true);resetMenuFocus($('collectionKeyboard'));
}
function collectionKey(key){
 const scope=collectionKeyboardTarget;if(!scope)return;
 if(key==='done'){collectionCloseKeyboard();return}
 let name=collectionFilters[scope].name;
 name=key==='clear'?'':key==='delete'?name.slice(0,-1):(name+(key==='space'?' ':key)).slice(0,32);
 $(scope+'Filtername').value=name;collectionFilterChange(scope);$('collectionKeyboardValue').textContent=name||'Enter a name';
}
function collectionRestoreFocus(){
 pcPreviewDex=null;const el=collectionReturnFocus;collectionReturnFocus=null;
 if(el?.isConnected&&!el.hidden)focusMenuElement(el,menuRoot());
}
function collectionPreviewPc(dex,source){
 pcPreviewDex=dex;collectionReturnFocus=source;openDexDetail(dex);
 const original=$('dexDetailTeamBtn'),button=original.cloneNode(true);original.replaceWith(button);
 button.disabled=!save.pc.includes(dex);button.textContent=save.pc.includes(dex)?'CHOOSE FOR SWAP':'TEAM POKéMON';
 button.addEventListener('click',()=>{
   if(!save.pc.includes(dex))return;
   pcSelectedDex=dex;closeDexDetail();renderBillsPC();
   focusMenuElement($('pcTeamGrid').querySelector('[data-pc-swap-slot]:not(:disabled)'),$('billsPcModal'));
 });
 $('dexDetailClose2').textContent='BACK TO PC';$('dexDetailClose2').addEventListener('click',collectionRestoreFocus);
 resetMenuFocus($('dexDetailModal'));
}
const collectionDexBase=renderDex;
renderDex=function(){collectionDexBase();if(collectionToolsReady){for(const card of $('dexGrid').querySelectorAll('[data-dex]')){if(dexIsUnlocked(+card.dataset.dex))card.querySelector('.type').textContent=v25Types(+card.dataset.dex).join(' / ').toUpperCase();}}collectionApply('dex')};
// Show the same dual types that power the filters and the battle calculations.
dexTypeBadge=function(mon){return v25Types(mon.dex).map(type=>`<span class="dex-type-badge" style="background:${TYPE_SHADE[type]||'#e0f8cf'}">${type}</span>`).join(' ')};
const collectionPcBase=renderBillsPC;
renderBillsPC=function(){
 collectionPcBase();if(!collectionToolsReady)return;
 for(const old of $('pcBoxGrid').querySelectorAll('[data-pc-select]')){
   const button=old.cloneNode(true);old.replaceWith(button);button.textContent=pcSelectedDex===+button.dataset.pcSelect?'PREVIEW SELECTED':'PREVIEW & SELECT';
   button.addEventListener('click',()=>collectionPreviewPc(+button.dataset.pcSelect,button));
 }
 for(const card of $('pcTeamGrid').querySelectorAll('[data-pc-team-portrait]')){
   const button=document.createElement('button');button.className='pc-action';button.textContent='PREVIEW';button.dataset.pcPreview=card.dataset.pcTeamPortrait;
   button.addEventListener('click',()=>collectionPreviewPc(+button.dataset.pcPreview,button));card.parentElement.append(button);
 }
 for(const old of $('pcTeamGrid').querySelectorAll('[data-pc-swap-slot]')){
   const button=old.cloneNode(true);old.replaceWith(button);
   button.addEventListener('click',()=>{
     const incoming=pcSelectedDex,slot=+button.dataset.pcSwapSlot,outgoing=save.team[slot];if(!incoming||!save.pc.includes(incoming))return;
     const label=d=>`${pokemonIdentityLabel(d).toUpperCase()} · LV.${save.collection[String(d)].level} · HP ${save.collection[String(d)].currentHP}/${pokemonMaxHP(save.collection[String(d)].level,d)}`;
     showControlsConfirm(outgoing?'CONFIRM SWAP':'WITHDRAW POKéMON',`${label(incoming)} ${outgoing?'will replace '+label(outgoing)+'. The outgoing Pokémon goes to Bill’s PC.':'will join your team in the empty slot.'}`,()=>{
       if(pcSelectedDex!==incoming||!save.pc.includes(incoming)||save.team[slot]!==outgoing)return;
       swapPcWithTeam(incoming,slot);resetMenuFocus($('billsPcModal'));
     },outgoing?'SWAP POKéMON':'WITHDRAW');
   });
 }
 $('pcInstructions').textContent=pcSelectedDex?`${pokemonIdentityLabel(pcSelectedDex).toUpperCase()} previewed. Choose a team slot, then review and confirm the swap.`:'Preview a boxed Pokémon, choose it for a swap, then select a team slot and confirm. Empty slots withdraw without depositing anyone.';
 collectionApply('pc');
};
const collectionDetailCloseBase=closeDexDetail;
closeDexDetail=function(){collectionDetailCloseBase();collectionRestoreFocus()};
const collectionMenuBackBase=menuBack;
menuBack=function(){if(isShown('collectionKeyboard')){collectionCloseKeyboard();return}collectionMenuBackBase()};
const collectionPauseBase=pauseDialogOpen;
pauseDialogOpen=function(){return isShown('collectionKeyboard')||collectionPauseBase()};
const collectionClearBase=clearControlsScreens;
clearControlsScreens=function(){setModal('collectionKeyboard',false);collectionKeyboardTarget=null;collectionReturnFocus=null;pcPreviewDex=null;collectionClearBase()};
function initializeCollectionTools(){
 $('dexGrid').insertAdjacentHTML('beforebegin',collectionToolbar('dex'));
 $('pcBoxGrid').insertAdjacentHTML('beforebegin',collectionToolbar('pc'));
 for(const scope of ['dex','pc']){
   for(const key of ['name','type','status','sort'])$(scope+'Filter'+key).addEventListener(key==='name'?'input':'change',()=>collectionFilterChange(scope));
   $(scope+'FilterReset').addEventListener('click',()=>{for(const [key,value] of Object.entries({name:'',type:'all',status:'all',sort:'number'}))$(scope+'Filter'+key).value=value;collectionFilterChange(scope)});
   $(scope+'NameKeys').addEventListener('click',()=>collectionOpenKeyboard(scope));
 }
 document.body.insertAdjacentHTML('beforeend',`<div id="collectionKeyboard" class="controls-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="collectionKeyboardTitle"><div class="controls-card compact-dialog"><h2 id="collectionKeyboardTitle">POKéMON SEARCH</h2><p id="collectionKeyboardValue"></p><div class="collection-keys">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map(k=>`<button data-search-key="${k}">${k}</button>`).join('')}</div><div class="collection-key-actions"><button data-search-key="space">SPACE</button><button data-search-key="delete">DELETE</button><button data-search-key="clear">CLEAR</button><button data-search-key="done">DONE</button></div><p>Arrows / D-pad: choose a key · A / Enter: type · B / Esc: return</p></div></div>`);
 $('collectionKeyboard').querySelectorAll('[data-search-key]').forEach(b=>b.addEventListener('click',()=>collectionKey(b.dataset.searchKey)));
 navModalIds.unshift('collectionKeyboard');$('dexDetailClose').addEventListener('click',collectionRestoreFocus);
 collectionToolsReady=true;renderDex();
}
