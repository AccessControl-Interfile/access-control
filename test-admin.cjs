const admin = require('firebase-admin');
try {
  admin.initializeApp();
  console.log("Initialized!");
  admin.auth().listUsers(1).then(() => console.log("Can list users!")).catch(e => console.log("List users failed:", e.message));
} catch(e) {
  console.log("Init failed:", e.message);
}
