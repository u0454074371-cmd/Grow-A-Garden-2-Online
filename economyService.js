import { GAME } from "../config/game.js";
import { updatePlayer } from "./playerService.js";

export function petMultiplier(player){
 return (player.equippedPets||[]).reduce((m,n)=>m*(GAME.pets[n]?.multiplier||1),1);
}
export function sellValue(crop,player,mutation=1){
 const c=GAME.crops[crop];if(!c)return 0;
 return Math.floor(c.sell*mutation*petMultiplier(player));
}
export async function buySeed(id,player,crop){
 const c=GAME.crops[crop];if(!c||player.coins<c.price)return false;
 player.coins-=c.price;player.seeds[crop]=(player.seeds[crop]||0)+1;
 await updatePlayer(id,{coins:player.coins,seeds:player.seeds});return true;
}
export async function buyPet(id,player,name){
 const p=GAME.pets[name];if(!p||player.coins<p.price)return false;
 player.coins-=p.price;player.pets=[...(player.pets||[]),name];
 await updatePlayer(id,{coins:player.coins,pets:player.pets});return true;
}
