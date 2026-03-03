import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAkI1Ybt1JiMip8wcuVpSxCs93nCsqtKRU",
  authDomain: "access-control-001.firebaseapp.com",
  databaseURL: "https://access-control-001-default-rtdb.firebaseio.com",
  projectId: "access-control-001",
  storageBucket: "access-control-001.firebasestorage.app",
  messagingSenderId: "285032281412",
  appId: "1:285032281412:web:39b08b3485e71f38441311",
  measurementId: "G-G60DQPWCCJ"
};

export const logFirebaseConfig = {
  apiKey: "AIzaSyBifqBJxBNL6L5mtIQC6gc5gBDaBpRNadM",
  authDomain: "audit-logs-57a60.firebaseapp.com",
  databaseURL: "https://audit-logs-57a60-default-rtdb.firebaseio.com",
  projectId: "audit-logs-57a60",
  storageBucket: "audit-logs-57a60.firebasestorage.app",
  messagingSenderId: "54762764409",
  appId: "1:54762764409:web:54632d117866e51ad1fca8",
  measurementId: "G-DB9EYYQWQ7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Initialize Log Firebase
export const logApp = initializeApp(logFirebaseConfig, "logs");
export const logDb = getDatabase(logApp);
