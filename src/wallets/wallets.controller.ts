import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Wallet, TransactionResponse } from './types';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('user/:userId')
  async getWalletByUserId(@Param('userId') userId: string): Promise<Wallet> {
    console.log('🔍 Buscando billetera para usuario:', userId);
    return this.walletsService.getWallet(userId);
  }

  @Get(':id')
  async getWallet(@Param('id') id: string): Promise<Wallet> {
    console.log('🔍 Buscando billetera por ID:', id);
    return this.walletsService.getWallet(id);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string): Promise<{ balance: number }> {
    console.log('💰 Obteniendo saldo de billetera:', id);
    return this.walletsService.getBalance(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive'
  ): Promise<Wallet> {
    console.log('🔄 Actualizando estado de billetera:', { id, status });
    return this.walletsService.updateStatus(id, status);
  }

  @Get(':id/transactions')
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<TransactionResponse> {
    console.log('📊 Obteniendo transacciones:', { id, page, limit });
    return this.walletsService.getTransactions(
      id,
      parseInt(page),
      parseInt(limit)
    );
  }
} 