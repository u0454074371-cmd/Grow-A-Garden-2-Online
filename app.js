
/*
 Grow Garden 2 - Main application controller
 Handles boot, routing, persistence, game actions, Firebase sync,
 notifications, keyboard shortcuts and graceful error recovery.
*/
import {
 initializeFirebase,loadPlayer,loadGarden,savePlayer,saveGarden,
 subscribePlayer,subscribeGarden,touchPresence,removePresence,isOnline
} from "./firebase.js";
import {
 GAME,defaultPlayer,defaultGarden,migratePlayer,migrateGarden,loadLocal,saveLocal,
 applyOfflineGrowth,plant,harvest,buySeed,buyPet,equipPet,claimQuest,dailyReward
} from "./game.js";
import {UI} from "./ui.js";
import {safeStorageGet,safeStorageSet,randomId} from "./helpers.js";
import {achievementProgress,claimAchievement,normalizePlayer,normalizeGarden} from "./systems.js";

class AppController{
 constructor(){
  this.player=null;
  this.garden=null;
  this.ui=new UI(this);
  this.backendOnline=false;
  this.playerUnsub=()=>{};
  this.gardenUnsub=()=>{};
  this.saveInterval=null;
  this.refreshInterval=null;
  this.initialized=false;
  this.flags={saving:false,dirty:false};
  this.lastServerSync=0;
 }
 async start(){
  try{
   this.setBoot("Profiel laden...");
   this.bootstrapLocalState();
   this.bindGlobalEvents();
   this.ui.setView("garden");
   this.showApp();
   this.setBoot("Firebase verbinden...");
   const result=await initializeFirebase();
   this.backendOnline=!!result.ok;
   if(this.backendOnline) await this.bootstrapFirebase();
   else this.ui.toast("Offline demo mode: je game werkt lokaal.","warn");
   this.initialized=true;
   this.startLoops();
   this.ui.renderCurrent();
   this.setBoot("Klaar");
  }catch(error){
   console.error("Fatal startup error",error);
   this.showApp();
   this.ui.toast("Lokale veiligheidsmodus geladen.","warn");
   this.ui.setView("garden");
  }
 }
 bootstrapLocalState(){
  const stored=loadLocal();
  if(stored){
   this.player=migratePlayer(stored.player);
   this.garden=migrateGarden(stored.garden);
   if(stored.savedAt)applyOfflineGrowth(this.garden,stored.savedAt,Date.now());
  }else{
   this.player=defaultPlayer(this.getPreferredName());
   this.garden=defaultGarden();
  }
  if(!this.player.id)this.player.id=this.getLocalId();
  this.player=normalizePlayer(this.player);
  this.garden=normalizeGarden(this.garden);
 }
 async bootstrapFirebase(){
  try{
   const rp=await loadPlayer(this.player.id);
   const rg=await loadGarden(this.player.id);
   if(rp)this.player=migratePlayer({...this.player,...rp,id:this.player.id});
   if(rg)this.garden=migrateGarden(rg);
   this.player.id=this.player.id||this.getLocalId();
   await this.save();
   this.playerUnsub=subscribePlayer(this.player.id,p=>{
    if(p){
     this.player=normalizePlayer({...this.player,...p,id:this.player.id});
     this.ui.updateHeader();
    }
   });
   this.gardenUnsub=subscribeGarden(this.player.id,g=>{
    if(g){
     this.garden=normalizeGarden(g);
     if(this.ui.currentView==="garden")this.ui.renderGarden();
    }
   });
   await touchPresence(this.player.id);
   this.lastServerSync=Date.now();
  }catch(error){
   console.warn("Firebase sync failed, using local mode",error);
   this.backendOnline=false;
  }
 }
 getPreferredName(){
  return safeStorageGet("gg2_display_name")||"Garden Player";
 }
 getLocalId(){
  let id=safeStorageGet("gg2_local_id");
  if(!id){
   id=randomId("player");
   safeStorageSet("gg2_local_id",id);
  }
  return id;
 }
 setBoot(text){
  const el=document.querySelector("#boot-status");
  if(el)el.textContent=text;
 }
 showApp(){
  const boot=document.querySelector("#boot");
  const app=document.querySelector("#app");
  if(boot)boot.style.display="none";
  if(app)app.hidden=false;
 }
 bindGlobalEvents(){
  document.querySelectorAll(".nav").forEach(btn=>{
   btn.addEventListener("click",()=>this.ui.setView(btn.dataset.view));
  });
  const settings=document.querySelector("#open-settings");
  if(settings)settings.addEventListener("click",()=>this.ui.openSettings());
  document.addEventListener("keydown",event=>this.handleKeyboard(event));
  document.addEventListener("visibilitychange",()=>{
   if(document.visibilityState==="visible")this.ui.renderCurrent();
   else this.save();
  });
  window.addEventListener("beforeunload",()=>this.shutdown());
  window.addEventListener("error",event=>{
   console.error("UI error",event.error||event.message);
  });
 }
 handleKeyboard(event){
  if(event.target && ["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName))return;
  const keys={1:"Carrot",2:"Tomato",3:"Blueberry",4:"Starfruit",5:"Moonmelon",6:"Sunflower"};
  if(keys[event.key]){
   this.ui.selectedSeed=keys[event.key];
   if(this.ui.currentView==="garden")this.ui.renderGarden();
   this.ui.toast(`${keys[event.key]} geselecteerd.`);
  }
  if(event.key.toLowerCase()==="g")this.ui.setView("garden");
  if(event.key.toLowerCase()==="s")this.ui.setView("shop");
  if(event.key.toLowerCase()==="p")this.ui.setView("pets");
  if(event.key.toLowerCase()==="q")this.ui.setView("quests");
  if(event.key.toLowerCase()==="i")this.ui.setView("inventory");
 }
 startLoops(){
  if(this.saveInterval)clearInterval(this.saveInterval);
  if(this.refreshInterval)clearInterval(this.refreshInterval);
  this.saveInterval=setInterval(()=>this.save(),GAME.autosaveMs);
  this.refreshInterval=setInterval(()=>{
   if(!this.initialized)return;
   this.ui.updateHeader();
   if(this.ui.currentView==="garden")this.ui.renderGarden();
  },1000);
 }
 markDirty(){this.flags.dirty=true;}
 async save(){
  if(!this.player||!this.garden||this.flags.saving)return;
  this.flags.saving=true;
  try{
   saveLocal(this.player,this.garden);
   if(this.backendOnline){
    const remotePlayer={...this.player};
    delete remotePlayer.id;
    await savePlayer(this.player.id,remotePlayer);
    await saveGarden(this.player.id,this.garden);
    this.lastServerSync=Date.now();
   }
   this.flags.dirty=false;
  }catch(error){
   console.warn("save failed",error);
   saveLocal(this.player,this.garden);
  }finally{this.flags.saving=false;}
 }
 async cellClick(cell){
  if(!this.player||!this.garden)return;
  const crop=this.garden.crops[cell];
  if(crop){
   const result=harvest(this.player,this.garden,cell);
   if(!result.ok){
    this.ui.toast(result.message,"warn");
    return;
   }
   const amount=this.ui.money(result.amount);
   this.ui.toast(`${result.mutation} harvest · +🪙 ${amount} · +${result.xp} XP`);
   if(result.levelUps>0)this.ui.toast(`🎉 Level ${this.player.level}!`);
   this.markDirty();
  }else{
   const seed=this.ui.selectedSeed;
   const result=plant(this.player,this.garden,seed,cell);
   if(!result.ok){
    this.ui.toast(result.message,"warn");
    return;
   }
   const cfg=GAME.crops[seed];
   this.ui.toast(`${cfg.emoji} ${seed} geplant.`);
   this.markDirty();
  }
  this.ui.renderGarden();
  await this.save();
 }
 async buySeed(name){
  const result=buySeed(this.player,name);
  if(!result.ok){
   this.ui.toast(result.message||"Aankoop mislukt.","warn");
   return;
  }
  this.markDirty();
  this.ui.toast(`${GAME.crops[name].emoji} ${name} seed gekocht.`);
  this.ui.renderCurrent();
  await this.save();
 }
 async buyPet(name){
  const result=buyPet(this.player,name);
  if(!result.ok){
   this.ui.toast(result.message||"Aankoop mislukt.","warn");
   return;
  }
  this.markDirty();
  this.ui.toast(`🐾 ${name} gekocht.`);
  this.ui.renderCurrent();
  await this.save();
 }
 async equipPet(id){
  const result=equipPet(this.player,id);
  if(!result.ok){
   this.ui.toast(result.message||"Kon pet niet aanpassen.","warn");
   return;
  }
  this.markDirty();
  this.ui.renderCurrent();
  await this.save();
 }
 async claimQuest(id){
  const result=claimQuest(this.player,id);
  if(!result.ok){
   this.ui.toast("Deze quest is nog niet claimbaar.","warn");
   return;
  }
  this.markDirty();
  this.ui.toast(`📜 Quest klaar · +🪙 ${this.ui.money(result.reward)}`);
  this.ui.renderCurrent();
  await this.save();
 }
 async claimDaily(){
  const result=dailyReward(this.player);
  if(!result.ok){
   this.ui.toast("Daily reward is nog niet beschikbaar.","warn");
   return;
  }
  this.player.stats.daysPlayed=(this.player.stats.daysPlayed||1)+1;
  this.markDirty();
  this.ui.toast(`🎁 +${this.ui.money(result.coins)} coins · +${result.gems} gems`);
  this.ui.renderCurrent();
  await this.save();
 }
 async claimAchievement(id){
  const result=claimAchievement(this.player,id);
  if(!result.ok){
   this.ui.toast("Achievement niet beschikbaar.","warn");
   return;
  }
  this.markDirty();
  this.ui.toast(`🏆 Achievement · +🪙 ${this.ui.money(result.reward)}`);
  this.ui.renderCurrent();
  await this.save();
 }
 async rename(name){
  if(typeof name!=="string"||!name.trim())return;
  this.player.displayName=name.trim().slice(0,30);
  safeStorageSet("gg2_display_name",this.player.displayName);
  await this.save();
  this.ui.updateHeader();
 }
 async resetLocal(){
  try{
   localStorage.removeItem("gg2_real_web_v2");
   location.reload();
  }catch(error){console.warn(error);}
 }
 shutdown(){
  try{saveLocal(this.player,this.garden);}catch(error){}
  try{if(this.backendOnline)removePresence(this.player.id);}catch(error){}
 }
}
const controller=new AppController();
window.GrowGarden2=controller;
controller.start();
