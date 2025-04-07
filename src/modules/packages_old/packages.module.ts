import { Module, forwardRef } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { ActivitiesModule } from '../activities/activities.module';
import { CargoModule } from '../../cargo/cargo.module';

@Module({
  imports: [
    FirebaseModule, 
    ActivitiesModule, 
    forwardRef(() => CargoModule)
  ],
  // Comentamos el controlador para evitar conflictos con el nuevo
  // controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {} 