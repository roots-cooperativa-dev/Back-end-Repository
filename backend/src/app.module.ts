import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeOrmConfig from './config/SupabaseDB';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { UsersModule } from './modules/users/users.module';
import google0authConfig from './config/google-0auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig, google0authConfig],
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
