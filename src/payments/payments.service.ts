import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../modules/activities/activities.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Invoice, INVOICE_STATUS, ShippingStage, InvoiceStatusType } from './types';
import { ActivityAction, ActivityStatus } from '../modules/activities/interfaces/operator-activity.interface';
import { payment_method_enum, payment_status_enum, invoice_status_enum } from '@prisma/client';

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
    private readonly transactionsService: TransactionsService
  ) {
    console.log('🚀 PaymentsService inicializado');
  }

  async onModuleInit() {
    try {
      // Verificar la conexión a la base de datos
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexión a la base de datos verificada');
      
      // Contar registros de facturas y pagos para verificar acceso
      const invoicesCount = await this.prisma.invoices.count();
      const paymentsCount = await this.prisma.payments.count();
      
      console.log('📁 Tabla invoices accesible. Registros:', invoicesCount);
      console.log('📁 Tabla payments accesible. Registros:', paymentsCount);
    } catch (error) {
      console.error('❌ Error al verificar tablas en la base de datos:', error);
      // No lanzamos error para permitir que el servicio inicie aunque haya problemas
    }
  }

  async processPayment(
    invoiceId: string,
    amount: number,
    paymentDetails: {
      method: string;
      amountReceived: number;
      paymentMethodId?: string;
      isPartialPayment?: boolean;
      requestId?: string;
    },
    operatorData: {
      id: string;
      email: string;
    }
  ): Promise<any> {
    const requestId = paymentDetails.requestId || 'no-id';
    console.log(`🔄 [${requestId}] Procesando pago:`, {
      invoiceId,
      amount,
      paymentDetails: {
        method: paymentDetails.method,
        amountReceived: paymentDetails.amountReceived,
        paymentMethodId: paymentDetails.paymentMethodId,
        isPartialPayment: paymentDetails.isPartialPayment
      },
      operador: {
        id: operatorData.id,
        email: operatorData.email
      }
    });

    try {
      // Obtener datos de la factura
      const invoiceData = await this.prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true // Incluir pagos previos para calcular total pagado
        }
      });
      
      if (!invoiceData) {
        throw new Error('Factura no encontrada');
      }

      // Log detallado de todos los pagos recibidos para depuración
      console.log(`🔍 [${requestId}] DATOS DE PAGOS RECIBIDOS:`, {
        invoice_id: invoiceId,
        total_payments: invoiceData.payments.length,
        all_payments: invoiceData.payments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          date: p.payment_date
        }))
      });

      // Obtener datos del operador
      const operatorInfo = await this.prisma.operators.findUnique({
        where: { id: operatorData.id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      });

      if (!operatorInfo) {
        throw new HttpException({
          message: 'Operador no encontrado',
          details: 'No se encontró el operador que intenta procesar el pago'
        }, HttpStatus.NOT_FOUND);
      }
      
      // Verificar si ya está completamente pagada (solo si no es un pago parcial)
      if (invoiceData.status === invoice_status_enum.paid || invoiceData.is_paid === true) {
        console.log('❌ La factura ya está pagada:', {
          status: invoiceData.status,
          isPaid: invoiceData.is_paid,
          invoiceId: invoiceId
        });
        throw new HttpException({
          message: 'Factura ya pagada',
          details: 'Esta factura ya ha sido pagada anteriormente'
        }, HttpStatus.BAD_REQUEST);
      }

      // Obtener el monto total de la factura
      const invoiceAmount = Number(invoiceData.total_amount);

      // Calcular monto ya pagado (de pagos anteriores)
      const previousPaidAmount = invoiceData.payments
        .filter(payment => payment.status === payment_status_enum.completed) // Solo contar pagos completados
        .reduce((total, payment) => {
          console.log(`📊 [${requestId}] Pago previo:`, {
            id: payment.id,
            amount: Number(payment.amount),
            status: payment.status,
            date: payment.payment_date
          });
          return total + Number(payment.amount);
        }, 0);

      // Calcular monto restante por pagar
      const remainingAmount = invoiceAmount - previousPaidAmount;

      console.log(`💰 [${requestId}] Montos:`, {
        amountToPayNow: amount,
        totalInvoiceAmount: invoiceAmount,
        pagosPrevios: invoiceData.payments.length,
        pagosPreviosCompletados: invoiceData.payments.filter(p => p.status === payment_status_enum.completed).length,
        previousPaidAmount: previousPaidAmount,
        remainingAmount: remainingAmount,
        isPartialPayment: paymentDetails.isPartialPayment
      });

      // Verificar que el monto a pagar no sea mayor que el monto restante
      if (amount > remainingAmount) {
        throw new HttpException({
          message: '¡Monto excede lo pendiente! 🚫',
          details: `El monto del pago ($${amount}) es mayor que el monto restante por pagar ($${remainingAmount})`
        }, HttpStatus.BAD_REQUEST);
      }

      // Convertir el método de pago al enum de Prisma
      const paymentMethod = this.convertToPaymentMethodEnum(paymentDetails.method);

      // Usar el ID proporcionado o el ID fijo como respaldo
      const FIXED_PAYMENT_METHOD_ID = '3e7a40e3-307d-4846-8f65-f4f1668bbfb3';
      const paymentMethodId = paymentDetails.paymentMethodId || FIXED_PAYMENT_METHOD_ID;

      // Ejecutar todo en una transacción
      return await this.prisma.$transaction(async (tx) => {
        // Crear el registro de pago primero para poder usar su ID como referencia
        const payment = await tx.payments.create({
          data: {
            invoice_id: invoiceId,
            amount: amount,
            payment_method: paymentMethod,
            payment_method_id: paymentMethodId, // Usar el ID proporcionado o el ID fijo
            status: payment_status_enum.completed,
            payment_date: new Date(),
            payer_details: {
              method: paymentDetails.method,
              amountReceived: paymentDetails.amountReceived,
              processedBy: operatorData.id,
              paymentMethodId: paymentMethodId,
              isPartialPayment: paymentDetails.isPartialPayment
            }
          }
        });

        // IDs fijos para la transacción
        const FIXED_CATEGORY_ID = '1828014d-5e86-4007-b92d-1ee75828dbce';
        const FIXED_TRANSACTION_TYPE_ID = '0d0d364e-f554-4d08-937d-61c499936b1d';

        // Crear una nueva transacción para el pago
        const transaction = await this.transactionsService.createTransaction({
          description: `${paymentDetails.isPartialPayment ? 'Pago parcial' : 'Pago'} de factura #${invoiceData.invoice_number || invoiceId.substring(0, 8)}`,
          status: 'completed',
          transactionType: 'payment',
          entityType: 'invoice',
          entityId: invoiceId,
          referenceId: payment.id, // Usar el ID del pago como referencia
          metadata: {
            invoiceId,
            invoiceNumber: invoiceData.invoice_number,
            amount,
            paymentMethod: paymentDetails.method,
            paymentMethodId: paymentMethodId,
            paymentId: payment.id, // Incluir también el ID del pago en los metadatos
            amountReceived: paymentDetails.amountReceived,
            isPartialPayment: paymentDetails.isPartialPayment,
            previousPaidAmount: previousPaidAmount,
            totalPaidAmount: previousPaidAmount + amount,
            remainingAmount: remainingAmount - amount,
            totalInvoiceAmount: invoiceAmount,
            processedBy: {
              id: operatorData.id,
              name: `${operatorInfo.first_name} ${operatorInfo.last_name}`,
              email: operatorInfo.email
            },
            changeAmount: paymentDetails.amountReceived - amount,
            paymentDate: new Date().toISOString()
          },
          amount: amount,
          paymentMethodId: paymentMethodId,
          categoryId: FIXED_CATEGORY_ID, // Usar el ID fijo para la categoría
          transactionTypeId: FIXED_TRANSACTION_TYPE_ID // Usar el ID fijo para el tipo de transacción
        });

        console.log('✅ Transacción creada:', transaction.id);

        // Actualizar el pago para incluir la transacción
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            transaction_id: transaction.id
          }
        });

        // Calcular el total pagado (pagos anteriores + pago actual)
        const totalPaidAmount = previousPaidAmount + amount;
        
        // Verificar si el pago cubre el total de la factura, independientemente del flag isPartialPayment
        const isAmountFullyPaid = Math.abs(totalPaidAmount - invoiceAmount) < 0.01;
        
        // Determinar si es pago completo o parcial 
        // Si isPartialPayment es true pero el monto pagado cubre el total, considerarlo como pago completo
        let isFullyPaid = false;
        
        if (isAmountFullyPaid) {
          // Si el monto pagado cubre el total, siempre marcar como pagado completamente
          isFullyPaid = true;
        } else if (paymentDetails.isPartialPayment === true) {
          // Si es explícitamente un pago parcial y no cubre el total
          isFullyPaid = false;
        } else {
          // Para compatibilidad con código existente
          isFullyPaid = Math.abs(totalPaidAmount - invoiceAmount) < 0.01;
        }
        
        console.log('💳 Detalles de pago:', {
          isPartialPayment: paymentDetails.isPartialPayment,
          calculatedIsFullyPaid: Math.abs(totalPaidAmount - invoiceAmount) < 0.01,
          isAmountFullyPaid,
          finalIsFullyPaid: isFullyPaid,
          totalPaidAmount,
          invoiceAmount,
          previousPaidAmount,
          currentAmount: amount,
          remainingAmount: invoiceAmount - totalPaidAmount
        });
        
        // Actualizar la factura con el estado correspondiente
        const updatedInvoice = await tx.invoices.update({
          where: { id: invoiceId },
          data: {
            status: isFullyPaid ? invoice_status_enum.paid : invoice_status_enum.partial,
            is_paid: isFullyPaid,
            paid_amount: totalPaidAmount,
            remaining_amount: invoiceAmount - totalPaidAmount,
            last_payment_date: new Date()
          }
        });

        // Crear actividad
        const activity = {
          operatorId: operatorData.id,
          operatorName: `${operatorInfo.first_name} ${operatorInfo.last_name}`,
          action: ActivityAction.PAYMENT_PROCESSED,
          description: `${isFullyPaid ? 'Pago completo' : 'Pago parcial'} procesado para factura ${invoiceId} por ${amount} (${paymentDetails.method})`,
          entityType: 'invoice',
          entityId: invoiceId,
          metadata: {
            invoiceId,
            amount,
            paymentMethod: paymentDetails.method,
            transactionId: transaction.id,
            isPartialPayment: !isFullyPaid,
            paidAmount: totalPaidAmount,
            remainingAmount: invoiceAmount - totalPaidAmount,
            processedBy: {
              id: operatorData.id,
              name: `${operatorInfo.first_name} ${operatorInfo.last_name}`
            }
          },
          status: ActivityStatus.COMPLETED,
          timestamp: new Date().toISOString()
        };

        console.log('📝 Intentando crear actividad:', activity);
        
        try {
          await this.activitiesService.createActivity(activity);
          console.log('✅ Actividad creada exitosamente');
        } catch (activityError) {
          console.error('⚠️ Error al crear actividad:', activityError);
          // No lanzamos el error para no afectar el flujo principal
        }

        return {
          success: true,
          transactionId: transaction.id,
          paymentId: payment.id,
          message: isFullyPaid ? 'Pago completo procesado correctamente' : 'Pago parcial procesado correctamente',
          isPartialPayment: !isFullyPaid,
          paidAmount: totalPaidAmount,
          remainingAmount: invoiceAmount - totalPaidAmount
        };
      });
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      throw error instanceof HttpException 
        ? error 
        : new HttpException(
            { message: error instanceof Error ? error.message : 'Error al procesar el pago' },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    try {
      console.log('🔍 Buscando facturas del usuario:', userId);
      
      if (!userId?.trim()) {
        throw new HttpException({
          message: 'ID de usuario inválido',
          details: 'El ID del usuario es requerido'
        }, HttpStatus.BAD_REQUEST);
      }

      // Verificar si el usuario existe
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      });
      
      if (!user) {
        console.log('❌ Usuario no encontrado:', userId);
        return [];
      }

      console.log('👤 Usuario encontrado:', {
        id: userId,
        nombre: `${user.first_name} ${user.last_name}`,
        email: user.email
      });

      // 1. Verificamos si hay facturas "PARCIAL" con remaining_amount = 0 y las actualizamos
      const partialsWithNoRemaining = await this.prisma.invoices.findMany({
        where: {
          user_id: userId,
          status: invoice_status_enum.partial,
          remaining_amount: { 
            lte: 0.01 // Consideramos valores muy pequeños (centavos) como completamente pagados
          }
        },
        select: { id: true }
      });
      
      // Si encontramos facturas para actualizar, las marcamos como pagadas
      if (partialsWithNoRemaining.length > 0) {
        console.log(`🔄 Actualizando ${partialsWithNoRemaining.length} facturas del usuario que estaban en estado PARCIAL pero ya no tienen saldo pendiente`);
        
        const ids = partialsWithNoRemaining.map(inv => inv.id);
        
        await this.prisma.invoices.updateMany({
          where: { id: { in: ids } },
          data: {
            status: invoice_status_enum.paid,
            is_paid: true
          }
        });
        
        console.log(`✅ ${partialsWithNoRemaining.length} facturas del usuario actualizadas a estado PAGADO`);
      }

      // Buscar facturas por userId con sus paquetes y posiciones
      const invoices = await this.prisma.invoices.findMany({
        where: { user_id: userId },
        include: {
          invoice_packages: {
            include: {
              packages: {
                select: {
                  id: true,
                  tracking_number: true,
                  package_status: true,
                  shipping_stages: true,
                  position: true
                }
              }
            }
          },
          payments: true
        },
        orderBy: {
          issue_date: 'desc'
        }
      });

      console.log('📊 Total de facturas encontradas:', invoices.length);

      if (invoices.length === 0) {
        console.log('ℹ️ No se encontraron facturas para el usuario');
        return [];
      }

      // Transformar los resultados al formato esperado
      return invoices.map(invoice => {
        // Determinar el estado correcto de la factura
        let invoiceStatus: InvoiceStatusType = INVOICE_STATUS.PENDING;
        
        if (invoice.is_paid || invoice.status === invoice_status_enum.paid) {
          invoiceStatus = INVOICE_STATUS.PAID;
        } else if (invoice.status === invoice_status_enum.partial || 
                  (invoice.paid_amount && Number(invoice.paid_amount) > 0)) {
          invoiceStatus = INVOICE_STATUS.PARTIAL;
        }
        
        return {
          id: invoice.id,
          userId: invoice.user_id,
          amount: Number(invoice.total_amount),
          status: invoiceStatus,
          date: invoice.issue_date.toISOString(),
          description: invoice.notes || '',
          paymentDate: invoice.payments && invoice.payments.length > 0 
            ? invoice.payments[0].payment_date.toISOString() 
            : undefined,
          transactionId: invoice.payments && invoice.payments.length > 0 
            ? invoice.payments[0].id 
            : undefined,
          userName: `${user.first_name} ${user.last_name}`,
          userEmail: user.email,
          invoiceNumber: invoice.invoice_number,
          dueDate: invoice.due_date.toISOString(),
          totalAmount: Number(invoice.total_amount),
          taxAmount: Number(invoice.tax_amount || 0),
          discountAmount: Number(invoice.discount_amount || 0),
          currency: invoice.currency || 'USD',
          packages: invoice.invoice_packages.map(ip => {
            return {
              id: ip.packages.id,
              trackingNumber: ip.packages.tracking_number || '',
              status: ip.packages.package_status,
              position: this.getPackagePosition(ip.packages)
            };
          })
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener facturas:', error);
      throw error instanceof HttpException 
        ? error 
        : new HttpException(
            { message: error instanceof Error ? error.message : 'Error al obtener facturas' },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getPendingInvoices(search?: string): Promise<Invoice[]> {
    try {
      console.log('🔍 Buscando facturas pendientes:', search ? `con filtro: ${search}` : 'sin filtro');
      
      // 1. Primero, verificamos si hay facturas "PARCIAL" con remaining_amount = 0 y las actualizamos
      const partialsWithNoRemaining = await this.prisma.invoices.findMany({
        where: {
          status: invoice_status_enum.partial,
          remaining_amount: { 
            lte: 0.01 // Consideramos valores muy pequeños (centavos) como completamente pagados
          }
        },
        select: { id: true }
      });
      
      // Si encontramos facturas para actualizar, las marcamos como pagadas
      if (partialsWithNoRemaining.length > 0) {
        console.log(`🔄 Actualizando ${partialsWithNoRemaining.length} facturas que estaban en estado PARCIAL pero ya no tienen saldo pendiente`);
        
        const ids = partialsWithNoRemaining.map(inv => inv.id);
        
        await this.prisma.invoices.updateMany({
          where: { id: { in: ids } },
          data: {
            status: invoice_status_enum.paid,
            is_paid: true
          }
        });
        
        console.log(`✅ ${partialsWithNoRemaining.length} facturas actualizadas a estado PAGADO`);
      }
      
      const whereClause: any = {
        is_paid: false,
        status: { 
          not: invoice_status_enum.paid
        }
      };
      
      // Añadir condición de búsqueda si existe
      if (search) {
        whereClause.OR = [
          { invoice_number: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          {
            users: {
              OR: [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        ];
      }
      
      // Consultar facturas pendientes
      const invoices = await this.prisma.invoices.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          invoice_packages: {
            include: {
              packages: {
                select: {
                  id: true,
                  tracking_number: true,
                  package_status: true,
                  shipping_stages: true,
                  position: true
                }
              }
            }
          }
        },
        orderBy: {
          issue_date: 'desc'
        },
        take: 100 // Limitamos a 100 resultados para evitar sobrecarga
      });
      
      console.log('📊 Total de facturas pendientes encontradas:', invoices.length);

      // Transformar a formato de respuesta
      return invoices.map(invoice => {
        // Determinar el estado correcto de la factura
        let invoiceStatus: InvoiceStatusType = INVOICE_STATUS.PENDING;
        
        if (invoice.is_paid || invoice.status === invoice_status_enum.paid) {
          invoiceStatus = INVOICE_STATUS.PAID;
        } else if (invoice.status === invoice_status_enum.partial || 
                  (invoice.paid_amount && Number(invoice.paid_amount) > 0)) {
          invoiceStatus = INVOICE_STATUS.PARTIAL;
          console.log(`📝 Factura ${invoice.id} detectada como PARCIAL:`, {
            estado: invoice.status,
            pagado: Number(invoice.paid_amount || 0),
            restante: Number(invoice.remaining_amount || 0),
            total: Number(invoice.total_amount)
          });
        }
        
        return {
          id: invoice.id,
          userId: invoice.user_id,
          amount: Number(invoice.total_amount),
          status: invoiceStatus,
          date: invoice.issue_date.toISOString(),
          description: invoice.notes || '',
          userName: invoice.users 
            ? `${invoice.users.first_name || ''} ${invoice.users.last_name || ''}`.trim() 
            : 'Usuario desconocido',
          userEmail: invoice.users?.email || 'Sin email',
          invoiceNumber: invoice.invoice_number,
          dueDate: invoice.due_date.toISOString(),
          totalAmount: Number(invoice.total_amount),
          paid_amount: invoice.paid_amount ? Number(invoice.paid_amount) : undefined,
          remaining_amount: invoice.remaining_amount ? Number(invoice.remaining_amount) : undefined,
          taxAmount: Number(invoice.tax_amount || 0),
          discountAmount: Number(invoice.discount_amount || 0),
          currency: invoice.currency || 'USD',
          packages: invoice.invoice_packages.map(ip => {
            return {
              id: ip.packages.id,
              trackingNumber: ip.packages.tracking_number || '',
              status: ip.packages.package_status,
              position: this.getPackagePosition(ip.packages)
            };
          })
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener facturas pendientes:', error);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            { message: error instanceof Error ? error.message : 'Error al obtener facturas pendientes' },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
    }
  }

  // Método auxiliar para convertir string a enum de payment_method_enum
  private convertToPaymentMethodEnum(method: string): payment_method_enum {
    const methodMap: Record<string, payment_method_enum> = {
      'efectivo': payment_method_enum.cash,
      'cash': payment_method_enum.cash,
      'tarjeta_credito': payment_method_enum.credit_card,
      'credit_card': payment_method_enum.credit_card,
      'tarjeta_debito': payment_method_enum.debit_card,
      'debit_card': payment_method_enum.debit_card,
      'transferencia': payment_method_enum.bank_transfer,
      'bank_transfer': payment_method_enum.bank_transfer,
      'paypal': payment_method_enum.paypal,
      'crypto': payment_method_enum.crypto,
      'gift_card': payment_method_enum.gift_card,
      'store_credit': payment_method_enum.store_credit
    };
    
    return methodMap[method.toLowerCase()] || payment_method_enum.cash;
  }

  /**
   * Obtiene la posición de un paquete, ya sea del campo position directo o de shipping_stages
   * @param packageData Los datos del paquete
   * @returns La posición del paquete como string o null
   */
  private getPackagePosition(packageData: any): string | null {
    if (!packageData) return null;
    
    // Primero intentar obtener la posición directamente del campo position
    let position = packageData.position || null;
    
    // Si no hay position explícita, buscar en shipping_stages
    if (!position && packageData.shipping_stages && Array.isArray(packageData.shipping_stages)) {
      try {
        // Asegurarse de que shipping_stages tenga elementos
        if (packageData.shipping_stages.length === 0) return null;
        
        // Convertir cada etapa a ShippingStage
        const stages = packageData.shipping_stages.map(stage => {
          // Verificar si stage es un objeto
          if (typeof stage !== 'object' || stage === null) {
            return {} as ShippingStage;
          }
          return stage as unknown as ShippingStage;
        });
        
        // Buscar la última etapa con posición
        const latestStageWithPosition = [...stages]
          .reverse()
          .find(stage => 
            (stage.position && typeof stage.position === 'string') || 
            (stage.ubicacion && typeof stage.ubicacion === 'string') || 
            (stage.location && typeof stage.location === 'string')
          );
          
        if (latestStageWithPosition) {
          position = latestStageWithPosition.position || 
                    latestStageWithPosition.ubicacion || 
                    latestStageWithPosition.location || null;
        }
      } catch (error) {
        console.error('Error al procesar shipping_stages:', error);
      }
    }
    
    // Asegurarse de que la posición sea un string
    return typeof position === 'string' ? position : null;
  }
}