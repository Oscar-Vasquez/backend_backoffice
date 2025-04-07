import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { OperatorsModule } from './operators/operators.module';
import { BranchesModule } from './branches/branches.module';
import { PlansModule } from './plans/plans.module';
import { WalletsModule } from './wallets/wallets.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CargoModule } from './cargo/cargo.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PackagesModule } from './packages/packages.module';
import { PaymentTypesModule } from './payment-types/payment-types.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CashClosuresModule } from './cash-closures/cash-closures.module';
// Comentamos este módulo porque estamos usando el nuevo módulo de packages
// import { ActivitiesModule } from './modules/activities/activities.module';
import { PrismaModule } from './prisma/prisma.module';
import { OperatorTypesModule } from './operator-types/operator-types.module';
import { QueryPerformanceMiddleware } from './common/middleware/query-performance.middleware';
import databaseConfig from './config/database.config';
import prismaPerformanceConfig from './config/prisma-performance.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, prismaPerformanceConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    OperatorsModule,
    BranchesModule,
    PlansModule,
    WalletsModule,
    PaymentsModule,
    InvoicesModule,
    NotificationsModule,
    CargoModule,
    UsersModule,
    EmailModule,
    DashboardModule,
    PackagesModule,
    PaymentTypesModule,
    TransactionsModule,
    CashClosuresModule,
    // Comentamos también la importación del módulo
    // ActivitiesModule,
    OperatorTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de rendimiento a todas las rutas de la API
    consumer
      .apply(QueryPerformanceMiddleware)
      .exclude(
        // Excluir rutas no críticas o de métricas
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
