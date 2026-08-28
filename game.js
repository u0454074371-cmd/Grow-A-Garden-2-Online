
import {CROPS,PETS,defaultPlayer,defaultGarden} from "./data.js";
import {firebaseConfig,connectFirebase,loadRemotePlayer,saveRemote} from "./firebase.js";

const LOCAL_KEY="gg2_3d_save_v4";
export class GameState{
 constructor(){
  const local=this.loadLocal();
  this.player=local?.player||defaultPlayer();
  this.garden=local?.garden||defaultGarden();
  this.player.id=this.player.id||this.localId();
  this.backendOnline=false;this.selectedSeed="Carrot";this.world=null;
 }
 localId(){
  let x=localStorage.getItem("gg2_player_id");
  if(!x){x="player_"+Math.random().toString(36).slice(2)+"_"+Date.now();localStorage.setItem("gg2_player_id",x)}
  return x;
 }
 loadLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||"null")}catch{return null}}
 saveLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify({player:this.player,garden:this.garden,savedAt:Date.now()}))}catch{}}
 async connect(){
  this.backendOnline=await connectFirebase();
  if(this.backendOnline){
   const remote=await loadRemotePlayer(this.player.id);
   if(remote)this.player={...this.player,...remote,id:this.player.id,seeds:{...this.player.seeds,...(remote.seeds||{})}};
   await this.save();
  }
  return this.backendOnline;
 }
 async save(){
  this.saveLocal();
  if(this.backendOnline){
   const copy={...this.player};delete copy.id;
   await saveRemote(this.player.id,copy);
  }
 }
 petMultiplier(){
  return (this.player.equipped||[]).reduce((m,id)=>{
   const pet=this.player.pets.find(p=>p.id===id);return m*(pet?PETS[pet.name]?.multiplier||1:1)
  },1);
 }
 plant(plot,cell,name=this.selectedSeed){
  const cfg=CROPS[name];const key=`${plot}:${cell}`;
  if(!cfg)return{ok:false,msg:"Unknown seed"};
  if(this.garden.crops[key])return{ok:false,msg:"Dit veld is al bezet."};
  if((this.player.seeds[name]||0)<=0)return{ok:false,msg:"Je hebt geen seeds meer."};
  const now=Date.now();this.player.seeds[name]--;
  this.garden.crops[key]={name,plot,cell,plantedAt:now,readyAt:now+cfg.grow*1000,ready:false,mutation:this.rollMutation()};
  this.player.planted++;this.player.questPlant++;
  return{ok:true,crop:this.garden.crops[key]};
 }
 rollMutation(){
  const r=Math.random();if(r<.003)return"Rainbow";if(r<.02)return"Golden";if(r<.08)return"Giant";return"Normal";
 }
 isReady(c){return c && (c.ready||Date.now()>=c.readyAt)}
 harvest(plot,cell){
  const key=`${plot}:${cell}`,crop=this.garden.crops[key];
  if(!crop)return{ok:false,msg:"Hier groeit niets."};
  if(!this.isReady(crop))return{ok:false,msg:"Deze crop groeit nog."};
  const cfg=CROPS[crop.name];const multi={Normal:1,Giant:2,Golden:4,Rainbow:10}[crop.mutation]||1;
  const value=Math.floor(cfg.sell*multi*this.petMultiplier());
  this.player.coins+=value;this.player.xp+=cfg.xp;this.player.harvested++;this.player.earned+=value;this.player.questHarvest++;
  while(this.player.xp>=this.player.level*100){this.player.xp-=this.player.level*100;this.player.level++;}
  this.garden.crops[key]=null;
  return{ok:true,value,mutation:crop.mutation,level:this.player.level};
 }
 buySeed(name){
  const cfg=CROPS[name];if(!cfg)return{ok:false,msg:"Seed bestaat niet."};
  if(this.player.coins<cfg.price)return{ok:false,msg:"Niet genoeg coins."};
  this.player.coins-=cfg.price;this.player.seeds[name]=(this.player.seeds[name]||0)+1;return{ok:true};
 }
 buyPet(name){
  const cfg=PETS[name];if(!cfg)return{ok:false,msg:"Pet bestaat niet."};
  if(this.player.coins<cfg.price)return{ok:false,msg:"Niet genoeg coins."};
  this.player.coins-=cfg.price;this.player.pets.push({id:Math.random().toString(36).slice(2),name});return{ok:true};
 }
 equipPet(id){
  if(this.player.equipped.includes(id)){this.player.equipped=this.player.equipped.filter(x=>x!==id);return{ok:true}}
  if(this.player.equipped.length>=3)return{ok:false,msg:"Maximaal 3 pets."};
  if(!this.player.pets.some(p=>p.id===id))return{ok:false,msg:"Pet niet gevonden."};
  this.player.equipped.push(id);return{ok:true}
 }
 quest(){
  const target=10,progress=Math.min(target,this.player.questHarvest||0);
  return{title:"First Harvest",progress,target,done:progress>=target};
 }
}
