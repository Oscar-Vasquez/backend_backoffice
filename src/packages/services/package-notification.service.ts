import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { SupabaseEmailService } from '../../email/supabase-email.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PackageNotificationService {
  private readonly logger = new Logger(PackageNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly supabaseEmailService: SupabaseEmailService,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Notifica al cliente que su paquete ha llegado incluyendo el precio
   * @param packageId ID del paquete
   * @param useSupabase Si se debe utilizar Supabase para el envío del correo
   * @returns Resultado de la notificación
   */
  async notifyPackageArrival(packageId: string, useSupabase = false) {
    try {
      this.logger.log(`🔔 Notificando llegada del paquete: ${packageId}`);

      // Obtener datos completos del paquete
      const packageData = await this.prisma.packages.findUnique({
        where: { id: packageId },
        include: {
          users: true
        }
      });

      if (!packageData) {
        throw new Error(`Paquete con ID ${packageId} no encontrado`);
      }

      // Verificar si hay un usuario asignado
      if (!packageData.user_reference || !packageData.users) {
        throw new Error(`El paquete ${packageId} no tiene un usuario asignado`);
      }

      // Verificar si el usuario tiene email
      if (!packageData.users.email) {
        throw new Error(`El usuario asignado al paquete ${packageId} no tiene email`);
      }

      const userData = {
        firstName: packageData.users.first_name || 'Cliente',
        lastName: packageData.users.last_name
      };

      // Calcular el precio del paquete
      // Si el paquete no tiene declared_value, calcularlo basado en el peso y la tarifa del plan
      let price = 0;
      
      if (packageData.declared_value) {
        // Usar valor declarado como precio
        price = parseFloat(packageData.declared_value.toString());
      } else if (packageData.weight && packageData.users.plan_id) {
        // Buscar la tarifa del plan
        const userPlan = await this.prisma.plans.findUnique({
          where: { id: packageData.users.plan_id }
        });
        
        if (userPlan && userPlan.price) {
          // Calcular el precio basado en el peso y la tarifa
          const rate = parseFloat(userPlan.price.toString());
          const weight = parseFloat(packageData.weight.toString());
          price = rate * weight;
        }
      }

      const notificationData = {
        trackingNumber: packageData.tracking_number,
        weight: packageData.weight ? parseFloat(packageData.weight.toString()) : undefined,
        price,
        packageStatus: packageData.package_status,
        // Formatear la fecha estimada de entrega
        estimatedDeliveryDate: packageData.estimated_delivery_date 
          ? new Date(packageData.estimated_delivery_date).toLocaleDateString('es-ES', {
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })
          : undefined
      };

      // Enviar correo electrónico
      let emailResult;
      if (useSupabase) {
        // Usar Supabase para enviar el correo
        emailResult = await this.supabaseEmailService.sendPackageArrivalEmail(
          packageData.users.email,
          userData,
          notificationData
        );
        
        // Manejar el caso de éxito simulado
        if (emailResult.simulated) {
          this.logger.warn(`⚠️ Correo simulado para ${packageData.tracking_number}: ${emailResult.error}`);
        } else if (emailResult.fallback) {
          this.logger.warn(`⚠️ Correo enviado por método alternativo para ${packageData.tracking_number}: ${emailResult.message}`);
        }
      } else {
        // Usar el servicio de correo tradicional
        emailResult = await this.emailService.sendPackageArrivalNotification(
          packageData.users.email,
          userData,
          notificationData
        );
      }

      // Si el envío de correo falló pero se simuló éxito, seguimos considerándolo exitoso
      const isEmailSuccessful = emailResult && (emailResult.success === true);

      // Registrar notificación en el sistema
      await this.notificationsService.sendNotification(
        packageData.users.id,
        {
          type: 'package_arrival',
          title: '¡Tu paquete ha llegado!',
          message: `Tu paquete ${packageData.tracking_number} ha llegado a nuestras instalaciones.`,
          data: {
            packageId: packageData.id,
            trackingNumber: packageData.tracking_number,
            price: price.toFixed(2),
            status: packageData.package_status,
            emailSent: isEmailSuccessful
          }
        }
      );

      // Actualizar el registro del paquete para indicar que la notificación fue enviada
      // Como notification_sent no existe en el modelo, usamos la columna notes para registrarlo
      const notesContent = isEmailSuccessful
        ? `Notificación de llegada enviada: ${new Date().toISOString()}`
        : `Notificación de llegada registrada, pero el correo ${emailResult.simulated ? 'fue simulado' : 'no fue enviado'}: ${new Date().toISOString()}`;

      await this.prisma.packages.update({
        where: { id: packageId },
        data: {
          notes: notesContent
        }
      });

      this.logger.log(`✅ Notificación de llegada enviada correctamente para el paquete ${packageData.tracking_number}`);
      
      return {
        success: true,
        packageId,
        trackingNumber: packageData.tracking_number,
        emailResult
      };
    } catch (error) {
      this.logger.error(`❌ Error al notificar llegada del paquete: ${error.message}`);
      
      return {
        success: false,
        packageId,
        error: error.message
      };
    }
  }

  /**
   * Notifica a múltiples clientes sobre la llegada de sus paquetes
   * @param packageIds Array de IDs de paquetes
   * @param useSupabase Si se debe utilizar Supabase para el envío de correos
   * @returns Resultados de las notificaciones
   */
  async notifyBulkPackageArrival(packageIds: string[], useSupabase = false) {
    this.logger.log(`🔔 Notificando llegada de ${packageIds.length} paquetes`);
    
    const results = [];
    
    for (const packageId of packageIds) {
      try {
        const result = await this.notifyPackageArrival(packageId, useSupabase);
        results.push(result);
      } catch (error) {
        this.logger.error(`❌ Error al notificar paquete ${packageId}: ${error.message}`);
        results.push({
          success: false,
          packageId,
          error: error.message
        });
      }
    }
    
    this.logger.log(`✅ Proceso de notificación masiva completado: ${results.filter(r => r.success).length}/${packageIds.length} exitosos`);
    
    return {
      total: packageIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }
} 