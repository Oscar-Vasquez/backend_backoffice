const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() { try {
    const result = await prisma.payment_types.findFirst();
    console.log(JSON.stringify(result, null, 2));
}
catch (err) {
    console.error(err);
}
finally {
    await prisma.$disconnect();
} }
main();
//# sourceMappingURL=query.js.map