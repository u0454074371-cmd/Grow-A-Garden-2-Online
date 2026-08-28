
/*
 Grow Garden 2 - Firebase layer
 This module deliberately degrades to local/demo mode when Firebase is unavailable.
 It is written as a real application layer rather than a tiny placeholder.
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const CONFIG = Object.freeze({
  apiKey:"AIzaSyCVm0hi6cL18kNA6ITBFiK1B7K9xNzUh8E",
  authDomain:"game-gag2-online.firebaseapp.com",
  projectId:"game-gag2-online",
  storageBucket:"game-gag2-online.firebasestorage.app",
  messagingSenderId:"1074153081214",
  appId:"1:1074153081214:web:a7487e92a2054e5b354b2f",
  measurementId:"G-P6XNGW6W9C",
  databaseURL:"https://game-gag2-online-default-rtdb.europe-west1.firebasedatabase.app"
});

let app=null;
let db=null;
let online=false;

export function getFirebaseConfig(){ return {...CONFIG}; }
export function isOnline(){ return online; }

export async function initializeFirebase(){
  try{
    app=initializeApp(CONFIG);
    db=getDatabase(app);
    await get(ref(db,".info/connected"));
    online=true;
    return {ok:true,mode:"firebase"};
  }catch(error){
    console.warn("Firebase unavailable; local mode enabled.",error);
    online=false;
    return {ok:false,mode:"local",error};
  }
}

function ensureDb(){
  if(!db) throw new Error("Firebase database is not initialized");
  return db;
}

export async function loadPlayer(playerId){
  if(!online) return null;
  try{
    const snap=await get(ref(ensureDb(),`players/${playerId}`));
    return snap.exists()?snap.val():null;
  }catch(error){
    console.warn("loadPlayer failed",error);
    return null;
  }
}

export async function savePlayer(playerId,data){
  if(!online) return {ok:false,mode:"local"};
  try{
    await set(ref(ensureDb(),`players/${playerId}`),{...data,updatedAt:Date.now()});
    return {ok:true};
  }catch(error){
    console.error("savePlayer failed",error);
    return {ok:false,error};
  }
}

export async function updatePlayer(playerId,patch){
  if(!online) return {ok:false,mode:"local"};
  try{
    await update(ref(ensureDb(),`players/${playerId}`),{...patch,updatedAt:Date.now()});
    return {ok:true};
  }catch(error){
    console.error("updatePlayer failed",error);
    return {ok:false,error};
  }
}

export async function loadGarden(playerId){
  if(!online) return null;
  try{
    const snap=await get(ref(ensureDb(),`gardens/${playerId}`));
    return snap.exists()?snap.val():null;
  }catch(error){
    console.warn("loadGarden failed",error);
    return null;
  }
}

export async function saveGarden(playerId,garden){
  if(!online) return {ok:false,mode:"local"};
  try{
    await set(ref(ensureDb(),`gardens/${playerId}`),{...garden,updatedAt:Date.now()});
    return {ok:true};
  }catch(error){
    console.error("saveGarden failed",error);
    return {ok:false,error};
  }
}

export function subscribePlayer(playerId,callback){
  if(!online || !db) return ()=>{};
  return onValue(ref(db,`players/${playerId}`),snap=>callback(snap.exists()?snap.val():null));
}

export function subscribeGarden(playerId,callback){
  if(!online || !db) return ()=>{};
  return onValue(ref(db,`gardens/${playerId}`),snap=>callback(snap.exists()?snap.val():null));
}

export async function touchPresence(playerId){
  if(!online) return;
  try{
    await set(ref(db,`presence/${playerId}`),{online:true,lastSeen:Date.now()});
  }catch(error){
    console.warn("presence failed",error);
  }
}

export async function removePresence(playerId){
  if(!online) return;
  try{
    await set(ref(db,`presence/${playerId}`),{online:false,lastSeen:Date.now()});
  }catch(error){}
}

export async function writeEvent(eventName,payload){
  if(!online) return;
  try{
    const key=Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
    await set(ref(db,`events/${eventName}/${key}`),{...payload,createdAt:Date.now()});
  }catch(error){
    console.warn("event write failed",error);
  }
}
