
/*
 Grow Garden 2 - Core game engine
 Includes state management, crops, progression, shop, pets, quests, mutations,
 weather, daily reward, offline growth, autosave and persistence.
*/
export const GAME={
 version:"2.1.0",
 maxGrid:64,
 maxEquippedPets:3,
 autosaveMs:30000,
 offlineCapMs:8*60*60*1000,
 crops:{
  Carrot:{emoji:"🥕",price:10,sell:18,grow:15,rarity:"Common",xp:5,seedPack:1},
  Tomato:{emoji:"🍅",price:35,sell:68,grow:30,rarity:"Uncommon",xp:10,seedPack:1},
  Blueberry:{emoji:"🫐",price:100,sell:210,grow:55,rarity:"Rare",xp:20,seedPack:1},
  Starfruit:{emoji:"⭐",price:350,sell:850,grow:100,rarity:"Epic",xp:45,seedPack:1},
  Moonmelon:{emoji:"🍈",price:1200,sell:3200,grow:180,rarity:"Legendary",xp:100,seedPack:1},
  Sunflower:{emoji:"🌻",price:2200,sell:5900,grow:240,rarity:"Mythic",xp:160,seedPack:1}
 },
 pets:{
  Bunny:{emoji:"🐰",price:250,rarity:"Common",multiplier:1.10},
  Cat:{emoji:"🐱",price:700,rarity:"Uncommon",multiplier:1.18},
  Fox:{emoji:"🦊",price:1200,rarity:"Rare",multiplier:1.30},
  Bee:{emoji:"🐝",price:3500,rarity:"Epic",multiplier:1.60},
  Dragon:{emoji:"🐉",price:15000,rarity:"Legendary",multiplier:2.20},
  Phoenix:{emoji:"🔥",price:50000,rarity:"Mythic",multiplier:3.00}
 },
 mutations:{
  normal:{name:"Normal",multiplier:1,color:"normal"},
  giant:{name:"Giant",multiplier:2,color:"giant"},
  golden:{name:"Golden",multiplier:4,color:"golden"},
  rainbow:{name:"Rainbow",multiplier:10,color:"rainbow"}
 },
 weather:{
  clear:{name:"Clear",growth:1,sell:1,icon:"☀️"},
  rain:{name:"Rain",growth:1.5,sell:1,icon:"🌧️"},
  golden:{name:"Golden Weather",growth:1.2,sell:1.5,icon:"✨"},
  bloom:{name:"Bloom Festival",growth:1.75,sell:1.25,icon:"🌸"}
 }
};

const STORAGE="gg2_real_web_v2";
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function clamp(n,a,b){return Math.min(b,Math.max(a,n));}

export function defaultPlayer(name="Garden Player"){
 return{
  id:"",
  displayName:name,
  coins:250,
  gems:10,
  xp:0,
  level:1,
  rebirths:0,
  seeds:{Carrot:5,Tomato:2,Blueberry:0,Starfruit:0,Moonmelon:0,Sunflower:0},
  pets:[],
  equippedPets:[],
  quests:{harvest:0,plant:0,earn:0},
  completedQuests:{},
  stats:{harvested:0,planted:0,coinsEarned:0,daysPlayed:1},
  settings:{sound:true,music:true},
  lastDaily:0,
  updatedAt:Date.now()
 };
}

export function defaultGarden(){
 const crops={};
 for(let i=0;i<GAME.maxGrid;i++) crops[i]=null;
 return{version:2,crops,updatedAt:Date.now()};
}

export function loadLocal(){
 try{
  const raw=localStorage.getItem(STORAGE);
  if(!raw) return null;
  const parsed=JSON.parse(raw);
  return parsed && parsed.player ? parsed:null;
 }catch(error){console.warn(error);return null;}
}

export function saveLocal(player,garden){
 try{
  localStorage.setItem(STORAGE,JSON.stringify({player,garden,savedAt:Date.now()}));
 }catch(error){console.warn("local save failed",error);}
}

export function migratePlayer(player){
 const base=defaultPlayer(player?.displayName||"Garden Player");
 const out={...base,...(player||{})};
 out.seeds={...base.seeds,...(player?.seeds||{})};
 out.stats={...base.stats,...(player?.stats||{})};
 out.settings={...base.settings,...(player?.settings||{})};
 out.pets=Array.isArray(player?.pets)?player.pets:[];
 out.equippedPets=Array.isArray(player?.equippedPets)?player.equippedPets:[];
 out.quests={...base.quests,...(player?.quests||{})};
 out.completedQuests={...(player?.completedQuests||{})};
 return out;
}

export function migrateGarden(garden){
 const base=defaultGarden();
 if(!garden) return base;
 const crops={...base.crops,...(garden.crops||{})};
 return{...base,...garden,crops};
}

export function selectedPetMultiplier(player){
 let total=1;
 for(const name of player.equippedPets||[]){
  if(GAME.pets[name]) total*=GAME.pets[name].multiplier;
 }
 return total;
}

export function levelNeeded(level){return Math.floor(100+Math.pow(level,1.7)*35);}
export function addXp(player,amount){
 player.xp+=Math.max(0,amount);
 let ups=0;
 while(player.xp>=levelNeeded(player.level)){
  player.xp-=levelNeeded(player.level);
  player.level++;
  ups++;
 }
 return ups;
}

export function currentWeather(now=Date.now()){
 const minute=Math.floor(now/(1000*60));
 const bucket=Math.floor(minute/3)%20;
 if(bucket===0||bucket===1) return GAME.weather.rain;
 if(bucket===8) return GAME.weather.golden;
 if(bucket===14) return GAME.weather.bloom;
 return GAME.weather.clear;
}

export function cropProgress(crop,now=Date.now(),weather=currentWeather(now)){
 if(!crop) return 0;
 const elapsed=Math.max(0,now-crop.plantedAt);
 const total=Math.max(1,crop.readyAt-crop.plantedAt);
 const base=clamp(elapsed/total,0,1);
 if(crop.ready||base>=1)return 1;
 return clamp(base*weather.growth,0,1);
}

export function isReady(crop,now=Date.now()){
 return !!crop && (crop.ready || now>=crop.readyAt);
}

export function mutateCrop(cropName){
 const r=Math.random();
 if(r<0.003)return"rainbow";
 if(r<0.015)return"golden";
 if(r<0.06)return"giant";
 return"normal";
}

export function createCrop(name,cell,now=Date.now()){
 const cfg=GAME.crops[name];
 const mutation=mutateCrop(name);
 return{
  id:uid(),name,cell,
  plantedAt:now,
  readyAt:now+cfg.grow*1000,
  ready:false,
  mutation,
  water:0,
  fertilized:false
 };
}

export function plant(player,garden,name,cell,now=Date.now()){
 const cfg=GAME.crops[name];
 if(!cfg)return{ok:false,message:"Deze crop bestaat niet."};
 if(!Number.isInteger(cell)||cell<0||cell>=GAME.maxGrid)return{ok:false,message:"Ongeldig veld."};
 if(garden.crops[cell])return{ok:false,message:"Dit veld is al bezet."};
 if((player.seeds[name]||0)<=0)return{ok:false,message:"Je hebt geen zaden van deze soort."};
 player.seeds[name]--;
 garden.crops[cell]=createCrop(name,cell,now);
 player.stats.planted++;
 player.quests.plant=(player.quests.plant||0)+1;
 return{ok:true,crop:garden.crops[cell]};
}

export function harvest(player,garden,cell,now=Date.now()){
 const crop=garden.crops[cell];
 if(!crop)return{ok:false,message:"Hier groeit niets."};
 if(!isReady(crop,now))return{ok:false,message:"Deze crop is nog niet klaar."};
 const cfg=GAME.crops[crop.name];
 const mutation=GAME.mutations[crop.mutation]||GAME.mutations.normal;
 const weather=currentWeather(now);
 const amount=Math.floor(cfg.sell*mutation.multiplier*weather.sell*selectedPetMultiplier(player));
 const xp=Math.floor(cfg.xp*mutation.multiplier);
 player.coins+=amount;
 player.xp+=0;
 const levelUps=addXp(player,xp);
 player.stats.harvested++;
 player.stats.coinsEarned+=amount;
 player.quests.harvest=(player.quests.harvest||0)+1;
 player.quests.earn=(player.quests.earn||0)+amount;
 garden.crops[cell]=null;
 return{ok:true,amount,xp,levelUps,crop,mutation:mutation.name};
}

export function buySeed(player,name){
 const cfg=GAME.crops[name];
 if(!cfg)return{ok:false,message:"Onbekend seed."};
 if(player.coins<cfg.price)return{ok:false,message:"Niet genoeg coins."};
 player.coins-=cfg.price;
 player.seeds[name]=(player.seeds[name]||0)+cfg.seedPack;
 return{ok:true};
}

export function buyPet(player,name){
 const cfg=GAME.pets[name];
 if(!cfg)return{ok:false,message:"Onbekende pet."};
 if(player.coins<cfg.price)return{ok:false,message:"Niet genoeg coins."};
 player.coins-=cfg.price;
 player.pets.push({id:uid(),name,createdAt:Date.now()});
 return{ok:true};
}

export function equipPet(player,petId){
 const pet=player.pets.find(p=>p.id===petId);
 if(!pet)return{ok:false,message:"Pet niet gevonden."};
 if(player.equippedPets.includes(petId)){
  player.equippedPets=player.equippedPets.filter(id=>id!==petId);
  return{ok:true,equipped:false};
 }
 if(player.equippedPets.length>=GAME.maxEquippedPets)return{ok:false,message:`Maximaal ${GAME.maxEquippedPets} pets.`};
 player.equippedPets.push(petId);
 return{ok:true,equipped:true};
}

export function petNameMultiplier(player,petId){
 const pet=player.pets.find(p=>p.id===petId);return pet?GAME.pets[pet.name]?.multiplier||1:1;
}

export function quests(player){
 const rows=[
  {id:"harvest",title:"Harvest Helper",description:"Oogst 10 crops.",target:10,progress:player.quests.harvest||0,reward:300},
  {id:"plant",title:"Green Thumb",description:"Plant 15 crops.",target:15,progress:player.quests.plant||0,reward:250},
  {id:"earn",title:"Garden Tycoon",description:"Verdien 2.500 coins.",target:2500,progress:player.quests.earn||0,reward:500}
 ];
 return rows.map(q=>({...q,done:q.progress>=q.target,claimed:!!player.completedQuests[q.id]}));
}

export function claimQuest(player,id){
 const q=quests(player).find(x=>x.id===id);
 if(!q||!q.done||q.claimed)return{ok:false};
 player.completedQuests[id]=Date.now();
 player.coins+=q.reward;
 addXp(player,50);
 return{ok:true,reward:q.reward};
}

export function dailyReward(player,now=Date.now()){
 const day=86400000;
 if(now-player.lastDaily<day)return{ok:false};
 player.lastDaily=now;
 const streak=Math.min(7,(player.stats.daysPlayed||1)%7+1);
 const coins=100*streak;
 const gems=1+(streak>=5?2:0);
 player.coins+=coins;player.gems+=gems;
 return{ok:true,coins,gems,streak};
}

export function applyOfflineGrowth(garden,lastSaved,now=Date.now()){
 if(!lastSaved)return{grown:0};
 const diff=clamp(now-lastSaved,0,GAME.offlineCapMs);
 let grown=0;
 for(const crop of Object.values(garden.crops)){
  if(!crop||crop.ready)continue;
  if(now>=crop.readyAt){crop.ready=true;grown++;}
 }
 return{grown,diff};
}

export function serialize(player,garden){
 return JSON.parse(JSON.stringify({player,garden,savedAt:Date.now()}));
}
