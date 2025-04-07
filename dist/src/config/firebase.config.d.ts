import * as admin from 'firebase-admin';
export declare function initializeFirebase(): typeof admin;
export declare const db: admin.firestore.Firestore;
export declare const storage: import("firebase-admin/lib/storage/storage").Storage;
export declare const auth: import("firebase-admin/lib/auth/auth").Auth;
