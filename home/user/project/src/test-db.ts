import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAkI1Ybt1JiMip8wcuVpSxCs93nCsqtKRU",
  authDomain: "access-control-001.firebaseapp.com",
  databaseURL: "https://access-control-001-default-rtdb.firebaseio.com",
  projectId: "access-control-001",
  storageBucket: "access-control-001.firebasestorage.app",
  messagingSenderId: "285032281412",
  appId: "1:285032281412:web:39b08b3485e71f38441311",
  measurementId: "G-G60DQPWCCJ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

get(ref(db, 'users')).then(snap => {
  console.log("SUCCESS! Got data.");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
