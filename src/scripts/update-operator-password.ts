import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function updateOperatorPassword() {
  // Inicializar Firebase Admin usando variables de entorno
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
    
    // Buscar el operador por email
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

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('123456789', 10);
    console.log('🔐 Contraseña hasheada generada');

    // Actualizar el documento con la contraseña hasheada
    await operatorDoc.ref.update({
      password: hashedPassword,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('📧 Email:', operatorData.email);
    console.log('🔑 Nueva contraseña (sin hashear):', '123456789');
    console.log('🔒 Hash generado:', hashedPassword);

  } catch (error) {
    console.error('❌ Error al actualizar la contraseña:', error);
  } finally {
    // Cerrar la aplicación
    process.exit(0);
  }
}

updateOperatorPassword(); 