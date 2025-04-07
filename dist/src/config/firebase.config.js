"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.storage = exports.db = void 0;
exports.initializeFirebase = initializeFirebase;
const admin = require("firebase-admin");
function initializeFirebase() {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                }),
                storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
            });
        }
        console.log('✅ Firebase inicializado correctamente');
        return admin;
    }
    catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        throw error;
    }
}
const firebase = initializeFirebase();
exports.db = firebase.firestore();
exports.storage = firebase.storage();
exports.auth = firebase.auth();
//# sourceMappingURL=firebase.config.js.map