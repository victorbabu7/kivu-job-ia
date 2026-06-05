const admin = require('firebase-admin');
const path  = require('path');
require('dotenv').config();

const serviceAccount = require(path.resolve(__dirname, '..', process.env.FIREBASE_KEY_PATH));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };