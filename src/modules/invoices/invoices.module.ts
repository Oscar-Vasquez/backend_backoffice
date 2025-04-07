import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { ActivitiesModule } from '../activities/activities.module';
import { PackagesModule } from '../../packages/packages.module';

@Module({
  imports: [
    FirebaseModule,
    ActivitiesModule,
    PackagesModule
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {} 