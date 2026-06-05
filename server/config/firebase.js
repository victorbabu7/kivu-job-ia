const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

if (process.env.FIREBASE_KEY_JSON) {
  // Production (Render) — clé dans variable d'environnement
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);
} else {
  // Local — clé dans le fichier JSON
  const path = require('path');
  serviceAccount = require(path.resolve(__dirname, '..', process.env.FIREBASE_KEY_PATH));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { admin, db };