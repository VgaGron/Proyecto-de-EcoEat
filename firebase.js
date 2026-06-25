import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Herramientas exclusivas para que funcione en celulares (Expo / React Native)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// Mantén AQUÍ tus mismas llaves del proyecto anterior (no cambian)
const firebaseConfig = {
  apiKey: "AIzaSyC7bA1EKynktAPqSkGENag0SFpVtaEOJMI",
  authDomain: "ecoeat-3a228.firebaseapp.com",
  projectId: "ecoeat-3a228",
  storageBucket: "ecoeat-3a228.firebasestorage.app",
  messagingSenderId: "805365861786",
  appId: "1:805365861786:web:c0b384b9706f65ac597e23",
  measurementId: "G-W0TKR83F2R"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});