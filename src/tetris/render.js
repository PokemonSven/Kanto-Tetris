// Fit whole square cells to the display's physical pixels. Keep the engine's
// logical 30px drawing coordinates; only the presentation surface changes.
function boardPixelRatio(){
 // WebView rounds its viewport zoom; use the measured scale, not the
 // requested Android viewport scale or display density in isolation.
 const ratio=(window.devicePixelRatio||1)*(window.visualViewport?.scale||1);
 // Browser float noise (for example 1.0000000298) must not trigger a resample.
 return Math.round(ratio*1e5)/1e5;
}
function fitBoardRaster(cell,ratio){
 const width=cell*COLS,height=cell*ROWS;
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 canvas.dataset.pixelRatio=String(ratio);
 // CSS layout rounds lengths to 1/64px. Apply the tiny remaining scale/offset
 // in the compositor so fractional display zoom cannot widen selected lines.
 // Sabrina's rotation animation temporarily overrides this resting transform.
 if(!canvas.classList.contains('psychic-spinning')){
  canvas.style.transform='none';
  const r=canvas.getBoundingClientRect();
  if(r.width&&r.height){
   const w=width/ratio,h=height/ratio;
   const x=Math.round(r.left*ratio)/ratio-r.left+(w-r.width)/2;
   const y=Math.round(r.top*ratio)/ratio-r.top+(h-r.height)/2;
   canvas.style.transform=`translate3d(${x}px,${y}px,0) scale(${w/r.width},${h/r.height})`;
  }
 }
}
function drawBoardCell(x,y,type,cell,alpha=1){
 // Rasterize a piece tile once at its exact physical size. Reusing that tile
 // avoids position-dependent edge/gradient rounding across the board.
 const style=cell+':'+comfortSettings.highContrast;
 if(drawBoardCell.style!==style){drawBoardCell.style=style;drawBoardCell.tiles=new Map();}
 const key=type+':'+alpha,tiles=drawBoardCell.tiles;
 if(!tiles.has(key)){
  const tile=document.createElement('canvas');tile.width=tile.height=cell;
  const g=tile.getContext('2d');g.scale(cell/BLOCK,cell/BLOCK);drawCell(g,0,0,type,BLOCK,alpha);tiles.set(key,tile);
 }
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(tiles.get(key),x*cell,y*cell);ctx.restore();
}
function drawBoard(){
 if(Number(canvas.dataset.pixelRatio)!==boardPixelRatio())compactFit();
 const theme=towerBoardTheme(isGymBattle()?gymThemeMeta(save.gymBattle.gymIndex):null);
 const cell=canvas.width/COLS,line=Math.max(1,Math.round(cell/BLOCK));
 ctx.setTransform(1,0,0,1,0,0);
 ctx.fillStyle=theme?theme.board:'#e0f8cf';ctx.fillRect(0,0,canvas.width,canvas.height);
 if(comfortSettings.grid){
  ctx.fillStyle=theme?theme.grid:'#86c06c';
  for(let x=1;x<COLS;x++)ctx.fillRect(x*cell,0,line,canvas.height);
  for(let y=1;y<ROWS;y++)ctx.fillRect(0,y*cell,canvas.width,line);
 }
 ctx.save();ctx.scale(cell/BLOCK,cell/BLOCK);
 if(isBlaineBattle()&&save.gymBattle?.flameWarningTimer>0){
  const col=Math.max(0,Math.min(COLS-1,save.gymBattle.flameColumn||0));
  ctx.fillStyle='rgba(255,96,32,.26)';ctx.fillRect(col*BLOCK,0,BLOCK,ROWS*BLOCK);
  ctx.strokeStyle='rgba(180,32,0,.85)';ctx.lineWidth=3;ctx.strokeRect(col*BLOCK+1.5,1.5,BLOCK-3,ROWS*BLOCK-3);
 }
 board.forEach((r,y)=>r.forEach((t,x)=>{if(t)drawBoardCell(x,y,t,cell)}));
 if(current&&!gameOver){
  let gy=current.y;while(!collides({...current,y:gy},0,1))gy++;
  if(comfortSettings.ghost!=='off')current.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&gy+y>=0){drawBoardCell(current.x+x,gy+y,current.type,cell,comfortSettings.ghost==='strong'?.5:.22);if(comfortSettings.ghost==='strong'){ctx.strokeStyle='#172c44';ctx.lineWidth=2;ctx.strokeRect((current.x+x)*BLOCK+3,(gy+y)*BLOCK+3,BLOCK-6,BLOCK-6);}}}));
  current.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&current.y+y>=0)drawBoardCell(current.x+x,current.y+y,current.type,cell)}));
 }
 ctx.restore();
}
