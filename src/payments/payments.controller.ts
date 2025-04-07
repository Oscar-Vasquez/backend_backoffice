import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Query, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Invoice, ProcessPaymentDto, INVOICE_STATUS } from './types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { payment_method_enum, payment_status_enum, invoice_status_enum } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {
    console.log('🚀 PaymentsController inicializado');
  }

  @Post(':invoiceId/process')
  async processPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() paymentData: { 
      amount: number; 
      method: string; 
      amountReceived: number;
      paymentMethodId?: string;
      isPartialPayment?: boolean;
    },
    @Request() req
  ) {
    const requestId = Date.now().toString(); // ID único para esta solicitud
    console.log(`🔄 [${requestId}] Procesando pago en controlador:`, {
      invoiceId,
      amount: paymentData.amount,
      method: paymentData.method,
      amountReceived: paymentData.amountReceived,
      paymentMethodId: paymentData.paymentMethodId || '3e7a40e3-307d-4846-8f65-f4f1668bbfb3', // Usar el ID fijo como valor predeterminado
      isPartialPayment: paymentData.isPartialPayment,
      operador: {
        id: req.user.id,
        email: req.user.email
      }
    });

    try {
      const result = await this.paymentsService.processPayment(
        invoiceId,
        paymentData.amount,
        {
          method: paymentData.method,
          amountReceived: paymentData.amountReceived,
          paymentMethodId: paymentData.paymentMethodId || '3e7a40e3-307d-4846-8f65-f4f1668bbfb3', // Incluir el paymentMethodId
          isPartialPayment: paymentData.isPartialPayment,
          requestId: requestId // Pasar el ID de la solicitud para seguimiento
        },
        {
          id: req.user.id,
          email: req.user.email
        }
      );

      console.log(`✅ [${requestId}] Pago procesado exitosamente:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [${requestId}] Error al procesar pago:`, error);
      throw error;
    }
  }

  @Get('invoices/:userId')
  async getUserInvoices(@Param('userId') userId: string) {
    try {
      console.log('🔍 Obteniendo facturas para usuario:', userId);
      const invoices = await this.paymentsService.getUserInvoices(userId);
      console.log('✅ Facturas obtenidas en controlador:', invoices.length);
      
      return {
        success: true,
        message: invoices.length > 0 ? 'Facturas encontradas' : 'No hay facturas para este usuario',
        invoices: invoices
      };
    } catch (error) {
      console.error('❌ Error al obtener facturas:', error);
      throw error instanceof HttpException 
        ? error 
        : new HttpException(
            { message: 'Error al obtener las facturas', error: error instanceof Error ? error.message : 'Error desconocido' },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
    }
  }

  @Get('pending')
  async getPendingInvoices(@Query('search') search?: string): Promise<{ success: boolean; count: number; invoices: Invoice[] }> {
    try {
      console.log('🔍 Buscando facturas pendientes:', search ? `con filtro: ${search}` : 'sin filtro');
      
      const invoices = await this.paymentsService.getPendingInvoices(search);
      console.log('✅ Facturas pendientes encontradas:', invoices.length);
      
      return {
        success: true,
        count: invoices.length,
        invoices
      };
    } catch (error) {
      console.error('Error al obtener facturas pendientes:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException({
        message: 'Error al obtener las facturas pendientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('enums')
  async getEnums() {
    return {
      invoice_status_enum,
      payment_method_enum,
      payment_status_enum,
      INVOICE_STATUS
    };
  }
}
