import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { MemosModule } from '../memos/memos.module';
import { TypeOrmModule } from '@nestjs/typeorm'
import { TagsEntity } from 'src/entities/tags.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([TagsEntity]),
    MemosModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
