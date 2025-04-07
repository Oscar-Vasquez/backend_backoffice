import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class CustomerService {
  private readonly db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async create(createCustomerDto: CreateCustomerDto) {
    try {
      const customerRef = this.db.collection('customers').doc();
      await customerRef.set({
        ...createCustomerDto,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        id: customerRef.id,
        ...createCustomerDto
      };
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const snapshot = await this.db.collection('customers').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const doc = await this.db.collection('customers').doc(id).get();
      
      if (!doc.exists) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }
  }

  async update(id: string, updateCustomerDto: Partial<CreateCustomerDto>) {
    try {
      const doc = await this.db.collection('customers').doc(id).get();
      
      if (!doc.exists) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      await this.db.collection('customers').doc(id).update({
        ...updateCustomerDto,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        id,
        ...doc.data(),
        ...updateCustomerDto
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const doc = await this.db.collection('customers').doc(id).get();
      
      if (!doc.exists) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      await this.db.collection('customers').doc(id).delete();
      return { message: 'Cliente eliminado correctamente' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }
  }
}
