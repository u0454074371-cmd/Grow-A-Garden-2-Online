import { GAME } from "../config/game.js";
export function renderSeedShop(el,onBuy){
 el.innerHTML="<h2>Seed Shop</h2>"+Object.entries(GAME.crops).map(([n,c])=>`
 <button class="shopItem" data-seed="${n}"><b>${n}</b><span>${c.price} coins · ${c.rarity}</span></button>`).join("");
 el.querySelectorAll("[data-seed]").forEach(b=>b.onclick=()=>onBuy(b.dataset.seed));
}
export function renderPetShop(el,onBuy){
 el.innerHTML="<h2>Pet Shop</h2>"+Object.entries(GAME.pets).map(([n,p])=>`
 <button class="shopItem" data-pet="${n}"><b>${n}</b><span>${p.price} coins · ×${p.multiplier}</span></button>`).join("");
 el.querySelectorAll("[data-pet]").forEach(b=>b.onclick=()=>onBuy(b.dataset.pet));
}
