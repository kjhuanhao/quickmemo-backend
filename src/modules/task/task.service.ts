import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RssService } from '../rss/rss.service';

@Injectable()
export class TasksService {
  constructor(private rssService: RssService) {}
  // 使用 Cron 表达式定义每隔 30 分钟执行一次的任务
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    console.log('Rss sync task executed every 30 minutes');
    try {
      // 在这里添加你的任务逻辑
      await this.rssService.syncAllRss();
      console.log('Rss sync task end');
    } catch (error) {
      console.error('Error during Rss sync task:', error);
    }
  }
}
