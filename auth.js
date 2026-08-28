import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase.js";

export async function anonymousLogin(){return signInAnonymously(auth);}
export function watchAuth(cb){return onAuthStateChanged(auth,cb);}
