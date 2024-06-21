import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from '../../utils/parse';
import type { CreateRssDto, SubscriptionDto } from '../../dtos/rss.dto';
import {
  RssEntity,
  RssGroupEntity,
  RssInfoEntity,
  RssSubscriptionEntity,
  RssTypeEntity,
} from 'src/entities/rss.entity';
import { DataSource, Equal, QueryRunner, Repository } from 'typeorm';
import { RedisService } from '../../services/redis.service';
import { WeRssUtils } from 'src/utils/weRss';
import { WinstonLoggerService } from '../logger/logger.service';
import * as dayjs from 'dayjs';

@Injectable()
export class RssService {
  constructor(
    @InjectRepository(RssTypeEntity)
    private rssTypeRepository: Repository<RssTypeEntity>,
    @InjectRepository(RssEntity)
    private rssRepository: Repository<RssEntity>,
    @InjectRepository(RssSubscriptionEntity)
    private rssSubscriptionRepository: Repository<RssSubscriptionEntity>,
    @InjectRepository(RssGroupEntity)
    private rssGroupRepository: Repository<RssGroupEntity>,
    @InjectRepository(RssInfoEntity)
    private rssInfoRepository: Repository<RssInfoEntity>,
    @Inject('LoggerService') private readonly logger: WinstonLoggerService,
    private redisService: RedisService,
    private dataSource: DataSource,
  ) {}

  async parseRss(link: string) {
    const rss = await this.withTimeout(parse(link), 10000);
    return rss;
  }

  /**
   * 同步 rss 的函数，用于定时同步所有的 rss
   */
  async syncAllRss() {
    // 获取所有的 rss 源
    this.logger.verbose('开始同步所有的 rss');
    const allRss = await this.rssRepository.find();
    const tasks = allRss.map(async (rss) => {
      const url = rss.url;
      const rssId = rss.id;
      try {
        // 先同步微信的rss
        const rssType = rss.type;
        if (rssType.name === '微信公众号') {
          const regex = /(?<=feeds\/)[^\.]+(?=\.atom)/;
          const match = url.match(regex);
          await this.syncWeRss(rssId, match[0]);
        } else {
          // 同步其他类型的rss
          const batchData = [];
          const rssInfo = await this.parseRss(url);
          // 获取最新的 10 条数据
          const latestItems = rssInfo.items.slice(0, 10);
          // 获取数据库中该RSS源的最新10个项
          const existingItems = await this.rssInfoRepository.find({
            where: { rss: Equal(rssId) },
            order: { createdTime: 'DESC' },
            take: 10,
          });

          const existingLink = new Set(
            existingItems.map((item) => item.url),
          );
          console.log(existingLink);
          
          // 对比并插入不存在的项
          for (const item of latestItems) {
            console.log(`link： ${item.link}`);
            if (!existingLink.has(item.link)) {
              this.logger.log(`Rss: ${item.link} ${item.title} is saving...`);
              batchData.push({
                title: item.title,
                url: item.link,
                rss: rssId,
                createdTime: dayjs(item.created).toDate(),
              });
            }
          }
          // 批量插入新项
          if (batchData.length > 0) {
            await this.rssInfoRepository.insert(batchData);
          }
        }
      } catch (error) {
        const timestamp = new Date().toISOString();
        await this.redisService.set(
          `rssSyncError:${rssId}`,
          JSON.stringify({ url, timestamp, error }),
          86400,
        );
        console.log(`Exception: rssId ${rssId} and url ${url} saved to Redis`);
      }
    });

    // 等待所有任务完成
    await Promise.allSettled(tasks);
  }

  async syncWeRss(rssId: string, mpId: string) {
    try {
      // 同步微信公众号的 rss
      const weRssUtils = new WeRssUtils();
      const weRssBatchData = []; // 数据库实体类

      // 获取数据库中该RSS源的最新10个项
      const existingItems = await this.rssInfoRepository.find({
        where: { rss: Equal(rssId) },
        order: { createdTime: 'DESC' },
        take: 10,
      });

      const weRssInfo = await weRssUtils.getWeRssInfoByMpId(mpId);

      // 根据 weRssInfo 对比并插入不存在的项
      const existingUrls = new Set(existingItems.map((item) => item.url));

      for (const item of weRssInfo.items.splice(0, 10)) {
        if (!existingUrls.has(item.link)) {
          this.logger.log(
            `weRss: ${weRssInfo.id} / ${item.title} is saving...`,
          );
          weRssBatchData.push({
            title: item.title,
            url: item.link,
            rss: rssId,
            createdTime: dayjs(item.created).toDate(),
          });
        }
      }

      // 批量插入新项
      if (weRssBatchData.length > 0) {
        await this.rssInfoRepository.insert(weRssBatchData);
      }
    } catch (error) {
      this.logger.error(`Exception: ${error}`);
      return;
    }
  }

  // 超时机制
  async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), ms);
      promise
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * 根据 rssId 去获取 rss 源的数据
   * @param rssId
   * @returns
   */
  async getRssInfoByRssId(
    rssId: string,
  ): Promise<Omit<RssInfoEntity, 'rss'>[]> {
    const data = await this.rssInfoRepository.find({
      where: { rss: Equal(rssId) },
      order: { createdTime: 'DESC' },
    });

    if (data.length !== 0) {
      return data.map((item) => {
        return {
          id: item.id,
          title: item.title,
          author: item.rss.name,
          url: item.url,
          createdTime: item.createdTime,
          syncTime: item.syncTime,
        };
      });
    } else {
      return [];
    }
  }

  /**
   * 获取整个分组的所有的 rss
   * @param group
   * @param userId
   */
  async getRssInfoByRssGroup(group: string, userId: string) {
    // 需要先查询用户这个分组下的所有 rssId
    const subscriptions: any[] = await this.rssSubscriptionRepository.find({
      where: {
        createdBy: Equal(userId),
      },
      relations: ['rss'], // 加载关联的 RssEntity 对象
    });

    const data = [];
    for (const subscription of subscriptions) {
      if (group === 'all') {
        const info = await this.getRssInfoByRssId(subscription.rss.id);
        data.push(...info);
      }
      if (subscription.group && subscription.group.name === group) {
        const info = await this.getRssInfoByRssId(subscription.rss.id);
        data.push(...info);
      }
    }
    return data;
  }

  /**
   * 创建一个新的 Rss 源
   * @param rss
   * @param userId
   */
  async createRss(rss: CreateRssDto, userId: string) {
    const rssType = await this.rssTypeRepository.findOne({
      where: { id: rss.typeId },
    });
    const data = await this.rssRepository.insert({
      name: rss.rssName,
      icon: rss.icon,
      description: rss.description,
      url: rss.url,
      type: rssType,
      createdBy: userId,
      source: rss.source,
    });
    if (data) {
      return data.identifiers[0].id;
    }
    return 'error';
  }

  /**
   *
   * @param url
   * @param userId
   * @returns
   */
  async createWeRss(url: string, userId: string, source: 'admin' | 'user') {
    const weRssUtils = new WeRssUtils();
    const data = await weRssUtils.fetchMpInfo(url);
    const { id, name, cover, intro } = data;
    // 查询是否存在这个源
    const weRssUrl = await weRssUtils.getRssUrl(id);
    const obj = await this.rssRepository.findOne({ where: { url: weRssUrl } });
    if (obj) {
      return 'success';
    }
    // 不存在则先在 weRss 进行添加
    try {
      await weRssUtils.fetchFeed(data);
      const rss: CreateRssDto = {
        rssName: name,
        icon: cover,
        description: intro,
        url: await weRssUtils.getRssUrl(id),
        typeId: await this.rssTypeRepository
          .findOne({
            where: { name: '微信公众号' },
          })
          .then((res) => res.id),
        other: id,
        source,
      };
      const createdData = await this.createRss(rss, userId);
      if (createdData === 'error') {
        throw new Error('数据');
      }
      // 同步数据
      const info = await weRssUtils.getWeRssInfoByMpId(id);
      const insertData = info.items.map((item) => {
        return {
          rss: createdData.id,
          title: item.title,
          createdTime: item.created,
        };
      });
      await this.rssInfoRepository.insert(insertData);
      return 'success';
    } catch (error) {
      throw new Error('公众号源添加失败');
    }
  }

  /**
   * 获取所有的 Rss 源
   * @returns
   */
  async getAllRss(userId: string): Promise<RssResult[]> {
    const rssEntities = await this.rssRepository.find({
      relations: ['type'], // 加载关联的 RssTypeEntity 对象
    });
    console.log(rssEntities);

    let result = [];
    for (const rss of rssEntities) {
      let type = rss.type.name; // 访问关联对象的 name 属性
      console.log(type, 'type');

      // 修改这里的查询逻辑，使用简单的查询条件
      const subscription = await this.rssSubscriptionRepository.findOne({
        where: {
          rss: Equal(rss.id),
          createdBy: Equal(userId),
        },
      });
      console.log(subscription);

      // 根据用户和 rssId 去查询是否被订阅过
      let selected = subscription ? true : false;
      console.log(selected, '12');

      result.push({
        id: rss.id,
        name: rss.name,
        description: rss.description,
        url: rss.url,
        icon: rss.icon,
        type,
        selected,
      });
    }
    return result;
  }

  /**
   * 创建新的 RssType
   * @param name
   */
  async createRssType(name: string) {
    return await this.rssTypeRepository.insert({ name });
  }

  /**
   * 获取所有的 RssType
   * @returns
   */
  async getAllRssType(): Promise<string[]> {
    return (await this.rssTypeRepository.find()).map((res) => res.name);
  }

  /**
   * 用户进行 rss 的订阅
   * @param ids
   * @param userId
   * @returns
   */
  async saveBatchRssSubscription(
    ids: string[],
    userId: string,
  ): Promise<boolean> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    // 开始事务
    await queryRunner.startTransaction();
    try {
      // 先查询这个用户所有的订阅信息
      const subscriptions = await this.rssSubscriptionRepository.find({
        where: {
          createdBy: Equal(userId),
        },
      });

      // 如果不存在于 ids 中的直接删除，否则就保存更新
      for (const subscription of subscriptions) {
        if (!ids.includes(subscription.rss.id)) {
          console.log(
            await queryRunner.manager.delete(RssSubscriptionEntity, {
              rss: { id: subscription.rss.id },
              createdBy: userId,
            }),
            'delete',
          );
        }
      }
      // // 使用 group 分组
      // const defaultGroup = await queryRunner.manager.save(RssGroupEntity, {
      //   createdBy: userId,
      //   name: 'default',
      // });

      // 更新订阅状态
      for (const rssId of ids) {
        console.log(rssId);
        // 先查询是否存在，不存在则插入
        const subscription = await queryRunner.manager.findOne(
          RssSubscriptionEntity,
          {
            where: { rss: { id: rssId }, createdBy: Equal(userId) },
          },
        );

        if (!subscription) {
          await queryRunner.manager.save(RssSubscriptionEntity, {
            rss: { id: rssId },
            createdBy: userId,
            group: null,
          });
        }
      }

      // 提交事务
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      // 如果有错误，回滚事务
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 释放 queryRunner
      await queryRunner.release();
    }
  }

  /**
   *  单个订阅
   * @param rssId
   * @param userId
   */
  async subscribe(subscriptionDto: SubscriptionDto, userId: string) {
    console.log(subscriptionDto);

    if (subscriptionDto.type === 'add') {
      await this.rssSubscriptionRepository.insert({
        rss: { id: subscriptionDto.rssId },
        createdBy: userId,
        group: subscriptionDto?.group,
      });
    }
    if (subscriptionDto.type === 'update') {
      await this.rssSubscriptionRepository.update(
        {
          rss: { id: subscriptionDto.rssId },
          createdBy: userId,
        },
        { group: subscriptionDto?.group },
      );
    }
    if (subscriptionDto.type === 'delete') {
      await this.rssSubscriptionRepository.delete({
        rss: { id: subscriptionDto.rssId },
        createdBy: userId,
      });
    }
    return true;
  }

  /**
   * 获取某个用户的所有已订阅 rss 源
   */
  async getRssSubscription(userId: string) {
    return await this.rssSubscriptionRepository
      .createQueryBuilder('rssSubscription')
      .leftJoinAndMapOne(
        'rssSubscription.rss',
        RssEntity,
        'rss',
        'rssSubscription.rssId = rss.id',
      )
      // 加入对 RssGroupEntity 的连接
      .leftJoinAndMapOne(
        'rssSubscription.group',
        RssGroupEntity,
        'rssGroup',
        'rssSubscription.groupId = rssGroup.id',
      )
      .where('rssSubscription.createdBy = :userId', { userId })
      .select([
        'rssSubscription.id',
        'rssSubscription.group',
        'rss.id',
        'rss.icon',
        'rss.name',
        // 添加 RssGroup 的字段
        'rssGroup.id',
        'rssGroup.name',
      ])
      .getMany()
      .then((res) =>
        res.map((rssSubscription: any) => {
          console.log(rssSubscription, 'r');

          return {
            id: rssSubscription.id,
            rssId: rssSubscription.rss.id,
            group: rssSubscription.group?.name || null,
            icon: rssSubscription.rss.icon,
            name: rssSubscription.rss.name,
          };
        }),
      );
  }

  /**
   *  获取所有的分组
   * @param userId
   * @returns
   */
  async getAllRssGroup(userId: string) {
    const data = await this.rssGroupRepository.find({
      where: {
        createdBy: userId,
      },
    });

    return data.map((item) => {
      return {
        id: item.id,
        name: item.name,
      };
    });
  }

  /**
   * 创建新的分组
   * @param name
   * @param userId
   * @returns
   */
  async createRssGroup(name: string, userId: string) {
    return await this.rssGroupRepository.insert({ name, createdBy: userId });
  }

  /**
   * 修改某个订阅源的分组
   * @param updateRssSubscriptionGroupDto
   * @param userId
   * @returns
   */
  async updateRssSubscriptionGroup(
    changeRssSubscriptionGroupDto: ChangeRssSubscriptionGroupDto,
    userId: string,
  ) {
    return await this.rssSubscriptionRepository.update(
      { id: changeRssSubscriptionGroupDto.rssId, createdBy: userId },
      { group: changeRssSubscriptionGroupDto.groupId },
    );
  }
  /**
   * 更新某个分组的名字
   * @param updateRssSubscriptionGroupDto
   * @param userId
   * @returns
   */
  async updateRssGroup(updateRssGroupDto: UpdateRssGroupDto, userId: string) {
    return await this.rssGroupRepository.update(
      { id: updateRssGroupDto.id, createdBy: userId },
      { name: updateRssGroupDto.name },
    );
  }

  /**
   * 删除某个分组
   * @param id
   * @param userId
   */
  async deleteRssSubscriptionGroup(id: string, userId: string) {
    console.log(id, '1234');
    console.log(userId, '123');
    this.logger.log(`删除分组 ${id}`);
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 需要把被删除的分组的相关订阅，全部设空
      console.log(
        await queryRunner.manager.update(
          RssSubscriptionEntity,
          { group: Equal(id) },
          { createdBy: userId },
        ),
      );

      // 删除分组
      await queryRunner.manager.delete(
        this.rssGroupRepository.metadata.target,
        { id, createdBy: userId },
      );

      // 提交事务
      await queryRunner.commitTransaction();
    } catch (err) {
      // 如果有错误，回滚事务
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // 释放 queryRunner
      await queryRunner.release();
    }
  }
}
