import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqlService } from './sql.service';

@Module({
  imports: [ConfigModule],
  providers: [SqlService],
  exports: [SqlService],
})
export class DatabaseModule {} 