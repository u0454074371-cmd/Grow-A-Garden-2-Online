
/*
 3D WORLD ENGINE
 Procedural garden island, roads, plots, trees, rocks, water and shop buildings.
 No Roblox map is needed; everything is generated in the browser.
*/
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class World{
 constructor(canvas,onCellInteract){
  this.canvas=canvas;this.onCellInteract=onCellInteract;this.objects=[];this.plotCells=new Map();this.clickTargets=[];
  this.scene=new THREE.Scene();
  this.scene.background=new THREE.Color(0x8ec7e8);
  this.scene.fog=new THREE.Fog(0x8ec7e8,45,180);
  this.camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,300);
  this.camera.position.set(0,4,20);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;
  this.clock=new THREE.Clock();
  this.keys=new Set();
  this.player={pos:new THREE.Vector3(0,2.3,18),vel:new THREE.Vector3(),yaw:Math.PI,pitch:0,grounded:false,sprint:false};
  this.moveTarget=new THREE.Vector2();
  this.buildLights();this.buildTerrain();this.buildRoads();this.buildBuildings();this.buildPlots();this.buildDecor();
  addEventListener("resize",()=>this.resize());
  canvas.addEventListener("click",()=>canvas.requestPointerLock?.());
  document.addEventListener("mousemove",e=>this.mouseLook(e));
 }
 buildLights(){
  const hemi=new THREE.HemisphereLight(0xd7f3ff,0x496042,1.8);this.scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff4cc,2.6);sun.position.set(35,60,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);this.scene.add(sun);
 }
 mat(color,rough=.9){return new THREE.MeshStandardMaterial({color,roughness:rough});}
 mesh(geo,mat,pos){
  const m=new THREE.Mesh(geo,mat);m.position.copy(pos);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);return m;
 }
 buildTerrain(){
  const island=this.mesh(new THREE.CylinderGeometry(110,118,4,96),this.mat(0x4f9b54),new THREE.Vector3(0,-2,0));
  const sand=this.mesh(new THREE.CylinderGeometry(115,120,.8,96),this.mat(0xd3b36c),new THREE.Vector3(0,-.2,0));this.objects.push(island,sand);
  const pond=this.mesh(new THREE.CylinderGeometry(24,24,.35,64),new THREE.MeshStandardMaterial({color:0x54bddd,roughness:.2,metalness:.05}),new THREE.Vector3(-70,.2,58));this.objects.push(pond);
 }
 buildRoads(){
  const roadMat=this.mat(0x9b7b55);
  this.mesh(new THREE.BoxGeometry(200,.15,13),roadMat,new THREE.Vector3(0,.35,0));
  this.mesh(new THREE.BoxGeometry(13,.15,200),roadMat,new THREE.Vector3(0,.36,0));
  for(let x=-90;x<=90;x+=12)this.mesh(new THREE.BoxGeometry(7,.03,.7),this.mat(0xc9b080),new THREE.Vector3(x,.46,0));
 }
 building(name,pos,color){
  const group=new THREE.Group();group.name=name;
  const wall=this.mat(color);const roof=this.mat(0x663f32);
  const base=new THREE.Mesh(new THREE.BoxGeometry(18,8,13),wall);base.position.y=4;base.castShadow=true;base.receiveShadow=true;group.add(base);
  const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(12,5,4),roof);roofMesh.rotation.y=Math.PI/4;roofMesh.position.y=10.5;roofMesh.castShadow=true;group.add(roofMesh);
  group.position.copy(pos);this.scene.add(group);
  const sign=this.mesh(new THREE.BoxGeometry(10,.3,3),this.mat(0xf4d06d),new THREE.Vector3(pos.x,pos.y+7,pos.z-7));sign.userData.label=name;
 }
 buildBuildings(){this.building("Seed Shop",new THREE.Vector3(0,0,-54),0xa9774e);this.building("Pet House",new THREE.Vector3(25,0,-54),0x7762a1);this.building("Sell Barn",new THREE.Vector3(-25,0,-54),0x688e5b);}
 buildPlots(){
  const positions=[[-43,-34],[43,-34],[-43,0],[43,0],[-43,34],[43,34]];
  positions.forEach((p,index)=>{
   const group=new THREE.Group();group.name="Plot"+(index+1);group.position.set(p[0],.55,p[1]);this.scene.add(group);
   const border=new THREE.Mesh(new THREE.BoxGeometry(31,.6,31),this.mat(0x5a3a27));border.position.y=.1;group.add(border);
   const soil=new THREE.Mesh(new THREE.BoxGeometry(29,.65,29),this.mat(0x8a5836));soil.position.y=.47;group.add(soil);
   for(let z=0;z<8;z++)for(let x=0;x<8;x++){
    const cell=new THREE.Mesh(new THREE.BoxGeometry(3.2,.18,3.2),this.mat(0x9a6440));
    cell.position.set(-12.25+x*3.5,.88,-12.25+z*3.5);cell.userData={plot:index,cell:z*8+x};
    group.add(cell);this.plotCells.set(`${index}:${z*8+x}`,cell);this.clickTargets.push(cell);
   }
  });
 }
 tree(x,z){
  const trunk=this.mesh(new THREE.CylinderGeometry(.55,.75,5,10),this.mat(0x70462e),new THREE.Vector3(x,2.5,z));
  const crown=this.mesh(new THREE.IcosahedronGeometry(3.5,1),this.mat(0x287243),new THREE.Vector3(x,7,z));
  crown.rotation.y=Math.random()*6;return{trunk,crown};
 }
 rock(x,z){
  const r=this.mesh(new THREE.DodecahedronGeometry(1.4,0),this.mat(0x6b7568),new THREE.Vector3(x,1,z));r.scale.set(1.5,.8,1);return r;
 }
 buildDecor(){
  for(let i=0;i<45;i++){const a=Math.random()*Math.PI*2,r=70+Math.random()*32;this.tree(Math.cos(a)*r,Math.sin(a)*r);}
  for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,r=35+Math.random()*60;this.rock(Math.cos(a)*r,Math.sin(a)*r);}
  const spawn=this.mesh(new THREE.CylinderGeometry(4,4,.3,32),this.mat(0x5cb86c),new THREE.Vector3(0,.5,20));spawn.userData.spawn=true;
 }
 updatePlotCrop(plot,cell,crop){
  const tile=this.plotCells.get(`${plot}:${cell}`);if(!tile)return;
  if(tile.userData.cropMesh){this.scene.remove(tile.userData.cropMesh);tile.userData.cropMesh=null;}
  if(!crop)return;
  const geo=new THREE.ConeGeometry(.65,1.5,8);
  const colors={Carrot:0xff8d3a,Tomato:0xee5146,Blueberry:0x5d6ee9,Starfruit:0xf8d54b,Moonmelon:0x86d6af,Sunflower:0xffd34f};
  const material=this.mat(colors[crop.name]||0x6fc56f);
  const m=this.mesh(geo,material,new THREE.Vector3(tile.getWorldPosition(new THREE.Vector3()).x,.1,tile.getWorldPosition(new THREE.Vector3()).z));
  m.scale.set(.2,.2,.2);m.userData.crop=true;m.userData.plot=plot;m.userData.cell=cell;tile.userData.cropMesh=m;
  const ready=crop.ready||Date.now()>=crop.readyAt;m.scale.setScalar(ready?1.05:.25+.75*Math.min(1,(Date.now()-crop.plantedAt)/(crop.readyAt-crop.plantedAt)));
  m.position.y=1+ m.scale.y*.8;
  this.clickTargets.push(m);
 }
 mouseLook(e){
  if(document.pointerLockElement!==this.canvas)return;
  this.player.yaw-=e.movementX*.0022;this.player.pitch-=e.movementY*.0017;this.player.pitch=Math.max(-1.25,Math.min(1.25,this.player.pitch));
 }
 resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);}
 start(){this.animate();}
 animate=()=>{
  requestAnimationFrame(this.animate);const dt=Math.min(.033,this.clock.getDelta());this.updatePlayer(dt);this.updateCamera();this.renderer.render(this.scene,this.camera);
 }
 updatePlayer(dt){
  const p=this.player;let input=new THREE.Vector2();
  if(this.keys.has("KeyA"))input.x-=1;if(this.keys.has("KeyD"))input.x+=1;if(this.keys.has("KeyW"))input.y+=1;if(this.keys.has("KeyS"))input.y-=1;
  if(this.moveTarget.length()>0){input.add(this.moveTarget);}
  if(input.length()>1)input.normalize();
  const forward=new THREE.Vector3(Math.sin(p.yaw),0,Math.cos(p.yaw));
  const right=new THREE.Vector3(Math.cos(p.yaw),0,-Math.sin(p.yaw));
  const dir=forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
  const speed=(this.keys.has("ShiftLeft")||this.keys.has("ShiftRight")||p.sprint)?11:6.5;
  const accel=dir.length()>0?38:48;
  p.vel.x+=(dir.x*speed-p.vel.x)*Math.min(1,accel*dt/speed);
  p.vel.z+=(dir.z*speed-p.vel.z)*Math.min(1,accel*dt/speed);
  p.vel.y-=24*dt;p.pos.addScaledVector(p.vel,dt);
  if(p.pos.y<2.3){p.pos.y=2.3;p.vel.y=0;p.grounded=true}else p.grounded=false;
  p.pos.x=Math.max(-103,Math.min(103,p.pos.x));p.pos.z=Math.max(-103,Math.min(103,p.pos.z));
 }
 jump(){if(this.player.grounded){this.player.vel.y=9.5;this.player.grounded=false;}}
 updateCamera(){
  const p=this.player;this.camera.position.copy(p.pos);this.camera.rotation.order="YXZ";this.camera.rotation.y=p.yaw;this.camera.rotation.x=p.pitch;
 }
 setKeys(keys){this.keys=keys;}
 findLookTarget(){
  const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),this.camera);
  const hits=ray.intersectObjects(this.clickTargets,true);return hits[0]?.object||null;
 }
}
