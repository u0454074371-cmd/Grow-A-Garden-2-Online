import { ref,onValue,serverTimestamp } from "firebase/database";
import { db } from "../firebase/firebase.js";

export function watchOnlinePlayers(cb){
 return onValue(ref(db,"presence"),s=>cb(s.val()||{}));
}
export function presenceRef(id){return ref(db,`presence/${id}`);}
