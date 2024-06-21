import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  createTagsDto,
  updateTagsDto,
  type deleteTagsDto,
} from '../../dtos/tags.dto';
import { TagsService } from './tags.service';
import { User } from '../../decorators/user.decorator';
import type { TagsEntity } from 'src/entities/tags.entity'

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('new')
  async createTags(
    @Body() tagsDto: createTagsDto,
    @User() user: UserDecoded,
  ): Promise<TagsEntity> {
    return await this.tagsService.createTags(tagsDto, user.id);
  }

  @Post('update')
  async updateTags(
    @Body() updateTagsDto: updateTagsDto,
    @User() user: UserDecoded,
  ): Promise<boolean> {
    return await this.tagsService.updateTags(updateTagsDto, user.id);
  }

  @Post('delete')
  async deleteTags(
    @Body() deleteTagsDto: deleteTagsDto,
    @User() user: UserDecoded,
  ): Promise<boolean> {
    return await this.tagsService.deleteTags(deleteTagsDto, user.id);
  }

  @Get('all')
  async getAllTags(): Promise<TagsEntity[]> {
    return await this.tagsService.getAllTags();
  }
}
