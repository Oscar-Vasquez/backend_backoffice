import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseEmailService } from './supabase-email.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailController],
  providers: [EmailService, SupabaseEmailService],
  exports: [EmailService, SupabaseEmailService]
})
export class EmailModule {} 