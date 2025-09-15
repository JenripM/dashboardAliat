// src/firebase.js (temporal)
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgeOEN_7M_uZoLOirAQBu0SXvcuH70hFE",
  authDomain: "universidades-template-test.firebaseapp.com",
  projectId: "universidades-template-test",
  storageBucket: "universidades-template-test.firebasestorage.app",
  messagingSenderId: "334623402993",
  appId: "1:334623402993:web:7585b9d3f0f1a6811b7250",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);