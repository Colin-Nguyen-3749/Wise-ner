// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDX92DeRlsPzbagB6uBdMuh7rm2LdL2yxc",
  authDomain: "wise-ner.firebaseapp.com",
  projectId: "wise-ner",
  storageBucket: "wise-ner.firebasestorage.app",
  messagingSenderId: "1089129721958",
  appId: "1:1089129721958:web:d85ae8bd4904e8d6807da7",
  measurementId: "G-W7H39TV6SX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Storage and export it
export const storage = getStorage(app);