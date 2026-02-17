import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { io } from "socket.io-client";
const GS=6,TARGET=1000,TIME_S=75,HINT_DELAY=2500,CELL=58,PAD=10,BPX=GS*CELL+PAD*2,FC=6;
const SP_BOMB=100,SP_LIGHT=101,SP_RAIN=102;
const COL=[{f:"#E53935",l:"#FF8A80",d:"#B71C1C",n:"cherry"},{f:"#43A047",l:"#A5D6A7",d:"#1B5E20",n:"apple"},{f:"#FDD835",l:"#FFF9C4",d:"#F9A825",n:"lemon"},{f:"#AB47BC",l:"#E1BEE7",d:"#6A1B9A",n:"grape"},{f:"#1E88E5",l:"#90CAF9",d:"#0D47A1",n:"seven"},{f:"#EC407A",l:"#F8BBD0",d:"#AD1457",n:"bell"}];
const ME={n:"Ты",a:"🦊",c:"#FF9F43",r:"#FFB74D"};
const BOTS=[{n:"Lily",a:"🐱",c:"#7C83FF",r:"#9FA8DA"},{n:"Max",a:"🐶",c:"#FF6B6B",r:"#EF9A9A"},{n:"Coco",a:"🐸",c:"#2ED573",r:"#81C784"}];
const OP_COLS=["#7C83FF","#FF6B6B","#2ED573"];
const MILES=[250,500,750];
const vb=ms=>{try{navigator.vibrate?.(ms)}catch(e){}};
const isSp=v=>v>=100;const isNorm=v=>v!==null&&v>=0&&v<FC;
const lerp=(a,b,t)=>a+(b-a)*Math.min(1,t);
const easeOut=t=>1-(1-t)*(1-t);
const easeOutBounce=t=>{const n1=7.5625,d1=2.75;if(t<1/d1)return n1*t*t;if(t<2/d1)return n1*(t-=1.5/d1)*t+.75;if(t<2.5/d1)return n1*(t-=2.25/d1)*t+.9375;return n1*(t-=2.625/d1)*t+.984375};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function drawFruit(ctx,fi,cx,cy,sz){
  const fc=COL[fi%FC]||COL[0];
  const gl=(x,y,r,c1,c2,c3)=>{const g=ctx.createRadialGradient(x-r*.3,y-r*.35,r*.05,x,y,r*1.05);g.addColorStop(0,c1||fc.l);g.addColorStop(.55,c2||fc.f);g.addColorStop(1,c3||fc.d);return g};
  const sh=(x,y,r)=>{ctx.fillStyle="rgba(255,255,255,0.45)";ctx.beginPath();ctx.ellipse(x-r*.2,y-r*.3,r*.38,r*.2,-.35,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.2)";ctx.beginPath();ctx.arc(x-r*.15,y-r*.35,r*.12,0,Math.PI*2);ctx.fill()};
  const sd=(x,y,r)=>{ctx.fillStyle="rgba(0,0,0,0.1)";ctx.beginPath();ctx.ellipse(x,y+r+3,r*.6,4,0,0,Math.PI*2);ctx.fill()};
  if(fc.n==="cherry"){const cr=sz*.42;ctx.strokeStyle="#2E7D32";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(cx,cy-sz*.7);ctx.quadraticCurveTo(cx-sz*.3,cy-sz*.2,cx-sz*.4,cy+sz*.15);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy-sz*.7);ctx.quadraticCurveTo(cx+sz*.2,cy-sz*.1,cx+sz*.35,cy+sz*.25);ctx.stroke();ctx.fillStyle="#4CAF50";ctx.beginPath();ctx.ellipse(cx+sz*.1,cy-sz*.65,sz*.25,sz*.12,.4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#66BB6A";ctx.beginPath();ctx.ellipse(cx+sz*.08,cy-sz*.68,sz*.18,sz*.07,.4,0,Math.PI*2);ctx.fill();const c1x=cx-sz*.4,c1y=cy+sz*.2;ctx.fillStyle=gl(c1x,c1y,cr);ctx.beginPath();ctx.arc(c1x,c1y,cr,0,Math.PI*2);ctx.fill();sh(c1x,c1y,cr);const c2x=cx+sz*.35,c2y=cy+sz*.3;ctx.fillStyle=gl(c2x,c2y,cr);ctx.beginPath();ctx.arc(c2x,c2y,cr,0,Math.PI*2);ctx.fill();sh(c2x,c2y,cr);sd(cx,cy,sz)}
  else if(fc.n==="apple"){const ag=ctx.createRadialGradient(cx-sz*.25,cy-sz*.2,sz*.05,cx,cy+sz*.1,sz*1.1);ag.addColorStop(0,"#C8E6C9");ag.addColorStop(.4,"#43A047");ag.addColorStop(1,"#1B5E20");ctx.fillStyle=ag;ctx.beginPath();ctx.moveTo(cx,cy-sz*.7);ctx.bezierCurveTo(cx-sz*1.2,cy-sz*.6,cx-sz*1.2,cy+sz*1.1,cx,cy+sz);ctx.bezierCurveTo(cx+sz*1.2,cy+sz*1.1,cx+sz*1.2,cy-sz*.6,cx,cy-sz*.7);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.35)";ctx.beginPath();ctx.ellipse(cx-sz*.25,cy-sz*.2,sz*.22,sz*.35,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#5D4037";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(cx,cy-sz*.7);ctx.quadraticCurveTo(cx+sz*.1,cy-sz*1.2,cx+sz*.05,cy-sz*1.3);ctx.stroke();ctx.fillStyle="#66BB6A";ctx.beginPath();ctx.ellipse(cx+sz*.2,cy-sz*1.05,sz*.22,sz*.1,.5,0,Math.PI*2);ctx.fill();sd(cx,cy,sz)}
  else if(fc.n==="lemon"){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.3);const lg=ctx.createRadialGradient(-sz*.15,-sz*.15,sz*.05,0,0,sz*1.15);lg.addColorStop(0,"#FFFDE7");lg.addColorStop(.4,"#FDD835");lg.addColorStop(1,"#F9A825");ctx.fillStyle=lg;ctx.beginPath();ctx.ellipse(0,0,sz*.65,sz*1.05,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#F9A825";ctx.beginPath();ctx.ellipse(0,-sz*1,sz*.1,sz*.15,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(0,sz*1,sz*.08,sz*.12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.4)";ctx.beginPath();ctx.ellipse(-sz*.15,-sz*.35,sz*.22,sz*.13,-.2,0,Math.PI*2);ctx.fill();ctx.restore();sd(cx,cy,sz)}
  else if(fc.n==="grape"){[[0,-.55],[-.32,-.2],[.32,-.2],[-.5,.2],[0,.15],[.5,.2],[-.32,.6],[.32,.6],[0,.95]].forEach(([gx,gy])=>{const px=cx+gx*sz*.6,py=cy+gy*sz*.5,gr=sz*.23;ctx.fillStyle=gl(px,py,gr,"#CE93D8","#AB47BC","#6A1B9A");ctx.beginPath();ctx.arc(px,py,gr,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.35)";ctx.beginPath();ctx.arc(px-gr*.25,py-gr*.3,gr*.35,0,Math.PI*2);ctx.fill()});ctx.strokeStyle="#5D4037";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(cx,cy-sz*.55);ctx.quadraticCurveTo(cx+3,cy-sz*1.1,cx+10,cy-sz*1.2);ctx.stroke();ctx.fillStyle="#66BB6A";ctx.beginPath();ctx.ellipse(cx+8,cy-sz*1.05,7,3.5,.5,0,Math.PI*2);ctx.fill();sd(cx,cy,sz)}
  else if(fc.n==="seven"){const s=sz*1.1;const bg=ctx.createRadialGradient(cx,cy,s*.1,cx,cy,s);bg.addColorStop(0,"#42A5F5");bg.addColorStop(.6,"#1565C0");bg.addColorStop(1,"#0D47A1");ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy,s*.9,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#FFD54F";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,s*.85,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#FFD54F";ctx.font=`bold ${s*1.3}px Georgia,serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.shadowColor="#FF8F00";ctx.shadowBlur=8;ctx.fillText("7",cx+1,cy+2);ctx.shadowBlur=0;sd(cx,cy,sz)}
  else if(fc.n==="bell"){const s=sz*.95;const bg=ctx.createRadialGradient(cx-s*.2,cy-s*.2,s*.05,cx,cy+s*.1,s*1.1);bg.addColorStop(0,"#FFF8E1");bg.addColorStop(.3,"#FFD54F");bg.addColorStop(.7,"#FFB300");bg.addColorStop(1,"#FF8F00");ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(cx-s*.15,cy-s*.8);ctx.quadraticCurveTo(cx-s*.8,cy-s*.3,cx-s*.85,cy+s*.3);ctx.quadraticCurveTo(cx-s*.85,cy+s*.7,cx,cy+s*.65);ctx.quadraticCurveTo(cx+s*.85,cy+s*.7,cx+s*.85,cy+s*.3);ctx.quadraticCurveTo(cx+s*.8,cy-s*.3,cx+s*.15,cy-s*.8);ctx.closePath();ctx.fill();ctx.fillStyle="#FF8F00";ctx.beginPath();ctx.ellipse(cx,cy+s*.55,s*.85,s*.18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#FFB300";ctx.beginPath();ctx.ellipse(cx,cy+s*.5,s*.8,s*.14,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#E65100";ctx.beginPath();ctx.arc(cx,cy+s*.75,s*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#FFB300";ctx.beginPath();ctx.arc(cx,cy-s*.8,s*.15,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.35)";ctx.beginPath();ctx.ellipse(cx-s*.25,cy-s*.25,s*.2,s*.45,-.2,0,Math.PI*2);ctx.fill();sd(cx,cy,sz)}
}
function drawSpecial(ctx,fi,cx,cy,sz,t){const pulse=1+Math.sin(t*5)*.08,s=sz*pulse;
if(fi===SP_BOMB){const bg=ctx.createRadialGradient(cx-s*.2,cy-s*.2,s*.05,cx,cy,s);bg.addColorStop(0,"#616161");bg.addColorStop(.6,"#424242");bg.addColorStop(1,"#212121");ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy+s*.05,s*.85,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.2)";ctx.beginPath();ctx.ellipse(cx-s*.2,cy-s*.2,s*.25,s*.15,-.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#FF6D00";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx+s*.3,cy-s*.65);ctx.quadraticCurveTo(cx+s*.5,cy-s*1.1,cx+s*.15,cy-s*1.1);ctx.stroke();ctx.fillStyle=Math.sin(t*15)>.3?"#FFAB00":"#FF6D00";ctx.beginPath();ctx.arc(cx+s*.15,cy-s*1.1,s*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#FFAB00";ctx.font=`bold ${s*.45}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("3×3",cx,cy+s*.1)}
else if(fi===SP_LIGHT){const bg=ctx.createRadialGradient(cx,cy,s*.05,cx,cy,s);bg.addColorStop(0,"#FFF9C4");bg.addColorStop(.4,"#FFD54F");bg.addColorStop(1,"#FF8F00");ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy,s*.9,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(255,213,79,${.3+Math.sin(t*10)*.2})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,s,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#E65100";ctx.beginPath();ctx.moveTo(cx-s*.15,cy-s*.7);ctx.lineTo(cx+s*.25,cy-s*.1);ctx.lineTo(cx,cy-s*.05);ctx.lineTo(cx+s*.2,cy+s*.7);ctx.lineTo(cx-s*.25,cy+s*.05);ctx.lineTo(cx+s*.02,cy+s*.05);ctx.closePath();ctx.fill()}
else if(fi===SP_RAIN){const colors=["#E53935","#FF9800","#FDD835","#43A047","#1E88E5","#7B1FA2"];colors.forEach((col,i)=>{const a=(i/6)*Math.PI*2+t*2,r2=s*.65;ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r2*.35,cy+Math.sin(a)*r2*.35,s*.3,0,Math.PI*2);ctx.fill()});const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,s*.35);cg.addColorStop(0,"rgba(255,255,255,0.9)");cg.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,s*.35,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`${s*.5}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",cx,cy)}}
// Audio
const useAudio=(mutedRef)=>{const cx=useRef(null),mu=useRef(null);const gc=()=>{if(!cx.current)cx.current=new(window.AudioContext||window.webkitAudioContext)();if(cx.current.state==="suspended")cx.current.resume();return cx.current};
const sfx=useCallback((t,fi)=>{if(mutedRef?.current)return;try{const c=gc(),n=c.currentTime,p=fi!==undefined?1+fi*.08:1,o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
if(t==="select"){o.type="sine";o.frequency.setValueAtTime(600*p,n);o.frequency.exponentialRampToValueAtTime(800*p,n+.08);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.12);o.start(n);o.stop(n+.12)}
else if(t==="match"){vb(30);o.type="sine";o.frequency.setValueAtTime(523*p,n);o.frequency.setValueAtTime(659*p,n+.07);o.frequency.setValueAtTime(784*p,n+.14);g.gain.setValueAtTime(.15,n);g.gain.exponentialRampToValueAtTime(.001,n+.25);o.start(n);o.stop(n+.25)}
else if(t==="cascade"){vb(50);o.type="triangle";o.frequency.setValueAtTime(800,n);o.frequency.exponentialRampToValueAtTime(1400,n+.15);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.25);o.start(n);o.stop(n+.25)}
else if(t==="combo"){vb(80);[784,988,1175].forEach((fr,i)=>{const o2=c.createOscillator(),g2=c.createGain();o2.connect(g2);g2.connect(c.destination);o2.type="sine";o2.frequency.setValueAtTime(fr,n+i*.06);g2.gain.setValueAtTime(.1,n+i*.06);g2.gain.exponentialRampToValueAtTime(.001,n+i*.06+.2);o2.start(n+i*.06);o2.stop(n+i*.06+.2)})}
else if(t==="bomb"){vb(200);o.type="sawtooth";o.frequency.setValueAtTime(120,n);o.frequency.exponentialRampToValueAtTime(40,n+.5);g.gain.setValueAtTime(.22,n);g.gain.exponentialRampToValueAtTime(.001,n+.55);o.start(n);o.stop(n+.55);const o2=c.createOscillator(),g2=c.createGain();o2.connect(g2);g2.connect(c.destination);o2.type="square";o2.frequency.setValueAtTime(80,n);o2.frequency.exponentialRampToValueAtTime(30,n+.3);g2.gain.setValueAtTime(.1,n);g2.gain.exponentialRampToValueAtTime(.001,n+.35);o2.start(n);o2.stop(n+.35)}
else if(t==="special"){vb(100);[600,900,1200].forEach((fr,i)=>{const o2=c.createOscillator(),g2=c.createGain();o2.connect(g2);g2.connect(c.destination);o2.type="sine";o2.frequency.setValueAtTime(fr,n+i*.05);g2.gain.setValueAtTime(.1,n+i*.05);g2.gain.exponentialRampToValueAtTime(.001,n+i*.05+.15);o2.start(n+i*.05);o2.stop(n+i*.05+.15)})}
else if(t==="win"){vb([100,50,100,50,200]);[523,659,784,1047,1319].forEach((fr,i)=>{const o2=c.createOscillator(),g2=c.createGain();o2.connect(g2);g2.connect(c.destination);o2.type="sine";o2.frequency.setValueAtTime(fr,n+i*.1);g2.gain.setValueAtTime(.12,n+i*.1);g2.gain.exponentialRampToValueAtTime(.001,n+i*.1+.35);o2.start(n+i*.1);o2.stop(n+i*.1+.35)})}
else if(t==="lose"){o.type="sine";o.frequency.setValueAtTime(400,n);o.frequency.exponentialRampToValueAtTime(180,n+.5);g.gain.setValueAtTime(.1,n);g.gain.exponentialRampToValueAtTime(.001,n+.55);o.start(n);o.stop(n+.55)}
else if(t==="fail"){vb(20);o.type="square";o.frequency.setValueAtTime(200,n);g.gain.setValueAtTime(.04,n);g.gain.exponentialRampToValueAtTime(.001,n+.1);o.start(n);o.stop(n+.1)}
else if(t==="hint"){o.type="sine";o.frequency.setValueAtTime(880,n);o.frequency.setValueAtTime(1100,n+.05);g.gain.setValueAtTime(.04,n);g.gain.exponentialRampToValueAtTime(.001,n+.12);o.start(n);o.stop(n+.12)}
else if(t==="shuffle"){vb(60);o.type="triangle";o.frequency.setValueAtTime(300,n);o.frequency.setValueAtTime(700,n+.2);g.gain.setValueAtTime(.1,n);g.gain.exponentialRampToValueAtTime(.001,n+.35);o.start(n);o.stop(n+.35)}
else if(t==="milestone"){vb(40);[880,1100,1320].forEach((fr,i)=>{const o2=c.createOscillator(),g2=c.createGain();o2.connect(g2);g2.connect(c.destination);o2.type="sine";o2.frequency.setValueAtTime(fr,n+i*.08);g2.gain.setValueAtTime(.08,n+i*.08);g2.gain.exponentialRampToValueAtTime(.001,n+i*.08+.2);o2.start(n+i*.08);o2.stop(n+i*.08+.2)})}
}catch(e){}},[]);
const startMusic=useCallback(()=>{if(mutedRef?.current)return;try{const c=gc();if(mu.current)return;const m=c.createGain();m.gain.setValueAtTime(.018,c.currentTime);m.connect(c.destination);const ns=[262,330,392,330,294,349,440,349,262,330,392,523,440,392,349,330];let i=0;const p=()=>{if(!mu.current)return;const n=c.currentTime;[["sine",.5,1],["triangle",.2,.5]].forEach(([ty,v,ml])=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(m);o.type=ty;o.frequency.setValueAtTime(ns[i%ns.length]*ml,n);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+.38);o.start(n);o.stop(n+.38)});i++};const iv=setInterval(p,400);mu.current={m,iv}}catch(e){}},[]);
const stopMusic=useCallback(()=>{if(mu.current){clearInterval(mu.current.iv);try{mu.current.m.gain.exponentialRampToValueAtTime(.001,gc().currentTime+.5)}catch(e){}mu.current=null}},[]);
return{sfx,startMusic,stopMusic}};
// Logic
const mkG=(seed)=>{const rng=seed!=null?mulberry32(seed):()=>Math.random();const g=[];for(let r=0;r<GS;r++){const w=[];for(let c=0;c<GS;c++){let i;do{i=Math.floor(rng()*FC)}while((c>=2&&w[c-1]===i&&w[c-2]===i)||(r>=2&&g[r-1]?.[c]===i&&g[r-2]?.[c]===i));w.push(i)}g.push(w)}return g};
const fM=g=>{const m=new Set(),sp=[];for(let r=0;r<GS;r++){let c=0;while(c<GS){if(!isNorm(g[r][c])){c++;continue}let l=1;while(c+l<GS&&isNorm(g[r][c+l])&&g[r][c]===g[r][c+l])l++;if(l>=3){for(let i=0;i<l;i++)m.add(`${r},${c+i}`);if(l===4)sp.push({r,c:c+1,ty:SP_LIGHT});if(l>=5)sp.push({r,c:c+2,ty:SP_RAIN})}c+=Math.max(1,l)}}for(let c=0;c<GS;c++){let r=0;while(r<GS){if(!isNorm(g[r][c])){r++;continue}let l=1;while(r+l<GS&&isNorm(g[r+l][c])&&g[r][c]===g[r+l][c])l++;if(l>=3){for(let i=0;i<l;i++)m.add(`${r+i},${c}`);if(l===4)sp.push({r:r+1,c,ty:SP_BOMB});if(l>=5)sp.push({r:r+2,c,ty:SP_RAIN})}r+=Math.max(1,l)}}return{m,sp}};
const swapValid=(g,r1,c1,r2,c2)=>{if(isSp(g[r1][c1])||isSp(g[r2][c2]))return true;const t=g.map(x=>[...x]);[t[r1][c1],t[r2][c2]]=[t[r2][c2],t[r1][c1]];return fM(t).m.size>0};
const hasM=(g,lk)=>{for(let r=0;r<GS;r++)for(let c=0;c<GS;c++){if(lk.has(`${r},${c}`)||g[r][c]===null)continue;if(c+1<GS&&!lk.has(`${r},${c+1}`)&&g[r][c+1]!==null&&swapValid(g,r,c,r,c+1))return true;if(r+1<GS&&!lk.has(`${r+1},${c}`)&&g[r+1]?.[c]!==null&&swapValid(g,r,c,r+1,c))return true}return false};
const fH=(g,l)=>{for(let r=0;r<GS;r++)for(let c=0;c<GS;c++){if(l.has(`${r},${c}`)||g[r][c]===null)continue;if(c+1<GS&&!l.has(`${r},${c+1}`)&&g[r][c+1]!==null&&swapValid(g,r,c,r,c+1))return[`${r},${c}`,`${r},${c+1}`];if(r+1<GS&&!l.has(`${r+1},${c}`)&&g[r+1]?.[c]!==null&&swapValid(g,r,c,r+1,c))return[`${r},${c}`,`${r+1},${c}`]}return null};
const gvAnim=g=>{const n=g.map(r=>[...r]);const anims=[];for(let c=0;c<GS;c++){let w=GS-1;for(let r=GS-1;r>=0;r--)if(n[r][c]!==null){if(r!==w){n[w][c]=n[r][c];anims.push({c,toR:w,fromR:r});n[r][c]=null}w--}for(let r=w;r>=0;r--){n[r][c]=Math.floor(Math.random()*FC);anims.push({c,toR:r,fromR:r-w-2})}}return{grid:n,anims}};
const adj=(a,b)=>a&&b&&((Math.abs(a.r-b.r)===1&&a.c===b.c)||(a.r===b.r&&Math.abs(a.c-b.c)===1));
class Pt{constructor(x,y,col){this.x=x;this.y=y;this.vx=(Math.random()-.5)*7;this.vy=(Math.random()-.5)*7-3;this.life=1;this.dc=.015+Math.random()*.025;this.sz=2+Math.random()*5;this.col=col}update(){this.x+=this.vx;this.y+=this.vy;this.vy+=.12;this.life-=this.dc}draw(c){c.globalAlpha=this.life;c.fillStyle=this.col;c.beginPath();c.arc(this.x,this.y,this.sz*this.life,0,Math.PI*2);c.fill();c.globalAlpha=1}}
// Canvas Board
const CB=({grid,sel,locked,flash,hint,cursors,parts,onCell,swapAnim,fallAnims})=>{
const ref=useRef(null),aR=useRef(null),pR=useRef(parts||[]);pR.current=parts||[];const ht=useRef(0);
useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=cv.getContext("2d");const dp=window.devicePixelRatio||1;cv.width=BPX*dp;cv.height=BPX*dp;ctx.scale(dp,dp);
const draw=()=>{ctx.clearRect(0,0,BPX,BPX);const bg=ctx.createLinearGradient(0,0,0,BPX);bg.addColorStop(0,"#5D4037");bg.addColorStop(1,"#3E2723");ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(0,0,BPX,BPX,16);ctx.fill();ctx.strokeStyle="rgba(141,110,99,0.15)";ctx.lineWidth=1;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,i*BPX/8+5);ctx.lineTo(BPX,i*BPX/8+10);ctx.stroke()}ctx.strokeStyle="#6D4C41";ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(1,1,BPX-2,BPX-2,16);ctx.stroke();
ht.current+=.016;const t=ht.current,hs=1+Math.sin(t*8)*.06,now=Date.now();
const offY={},swOff={};
if(fallAnims)fallAnims.forEach(a=>{const el=(now-a.start)/a.dur;if(el<1){const fromPx=PAD+a.fromR*CELL+CELL/2,toPx=PAD+a.toR*CELL+CELL/2;offY[`${a.toR},${a.c}`]=lerp(fromPx,toPx,easeOutBounce(el))-(PAD+a.toR*CELL+CELL/2)}});
if(swapAnim){const el=(now-swapAnim.start)/150;if(el<1){const e=easeOut(el),dx=(swapAnim.c2-swapAnim.c1)*CELL*e,dy=(swapAnim.r2-swapAnim.r1)*CELL*e;swOff[`${swapAnim.r1},${swapAnim.c1}`]={dx,dy};swOff[`${swapAnim.r2},${swapAnim.c2}`]={dx:-dx,dy:-dy}}}
for(let r=0;r<GS;r++)for(let c=0;c<GS;c++){const x=PAD+c*CELL,y=PAD+r*CELL,k=`${r},${c}`,fi=grid[r][c];if(fi===null)continue;
const iS=sel?.r===r&&sel?.c===c,iL=locked.has(k),iF=flash.has(k),iH=hint&&(hint[0]===k||hint[1]===k);
let dx=x+CELL/2,dy=y+CELL/2;if(swOff[k]){dx+=swOff[k].dx;dy+=swOff[k].dy}if(offY[k])dy+=offY[k];
const sz=CELL*.38;ctx.fillStyle="rgba(78,52,46,0.4)";ctx.beginPath();ctx.roundRect(x+2,y+2,CELL-4,CELL-4,8);ctx.fill();
if(iF){ctx.globalAlpha=.3;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(dx,dy,CELL*.2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;continue}
ctx.save();if(iH&&!iS){ctx.translate(dx,dy);ctx.scale(hs,hs);ctx.translate(-dx,-dy)}if(iS){ctx.translate(dx,dy);ctx.scale(1.15,1.15);ctx.translate(-dx,-dy)}ctx.globalAlpha=iL?.35:1;
if(isSp(fi))drawSpecial(ctx,fi,dx,dy,sz,t);else drawFruit(ctx,fi,dx,dy,sz);
ctx.globalAlpha=1;if(iS){ctx.strokeStyle="#FFD54F";ctx.lineWidth=3;ctx.shadowColor="#FFD54F";ctx.shadowBlur=16;ctx.beginPath();ctx.roundRect(x+1,y+1,CELL-2,CELL-2,10);ctx.stroke();ctx.shadowBlur=0}if(iH&&!iS){ctx.strokeStyle="rgba(255,255,255,0.6)";ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.roundRect(x+2,y+2,CELL-4,CELL-4,8);ctx.stroke();ctx.setLineDash([])}ctx.restore()}
if(cursors)Object.entries(cursors).forEach(([id,pos])=>{const bi=parseInt(id);if(bi<=0)return;const p=BOTS[bi-1];if(!p)return;const bx=PAD+pos.c*CELL+CELL-5,by=PAD+pos.r*CELL+3;ctx.fillStyle=p.c;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(bx,by,9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.font="10px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.a,bx,by+1)});
const ps=pR.current;for(let i=ps.length-1;i>=0;i--){ps[i].update();if(ps[i].life<=0)ps.splice(i,1);else ps[i].draw(ctx)}
aR.current=requestAnimationFrame(draw)};draw();return()=>{if(aR.current)cancelAnimationFrame(aR.current)}},[grid,sel,locked,flash,hint,cursors,swapAnim,fallAnims]);
const hc=e=>{const rc=ref.current.getBoundingClientRect();const x=(e.clientX-rc.left)*(BPX/rc.width),y=(e.clientY-rc.top)*(BPX/rc.height);const c=Math.floor((x-PAD)/CELL),r=Math.floor((y-PAD)/CELL);if(r>=0&&r<GS&&c>=0&&c<GS)onCell(r,c)};
return <canvas ref={ref} onClick={hc} style={{width:"100%",maxWidth:BPX,aspectRatio:"1",borderRadius:18,cursor:"pointer",touchAction:"manipulation",boxShadow:"0 6px 0 #3E2723, 0 10px 30px rgba(0,0,0,0.3)"}}/>};
const Conf=()=><div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:310}}>{Array.from({length:50}).map((_,i)=><div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:"-5%",width:Math.random()*10+6,height:Math.random()*14+6,borderRadius:Math.random()>.5?"50%":"2px",background:["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF9F43","#A29BFE","#FD79A8","#00B894"][i%8],animation:`cF ${2+Math.random()*3}s linear ${Math.random()*1.5}s forwards`,transform:`rotate(${Math.random()*360}deg)`}}/>)}</div>;
// Shared styles
const BG="linear-gradient(180deg,#1a1a2e,#16213e,#0f3460)";
const CARD="linear-gradient(180deg,#1e293b,#0f172a)";
const WRAP={minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:"'Nunito',sans-serif",padding:"24px 16px",maxWidth:420,margin:"0 auto"};
const BTN_GOLD={padding:"14px 0",borderRadius:18,border:"2px solid #FFD54F50",cursor:"pointer",fontWeight:900,fontSize:20,background:"linear-gradient(180deg,#FFD54F,#FF8F00)",color:"#5D4037",boxShadow:"0 5px 0 #E65100,0 0 30px rgba(255,213,79,0.3)"};
const BTN_SEC={padding:"10px 0",borderRadius:14,border:"1px solid #334155",cursor:"pointer",fontWeight:700,fontSize:14,background:"rgba(255,255,255,0.05)",color:"#94a3b8"};

export default function GemRush(){
const[scr,setScr]=useState("menu");
const[mode,setMode]=useState(null);const[fee,setFee]=useState(0);const[pc,setPc]=useState(2);
const[grid,setGrid]=useState(()=>mkG());const[sel,setSel]=useState(null);
const[scores,setScores]=useState(()=>[0,0]);const[tl,setTl]=useState(TIME_S);
const[locked,setLocked]=useState(new Set());const[cursors,setCursors]=useState({});
const[win,setWin]=useState(null);const[log,setLog]=useState([]);
const[flash,setFlash]=useState(new Set());const[hint,setHint]=useState(null);
const[combo,setCombo]=useState(0);const[comboShow,setComboShow]=useState(null);
const[shMsg,setShMsg]=useState(false);const[parts]=useState(()=>[]);
const[streak,setStreak]=useState(0);const[scorePop,setScorePop]=useState(null);
const[swapAnim,setSwapAnim]=useState(null);const[fallAnims,setFallAnims]=useState(null);
const[spTip,setSpTip]=useState(null);const[mileHit,setMileHit]=useState(null);const[milesR,setMilesR]=useState([]);
// Online state
const[gamesList,setGamesList]=useState([]);
const[myGameId,setMyGameId]=useState(null);
const[name,setName]=useState(()=>localStorage.getItem('gr_name')||'');
const[soundOn,setSoundOn]=useState(()=>localStorage.getItem('gr_sound')!=='off');
const[onlineCount,setOnlineCount]=useState(0);
const[emoteShow,setEmoteShow]=useState(null);
const[copied,setCopied]=useState(false);
const gR=useRef(grid),lR=useRef(locked),wR=useRef(win),scR=useRef(scores),modeR=useRef(mode),pcR=useRef(pc);
gR.current=grid;lR.current=locked;wR.current=win;scR.current=scores;modeR.current=mode;pcR.current=pc;
const mutedRef=useRef(!soundOn);mutedRef.current=!soundOn;
const lm=useRef(Date.now());const seenSp=useRef(new Set());const{sfx,startMusic,stopMusic}=useAudio(mutedRef);
const socketRef=useRef(null);const myPI=useRef(0);
const nameRef=useRef(name);nameRef.current=name;
const saveName=n=>{setName(n);nameRef.current=n;localStorage.setItem('gr_name',n)};
const toggleSound=()=>{const nv=!soundOn;setSoundOn(nv);mutedRef.current=!nv;localStorage.setItem('gr_sound',nv?'on':'off');if(!nv)stopMusic()};
const shareResult=()=>{const txt=`🏆 Набрал ${scores[0]} очков в Gem Rush! Сможешь больше?\n${window.location.origin}`;if(navigator.share)navigator.share({title:'Gem Rush',text:txt}).catch(()=>{});else navigator.clipboard?.writeText(txt).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)}).catch(()=>{})};

const myPlayer=useMemo(()=>({...ME,n:name||'Ты'}),[name]);
const PL=useMemo(()=>{
  if(mode==='solo')return[myPlayer];
  if(mode==='bot')return[myPlayer,...BOTS.slice(0,pc-1)];
  if(mode==='online')return[myPlayer,...Array.from({length:pc-1},(_,i)=>({n:`Игрок ${i+2}`,a:"🎭",c:OP_COLS[i%3],r:OP_COLS[i%3]}))];
  return[myPlayer];
},[mode,pc,myPlayer]);

const spw=(r,c,col,n=8)=>{const cx=PAD+c*CELL+CELL/2,cy=PAD+r*CELL+CELL/2;for(let i=0;i<n;i++)parts.push(new Pt(cx,cy,col))};
const showSpTip=ty=>{if(seenSp.current.has(ty))return;seenSp.current.add(ty);const tips={[SP_BOMB]:"💣 Свапни бомбу — взрыв 3×3!",[SP_LIGHT]:"⚡ Свапни молнию — удар крестом!",[SP_RAIN]:"🌈 Свапни радугу — убирает цвет!"};setSpTip(tips[ty]);setTimeout(()=>setSpTip(null),2200)};
const checkMiles=sc=>{MILES.forEach(m=>{if(sc>=m&&!milesR.includes(m)){setMilesR(p=>[...p,m]);setMileHit(m);sfx("milestone");setTimeout(()=>setMileHit(null),1500)}})};
const triggerFall=(g)=>{const{grid:ng,anims}=gvAnim(g);const now=Date.now();const fa=anims.map(a=>({...a,start:now,dur:250+Math.abs(a.toR-a.fromR)*40}));setFallAnims(fa);setGrid(ng);gR.current=ng;setTimeout(()=>setFallAnims(null),500);return ng};
const chkR=useCallback(g=>{if(hasM(g,lR.current))return g;sfx("shuffle");setShMsg(true);setTimeout(()=>setShMsg(false),1600);let ng,tr=0;do{ng=mkG();tr++}while(!hasM(ng,new Set())&&tr<50);setTimeout(()=>{setGrid(ng);gR.current=ng},400);return ng},[sfx]);

// Socket
useEffect(()=>{
  const socket=io(window.location.origin,{transports:["websocket","polling"]});
  socketRef.current=socket;
  socket.on('online_count',c=>setOnlineCount(c));
  socket.on('games_list',list=>setGamesList(list));
  socket.on('game_created',({gameId})=>setMyGameId(gameId));
  socket.on('game_expired',()=>{setMyGameId(null);setScr('online')});
  socket.on('emote',({playerIndex,emoji})=>{setEmoteShow({pi:playerIndex,emoji,t:Date.now()});setTimeout(()=>setEmoteShow(null),1800)});
  socket.on('game_start',({seed,playerIndex,playerCount})=>{
    myPI.current=playerIndex;
    const npc=playerCount;setPc(npc);pcR.current=npc;
    const g=mkG(seed);setGrid(g);gR.current=g;
    setScores(Array(npc).fill(0));scR.current=Array(npc).fill(0);
    setTl(TIME_S);setSel(null);setWin(null);wR.current=null;
    setLocked(new Set());lR.current=new Set();setCursors({});
    setLog([]);setFlash(new Set());setHint(null);
    setCombo(0);setComboShow(null);setShMsg(false);
    setScorePop(null);setSwapAnim(null);setFallAnims(null);
    setSpTip(null);setMileHit(null);setMilesR([]);
    seenSp.current.clear();parts.length=0;lm.current=Date.now();
    setMyGameId(null);setMode('online');modeR.current='online';
    setScr("game");startMusic();
  });
  socket.on('scores_update',({scores:ss})=>{
    if(modeR.current!=='online')return;
    const pi=myPI.current;
    setScores(prev=>{const n=[...prev];let oi=1;ss.forEach((s,i)=>{if(i!==pi)n[oi++]=s});return n});
  });
  socket.on('game_over',({winner,reason})=>{
    if(wR.current||modeR.current!=='online')return;
    const iWon=winner===myPI.current;
    const w=iWon?"you":reason==="disconnect"?"disconnect":"opponent";
    setWin(w);wR.current=w;
    sfx(iWon?"win":"lose");if(iWon)setStreak(sk=>sk+1);else setStreak(0);
    stopMusic();
  });
  socket.on('player_disconnected',()=>{
    if(!wR.current&&modeR.current==='online'){setWin("you");wR.current="you";sfx("win");setStreak(sk=>sk+1);stopMusic()}
  });
  return()=>socket.disconnect();
},[startMusic,stopMusic,sfx]);

const reportScore=useCallback(sc=>{if(modeR.current==='online')socketRef.current?.emit('score_update',{score:sc})},[]);

useEffect(()=>{if(scr!=="game"||win)return;const iv=setInterval(()=>{if(Date.now()-lm.current>=HINT_DELAY){const h=fH(gR.current,lR.current);if(h){setHint(h);sfx("hint")}}},1000);return()=>clearInterval(iv)},[scr,win,sfx]);
const clrH=()=>{setHint(null);lm.current=Date.now()};

// Timer
useEffect(()=>{if(scr!=="game"||win||mode==='solo')return;const t=setInterval(()=>setTl(v=>{
  if(v<=1){
    if(mode==='bot'){const s=scR.current;const sorted=s.map((sc,i)=>({sc,i})).sort((a,b)=>b.sc-a.sc);const w=sorted[0].i===0?"you":"bot";setWin(w);wR.current=w;sfx(w==="you"?"win":"lose");if(w==="you")setStreak(sk=>sk+1);else setStreak(0);stopMusic()}
    return 0}return v-1}),1000);return()=>clearInterval(t)},[scr,win,mode,sfx,stopMusic]);

const activateSpecial=useCallback((ng,nl,fi,r,c)=>{sfx("bomb");
if(fi===SP_BOMB){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<GS&&nc>=0&&nc<GS&&ng[nr][nc]!==null){spw(nr,nc,"#FF9800",14);ng[nr][nc]=null;nl.add(`${nr},${nc}`)}}}
else if(fi===SP_LIGHT){for(let rr=0;rr<GS;rr++){if(ng[rr][c]!==null){spw(rr,c,"#FFD54F",12);ng[rr][c]=null;nl.add(`${rr},${c}`)}}for(let cc=0;cc<GS;cc++){if(ng[r][cc]!==null){spw(r,cc,"#FFD54F",12);ng[r][cc]=null;nl.add(`${r},${cc}`)}}}
else if(fi===SP_RAIN){const tc=Math.floor(Math.random()*FC);for(let rr=0;rr<GS;rr++)for(let cc=0;cc<GS;cc++){if(isNorm(ng[rr][cc])&&ng[rr][cc]===tc){spw(rr,cc,"#E040FB",10);ng[rr][cc]=null;nl.add(`${rr},${cc}`)}}}
},[sfx]);

const chain=useCallback((g,pi,depth,ls)=>{
if(wR.current)return;const{m,sp}=fM(g);
if(m.size===0){setLocked(p=>{const n=new Set(p);ls.forEach(k=>n.delete(k));return n});lR.current=new Set([...lR.current].filter(k=>!ls.has(k)));setFlash(new Set());if(depth>1){setCombo(depth);setComboShow(depth);sfx("combo");setTimeout(()=>setComboShow(null),1200)}setTimeout(()=>chkR(gR.current),300);return}
sp.forEach(s=>showSpTip(s.ty));setFlash(new Set(m));
m.forEach(k=>{const[r,c]=k.split(",").map(Number);const fi=g[r][c];if(isNorm(fi)){const fc=COL[fi];spw(r,c,fc.f,8);spw(r,c,fc.l,3)}});
const pts=Math.round(m.size*10*(1+depth*.5));
if(depth>0)sfx("cascade");else sfx("match",0);
setTimeout(()=>{if(wR.current)return;
setScores(s=>{const n=[...s];n[pi]+=pts;scR.current=n;
if(pi===0){checkMiles(n[0]);reportScore(n[0]);
if(n[0]>=TARGET&&!wR.current&&modeR.current==='solo'){setWin("you");wR.current="you";sfx("win");setStreak(sk=>sk+1);stopMusic()}}
if(modeR.current==='bot'&&n[pi]>=TARGET&&!wR.current){const w=pi===0?"you":"bot";setWin(w);wR.current=w;sfx(pi===0?"win":"lose");if(pi===0)setStreak(sk=>sk+1);else setStreak(0);stopMusic()}
return n});
if(pi===0){setScorePop({pts,x:20+Math.random()*60});setTimeout(()=>setScorePop(null),900)}
const plList=[ME,...BOTS.slice(0,pcR.current-1)];
setLog(l=>[{p:(plList[pi]||ME).n,c:(plList[pi]||ME).c,pts,d:depth,s:sp.length>0},...l].slice(0,6));
const ng=g.map(r=>[...r]);const nl=new Set(ls);
m.forEach(k=>{const[r,c]=k.split(",").map(Number);ng[r][c]=null;nl.add(k)});
sp.forEach(s=>{if(ng[s.r]?.[s.c]===null)ng[s.r][s.c]=s.ty});
m.forEach(k=>{const[r,c]=k.split(",").map(Number);const v=g[r][c];if(isSp(v))activateSpecial(ng,nl,v,r,c)});
const fg=triggerFall(ng);setFlash(new Set());setTimeout(()=>chain(fg,pi,depth+1,nl),350)},250)},[sfx,stopMusic,chkR,activateSpecial,reportScore]);

const doSwap=useCallback((r1,c1,r2,c2,pi=0)=>{
if(wR.current)return false;const k1=`${r1},${c1}`,k2=`${r2},${c2}`;
if(lR.current.has(k1)||lR.current.has(k2))return false;
const g=gR.current,v1=g[r1][c1],v2=g[r2][c2];const hasSp=isSp(v1)||isSp(v2);
const ng=g.map(r=>[...r]);[ng[r1][c1],ng[r2][c2]]=[ng[r2][c2],ng[r1][c1]];
if(!hasSp&&fM(ng).m.size===0){if(pi===0)sfx("fail");return false}
const ls=new Set([k1,k2]);setLocked(p=>new Set([...p,k1,k2]));lR.current=new Set([...lR.current,k1,k2]);
setSwapAnim({r1,c1,r2,c2,start:Date.now()});
setTimeout(()=>{setSwapAnim(null);setGrid(ng);gR.current=ng;clrH();
if(hasSp){setTimeout(()=>{const ag=ng.map(r=>[...r]);const al=new Set(ls);
if(isSp(v1)){ag[r2][c2]=null;al.add(k2);activateSpecial(ag,al,v1,r2,c2);sfx("special")}
if(isSp(v2)){ag[r1][c1]=null;al.add(k1);activateSpecial(ag,al,v2,r1,c1);sfx("special")}
const spPts=al.size*15;
setScores(s=>{const n=[...s];n[pi]+=spPts;scR.current=n;if(pi===0){checkMiles(n[0]);reportScore(n[0])}return n});
if(pi===0){setScorePop({pts:spPts,x:20+Math.random()*60});setTimeout(()=>setScorePop(null),900)}
const plList=[ME,...BOTS.slice(0,pcR.current-1)];
setLog(l=>[{p:(plList[pi]||ME).n,c:(plList[pi]||ME).c,pts:spPts,d:0,s:true},...l].slice(0,6));
const fg=triggerFall(ag);setTimeout(()=>chain(fg,pi,0,al),350)},150)}
else{setTimeout(()=>chain(ng,pi,0,ls),80)}
},160);return true},[chain,sfx,activateSpecial,reportScore]);

// Bot AI
useEffect(()=>{if(scr!=="game"||win||mode!=='bot')return;
const iv=setInterval(()=>{if(wR.current)return;
for(let bi=1;bi<pcR.current;bi++){if(Math.random()>.35)continue;
const g=gR.current,lk=lR.current;let best=[];
for(let r=0;r<GS;r++)for(let c=0;c<GS;c++){if(lk.has(`${r},${c}`)||g[r][c]===null)continue;
if(c+1<GS&&!lk.has(`${r},${c+1}`)&&g[r][c+1]!==null&&swapValid(g,r,c,r,c+1)){const t=g.map(x=>[...x]);[t[r][c],t[r][c+1]]=[t[r][c+1],t[r][c]];const fm=fM(t);best.push({r1:r,c1:c,r2:r,c2:c+1,v:fm.m.size+(isSp(g[r][c])||isSp(g[r][c+1])?8:0)+fm.sp.length*5})}
if(r+1<GS&&!lk.has(`${r+1},${c}`)&&g[r+1]?.[c]!==null&&swapValid(g,r,c,r+1,c)){const t=g.map(x=>[...x]);[t[r][c],t[r+1][c]]=[t[r+1][c],t[r][c]];const fm=fM(t);best.push({r1:r,c1:c,r2:r+1,c2:c,v:fm.m.size+(isSp(g[r][c])||isSp(g[r+1]?.[c])?8:0)+fm.sp.length*5})}}
if(!best.length)continue;best.sort((a,b)=>b.v-a.v);
const pick=best[Math.floor(Math.random()*Math.min(3,best.length))];
setCursors(cv=>({...cv,[bi]:{r:pick.r1,c:pick.c1}}));
setTimeout(()=>{doSwap(pick.r1,pick.c1,pick.r2,pick.c2,bi);setCursors(cv=>({...cv,[bi]:{r:pick.r2,c:pick.c2}}))},300);break}
},1000);return()=>clearInterval(iv)},[scr,win,mode,doSwap]);
// Bot cursor wander
useEffect(()=>{if(scr!=="game"||win||mode!=='bot')return;
const iv=setInterval(()=>{setCursors(cv=>{const n={...cv};for(let i=1;i<pcR.current;i++){if(Math.random()>.45)continue;const cur=n[i]||{r:Math.floor(Math.random()*GS),c:Math.floor(Math.random()*GS)};n[i]={r:Math.max(0,Math.min(GS-1,cur.r+Math.floor(Math.random()*3)-1)),c:Math.max(0,Math.min(GS-1,cur.c+Math.floor(Math.random()*3)-1))}}return n})},400);return()=>clearInterval(iv)},[scr,win,mode]);

const click=(r,c)=>{if(win||shMsg)return;if(lR.current.has(`${r},${c}`))return;if(gR.current[r][c]===null)return;if(!sel){setSel({r,c});sfx("select",gR.current[r][c]%FC);clrH();return}if(sel.r===r&&sel.c===c){setSel(null);return}if(!adj(sel,{r,c})){setSel({r,c});sfx("select",gR.current[r][c]%FC);return}doSwap(sel.r,sel.c,r,c,0);setSel(null)};

const startLocal=(m,npc,f)=>{
  setMode(m);modeR.current=m;setPc(npc);pcR.current=npc;setFee(f);
  const g=mkG();setGrid(g);gR.current=g;
  setScores(Array(npc).fill(0));scR.current=Array(npc).fill(0);
  setTl(TIME_S);setSel(null);setWin(null);wR.current=null;
  setLocked(new Set());lR.current=new Set();setCursors({});
  setLog([]);setFlash(new Set());setHint(null);
  setCombo(0);setComboShow(null);setShMsg(false);
  setScorePop(null);setSwapAnim(null);setFallAnims(null);
  setSpTip(null);setMileHit(null);setMilesR([]);
  seenSp.current.clear();parts.length=0;lm.current=Date.now();
  setScr("game");startMusic();
};

const goMenu=()=>{setScr("menu");setWin(null);wR.current=null;setMyGameId(null);stopMusic();socketRef.current?.emit('leave_game')};
const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

// ===== SCREENS =====

// Menu
if(scr==="menu")return(<div style={WRAP}>
<div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:52,animation:"bob 2s ease-in-out infinite"}}>🎰</div>
<h1 style={{fontSize:34,fontWeight:900,background:"linear-gradient(180deg,#FFD54F,#FF8F00)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>GEM RUSH</h1>
{streak>0&&<div style={{display:"inline-block",marginTop:4,padding:"3px 14px",borderRadius:12,background:"linear-gradient(180deg,#FF6D00,#E65100)",fontSize:12,fontWeight:800,color:"#FFE082"}}>🔥 Серия: {streak}</div>}
</div>
<div style={{width:"100%",marginBottom:12}}>
<div style={{position:"relative"}}><input value={name} onChange={e=>saveName(e.target.value.slice(0,16))} placeholder="Твоё имя..." maxLength={16} style={{width:"100%",padding:"10px 40px 10px 16px",borderRadius:14,border:"2px solid #334155",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Nunito',sans-serif",outline:"none",boxSizing:"border-box"}}/>
<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:18}}>🦊</span></div>
</div>
<div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
<button onClick={()=>startLocal('solo',1,0)} style={{...BTN_GOLD,width:"100%",fontSize:18}}>🧘 Соло — тренировка</button>
<button onClick={()=>setScr('botSetup')} style={{width:"100%",padding:"14px 0",borderRadius:18,border:"2px solid #7C83FF50",cursor:"pointer",fontWeight:900,fontSize:18,background:"linear-gradient(180deg,#7C83FF,#5C6BC0)",color:"#fff",boxShadow:"0 5px 0 #3949AB,0 0 30px rgba(124,131,255,0.3)"}}>🤖 Против ботов</button>
<button onClick={()=>setScr('online')} style={{width:"100%",padding:"14px 0",borderRadius:18,border:"2px solid #FF6B6B50",cursor:"pointer",fontWeight:900,fontSize:18,background:"linear-gradient(180deg,#FF6B6B,#E53935)",color:"#fff",boxShadow:"0 5px 0 #C62828,0 0 30px rgba(255,107,107,0.3)"}}>🌐 Онлайн</button>
</div>
<div style={{marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
<div style={{fontSize:11,color:"#475569",fontWeight:600}}>Match-3 гонка — первый до 1000!</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<button onClick={toggleSound} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:2,opacity:.7}}>{soundOn?'🔊':'🔇'}</button>
{onlineCount>0&&<div style={{fontSize:11,color:"#66BB6A",fontWeight:800}}><span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:"#66BB6A",marginRight:3,animation:"pulse 2s infinite"}}></span>{onlineCount}</div>}
</div></div>
</div>);

// Bot setup
if(scr==="botSetup"){const rk=fee<=.5?.15:fee<=2?.12:.1;const pool=+(fee*pc*(1-rk)).toFixed(2);
return(<div style={WRAP}>
<div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:40}}>🤖</div><h2 style={{fontSize:24,fontWeight:900,color:"#fff",margin:"4px 0"}}>Против ботов</h2></div>
<div style={{background:CARD,borderRadius:28,padding:"20px 16px",width:"100%",boxShadow:"0 0 30px rgba(0,0,0,0.2)",border:"2px solid #7C83FF30"}}>
<div style={{marginBottom:14}}><div style={{fontSize:11,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>⚔️ Формат</div><div style={{display:"flex",gap:6}}>{[2,3,4].map(n=><button key={n} onClick={()=>setPc(n)} style={{flex:1,padding:"9px 0",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:14,background:pc===n?"linear-gradient(180deg,#7C83FF,#5C6BC0)":"rgba(255,255,255,0.05)",border:pc===n?"2px solid #7C83FF":"2px solid #334155",color:pc===n?"#fff":"#64748b"}}>{n===2?"1v1":n===3?"1v2":"1v3"}</button>)}</div></div>
<div style={{marginBottom:14}}><div style={{fontSize:11,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>💰 Ставка</div><div style={{display:"flex",gap:5}}>{[0,.5,1,2,5].map(f=><button key={f} onClick={()=>setFee(f)} style={{flex:1,padding:"9px 0",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:13,background:fee===f?"linear-gradient(180deg,#FFD54F,#FF8F00)":"rgba(255,255,255,0.05)",border:fee===f?"2px solid #FFB300":"2px solid #334155",color:fee===f?"#5D4037":"#64748b"}}>{f===0?"Free":`$${f}`}</button>)}</div></div>
<div style={{background:"rgba(124,131,255,0.05)",borderRadius:16,padding:12,marginBottom:14,border:"1px solid #7C83FF20"}}><div style={{fontSize:13,color:"#7C83FF",fontWeight:800}}>🏆 Первый до 1000 • ⏱ {TIME_S}сек</div>{fee>0&&<div style={{fontSize:12,color:"#FFD54F",fontWeight:700,marginTop:2}}>Приз: ${pool}</div>}</div>
<button onClick={()=>startLocal('bot',pc,fee)} style={{...BTN_GOLD,width:"100%"}}>⚡ ИГРАТЬ</button>
<button onClick={goMenu} style={{...BTN_SEC,width:"100%",marginTop:6}}>← Назад</button>
</div></div>)}

// Online — one screen: create + list
if(scr==="online")return(<div style={WRAP}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",marginBottom:12}}>
<h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:0}}>🌐 Онлайн</h2>
{onlineCount>0&&<div style={{fontSize:12,color:"#66BB6A",fontWeight:800}}><span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:"#66BB6A",marginRight:4,animation:"pulse 2s infinite"}}></span>{onlineCount} онлайн</div>}
</div>
{myGameId?
<div style={{width:"100%",background:CARD,borderRadius:20,padding:"20px 16px",marginBottom:12,border:"2px solid #FF6B6B40",textAlign:"center"}}>
<div style={{fontSize:40,animation:"bob 2s ease-in-out infinite"}}>⏳</div>
<div style={{fontSize:16,fontWeight:900,color:"#fff",margin:"8px 0"}}>Ждём соперника...</div>
<div style={{fontSize:13,color:"#94a3b8",fontWeight:600,marginBottom:12}}>Когда кто-то присоединится — игра начнётся</div>
<div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>{[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:5,background:"#FF6B6B",animation:`pulse 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>
<button onClick={()=>{socketRef.current?.emit('leave_game');setMyGameId(null)}} style={{...BTN_SEC,padding:"8px 24px",fontSize:13}}>Отменить</button>
</div>
:<button onClick={()=>socketRef.current?.emit('create_game',{name:name||'Гость'})} style={{...BTN_GOLD,width:"100%",marginBottom:12,fontSize:16}}>➕ Создать игру</button>}
<div style={{width:"100%",flex:1}}>
<div style={{fontSize:11,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Открытые игры</div>
{gamesList.length===0?<div style={{background:CARD,borderRadius:16,padding:"24px 16px",textAlign:"center",border:"1px solid #334155"}}><div style={{fontSize:36,marginBottom:8}}>🏜️</div><div style={{fontSize:14,color:"#64748b",fontWeight:700}}>Пока нет игр</div><div style={{fontSize:12,color:"#475569",marginTop:4}}>Создай первую!</div></div>
:gamesList.map(g=><div key={g.id} onClick={()=>{if(!myGameId)socketRef.current?.emit('join_game',{gameId:g.id,name:name||'Гость'})}} style={{background:CARD,borderRadius:16,padding:"14px 16px",marginBottom:8,border:"1px solid #334155",cursor:myGameId?"default":"pointer",opacity:myGameId?.5:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{g.players[0]||'Гость'}</div>
<div style={{fontSize:11,color:"#64748b",fontWeight:600}}>ждёт соперника</div></div>
<div style={{padding:"6px 16px",borderRadius:12,background:"linear-gradient(180deg,#66BB6A,#43A047)",color:"#fff",fontWeight:800,fontSize:13}}>Играть</div>
</div>)}
</div>
<button onClick={goMenu} style={{...BTN_SEC,width:"100%",marginTop:8}}>← Меню</button>
</div>);

// ===== GAME SCREEN =====
const pct0=Math.min(100,scores[0]/TARGET*100);
const sorted=PL.map((p,i)=>({...p,sc:scores[i]||0,i})).sort((a,b)=>b.sc-a.sc);
const myRk=sorted.findIndex(x=>x.i===0)+1;
const lostBy=win&&win!=="you"?TARGET-scores[0]:0;
const hasTimer=mode!=='solo';

if(scr!=="game")return null;
return(<div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",fontFamily:"'Nunito',sans-serif",maxWidth:420,margin:"0 auto",position:"relative",overflow:"hidden"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",zIndex:1}}>
{hasTimer?<div style={{padding:"4px 12px",borderRadius:12,fontWeight:900,fontSize:16,fontFamily:"monospace",background:tl<=20?"linear-gradient(180deg,#FF8A80,#E53935)":"rgba(255,255,255,0.08)",color:tl<=20?"#fff":"#94a3b8",border:tl<=20?"2px solid #C62828":"1px solid #334155",animation:tl<=10?"pulse .5s infinite":"none"}}>⏱{fmt(tl)}</div>
:<div style={{padding:"4px 12px",borderRadius:12,background:"rgba(255,255,255,0.08)",color:"#94a3b8",fontSize:14,fontWeight:700,border:"1px solid #334155"}}>🧘 Соло</div>}
<div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#64748b",fontWeight:700}}>ДО ПОБЕДЫ</div><div style={{fontSize:18,fontWeight:900,color:"#FFD54F",fontFamily:"monospace"}}>{scores[0]}/{TARGET}</div></div>
<div style={{display:"flex",alignItems:"center",gap:4}}>
<button onClick={toggleSound} style={{background:"rgba(255,255,255,0.08)",border:"1px solid #33415530",borderRadius:10,padding:"4px 8px",cursor:"pointer",fontSize:14}}>{soundOn?'🔊':'🔇'}</button>
<div style={{padding:"4px 8px",borderRadius:10,background:"rgba(255,255,255,0.08)",border:"1px solid #33415530",fontSize:12,fontWeight:800,color:"#94a3b8"}}>{mode==='online'?'🌐':mode==='bot'?'🤖':'🧘'}</div>
</div>
</div>
<div style={{padding:"0 12px 4px",zIndex:1,position:"relative"}}><div style={{height:10,borderRadius:5,background:"rgba(255,255,255,.08)",overflow:"hidden",border:"1px solid rgba(255,255,255,.05)",position:"relative"}}><div style={{height:"100%",width:`${pct0}%`,borderRadius:4,background:"linear-gradient(90deg,#FFD54F,#FF8F00)",transition:"width .3s",boxShadow:pct0>70?"0 0 12px rgba(255,152,0,.5)":"none"}}/>{MILES.map(m=><div key={m} style={{position:"absolute",top:0,left:`${m/TARGET*100}%`,width:2,height:"100%",background:scores[0]>=m?"#FFD54F":"rgba(255,255,255,.2)"}}/>)}</div></div>
{spTip&&<div style={{position:"absolute",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:CARD,color:"#FFD54F",padding:"8px 18px",borderRadius:16,fontSize:13,fontWeight:800,border:"2px solid #FFD54F40",animation:"bIn .3s",whiteSpace:"nowrap"}}>{spTip}</div>}
{mileHit&&<div style={{position:"absolute",top:"30%",left:"50%",transform:"translateX(-50%)",zIndex:250,animation:"bIn .4s"}}><div style={{background:"linear-gradient(180deg,#FFD54F,#FF8F00)",padding:"10px 28px",borderRadius:20,boxShadow:"0 0 30px rgba(255,213,79,0.4)",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#5D4037"}}>⭐ {mileHit}!</div></div></div>}
{shMsg&&<div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",zIndex:250,animation:"bIn .4s"}}><div style={{background:CARD,padding:"14px 24px",borderRadius:20,border:"2px solid #FFD54F40",textAlign:"center"}}><div style={{fontSize:32}}>🔀</div><div style={{fontSize:15,fontWeight:900,color:"#FFD54F"}}>Нет ходов!</div></div></div>}
{PL.length>1&&<div style={{display:"flex",gap:4,padding:"0 10px 2px",zIndex:1}}>{sorted.map((p,i)=>{const pctP=Math.min(100,p.sc/TARGET*100);const isMe=p.i===0;return(<div key={p.i} style={{flex:1,borderRadius:14,padding:"4px 3px",textAlign:"center",background:isMe?"rgba(255,215,0,0.08)":"rgba(255,255,255,0.03)",border:isMe?"2px solid #FFD54F40":`1px solid ${p.c}30`}}>
<div style={{width:28,height:28,borderRadius:14,margin:"0 auto 1px",background:`linear-gradient(135deg,${p.c},${p.r||p.c})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:`0 2px 8px ${p.c}40`}}>{p.a}</div>
<div style={{fontSize:9,fontWeight:800,color:isMe?"#FFD54F":"#94a3b8"}}>{p.n}</div>
<div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.08)",margin:"2px 3px",overflow:"hidden"}}><div style={{height:"100%",width:`${pctP}%`,borderRadius:2,background:`linear-gradient(90deg,${p.c}88,${p.c})`,transition:"width .3s"}}/></div>
<div style={{fontSize:11,fontWeight:900,color:p.c,fontFamily:"monospace"}}>{p.sc}</div></div>)})}</div>}
{comboShow&&<div style={{textAlign:"center",padding:"1px 0",zIndex:2,animation:"cmIn .3s"}}><span style={{display:"inline-block",padding:"3px 16px",borderRadius:16,background:"linear-gradient(180deg,#FF6D00,#E65100)",color:"#fff",fontSize:16,fontWeight:900,border:"2px solid #FFB74D"}}>🔥 КОМБО x{comboShow}!</span></div>}
{scorePop&&<div style={{position:"absolute",top:"35%",left:`${scorePop.x}%`,zIndex:100,fontSize:24,fontWeight:900,color:"#FFD54F",textShadow:"0 0 12px rgba(255,213,79,0.5)",animation:"fUp .9s ease-out forwards",pointerEvents:"none"}}>+{scorePop.pts}</div>}
<div style={{padding:"2px 8px",flex:1,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}><CB grid={grid} sel={sel} locked={locked} flash={flash} hint={hint} cursors={mode==='bot'?cursors:null} parts={parts} onCell={click} swapAnim={swapAnim} fallAnims={fallAnims}/></div>
{emoteShow&&<div style={{position:"absolute",top:"25%",left:"50%",transform:"translateX(-50%)",zIndex:200,fontSize:48,animation:"bIn .3s",pointerEvents:"none"}}>{emoteShow.emoji}</div>}
{mode==='online'&&!win&&<div style={{display:"flex",justifyContent:"center",gap:6,padding:"2px 10px",zIndex:1}}>{['👏','🔥','😤','💪','😎','🎯'].map(e=><button key={e} onClick={()=>socketRef.current?.emit('emote',{emoji:e})} style={{background:"rgba(255,255,255,0.06)",border:"1px solid #33415520",borderRadius:10,padding:"2px 8px",cursor:"pointer",fontSize:16}}>{e}</button>)}</div>}
<div style={{padding:"4px 10px 8px",display:"flex",gap:3,overflowX:"auto",background:"rgba(255,255,255,.03)",borderTop:"1px solid rgba(255,255,255,.05)",zIndex:1}}>{log.slice(0,4).map((m,i)=>(<div key={i} style={{flexShrink:0,padding:"3px 8px",borderRadius:10,background:"rgba(255,255,255,.05)",border:`1px solid ${m.c}25`,fontSize:10,fontWeight:700,opacity:1-i*.2,whiteSpace:"nowrap"}}><span style={{color:m.c}}>{m.p}</span> <span style={{color:"#66BB6A"}}>+{m.pts}</span>{m.d>0&&<span style={{color:"#FF5252"}}> 🔥x{m.d+1}</span>}{m.s&&" ✨"}</div>))}{log.length===0&&<div style={{fontSize:11,color:"#64748b",fontWeight:700,padding:3}}>👆 Тапни фрукт!</div>}</div>
{win&&(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(8px)",animation:"fIn .4s"}}>
{win==="you"&&<Conf/>}
<div style={{textAlign:"center",padding:"28px 24px",borderRadius:28,width:"88%",maxWidth:340,position:"relative",zIndex:320,background:CARD,border:win==="you"?"2px solid #FFD54F60":"2px solid #334155",boxShadow:win==="you"?"0 0 60px rgba(255,213,79,0.2)":"none",overflow:"hidden"}}>
{win==="you"?(<>
<div style={{fontSize:64,animation:"bIn .5s"}}>🏆</div>
<h2 style={{fontSize:28,fontWeight:900,background:"linear-gradient(180deg,#FFD54F,#FF8F00)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"6px 0"}}>ТЫ ВЫИГРАЛ!</h2>
<p style={{fontSize:14,color:"#94a3b8",fontWeight:700}}>{scores[0]} очков{hasTimer&&` • ${fmt(TIME_S-tl)}`}</p>
{streak>1&&<div style={{marginTop:6,padding:"4px 14px",borderRadius:12,display:"inline-block",background:"linear-gradient(180deg,#FF6D00,#E65100)",fontSize:14,fontWeight:800,color:"#FFE082"}}>🔥 {streak} побед подряд!</div>}
</>):(<>
<div style={{fontSize:56,animation:"bIn .5s"}}>😤</div>
<h2 style={{fontSize:22,fontWeight:900,color:"#e2e8f0",margin:"6px 0"}}>{win==="disconnect"?"Соперник ушёл":mode==='bot'?"Бот быстрее!":"Соперник быстрее!"}</h2>
<p style={{fontSize:14,color:"#94a3b8",fontWeight:800}}>{scores[0]} очков</p>
{lostBy>0&&<div style={{marginTop:4,padding:"4px 14px",borderRadius:10,display:"inline-block",background:"rgba(255,82,82,0.1)",border:"1px solid rgba(255,82,82,0.2)",fontSize:13,fontWeight:800,color:"#FF5252"}}>Не хватило {lostBy} очков!</div>}
</>)}
<button onClick={shareResult} style={{...BTN_SEC,width:"100%",marginTop:10,fontSize:13,fontWeight:800,color:"#66BB6A",border:"1px solid #66BB6A40"}}>{copied?'Скопировано!':'📤 Поделиться результатом'}</button>
<div style={{marginTop:8,display:"flex",gap:6}}>
<button onClick={goMenu} style={{...BTN_SEC,flex:1}}>Меню</button>
{mode==='solo'&&<button onClick={()=>startLocal('solo',1,0)} style={{...BTN_GOLD,flex:2,fontSize:16}}>🔄 Ещё раз</button>}
{mode==='bot'&&<button onClick={()=>startLocal('bot',pc,fee)} style={{...BTN_GOLD,flex:2,fontSize:16}}>⚡ Реванш</button>}
{mode==='online'&&<button onClick={()=>{setWin(null);wR.current=null;setScr('online')}} style={{...BTN_GOLD,flex:2,fontSize:16}}>🔄 Ещё раз</button>}
</div></div></div>)}
<style>{`@keyframes bIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}@keyframes fIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes fUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}@keyframes cF{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes cmIn{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.2) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes vP{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@keyframes pI{0%{transform:scale(0) translateY(20px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}@keyframes sS{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes pulseBtn{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}button:active{filter:brightness(.9)!important}`}</style>
</div>)}
