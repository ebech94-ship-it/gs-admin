import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGM7cyge01VzitBw2lmOpyP7Fy8S-akYY",
  authDomain: "godspeed-mobility.firebaseapp.com",
  projectId: "godspeed-mobility",
  storageBucket: "godspeed-mobility.firebasestorage.app",
  messagingSenderId: "894324711484",
  appId: "1:894324711484:web:ff10fd573d34654235e339",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);