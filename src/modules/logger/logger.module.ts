import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useClass: WinstonLoggerService,
    },
  ],
  exports: ['LoggerService'],
})
export class LoggerModule {}
