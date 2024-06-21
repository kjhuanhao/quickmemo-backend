import { Injectable } from '@nestjs/common';
import { createMemosDto, updateMemosDto } from '../../dtos/memos.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MemosEntity } from 'src/entities/memos.entity';
import { type EntityManager, type Repository } from 'typeorm';
import { deleteTagsDto } from '../../dtos/tags.dto';
import type { PaginationDto } from 'src/entities/common.entity';
import { MinioService } from '../../services/minio.service';
import { SubmissionsService } from '../submission/submission.service';

@Injectable()
export class MemosService {
  constructor(
    @InjectRepository(MemosEntity)
    private memosRepository: Repository<MemosEntity>,
    private minioService: MinioService,
    private submissionsService: SubmissionsService,
  ) {}

  async createMemos(
    createMemosDto: createMemosDto,
    userId: string,
  ): Promise<MemosEntity> {
    createMemosDto.images = await this.minioService.confirmFilesUpload(
      createMemosDto.images,
    );
    const memos = await this.memosRepository.save({
      ...createMemosDto,
      createdBy: userId,
    });
    // 增加一次 submission
    await this.submissionsService.upsertSubmission(userId);
    return memos;
  }

  async deleteMemos(id: string): Promise<true> {
    await this.memosRepository.delete(id);
    return true;
  }

  async deleteMemosByTags(
    deleteTagsDto: deleteTagsDto,
    userId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    // 查找包含该标签ID的memos
    const memos = await transactionalEntityManager.find(MemosEntity, {
      where: { createdBy: userId },
    });

    for (const memo of memos) {
      if (memo.tags.includes(deleteTagsDto.id)) {
        await transactionalEntityManager.remove(memo);
      }
    }
  }

  async deleteManyMemos(ids: string[]): Promise<void> {
    await this.memosRepository.delete(ids);
  }

  async getAllMemos(userId: string): Promise<MemosEntity[]> {
    const memos = await this.memosRepository.find({
      where: { createdBy: userId },
    });

    return memos;
  }

  async updateMemos(updateMemosDto: updateMemosDto): Promise<void> {
    const { id, ...updateData } = updateMemosDto;
    await this.memosRepository.update(id, updateData);
  }
}
