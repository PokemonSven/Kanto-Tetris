const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
require('./build-retroid-web.cjs');
let html=fs.readFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_8_16_QA_Fixes/index.html'),'utf8');
function once(from,to){const i=html.indexOf(from);if(i<0||html.indexOf(from,i+from.length)>=0)throw new Error('Expected unique anchor '+from);html=html.slice(0,i)+to+html.slice(i+from.length)}
once('</head>','<script>'+fs.readFileSync(path.join(root,'src/android-viewport.js'),'utf8')+'</script></head>');
once('</head>','<style>'+fs.readFileSync(path.join(root,'src/android-handheld.css'),'utf8')+'</style></head>');
once('</head>','<style>body .compact-numbers{display:grid;grid-auto-flow:column;justify-content:space-between;grid-column-gap:9px}body .compact-numbers .stat{display:grid;grid-auto-flow:row;align-items:start;grid-row-gap:0}</style></head>');
once('initializePractice();initializeExpansion();initializeMilestones();initializePixelMap();initializeAdventureIntro();initializeRocketStory();initializeKeepsakes();initializeAdventureSlots();initializeTower();initCropEditorEvents();',fs.readFileSync(path.join(root,'src/android-bridge.js'),'utf8')+'\ninitializePractice();initializeExpansion();initializeMilestones();initializePixelMap();initializeAdventureIntro();initializeRocketStory();initializeKeepsakes();initializeAdventureSlots();initializeTower();initializeAndroidBridge();initCropEditorEvents();');
html=html.replaceAll('Build 1.8.16','Build 1.8.16 Android').replaceAll('build:"1.8.16"','build:"1.8.16"').replaceAll('100dvh','100vh');
// Android 11's bundled WebView 83 lacks the CSS inset shorthand. Modal roots
// otherwise acquire an offscreen static position despite being navigable.
html=html.replace(/([;{])inset:\s*(-?\d+(?:\.\d+)?(?:px|%|rem|em|vh|vw)?)(?=[;}])/g,(_,prefix,value)=>`${prefix}top:${value};right:${value};bottom:${value};left:${value}`);
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())new vm.Script(m[1],{filename:`android-game-${i}.js`});
fs.mkdirSync(path.join(root,'android/assets'),{recursive:true});fs.writeFileSync(path.join(root,'android/assets/index.html'),html);
console.log('Android assets built; script syntax checked.');

require('./copy-soundtrack.cjs')(path.join(root,'android/assets'));
