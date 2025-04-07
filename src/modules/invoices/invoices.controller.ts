import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async createInvoice(
    @Body() invoiceData: any,
    @Req() req: RequestWithUser,
  ) {
    const operatorData = {
      id: req.user.id,
      email: req.user.email
    };
    
    return this.invoicesService.createInvoice(invoiceData, operatorData);
  }
} 