
/*
 Main bootstrap:
 1. Loads local game state.
 2. Shows the 3D game immediately.
 3. Connects Firebase in the background.
 4. Never leaves the player stuck on "Game laden".
*/
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import {World} from "./world.js";
import {GameState} from "./game.js";
import {UI} from "./ui.js";

const $=s=>document.querySelector(s);
const game=new GameState();
const ui=new UI(game);
let world=null;
const keys=new Set();
let interaction=null;

function progress(n,text){$("#loading-progress").style.width=n+"%";$("#loading-text").textContent=text;}
function reveal(){progress(100,"Klaar!");setTimeout(()=>{const l=$("#loading");l.style.display="none";$("#game").hidden=false;},180);}
function toast(text,type=""){ui.toast(text,type);}

async function boot(){
 progress(10,"Lokale save laden...");
 game.player.displayName=game.player.displayName||"Garden Player";
 progress(25,"3D engine starten...");
 try{
  world=new World($("#game-canvas"));
  world.setKeys(keys);
  game.world=world;
 }catch(error){
  console.error(error);
  $("#loading-text").textContent="3D engine kon niet worden gestart.";
  return;
 }
 progress(55,"Tuinwereld bouwen...");
 for(const [key,crop] of Object.entries(game.garden.crops)){
  if(!crop)continue;
  const [plot,cell]=key.split(":").map(Number);
  world.updatePlotCrop(plot,cell,crop);
 }
 bindControls();
 ui.renderHud();
 progress(78,"Game starten...");
 reveal();
 world.animate();

 // Firebase is deliberately non-blocking: the game is already playable.
 setTimeout(async()=>{
  try{
   const online=await game.connect();
   ui.renderHud();
   toast(online?"☁ Firebase verbonden":"💾 Lokale opslag actief",online?"":"warn");
  }catch(error){
   console.warn("Firebase background connection failed",error);
  }
 },50);
}

function bindControls(){
 document.addEventListener("keydown",e=>{
  keys.add(e.code);
  if(e.code==="Space"){e.preventDefault();world.jump();}
  if(e.code==="KeyE")interact();
 });
 document.addEventListener("keyup",e=>keys.delete(e.code));
 $("#game-canvas").addEventListener("click",()=>{$("#game-canvas").requestPointerLock?.()});
 // Touch/mobile controls
 const mobile=$("#mobile-controls");
 if(matchMedia("(pointer:coarse)").matches){
  mobile.hidden=false;
  const joy=$("#joystick"),stick=$("#joystick-stick");
  let active=false;
  joy.addEventListener("pointerdown",e=>{active=true;joy.setPointerCapture(e.pointerId);joyMove(e)});
  joy.addEventListener("pointermove",e=>{if(active)joyMove(e)});
  joy.addEventListener("pointerup",()=>{active=false;world.moveTarget.set(0,0);stick.style.transform="translate(0,0)"});
  function joyMove(e){
   const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const dx=e.clientX-cx,dy=e.clientY-cy;const max=42;const len=Math.hypot(dx,dy);const scale=Math.min(1,max/Math.max(1,len));
   const x=dx*scale/max,y=dy*scale/max;
   world.moveTarget.set(x,-y);stick.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
  }
  $("#mobile-jump").onclick=()=>world.jump();$("#mobile-interact").onclick=()=>interact();
 }
}

function interact(){
 const target=world.findLookTarget();
 if(!target){toast("Kijk naar een crop of veld.","warn");return;}
 if(target.userData.crop){
  harvestTarget(target);
 }else if(target.userData.plot!==undefined && target.userData.cell!==undefined){
  plantTarget(target);
 }
}
function plantTarget(tile){
 const {plot,cell}=tile.userData;
 const r=game.plant(plot,cell,game.selectedSeed);
 if(!r.ok){toast(r.msg,"warn");return}
 world.updatePlotCrop(plot,cell,r.crop);ui.renderHud();game.save();
 toast(`${game.selectedSeed} geplant!`);
}
function harvestTarget(mesh){
 const r=game.harvest(mesh.userData.plot,mesh.userData.cell);
 if(!r.ok){toast(r.msg,"warn");return}
 const key=`${mesh.userData.plot}:${mesh.userData.cell}`;
 const crop=game.garden.crops[key];
 world.updatePlotCrop(mesh.userData.plot,mesh.userData.cell,crop);
 ui.renderHud();game.save();
 toast(`🌟 ${r.mutation} harvest: +🪙 ${ui.money(r.value)}`);
}

setInterval(()=>{
 if(!world)return;
 for(const [key,crop] of Object.entries(game.garden.crops)){
  if(!crop)continue;
  if(game.isReady(crop)&&!crop.ready){
   crop.ready=true;const [plot,cell]=key.split(":").map(Number);world.updatePlotCrop(plot,cell,crop);
  }
 }
},500);

window.addEventListener("beforeunload",()=>game.save());
window.addEventListener("error",e=>console.error("Game error",e.error||e.message));

boot().catch(error=>{
 console.error(error);
 $("#loading-text").textContent="Er ging iets mis. Lokale game-modus wordt geladen...";
 setTimeout(reveal,100);
});
