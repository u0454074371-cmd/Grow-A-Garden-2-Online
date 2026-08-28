import { ref, get, set, update, remove, onValue, runTransaction } from "firebase/database";
import { db } from "../firebase/firebase.js";

export const playerRef = id => ref(db, `players/${id}`);
export const gardenRef = id => ref(db, `gardens/${id}`);

export async function readPlayer(id){const s=await get(playerRef(id));return s.exists()?s.val():null;}
export async function writePlayer(id,data){await set(playerRef(id),data);return data;}
export async function patchPlayer(id,data){await update(playerRef(id),data);}
export async function readGarden(id){const s=await get(gardenRef(id));return s.exists()?s.val():null;}
export async function writeGarden(id,data){await set(gardenRef(id),data);}
export async function patchGarden(id,data){await update(gardenRef(id),data);}
export async function deletePath(path){await remove(ref(db,path));}
export function watchPlayer(id,cb){return onValue(playerRef(id),s=>cb(s.val()));}
export function watchGarden(id,cb){return onValue(gardenRef(id),s=>cb(s.val()));}
export async function atomicNumber(path,delta){
  const r=ref(db,path);
  const result=await runTransaction(r,current=>(Number(current)||0)+delta);
  return result.snapshot.val();
}
