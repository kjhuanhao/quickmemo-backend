import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RssService } from './rss.service';
import { User } from '../../decorators/user.decorator';
import { WeRssUtils } from '../../utils/weRss';
import type {
  CreateRssDto,
  DeleteRssSubscriptionGroupDto,
  SubscriptionDto,
} from 'src/dtos/rss.dto';

@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  // @Get()
  // async getRss(@Query('link') link: string) {
  //   const rss = await this.rssService.parseRss(link);
  //   return rss;
  // }

  @Get('test')
  async test() {
    // 1. 查询是否已经存在这个微信公众号的订阅源
    // 2. 如果不存在，则创建订阅源
    // 3. 返回的 rss 连接应该存入数据库
    // return this.rssService.parseRss(
    //   'https://rss.monsterglobe.site/juejin/trending/ios/monthly',
    // );
    return this.rssService.syncAllRss();
  }

  @Get('all')
  async getAllRss(@User() user: UserDecoded) {
    return this.rssService.getAllRss(user.id);
  }

  @Post('new')
  async createRss(
    @Body() createRssDto: CreateRssDto,
    @User() user: UserDecoded,
  ) {
    return this.rssService.createRss(createRssDto, user.id);
  }

  @Post('new/weRss')
  async createWeRss(
    @Body() { url, source }: { url: string; source: 'admin' | 'user' },
    @User() user: UserDecoded,
  ) {
    return this.rssService.createWeRss(url, user.id, source);
  }

  @Get('rssType/all')
  async getAllRssType() {
    return this.rssService.getAllRssType();
  }

  @Post('rssType/new')
  async createRssType(@Body() { name }: { name: string }) {
    return this.rssService.createRssType(name);
  }

  @Get('subscription/all')
  async getAllRssSubscription(@User() user: UserDecoded) {
    return this.rssService.getRssSubscription(user.id);
  }

  @Get('subscription/info')
  async getRssSubscriptionInfoByRssId(@Query('rssId') rssId: string) {
    return this.rssService.getRssInfoByRssId(rssId);
  }

  @Get('subscription/group')
  async getRssSubscriptionInfoByGroup(
    @Query('group') group: string,
    @User() user: UserDecoded,
  ) {
    console.log(group, 'group');
    return this.rssService.getRssInfoByRssGroup(group, user.id);
  }

  @Get('subscription/group/all')
  async getRssSubscriptionInfoByGroupAll(@User() user: UserDecoded) {
    return this.rssService.getAllRssGroup(user.id);
  }

  @Post('subscription/group/new')
  async createRssSGroup(
    @Body() { name }: { name: string },
    @User() user: UserDecoded,
  ) {
    return this.rssService.createRssGroup(name, user.id);
  }

  @Post('subscription/group/update')
  async updateRssGroup(
    @Body() updateRssGroupDto: UpdateRssGroupDto,
    @User() user: UserDecoded,
  ) {
    return this.rssService.updateRssGroup(updateRssGroupDto, user.id);
  }

  @Post('subscription/group/change')
  async updateRssSubscriptionGroup(
    @Body() changeRssSubscriptionGroup: ChangeRssSubscriptionGroupDto,
    @User() user: UserDecoded,
  ) {
    return this.rssService.updateRssSubscriptionGroup(
      changeRssSubscriptionGroup,
      user.id,
    );
  }

  @Post('subscription/group/delete')
  async deleteRssSubscriptionGroup(
    @Body() deleteRssSubscriptionGroupDto: DeleteRssSubscriptionGroupDto,
    @User() user: UserDecoded,
  ) {
    console.log(deleteRssSubscriptionGroupDto, 'id123');

    return this.rssService.deleteRssSubscriptionGroup(
      deleteRssSubscriptionGroupDto.groupId,
      user.id,
    );
  }

  @Post('subscription/subscribe')
  async saveRssSubscription(
    @Body() subscriptionDto: SubscriptionDto,
    @User() user: UserDecoded,
  ) {
    return this.rssService.subscribe(subscriptionDto, user.id);
  }
}
