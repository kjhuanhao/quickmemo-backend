import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './task.service'
import { RssModule } from '../rss/rss.module'

@Module({
  imports: [ScheduleModule.forRoot(), RssModule],
  providers: [TasksService],
})
export class TaskModule {}
