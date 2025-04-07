import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentTypesService, PaymentType } from './payment-types.service';

@Controller('payment-types')
export class PaymentTypesController {
  constructor(private readonly paymentTypesService: PaymentTypesService) {
    console.log('🚀 PaymentTypesController inicializado');
  }

  @Get()
  async getAllPaymentTypes(@Query('includeInactive') includeInactive?: string): Promise<PaymentType[]> {
    try {
      const showInactive = includeInactive === 'true';
      console.log(`📋 Listando todos los métodos de pago (incluye inactivos: ${showInactive})`);
      
      const paymentTypes = await this.paymentTypesService.getAllPaymentTypes(showInactive);
      console.log(`✅ ${paymentTypes.length} métodos de pago listados exitosamente`);
      
      return paymentTypes;
    } catch (error) {
      console.error('❌ Error al listar métodos de pago:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al obtener la lista de métodos de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getPaymentTypeById(@Param('id') id: string): Promise<PaymentType> {
    try {
      console.log(`🔍 Buscando método de pago por ID: ${id}`);
      
      const paymentType = await this.paymentTypesService.getPaymentTypeById(id);
      console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
      
      return paymentType;
    } catch (error) {
      console.error(`❌ Error al buscar método de pago con ID ${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al obtener el método de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('code/:code')
  async getPaymentTypeByCode(@Param('code') code: string): Promise<PaymentType> {
    try {
      console.log(`🔍 Buscando método de pago por código: ${code}`);
      
      const paymentType = await this.paymentTypesService.getPaymentTypeByCode(code);
      console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
      
      return paymentType;
    } catch (error) {
      console.error(`❌ Error al buscar método de pago con código ${code}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al obtener el método de pago',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 