import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceDto } from '../firebase/dto/invoice.dto';

@Injectable()
export class InvoiceService {
  private readonly db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDto> {
    try {
      const invoiceId = this.db.collection('invoices').doc().id;
      // Asegurarse de que customer_id sea solo el ID, sin la ruta completa
      const customerId = createInvoiceDto.customer_id.toString().includes('/') 
        ? createInvoiceDto.customer_id.toString().split('/').pop() 
        : createInvoiceDto.customer_id.toString();

      const newInvoice: InvoiceDto = {
        invoiceId,
        userReference: customerId,
        totalAmount: createInvoiceDto.total_amount,
        isPaid: false,
        paymentMethod: 'PENDING',
        paymentDetails: null,
        invoiceStatus: createInvoiceDto.status || 'PENDING',
        createdTimestamp: new Date(),
        updatedTimestamp: new Date()
      };

      await this.db.collection('invoices').doc(invoiceId).set(newInvoice);
      return newInvoice;
    } catch (error) {
      throw new Error(`Error al crear la factura: ${error.message}`);
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const snapshot = await this.db.collection('invoices').get();
      if (snapshot.empty) {
        console.log('No se encontraron facturas');
        return [];
      }

      const invoices = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        let clienteData = null;
        
        if (data.userReference) {
          try {
            // Extraer el ID del usuario de la ruta completa
            const userId = data.userReference.replace('/users/', '');
            console.log('🔍 Buscando cliente con ID:', userId);
            
            const clienteRef = await this.db.collection('users').doc(userId).get();
            
            if (clienteRef.exists) {
              clienteData = clienteRef.data();
              console.log('✅ Cliente encontrado:', clienteData);
            } else {
              console.log('❌ Cliente no encontrado para ID:', userId);
            }
          } catch (error) {
            console.error('Error al obtener datos del cliente:', error);
          }
        }

        invoices.push({
          id: doc.id,
          numero: data.invoiceId,
          cliente: {
            id: data.userReference.replace('/users/', ''),
            name: clienteData?.displayName || clienteData?.fullName || clienteData?.name || "Cliente no encontrado",
            email: clienteData?.email || "email@example.com"
          },
          email: clienteData?.email || "email@example.com",
          fechaEmision: data.createdTimestamp.toDate().toISOString(),
          fechaVencimiento: data.updatedTimestamp.toDate().toISOString(),
          total: parseFloat(data.totalAmount) || 0,
          estado: data.invoiceStatus === 'paid' ? 'PAGADO' : data.invoiceStatus.toUpperCase(),
          items: data.packageReferences || []
        });
      }

      return invoices;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw new Error(`Error al obtener las facturas: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<InvoiceDto> {
    try {
      const doc = await this.db.collection('invoices').doc(id.toString()).get();
      if (!doc.exists) {
        throw new NotFoundException(`Factura con ID ${id} no encontrada`);
      }
      return doc.data() as InvoiceDto;
    } catch (error) {
      throw new Error(`Error al obtener la factura: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: string): Promise<InvoiceDto> {
    try {
      const invoiceRef = this.db.collection('invoices').doc(id);
      await invoiceRef.update({
        invoiceStatus: status,
        updatedTimestamp: new Date()
      });
      
      const updatedDoc = await invoiceRef.get();
      return updatedDoc.data() as InvoiceDto;
    } catch (error) {
      throw new Error(`Error al actualizar el estado: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.db.collection('invoices').doc(id.toString()).delete();
    } catch (error) {
      throw new Error(`Error al eliminar la factura: ${error.message}`);
    }
  }
}
