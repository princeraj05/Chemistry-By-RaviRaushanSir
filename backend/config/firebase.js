import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Ensure environment variables are loaded immediately at module import time
dotenv.config({ path: envPath });

let firebaseAdminApp = null;

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing in backend/.env');
}

try {
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  throw error;
}

/**
 * Verifies a Firebase ID token.
 * Enforces real verification using the Firebase Admin SDK.
 */
export const verifyFirebaseToken = async (idToken) => {
  if (!idToken) {
    throw new Error('Firebase ID token is required.');
  }
  return await admin.auth().verifyIdToken(idToken);
};

export { firebaseAdminApp };
