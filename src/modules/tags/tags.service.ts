import { Injectable, Logger } from '@nestjs/common';
import {
  createTagsDto,
  updateTagsDto,
  deleteTagsDto,
} from '../../dtos/tags.dto';
import { MemosService } from '../memos/memos.service';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { TagsEntity } from '../../entities/tags.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagsEntity)
    private readonly tagsRepository: Repository<TagsEntity>,
    private memosService: MemosService,
    private readonly dataSource: DataSource,
  ) {}

  async createTags(
    createTagsDto: createTagsDto,
    userId: string
  ): Promise<TagsEntity> {
    const tags = await this.tagsRepository.save({
      ...createTagsDto,
      createdBy: userId,
      count: 1,
    });
    return tags;
  }

  async deleteTags(
    deleteTagsDto: deleteTagsDto,
    userId: string,
  ): Promise<boolean> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // 使用事务管理器调用 memosService 的方法
      await this.memosService.deleteMemosByTags(
        deleteTagsDto,
        userId,
        transactionalEntityManager,
      );

      // 使用事务管理器删除标签
      await transactionalEntityManager.delete(TagsEntity, deleteTagsDto.id);
    });

    return true;
  }

  async deleteManyTags(ids: string[]): Promise<boolean> {
    await this.tagsRepository.delete(ids);
    return true;
  }

  async updateTags(
    updateTagsDto: updateTagsDto,
    userId: string,
  ): Promise<boolean> {
    await this.tagsRepository.update(updateTagsDto.id, {
      ...updateTagsDto,
      createdBy: userId,
    });
    return true;
  }

  async getAllTags(): Promise<TagsEntity[]> {
    const tags = await this.tagsRepository.find();
    return tags;
  }
}
