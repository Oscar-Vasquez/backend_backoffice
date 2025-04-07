import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ActivitiesService } from '../activities/activities.service';
import { PackagesService } from '../../packages/packages.service';
import { ActivityAction, ActivityStatus } from '../activities/interfaces/operator-activity.interface';

@Injectable()
export class InvoicesService {
  private readonly COLLECTION = 'invoices';

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly activitiesService: ActivitiesService,
    private readonly packagesService: PackagesService
  ) {}

  async createInvoice(invoiceData: any, operatorData: { id: string; email: string }) {
    try {
      console.log('👤 Operador que crea la factura:', {
        operadorId: operatorData.id,
        email: operatorData.email
      });

      // Obtener información del operador
      const operatorDoc = await this.firebaseService.findOne('operators', operatorData.id);
      if (!operatorDoc) {
        console.error('❌ Error: Operador no encontrado en la base de datos');
        throw new Error('Operador no encontrado');
      }

      console.log('ℹ️ Información del operador:', {
        id: operatorDoc.id,
        nombre: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
        email: operatorDoc.email
      });

      // Crear la factura
      const invoiceId = await this.firebaseService.create(this.COLLECTION, {
        ...invoiceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: operatorData.id
      });

      console.log('📄 Factura creada:', {
        id: invoiceId,
        numero: invoiceData.invoice_number,
        cliente: invoiceData.customer_id,
        total: invoiceData.total_amount,
        createdBy: operatorData.id
      });

      // Registrar la actividad de creación de factura
      const invoiceActivity = {
        operatorId: operatorData.id,
        operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
        action: ActivityAction.INVOICE_CREATED,
        description: `Factura ${invoiceData.invoice_number} creada para el cliente ${invoiceData.customer_id}`,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: {
          invoiceId,
          invoiceNumber: invoiceData.invoice_number,
          customerId: invoiceData.customer_id,
          totalAmount: invoiceData.total_amount,
          itemsCount: invoiceData.invoice_items.length,
          operatorEmail: operatorData.email
        },
        status: ActivityStatus.COMPLETED,
        timestamp: new Date().toISOString()
      };

      await this.activitiesService.createActivity(invoiceActivity);
      console.log('✅ Actividad de factura registrada:', invoiceActivity);

      // Actualizar el estado de los paquetes a facturados
      console.log('📦 Actualizando estado de paquetes...');
      for (const item of invoiceData.invoice_items) {
        const trackingNumber = item.name.split(' - ')[1]; // Extraer tracking number del nombre del item
        if (trackingNumber) {
          console.log(`🔄 Actualizando paquete ${trackingNumber} a INVOICED`);
          await this.packagesService.updatePackageStatus(trackingNumber, 'INVOICED', operatorData);
        }
      }

      return { id: invoiceId, ...invoiceData };
    } catch (error) {
      console.error('❌ Error al crear la factura:', error);
      throw error;
    }
  }
} 