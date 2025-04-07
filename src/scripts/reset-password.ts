import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function resetPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando restablecimiento de contraseña...');
    
    // Email del usuario a actualizar
    const userEmail = 'jesus@joshtechs.com';
    
    // Nueva contraseña
    const newPassword = 'workexpresspanama';
    
    // Verificar si el usuario existe
    const user = await prisma.operators.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.error(`❌ Usuario con email ${userEmail} no encontrado`);
      return;
    }
    
    // Generar hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña
    await prisma.operators.update({
      where: { email: userEmail },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Contraseña actualizada exitosamente para ${userEmail}`);
    
  } catch (error) {
    console.error('❌ Error al restablecer la contraseña:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword()
  .then(() => console.log('🏁 Proceso completado'))
  .catch(error => console.error('❌ Error en el proceso:', error)); 