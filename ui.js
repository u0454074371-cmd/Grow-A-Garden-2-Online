
/*
 Grow Garden 2 - UI renderer and interaction layer.
 Large, reusable view components. All DOM creation is centralized here.
*/
import {GAME,currentWeather,cropProgress,isReady,selectedPetMultiplier,quests,levelNeeded} from "./game.js";

export class UI{
 constructor(app){
  this.app=app;
  this.currentView="garden";
  this.selectedSeed="Carrot";
  this.lastRender="";
 }
 money(n){return new Intl.NumberFormat("nl-NL").format(Math.floor(n||0));}
 escape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
 toast(msg,type="good"){
  const root=document.querySelector("#toast-root");if(!root)return;
  const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=msg;root.appendChild(el);
  setTimeout(()=>el.remove(),3200);
 }
 setView(view){
  this.currentView=view;
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  ["garden","shop","pets","quests","inventory"].forEach(v=>{
   const el=document.querySelector("#view-"+v);if(el)el.hidden=v!==view;
  });
  this.renderCurrent();
 }
 renderCurrent(){
  if(this.currentView==="garden")this.renderGarden();
  if(this.currentView==="shop")this.renderShop();
  if(this.currentView==="pets")this.renderPets();
  if(this.currentView==="quests")this.renderQuests();
  if(this.currentView==="inventory")this.renderInventory();
  this.updateHeader();
 }
 updateHeader(){
  const p=this.app.player;if(!p)return;
  document.querySelector("#coins").textContent=this.money(p.coins);
  document.querySelector("#gems").textContent=this.money(p.gems);
  document.querySelector("#level").textContent=p.level;
  document.querySelector("#player-name").textContent=p.displayName||"Garden Player";
  document.querySelector("#avatar").textContent=(p.displayName||"G").slice(0,1).toUpperCase();
 }

 renderGarden(){
  const root=document.querySelector("#view-garden"),p=this.app.player,g=this.app.garden;
  const weather=currentWeather();
  const xpPct=Math.min(100,p.xp/levelNeeded(p.level)*100);
  root.innerHTML=`
   <div class="hero">
    <div class="eyebrow">${weather.icon} ${weather.name.toUpperCase()}</div>
    <h2>Je tuin groeit.</h2>
    <p>Plant zaden, wacht op groeistages en oogst crops met mutations. Pets verhogen je opbrengsten.</p>
   </div>
   <div class="stats-grid">
    <div class="stat"><div class="label">Level</div><div class="value">${p.level}</div><div class="progress"><span style="width:${xpPct}%"></span></div></div>
    <div class="stat"><div class="label">Harvested</div><div class="value">${this.money(p.stats.harvested)}</div></div>
    <div class="stat"><div class="label">Pet bonus</div><div class="value">×${selectedPetMultiplier(p).toFixed(2)}</div></div>
    <div class="stat"><div class="label">Rebirths</div><div class="value">${p.rebirths||0}</div></div>
   </div>
   <div class="section-head"><h3>Garden Plot</h3><span class="muted">Klik een leeg veld om te planten · klik een rijpe crop om te oogsten</span></div>
   <div class="garden-panel">
    <div class="garden-tools">
      <div class="seed-selector">${this.seedButtons(p)}</div>
      <div><button class="action-btn alt" id="daily-btn">🎁 Daily Reward</button></div>
    </div>
    <div class="garden-grid">${this.gridCells(g)}</div>
   </div>`;
  root.querySelector("#daily-btn").onclick=()=>this.app.claimDaily();
  root.querySelectorAll("[data-seed]").forEach(b=>b.onclick=()=>{this.selectedSeed=b.dataset.seed;this.renderGarden();});
  root.querySelectorAll("[data-cell]").forEach(cell=>cell.onclick=()=>this.app.cellClick(Number(cell.dataset.cell)));
 }

 seedButtons(p){
  return Object.keys(GAME.crops).map(name=>{
   const count=p.seeds[name]||0;
   return `<button class="seed-select ${this.selectedSeed===name?"selected":""}" data-seed="${name}">
     ${GAME.crops[name].emoji} ${name} <b>${count}</b>
   </button>`;
  }).join("");
 }

 gridCells(g){
  const now=Date.now();
  return Object.keys(g.crops).map(k=>{
   const cell=Number(k),crop=g.crops[cell];
   if(!crop)return `<button class="plot-cell" data-cell="${cell}" title="Plant ${this.selectedSeed}"><span style="opacity:.4">+</span></button>`;
   const cfg=GAME.crops[crop.name];const ready=isReady(crop,now);const prog=cropProgress(crop,now);
   const mutation=GAME.mutations[crop.mutation]||GAME.mutations.normal;
   const remaining=Math.max(0,Math.ceil((crop.readyAt-now)/1000));
   const timer=ready?"READY":remaining+"s";
   return `<button class="plot-cell ${ready?"ready-glow":"growing"}" data-cell="${cell}" title="${ready?"Harvest":"Growing"}">
      <span class="crop-icon">${cfg.emoji}</span><span class="crop-name">${mutation.name} ${crop.name}</span>
      <span class="crop-timer">${timer}</span>
    </button>`;
  }).join("");
 }

 renderShop(){
  const root=document.querySelector("#view-shop");
  root.innerHTML=`<div class="section-head"><div><h3>Seed Shop</h3><span class="muted">Koop seeds en vul je voorraad.</span></div></div>
  <div class="card-grid">${Object.entries(GAME.crops).map(([name,c])=>`
   <article class="item-card">
    <div class="item-icon">${c.emoji}</div><h4>${name}</h4><p>${c.rarity} · groeit in ${c.grow}s · verkoopt voor ${c.sell} coins.</p>
    <div class="item-row"><span class="price">🪙 ${this.money(c.price)}</span><span class="rarity">${c.rarity}</span></div>
    <button class="action-btn" style="width:100%;margin-top:12px" data-buy-seed="${name}">Koop seed</button>
   </article>`).join("")}</div>`;
  root.querySelectorAll("[data-buy-seed]").forEach(b=>b.onclick=()=>this.app.buySeed(b.dataset.buySeed));
 }

 renderPets(){
  const root=document.querySelector("#view-pets"),p=this.app.player;
  root.innerHTML=`<div class="section-head"><div><h3>Pet House</h3><span class="muted">Equip tot ${GAME.maxEquippedPets} pets. Bonus: ×${selectedPetMultiplier(p).toFixed(2)}</span></div></div>
  <div class="card-grid">${Object.entries(GAME.pets).map(([name,c])=>`
   <article class="item-card">
    <div class="item-icon">${c.emoji}</div><h4>${name}</h4><p>${c.rarity} · je harvest wordt ×${c.multiplier.toFixed(2)}.</p>
    <div class="item-row"><span class="price">🪙 ${this.money(c.price)}</span><span class="rarity">${c.rarity}</span></div>
    <button class="action-btn" style="width:100%;margin-top:12px" data-buy-pet="${name}">Koop pet</button>
   </article>`).join("")}</div>
  <div class="section-head"><h3>Mijn pets</h3></div>
  <div class="card-grid">${(p.pets||[]).map(pet=>{
   const cfg=GAME.pets[pet.name],equipped=p.equippedPets.includes(pet.id);
   return `<article class="item-card"><div class="item-icon">${cfg?.emoji||"🐾"}</div><h4>${this.escape(pet.name)}</h4><p>Multiplier ×${cfg?.multiplier||1}</p><button class="action-btn ${equipped?"gold":"alt"}" data-equip="${pet.id}">${equipped?"Unequip":"Equip"}</button></article>`;
  }).join("")||`<div class="empty">Je hebt nog geen pets.</div>`}</div>`;
  root.querySelectorAll("[data-buy-pet]").forEach(b=>b.onclick=()=>this.app.buyPet(b.dataset.buyPet));
  root.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>this.app.equipPet(b.dataset.equip));
 }

 renderQuests(){
  const root=document.querySelector("#view-quests"),p=this.app.player;
  root.innerHTML=`<div class="section-head"><div><h3>Quests</h3><span class="muted">Voltooi doelen voor extra coins en XP.</span></div></div>
  ${quests(p).map(q=>`<article class="quest"><div class="quest-top"><div><h4>${q.title}</h4><p>${q.description}</p></div><button class="action-btn ${q.claimed?"alt":q.done?"gold":""}" ${(!q.done||q.claimed)?"disabled":""} data-claim="${q.id}">${q.claimed?"Claimed":q.done?"Claim":"In progress"}</button></div><div class="progress"><span style="width:${Math.min(100,q.progress/q.target*100)}%"></span></div><div class="item-row"><span class="muted">${this.money(q.progress)} / ${this.money(q.target)}</span><span class="price">🪙 ${this.money(q.reward)}</span></div></article>`).join("")}`;
  root.querySelectorAll("[data-claim]").forEach(b=>b.onclick=()=>this.app.claimQuest(b.dataset.claim));
 }

 renderInventory(){
  const p=this.app.player;
  const root=document.querySelector("#view-inventory");
  root.innerHTML=`<div class="section-head"><div><h3>Inventory</h3><span class="muted">Seeds, pets en progression.</span></div></div>
  <div class="card-grid">${Object.entries(GAME.crops).map(([n,c])=>`<article class="item-card"><div class="item-icon">${c.emoji}</div><h4>${n}</h4><p>Seeds in voorraad</p><div class="item-row"><b>${this.money(p.seeds[n]||0)}</b><span class="rarity">${c.rarity}</span></div></article>`).join("")}</div>
  <div class="section-head"><h3>Account</h3></div>
  <div class="item-card"><p>Player ID</p><h4>${this.escape(p.id||"local-demo")}</h4><p>Profile save status: ${this.app.backendOnline?"Firebase online":"Local fallback"}</p></div>`;
 }

 openSettings(){
  const modal=document.createElement("div");modal.className="modal-backdrop";
  modal.innerHTML=`<div class="modal"><div class="modal-head"><h3>Settings</h3><button class="close">×</button></div>
  <div class="modal-body"><p class="muted">Gameplay en account opties.</p>
   <div class="item-row"><span>Sound effects</span><button class="action-btn alt" id="sound-toggle">${this.app.player.settings.sound?"Aan":"Uit"}</button></div>
   <div class="item-row"><span>Music</span><button class="action-btn alt" id="music-toggle">${this.app.player.settings.music?"Aan":"Uit"}</button></div>
   <div class="item-row"><span>Save</span><button class="action-btn" id="save-now">Save now</button></div>
  </div></div>`;
  document.querySelector("#modal-root").appendChild(modal);
  modal.querySelector(".close").onclick=()=>modal.remove();
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
  modal.querySelector("#sound-toggle").onclick=()=>{this.app.player.settings.sound=!this.app.player.settings.sound;modal.querySelector("#sound-toggle").textContent=this.app.player.settings.sound?"Aan":"Uit";this.app.save();};
  modal.querySelector("#music-toggle").onclick=()=>{this.app.player.settings.music=!this.app.player.settings.music;modal.querySelector("#music-toggle").textContent=this.app.player.settings.music?"Aan":"Uit";this.app.save();};
  modal.querySelector("#save-now").onclick=()=>{this.app.save();this.toast("Game opgeslagen");};
 }
}
