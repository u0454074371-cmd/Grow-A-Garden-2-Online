
/*
 Grow Garden 2 - utility layer
 Formatting, deterministic helpers, clone functions, event bus and validation.
*/
export const VERSION="2.1.0";
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const deepClone=o=>JSON.parse(JSON.stringify(o));
export const formatNumber=n=>new Intl.NumberFormat("nl-NL").format(Math.floor(Number(n)||0));
export const formatTime=sec=>{
 sec=Math.max(0,Math.floor(sec||0));
 const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
 return h?`${h}u ${String(m).padStart(2,"0")}m`:m?`${m}m ${String(s).padStart(2,"0")}s`:`${s}s`;
};
export function safeJsonParse(value,fallback=null){try{return JSON.parse(value)}catch{return fallback}}
export function safeStorageGet(key){try{return localStorage.getItem(key)}catch{return null}}
export function safeStorageSet(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}
export function randomId(prefix="id"){return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`}
export function weightedPick(items){
 const total=items.reduce((a,x)=>a+Math.max(0,x.weight||0),0);
 if(total<=0)return items[0]?.value;
 let r=Math.random()*total;
 for(const item of items){r-=Math.max(0,item.weight||0);if(r<=0)return item.value;}
 return items.at(-1)?.value;
}
export function validateName(name){
 return typeof name==="string" && name.trim().length>=1 && name.trim().length<=30;
}
export function eventBus(){
 const map=new Map();
 return{
  on(type,fn){if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);return()=>map.get(type)?.delete(fn)},
  emit(type,payload){for(const fn of map.get(type)||[])try{fn(payload)}catch(e){console.error(e)}},
  clear(){map.clear()}
 };
}
export function debounce(fn,wait=250){
 let timer;return(...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),wait)}
}
export function throttle(fn,wait=250){
 let last=0;let queued=false;return(...args)=>{
  const now=Date.now();
  if(now-last>=wait){last=now;fn(...args);return}
  if(!queued){queued=true;setTimeout(()=>{queued=false;last=Date.now();fn(...args)},wait-(now-last))}
 }}
}
export function percent(part,total){return total<=0?0:clamp(part/total*100,0,100)}
