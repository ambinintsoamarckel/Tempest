const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
require('dotenv').config();

const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Remplacer \n par les nouvelles lignes
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

const app = initializeApp({
  credential: cert(firebaseConfig),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Remplacez par le nom de votre bucket
});
const storage = getStorage(app);

const bucket = storage.bucket();

// Exporte le bucket pour pouvoir l'utiliser ailleurs
module.exports = bucket;
