import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
try {
  const app = initializeApp();
  console.log("Initialized!");
  getAuth(app).listUsers(1).then(() => console.log("Can list users!")).catch(e => console.log("List users failed:", e.message));
} catch(e) {
  console.log("Init failed:", e.message);
}
