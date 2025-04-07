import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CargoService } from './cargo.service';
import { CargoController } from './cargo.controller';
import { ShipmentController } from './shipment.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PackagesModule } from '../packages/packages.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 15000,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => PackagesModule),
    PrismaModule,
  ],
  controllers: [CargoController, ShipmentController],
  providers: [CargoService],
  exports: [CargoService],
})
export class CargoModule {} 