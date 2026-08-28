import { ref, get, set, update } from "firebase/database";
import { db } from "../firebase/firebase.js";

export async function getPlayer(playerId) {
  const snapshot = await get(ref(db, `players/${playerId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function createPlayer(playerId, displayName) {
  const data = {
    displayName,
    coins: 250,
    gems: 10,
    level: 1,
    xp: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await set(ref(db, `players/${playerId}`), data);
  return data;
}

export async function updatePlayer(playerId, patch) {
  await update(ref(db, `players/${playerId}`), {
    ...patch,
    updatedAt: Date.now()
  });
}
