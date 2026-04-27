import * as admin from 'firebase-admin';

export function initFirebase() { 
  if (!admin.apps.length) { 
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ?.replace(/\\n/g, '\n') .replace(/^"|"$/g, ''); 
    admin.initializeApp({ credential: admin.credential.cert({ 
      projectId: process.env.FIREBASE_PROJECT_ID, 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }), }); 
      console.log('🔥 Firebase initialized OK'); 
  } 
}