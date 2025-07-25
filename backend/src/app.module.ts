import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeOrmConfig from './config/SupabaseDB';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthsModule } from './modules/auths/auths.module';
import { JwtModule } from '@nestjs/jwt';
import { ProductsModule } from './modules/products/products.module';
import { CategoryModule } from './modules/category/category.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { OrdersModule } from './modules/orders/orders.module';
import { VisitsModule } from './modules/visits/visits.module';
import { DonationsModule } from './modules/donations/donations.module';
import { MailModule } from './modules/mail/mail.module';
import { PaymentsModule } from './modules/payments/payment.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<DataSourceOptions>('typeorm');
        if (!config) {
          throw new Error('TypeORM config is missing');
        }
        return config;
      },
    }),
    UsersModule,
    AuthsModule,
    JwtModule,
    ProductsModule,
    CategoryModule,
    FileUploadModule,
    OrdersModule,
    VisitsModule,
    DonationsModule,
    PaymentsModule,
    MailModule,
    ContactModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
