import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

export function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        } as ServiceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
    }

    console.log('✅ Firebase inicializado correctamente');
    return admin;
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    throw error;
  }
}

// Inicializar Firebase y exportar la instancia de Firestore
const firebase = initializeFirebase();
export const db = firebase.firestore();

// Exportar otras instancias útiles
export const storage = firebase.storage();
export const auth = firebase.auth();

