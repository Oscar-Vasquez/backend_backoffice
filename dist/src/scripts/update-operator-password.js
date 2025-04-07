"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
async function updateOperatorPassword() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    const db = admin.firestore();
    try {
        console.log('🔍 Buscando operador...');
        const operatorsRef = db.collection('operators');
        const snapshot = await operatorsRef
            .where('email', '==', 'operador@workexpress.com')
            .get();
        if (snapshot.empty) {
            console.log('❌ No se encontró el operador');
            return;
        }
        const operatorDoc = snapshot.docs[0];
        const operatorData = operatorDoc.data();
        const hashedPassword = await bcrypt.hash('123456789', 10);
        console.log('🔐 Contraseña hasheada generada');
        await operatorDoc.ref.update({
            password: hashedPassword,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Contraseña actualizada exitosamente');
        console.log('📧 Email:', operatorData.email);
        console.log('🔑 Nueva contraseña (sin hashear):', '123456789');
        console.log('🔒 Hash generado:', hashedPassword);
    }
    catch (error) {
        console.error('❌ Error al actualizar la contraseña:', error);
    }
    finally {
        process.exit(0);
    }
}
updateOperatorPassword();
//# sourceMappingURL=update-operator-password.js.map