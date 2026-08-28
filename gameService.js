import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebase.js";

export function subscribeToPlayer(playerId, callback) {
  return onValue(ref(db, `players/${playerId}`), (snapshot) => {
    callback(snapshot.val());
  });
}

export function subscribeToWorld(callback) {
  return onValue(ref(db, "world"), (snapshot) => {
    callback(snapshot.val());
  });
}
