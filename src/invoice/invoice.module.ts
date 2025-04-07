import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { EmailService } from '../email/email.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, EmailService],
})
export class InvoiceModule {}