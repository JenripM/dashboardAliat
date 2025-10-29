// src/firebase2.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Config de la segunda app
const firebaseConfig2 = {
  apiKey: "AIzaSyB2BYCwpeVhx0ZYd9AQJ2OorCxFJYebm20",
   authDomain: "ulima-template-empresas.firebaseapp.com",
   projectId: "ulima-template-empresas",
   storageBucket: "ulima-template-empresas.firebasestorage.app",
   messagingSenderId: "686155576780",
   appId: "1:686155576780:web:6241cc69f9c6cfc2a61969"
 };
// Para apps adicionales, se puede dar un nombre distinto
const app2 = !getApps().some(app => app.name === "secondary") 
  ? initializeApp(firebaseConfig2, "secondary") 
  : getApp("secondary");

export const db2 = getFirestore(app2);
