"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
async function createOperator() {
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
        console.log('🔍 Verificando si el operador ya existe...');
        const operatorsRef = db.collection('operators');
        const snapshot = await operatorsRef
            .where('email', '==', 'oscar@admin.com')
            .get();
        if (!snapshot.empty) {
            console.log('⚠️ El operador ya existe, actualizando contraseña...');
            const operatorDoc = snapshot.docs[0];
            const hashedPassword = await bcrypt.hash('123456789', 10);
            await operatorDoc.ref.update({
                password: hashedPassword,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Contraseña actualizada exitosamente');
            return;
        }
        const operatorData = {
            email: 'oscar@admin.com',
            firstName: 'Oscar',
            lastName: 'Admin',
            phone: '+507300001',
            role: 'admin',
            status: 'active',
            branchReference: '/branches/nQhXoD0ceRHpKx86A92a',
            password: await bcrypt.hash('123456789', 10),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await operatorsRef.add(operatorData);
        console.log('✅ Operador creado exitosamente');
        console.log('📝 Detalles del operador:');
        console.log('🆔 ID:', docRef.id);
        console.log('📧 Email:', operatorData.email);
        console.log('👤 Nombre:', operatorData.firstName, operatorData.lastName);
        console.log('🔑 Contraseña (sin hashear):', '123456789');
        console.log('🎭 Rol:', operatorData.role);
        console.log('📍 Sucursal:', operatorData.branchReference);
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        process.exit(0);
    }
}
createOperator();
//# sourceMappingURL=create-operator.js.map