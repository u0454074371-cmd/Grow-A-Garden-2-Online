import { GAME } from "../config/game.js";
import { readPlayer,writePlayer,patchPlayer } from "./database.js";

export function defaultPlayer(displayName="Player"){
 return {displayName,coins:GAME.startingCoins,gems:GAME.startingGems,level:1,xp:0,rebirths:0,
 seeds:{Carrot:5,Tomato:0,Blueberry:0,Starfruit:0,Moonmelon:0},
 pets:[],equippedPets:[],quests:{},settings:{music:true,sfx:true},createdAt:Date.now(),updatedAt:Date.now()};
}
export async function ensurePlayer(id,name="Player"){
 let p=await readPlayer(id);if(!p){p=defaultPlayer(name);await writePlayer(id,p);}return p;
}
export async function updatePlayer(id,patch){patch.updatedAt=Date.now();return patchPlayer(id,patch);}
export async function addCoins(id,amount,p){return updatePlayer(id,{coins:Math.max(0,(p.coins||0)+amount)});}
