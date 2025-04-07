const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryDatabase() {
  try {
    const invoice = await prisma.invoices.findUnique({
      where: { id: 'd31b200f-336f-4e17-a35c-bbb729cbd2f6' },
      include: { payments: true }
    });
    
    console.log('Factura:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount.toString(),
      paid_amount: invoice.paid_amount?.toString(),
      remaining_amount: invoice.remaining_amount?.toString(),
      status: invoice.status,
      is_paid: invoice.is_paid
    });
    
    console.log('Pagos:', invoice.payments.map(p => ({
      id: p.id,
      amount: p.amount.toString(),
      date: p.payment_date,
      status: p.status
    })));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

queryDatabase(); 