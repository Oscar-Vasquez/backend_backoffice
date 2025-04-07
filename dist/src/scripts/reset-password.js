"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
async function resetPassword() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('🔄 Iniciando restablecimiento de contraseña...');
        const userEmail = 'jesus@joshtechs.com';
        const newPassword = 'workexpresspanama';
        const user = await prisma.operators.findUnique({
            where: { email: userEmail }
        });
        if (!user) {
            console.error(`❌ Usuario con email ${userEmail} no encontrado`);
            return;
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.operators.update({
            where: { email: userEmail },
            data: { password: hashedPassword }
        });
        console.log(`✅ Contraseña actualizada exitosamente para ${userEmail}`);
    }
    catch (error) {
        console.error('❌ Error al restablecer la contraseña:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
resetPassword()
    .then(() => console.log('🏁 Proceso completado'))
    .catch(error => console.error('❌ Error en el proceso:', error));
//# sourceMappingURL=reset-password.js.map