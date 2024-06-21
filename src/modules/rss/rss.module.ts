import { Module } from '@nestjs/common';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RssEntity,
  RssGroupEntity,
  RssInfoEntity,
  RssSubscriptionEntity,
  RssTypeEntity,
} from '../../entities/rss.entity';
import { RedisService } from '../../services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RssTypeEntity,
      RssEntity,
      RssInfoEntity,
      RssGroupEntity,
      RssSubscriptionEntity,
    ]),
  ],
  providers: [RssService, RedisService],
  controllers: [RssController],
  exports: [RssService],
})
export class RssModule {}
