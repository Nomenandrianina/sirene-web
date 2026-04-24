import * as admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json';

export function initFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('🔥 Firebase initialized OK');
  }
}