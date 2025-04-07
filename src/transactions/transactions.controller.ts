import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {
    console.log('🚀 TransactionsController inicializado');
  }

  @Post()
  async createTransaction(
    @Body() data: {
      description: string;
      status: string;
      transactionType: string;
      entityType: string;
      entityId: string;
      referenceId?: string;
      paymentMethodId?: string;
      metadata?: Record<string, any>;
      amount?: number;
      categoryId?: string;
      transactionTypeId?: string;
    },
    @Request() req
  ) {
    console.log('🔄 Creando transacción en controlador:', {
      ...data,
      createdBy: req.user.id
    });

    // Añadir información sobre quién crea la transacción
    const metadata = {
      ...data.metadata,
      createdBy: {
        id: req.user.id,
        email: req.user.email
      }
    };

    const transaction = await this.transactionsService.createTransaction({
      ...data,
      metadata
    });

    return {
      success: true,
      message: 'Transacción creada correctamente',
      transaction
    };
  }

  @Get('types')
  async getTransactionTypes() {
    const types = await this.transactionsService.getTransactionTypes();
    return {
      success: true,
      types
    };
  }

  @Get('entity/:type/:id')
  async getTransactionsByEntity(
    @Param('type') entityType: string,
    @Param('id') entityId: string
  ) {
    const transactions = await this.transactionsService.getTransactionsByEntity(
      entityType,
      entityId
    );

    return {
      success: true,
      count: transactions.length,
      transactions
    };
  }

  /**
   * Obtiene todas las transacciones del día actual
   */
  @Get('today')
  async getTodayTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    
    console.log(`📊 Solicitando transacciones del día - Página ${pageNumber}, Límite ${limitNumber}`);
    
    const result = await this.transactionsService.getTodayTransactions({
      page: pageNumber,
      limit: limitNumber
    });
    
    return {
      success: true,
      message: `Transacciones del día ${result.meta.date}`,
      ...result
    };
  }

  /**
   * Obtiene todas las transacciones para una categoría específica
   */
  @Get('category/:id')
  async getTransactionsByCategory(
    @Param('id') categoryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') transactionType?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    
    console.log(`📊 Solicitando transacciones para la categoría ${categoryId} - Página ${pageNumber}, Límite ${limitNumber}`);
    if (transactionType) {
      console.log(`📊 Filtrando por tipo de transacción: ${transactionType}`);
    }
    
    const result = await this.transactionsService.getTransactionsByCategory(
      categoryId,
      {
        page: pageNumber,
        limit: limitNumber,
        transactionType
      }
    );
    
    return {
      success: true,
      message: `Transacciones para la categoría: ${result.meta.category}`,
      ...result
    };
  }
} 