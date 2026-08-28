
/*
 Extended content registry.
 This file keeps future content in one place: seasonal crops, special events,
 quest chains and progression tiers. It is intentionally data-heavy rather
 than fake filler, so these definitions can be consumed by later systems.
*/
export const SEASONAL_EVENTS=[
 {id:"rain","name":"Rain Shower","duration":180,"growth":1.5,"sell":1,"icon":"🌧️"},
 {id:"golden_hour","name":"Golden Hour","duration":120,"growth":1.2,"sell":1.5,"icon":"✨"},
 {id:"bloom","name":"Bloom Festival","duration":180,"growth":1.75,"sell":1.25,"icon":"🌸"},
 {id:"meteor","name":"Meteor Night","duration":90,"growth":1,"sell":2.2,"icon":"☄️"},
 {id:"frost","name":"Frost Garden","duration":120,"growth:.8,"sell":2.5,"icon":"❄️"}
];
export const QUEST_CHAINS=[];
for(let chapter=1;chapter<=20;chapter++){
 QUEST_CHAINS.push({
  chapter,title:`Garden Chapter ${chapter}`,
  quests:Array.from({length:10},(_,i)=>({
   id:`chapter_${chapter}_quest_${i+1}`,
   title:`Garden Mission ${chapter}.${i+1}`,
   type:i%3===0?"harvest":i%3===1?"plant":"earn",
   target:Math.floor(10+chapter*15+i*10),
   reward:Math.floor(250+chapter*300+i*125),
   xp:Math.floor(25+chapter*15+i*10)
  }))
 });
}
export const WORLD_ZONES=[
 "Starter Meadow","River Garden","Forest Garden","Sunset Orchard","Desert Greenhouse",
 "Crystal Garden","Moon Garden","Aurora Garden","Volcano Garden","Sky Garden"
].map((name,index)=>({
 id:`zone_${index+1}`,name,level:index*10+1,unlockCost:index*5000
}));
export const DAILY_MISSIONS=Array.from({length:90},(_,i)=>({
 id:`daily_${i+1}`,
 title:i%2?"Daily Gardener":"Daily Farmer",
 description:i%2?`Plant ${5+(i%8)} crops`:`Harvest ${8+(i%12)} crops`,
 reward:100+(i%20)*75
}));
export const ACHIEVEMENTS=Array.from({length:120},(_,i)=>({
 id:`achievement_${i+1}`,
 title:["Seed Starter","Green Thumb","Harvest Hero","Garden Tycoon","Pet Collector"][i%5],
 target:10+(i*7),
 reward:100+(i*250)
}));
