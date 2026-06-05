const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // Sur Render — lit le fichier secret
  serviceAccount = require('/etc/secrets/firebase.json');
} else {
  // En local — lit le fichier JSON
  const path = require('path');
  serviceAccount = require(path.resolve(__dirname, '..', process.env.FIREBASE_KEY_PATH));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { admin, db };