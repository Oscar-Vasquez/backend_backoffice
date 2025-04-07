import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, BadRequestException, Put, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PackageNotificationService } from '../packages/services/package-notification.service';
import { SupabaseEmailService } from '../email/supabase-email.service';

interface RequestWithUser extends Request {
  user: {
    id?: string;
    sub?: string;
    email: string;
    role: string;
  };
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly packageNotificationService: PackageNotificationService,
    private readonly supabaseEmailService: SupabaseEmailService
  ) {}

  @Get()
  async findAll() {
    try {
      console.log('🔍 Llegó petición GET a /invoices');
      const result = await this.invoicesService.findAll();
      console.log('✅ Facturas encontradas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener facturas:', error);
      throw new HttpException(
        {
          message: 'Error al obtener las facturas',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async create(@Body() data: CreateInvoiceDto, @Req() req: RequestWithUser) {
    try {
      console.log('🔥 Llegó petición POST a /invoices');
      console.log('📦 Datos recibidos:', JSON.stringify(data, null, 2));
      
      // Log adicional para campos específicos
      console.log('📊 Campos específicos:', {
        price_plan: data.price_plan,
        price_plan_type: typeof data.price_plan,
        price_plan_value: data.price_plan !== undefined ? Number(data.price_plan) : undefined,
        shipping_insurance: data.shipping_insurance,
        shipping_insurance_type: typeof data.shipping_insurance,
        shipping_insurance_value: data.shipping_insurance === true,
      });

      // Validar datos requeridos
      if (!data.customer_id) {
        console.error('❌ Error: customer_id es requerido');
        throw new BadRequestException('El ID del cliente es requerido');
      }

      if (!data.invoice_items || data.invoice_items.length === 0) {
        console.error('❌ Error: se requiere al menos un item en la factura');
        throw new BadRequestException('Se requiere al menos un ítem en la factura');
      }

      // Validar que los items tengan los datos necesarios
      for (const item of data.invoice_items) {
        if (!item.name || !item.quantity || !item.price) {
          console.error('❌ Error: item inválido', item);
          throw new BadRequestException('Todos los ítems deben tener nombre, cantidad y precio');
        }
      }

      // Calcular el total
      const calculatedTotal = data.invoice_items.reduce(
        (sum, item) => sum + (item.quantity * item.price),
        0
      );

      // Verificar que el total coincida
      if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
        console.warn('⚠️ El total calculado no coincide con el total enviado');
        console.log(`Calculado: ${calculatedTotal}, Enviado: ${data.total_amount}`);
        data.total_amount = calculatedTotal;
      }

      // Obtener datos del operador
      const operatorData = {
        id: req.user.sub || req.user.id,
        email: req.user.email
      };
      console.log('👤 Operador:', operatorData);
      
      // Intentar crear la factura
      try {
        // Asegurarse de que los campos opcionales tengan valores correctos para su tipo
        if (data.price_plan !== undefined) {
          try {
            data.price_plan = Number(data.price_plan);
            if (isNaN(data.price_plan)) {
              data.price_plan = 0;
            }
          } catch (e) {
            console.warn('Error al convertir price_plan a número, usando 0:', e);
            data.price_plan = 0;
          }
        }
        
        // Convertir shipping_insurance a booleano explícito
        data.shipping_insurance = data.shipping_insurance === true;
        
        console.log('📊 Datos procesados antes de enviar al servicio:', {
          price_plan: data.price_plan,
          price_plan_type: typeof data.price_plan,
          shipping_insurance: data.shipping_insurance,
          shipping_insurance_type: typeof data.shipping_insurance,
        });
        
        const result = await this.invoicesService.createInvoice(data, operatorData);
        console.log('✅ Factura creada:', JSON.stringify(result, null, 2));
        
        // Log para verificar campos específicos en la respuesta
        console.log('📊 Campos específicos en la respuesta:', {
          price_plan: result.price_plan,
          price_plan_type: typeof result.price_plan,
          shipping_insurance: result.shipping_insurance,
          shipping_insurance_type: typeof result.shipping_insurance,
        });
        
        // Enviar notificaciones para cada paquete asociado a la factura
        if (result && result.packageIds && result.packageIds.length > 0) {
          console.log('📧 Enviando notificaciones de llegada para los paquetes:', result.packageIds);
          
          try {
            // Utilizamos Supabase para enviar los correos (useSupabase = true)
            const notificationResult = await this.packageNotificationService.notifyBulkPackageArrival(
              result.packageIds,
              true // usar Supabase para el envío de correos
            );
            
            console.log('📬 Resultado de las notificaciones de paquetes:', {
              total: notificationResult.total,
              successful: notificationResult.successful,
              failed: notificationResult.failed
            });
            
            // Agregar información de notificaciones al resultado
            result.notifications = {
              sent: notificationResult.successful,
              total: notificationResult.total
            };
          } catch (notificationError) {
            console.error('⚠️ Error al enviar notificaciones de paquetes:', notificationError);
            // No fallar la operación principal si las notificaciones fallan
            result.notifications = {
              error: notificationError.message,
              sent: 0,
              total: result.packageIds.length
            };
          }
        } else {
          console.log('⚠️ No hay paquetes asociados a la factura para notificar');
          result.notifications = { sent: 0, total: 0 };
        }
        
        // Enviar notificación específica de creación de factura al cliente
        if (result && result.customer && result.customer.email) {
          try {
            console.log('📧 Enviando notificación de factura creada a:', result.customer.email);
            
            // Preparar datos de los ítems para la notificación
            const invoiceItems = result.items.map(item => ({
              trackingNumber: item.trackingNumber,
              description: item.description,
              price: item.price,
              quantity: item.quantity
            }));
            
            // Enviar correo de factura creada
            const emailResult = await this.supabaseEmailService.sendInvoiceCreationEmail(
              result.customer.email,
              {
                firstName: result.customer.name.split(' ')[0],
                lastName: result.customer.name.split(' ').slice(1).join(' ')
              },
              {
                invoiceNumber: result.invoice_number,
                totalAmount: parseFloat(result.total_amount.toString()),
                issueDate: result.issue_date.toISOString(),
                dueDate: result.due_date ? result.due_date.toISOString() : undefined,
                items: invoiceItems
              }
            );
            
            console.log('📬 Resultado de la notificación de factura:', {
              success: emailResult.success,
              method: emailResult.method,
              fallback: emailResult.fallback,
              simulated: emailResult.simulated
            });
            
            // Añadir el resultado del correo a la respuesta
            result.invoiceNotification = {
              sent: emailResult.success,
              method: emailResult.method,
              fallback: emailResult.fallback || false,
              simulated: emailResult.simulated || false
            };
          } catch (invoiceEmailError) {
            console.error('⚠️ Error al enviar notificación de factura:', invoiceEmailError);
            
            // No fallar la operación principal si la notificación falla
            result.invoiceNotification = {
              sent: false,
              error: invoiceEmailError.message
            };
          }
        } else {
          console.warn('⚠️ No se puede enviar notificación de factura: falta email del cliente');
          result.invoiceNotification = { sent: false, error: 'Cliente sin email' };
        }
        
        return result;
      } catch (serviceError) {
        console.error('❌ Error en el servicio de facturas:', serviceError);
        console.error('❌ Mensaje de error:', serviceError.message);
        console.error('❌ Detalles:', serviceError.stack);
        throw serviceError;
      }
    } catch (error) {
      console.error('❌ Error general en el controlador:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Error al crear la factura',
          error: error.message,
          details: error.response?.message || error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('debug')
  async debugCreate(@Body() data: any, @Req() req: RequestWithUser) {
    console.log('🔬 DEPURACIÓN DE DATOS RECIBIDOS:');
    console.log('📦 Datos completos:', JSON.stringify(data, null, 2));
    
    // Verificar específicamente los campos price_plan y shipping_insurance
    console.log('🔎 Campos específicos:');
    console.log('  price_plan:', data.price_plan);
    console.log('  price_plan type:', typeof data.price_plan);
    console.log('  shipping_insurance:', data.shipping_insurance);
    console.log('  shipping_insurance type:', typeof data.shipping_insurance);
    
    // Verificar si los campos están en el objeto
    console.log('🔑 Verificación de propiedades:');
    console.log('  price_plan en data:', 'price_plan' in data);
    console.log('  shipping_insurance en data:', 'shipping_insurance' in data);
    
    // Analizar los datos serializados
    const serialized = JSON.stringify(data);
    console.log('📄 Datos serializados:', serialized);
    const deserialized = JSON.parse(serialized);
    console.log('📄 Datos deserializados:');
    console.log('  price_plan:', deserialized.price_plan);
    console.log('  price_plan type:', typeof deserialized.price_plan);
    console.log('  shipping_insurance:', deserialized.shipping_insurance);
    console.log('  shipping_insurance type:', typeof deserialized.shipping_insurance);
    
    return {
      success: true,
      message: 'Depuración completada',
      data: {
        received: {
          price_plan: data.price_plan,
          price_plan_type: typeof data.price_plan,
          shipping_insurance: data.shipping_insurance,
          shipping_insurance_type: typeof data.shipping_insurance
        },
        serialization_test: {
          price_plan: deserialized.price_plan,
          price_plan_type: typeof deserialized.price_plan,
          shipping_insurance: deserialized.shipping_insurance,
          shipping_insurance_type: typeof deserialized.shipping_insurance
        }
      }
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    try {
      console.log('🔄 Actualizando estado de factura:', id, status);
      if (!status) {
        throw new BadRequestException('El estado es requerido');
      }
      
      const result = await this.invoicesService.updateStatus(id, status);
      console.log('✅ Estado actualizado:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      throw new HttpException(
        {
          message: 'Error al actualizar el estado de la factura',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('verify-package/:tracking')
  async verifyPackage(@Param('tracking') tracking: string) {
    return this.invoicesService.verifyPackageStatus(tracking);
  }

  /**
   * Envía un correo electrónico de recordatorio para una factura pendiente
   * @param id ID de la factura
   * @param req Datos de la solicitud
   * @returns Resultado del envío del recordatorio
   */
  @Post(':id/send-reminder')
  async sendInvoiceReminder(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ) {
    try {
      console.log(`📧 Solicitud para enviar recordatorio de factura ${id} por operador ${req.user.sub}`);
      
      // Buscar la factura con sus paquetes y detalles del cliente
      const invoice = await this.invoicesService.findInvoiceWithDetails(id);
      
      if (!invoice) {
        throw new BadRequestException(`Factura con ID ${id} no encontrada`);
      }
      
      if (!invoice.customer || !invoice.customer.email) {
        throw new BadRequestException('La factura no tiene un cliente válido con email');
      }
      
      // Preparar datos para el recordatorio
      const userData = {
        firstName: invoice.customer.firstName || invoice.customer.name?.split(' ')[0] || 'Cliente',
        lastName: invoice.customer.lastName || invoice.customer.name?.split(' ').slice(1).join(' ') || ''
      };
      
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || `INV-${id.slice(0, 8)}`,
        totalAmount: typeof invoice.amount === 'number' ? invoice.amount : 
                    typeof invoice.totalAmount === 'number' ? invoice.totalAmount :
                    typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : 0,
        totalPackages: invoice.totalPackages || invoice.packages?.length || 0,
        issueDate: invoice.date || invoice.issue_date || new Date().toISOString()
      };
      
      // Enviar el recordatorio por correo electrónico
      const emailResult = await this.supabaseEmailService.sendInvoiceReminderEmail(
        invoice.customer.email,
        userData,
        invoiceData
      );
      
      // Registrar la actividad de envío de recordatorio
      await this.invoicesService.logReminderSent(id, req.user.sub, emailResult.success);
      
      return {
        success: true,
        message: 'Recordatorio enviado exitosamente',
        details: {
          invoiceId: id,
          sentTo: invoice.customer.email,
          emailResult
        }
      };
    } catch (error) {
      console.error('❌ Error al enviar recordatorio de factura:', error);
      
      throw new HttpException(
        {
          message: 'Error al enviar recordatorio',
          error: error.message,
          details: error.response?.message || error.message
        },
        error instanceof BadRequestException ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 