import { GAME } from "../config/game.js";
import { readGarden,writeGarden,patchGarden } from "./database.js";

export async function ensureGarden(id){
 let g=await readGarden(id);
 if(!g) {g={owner:id,crops:{},updatedAt:Date.now()};await writeGarden(id,g);}
 return g;
}
export async function plantCrop(id,crop,x,z){
 const cfg=GAME.crops[crop];if(!cfg)throw Error("Unknown crop");
 const g=await ensureGarden(id);const key=`${Date.now()}_${Math.random().toString(36).slice(2)}`;
 g.crops[key]={crop,x,z,plantedAt:Date.now(),readyAt:Date.now()+cfg.grow*1000,ready:false};
 await patchGarden(id,{crops:g.crops,updatedAt:Date.now()});return key;
}
export function isReady(crop){return crop && (crop.ready||Date.now()>=crop.readyAt);}
