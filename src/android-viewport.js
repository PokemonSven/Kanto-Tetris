// Android 11 devices may ship an older WebView. Keep save validation usable there.
if(!Object.hasOwn)Object.defineProperty(Object,'hasOwn',{value:(object,key)=>Object.prototype.hasOwnProperty.call(object,key),configurable:true,writable:true});
// Use a landscape design viewport independent of Android's user-selected display density.
// Android supplies the actual WebView bounds, so system insets and external displays are included.
window.applyKantoAndroidDisplay=function(display){
 if(!display||display.width<=0||display.height<=0||display.density<=0)return;
 document.documentElement.classList.add('kanto-handheld');
 const logicalWidth=display.width/display.height>=1.6?1920:1280;
 const scale=display.width/display.density/logicalWidth;
 const meta=document.querySelector('meta[name="viewport"]');
 const content=`width=${logicalWidth}, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=no`;
 if(meta&&meta.content!==content)meta.content=content;
};
if(window.KantoHost)try{applyKantoAndroidDisplay(JSON.parse(KantoHost.display()))}catch{}
