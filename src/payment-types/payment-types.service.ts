import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PaymentType {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  processing_fee_percentage?: string;
  processing_fee_fixed?: string;
  requires_approval?: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PaymentTypesService {
  constructor(private readonly prisma: PrismaService) {
    console.log('🚀 PaymentTypesService inicializado');
  }

  /**
   * Genera un código basado en el nombre del método de pago
   * @param name Nombre del método de pago
   * @returns Código generado
   */
  private generateCodeFromName(name: string): string {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Replace multiple dashes with a single dash
  }

  /**
   * Mapea un registro de la base de datos al formato de la API
   * @param paymentType Registro de la base de datos
   * @returns Objeto formateado para la API
   */
  private mapDatabaseToApiFormat(paymentType: any): PaymentType {
    return {
      id: paymentType.id.toString(), // Convert to string for API consistency
      name: paymentType.name,
      code: this.generateCodeFromName(paymentType.name),
      icon: paymentType.icon || null,
      description: paymentType.description || null,
      is_active: paymentType.is_active ?? true,
      processing_fee_percentage: paymentType.processing_fee_percentage?.toString() || '0',
      processing_fee_fixed: paymentType.processing_fee_fixed?.toString() || '0',
      requires_approval: paymentType.requires_approval ?? false,
      created_at: new Date().toISOString(), // Use current date as fallback
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Obtiene todos los métodos de pago activos
   * @returns Lista de métodos de pago
   */
  async getAllPaymentTypes(includeInactive: boolean = false): Promise<PaymentType[]> {
    try {
      console.log(`🔍 Obteniendo métodos de pago (incluye inactivos: ${includeInactive})`);
      
      // Consulta con Prisma para obtener todos los métodos de pago
      const paymentTypes = await this.prisma.payment_types.findMany({
        where: includeInactive ? {} : { is_active: true },
        orderBy: { name: 'asc' }
      });
      
      console.log(`✅ ${paymentTypes.length} métodos de pago encontrados`);
      
      // Mapear los resultados al formato esperado
      return paymentTypes.map(type => this.mapDatabaseToApiFormat(type));
    } catch (error) {
      console.error('❌ Error al obtener métodos de pago:', error);
      throw new HttpException(
        'Error al obtener métodos de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un método de pago por su ID
   * @param id ID del método de pago
   * @returns Método de pago encontrado
   */
  async getPaymentTypeById(id: string): Promise<PaymentType> {
    try {
      console.log(`🔍 Buscando método de pago con ID: ${id}`);
      
      // Convert id to number for database query if it's a string
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const paymentType = await this.prisma.payment_types.findUnique({
        where: { id: numericId }
      });
      
      if (!paymentType) {
        console.log(`⚠️ Método de pago con ID ${id} no encontrado`);
        throw new HttpException(
          `Método de pago con ID ${id} no encontrado`,
          HttpStatus.NOT_FOUND
        );
      }
      
      console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
      
      return this.mapDatabaseToApiFormat(paymentType);
    } catch (error) {
      console.error(`❌ Error al obtener método de pago con ID ${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al obtener método de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un método de pago por su código generado del nombre
   * @param code Código del método de pago
   * @returns Método de pago encontrado
   */
  async getPaymentTypeByCode(code: string): Promise<PaymentType> {
    try {
      console.log(`🔍 Buscando método de pago con código: ${code}`);
      
      // Since code doesn't exist in the database, we need to find all payment types
      // and filter by the generated code
      const paymentTypes = await this.prisma.payment_types.findMany({
        where: { is_active: true }
      });
      
      // Map to API format first to generate codes, then find the matching one
      const mappedTypes = paymentTypes.map(type => this.mapDatabaseToApiFormat(type));
      const paymentType = mappedTypes.find(type => type.code === code);
      
      if (!paymentType) {
        console.log(`⚠️ Método de pago con código ${code} no encontrado o inactivo`);
        throw new HttpException(
          `Método de pago con código ${code} no encontrado o inactivo`,
          HttpStatus.NOT_FOUND
        );
      }
      
      console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
      
      return paymentType;
    } catch (error) {
      console.error(`❌ Error al obtener método de pago con código ${code}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al obtener método de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 