import {
  Module,
  RequestMethod,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  getDatabaseConfig,
  getMinioConfig,
  getRedisConfig,
} from './utils/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { UserModule } from './modules/user/user.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { LoggerMiddleware } from './middilewares/logger.middileware';
import { AuthMiddleware } from './middilewares/auth.middleware';
import { AuthService } from './services/auth.service';
import { CommonModule } from './modules/common/common.module';
import { AuthGuard } from './guards/auth.guard';
import { GlobalValidationPipe } from './pipes/global-validation.pipe';
import { TagsModule } from './modules/tags/tags.module'
import { RssModule } from './modules/rss/rss.module'
import { TaskModule } from './modules/task/task.module'
import { LoggerModule } from './modules/logger/logger.module'

@Module({
  imports: [
    UserModule,
    TagsModule,
    CommonModule,
    RssModule,
    TaskModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    JwtModule.register({}),
    getDatabaseConfig(),
    getRedisConfig(),
    getMinioConfig(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        { path: 'user/getUserInfo', method: RequestMethod.GET },
        { path: 'user/updateUserInfo', method: RequestMethod.POST },
      );
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
