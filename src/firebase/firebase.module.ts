import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { FirebaseDatabaseService } from './firebase-database.service';
import { FirebaseDatabaseController } from './firebase-database.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule.forRoot(), forwardRef(() => EmailModule)],
  controllers: [FirebaseDatabaseController],
  providers: [FirebaseService, FirebaseDatabaseService],
  exports: [FirebaseService, FirebaseDatabaseService],
})
export class FirebaseModule {} 