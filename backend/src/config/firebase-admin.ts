import admin from 'firebase-admin';
import path from 'path';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

try {
  admin.initializeApp({
    credential: admin.credential.cert(path.resolve(serviceAccountPath)),
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.warn('Firebase Admin failed to initialize. Check if service account JSON exists.');
}

export default admin;
