import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVm0hi6cL18kNA6ITBFiK1B7K9xNzUh8E",
  authDomain: "game-gag2-online.firebaseapp.com",
  projectId: "game-gag2-online",
  storageBucket: "game-gag2-online.firebasestorage.app",
  messagingSenderId: "1074153081214",
  appId: "1:1074153081214:web:a7487e92a2054e5b354b2f",
  measurementId: "G-P6XNGW6W9C",
  databaseURL: "https://game-gag2-online-default-rtdb.europe-west1.firebasedatabase.app"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const analyticsPromise = isSupported().then(ok => ok ? getAnalytics(app) : null);
export default firebaseConfig;
