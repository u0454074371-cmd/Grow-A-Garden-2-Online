
/*
 Grow Garden 2 - extended systems module
 Weather schedules, mutation math, achievements, rebirth previews,
 balancing tools, notifications and safe state normalization.
*/
export const RARITY_COLORS={
 Common:"#9ce5ab",Uncommon:"#76d8ff",Rare:"#8aa8ff",Epic:"#d09cff",Legendary:"#ffdb6e",Mythic:"#ff8ee6"
};
export const ACHIEVEMENTS=[
 {id:"first_harvest",title:"First Harvest",description:"Oogst je eerste crop.",target:1,stat:"harvested",reward:100},
 {id:"farmer_25",title:"Growing Fast",description:"Oogst 25 crops.",target:25,stat:"harvested",reward:500},
 {id:"farmer_100",title:"Master Farmer",description:"Oogst 100 crops.",target:100,stat:"harvested",reward:2500},
 {id:"rich_10k",title:"Small Tycoon",description:"Verdien 10.000 coins.",target:10000,stat:"coinsEarned",reward:1000},
 {id:"rich_100k",title:"Garden Tycoon",description:"Verdien 100.000 coins.",target:100000,stat:"coinsEarned",reward:10000},
 {id:"planter_50",title:"Green Thumb",description:"Plant 50 crops.",target:50,stat:"planted",reward:750}
];

export function calculateMutationChance(weather,seedRarity){
 let base={Common:.05,Uncommon:.06,Rare:.075,Epic:.09,Legendary:.12,Mythic:.15}[seedRarity]||.05;
 if(weather==="rain")base*=1.2;
 if(weather==="golden")base*=1.8;
 if(weather==="bloom")base*=1.35;
 return Math.min(.85,base);
}

export function rollMutation(seedRarity,weather){
 const rainbow=.002+(seedRarity==="Mythic"?.002:0)+(weather==="golden"?.001:0);
 const golden=.012+(weather==="golden"?.018:0);
 const giant=.05+calculateMutationChance(weather,seedRarity);
 const r=Math.random();
 if(r<rainbow)return"rainbow";
 if(r<rainbow+golden)return"golden";
 if(r<rainbow+golden+giant)return"giant";
 return"normal";
}

export function weatherSchedule(now=Date.now()){
 const phase=Math.floor(now/180000);
 const values=[
  {name:"clear",duration:180000},
  {name:"rain",duration:180000},
  {name:"clear",duration:180000},
  {name:"golden",duration:180000},
  {name:"bloom",duration:180000},
  {name:"clear",duration:180000}
 ];
 return values[phase%values.length].name;
}

export function nextWeatherChange(now=Date.now()){
 return 180000-(now%180000);
}

export function rebirthCost(rebirths){return Math.floor(25000*Math.pow(2,rebirths));}
export function rebirthReward(rebirths){
 return{gems:5+rebirths*2,coinMultiplier:1+(rebirths+1)*.1};
}
export function canRebirth(player){return player.level>=25 && player.coins>=rebirthCost(player.rebirths||0);}
export function performRebirth(player){
 if(!canRebirth(player))return{ok:false};
 player.rebirths=(player.rebirths||0)+1;
 player.coins=250;player.xp=0;player.level=1;
 player.gems+=rebirthReward(player.rebirths-1).gems;
 return{ok:true};
}

export function normalizePlayer(p){
 const clone={...p};
 clone.coins=Math.max(0,Number(clone.coins)||0);
 clone.gems=Math.max(0,Number(clone.gems)||0);
 clone.level=Math.max(1,Number(clone.level)||1);
 clone.xp=Math.max(0,Number(clone.xp)||0);
 clone.rebirths=Math.max(0,Number(clone.rebirths)||0);
 clone.seeds=clone.seeds&&typeof clone.seeds==="object"?clone.seeds:{};
 clone.pets=Array.isArray(clone.pets)?clone.pets:[];
 clone.equippedPets=Array.isArray(clone.equippedPets)?clone.equippedPets.slice(0,3):[];
 return clone;
}

export function normalizeGarden(g){
 const crops={};
 for(let i=0;i<64;i++)crops[i]=(g?.crops?.[i]??null);
 return{version:2,crops,updatedAt:Number(g?.updatedAt)||Date.now()};
}

export function achievementProgress(player){
 return ACHIEVEMENTS.map(a=>({...a,progress:Number(player?.stats?.[a.stat]||0),done:Number(player?.stats?.[a.stat]||0)>=a.target,claimed:!!player?.achievements?.[a.id]}));
}

export function claimAchievement(player,id){
 const a=achievementProgress(player).find(x=>x.id===id);
 if(!a||!a.done||a.claimed)return{ok:false};
 player.achievements=player.achievements||{};
 player.achievements[id]=Date.now();
 player.coins+=a.reward;
 return{ok:true,reward:a.reward};
}

export function economySummary(player,cropDatabase){
 const seedValue=Object.entries(player.seeds||{}).reduce((sum,[name,count])=>sum+(cropDatabase[name]?.price||0)*count,0);
 const inventoryValue=player.pets?.reduce((sum,p)=>sum+(cropDatabase[p.name]?.price||0),0)||0;
 return{coins:player.coins,gems:player.gems,seedValue,petValue:inventoryValue,totalLiquid:player.coins+seedValue};
}
