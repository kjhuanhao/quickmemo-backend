import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MemosService } from './memos.service';
import { createMemosDto, type updateMemosDto } from '../../dtos/memos.dto';
import type { MemosEntity } from 'src/entities/memos.entity';
import type { PaginationDto } from 'src/entities/common.entity';
import { User } from 'src/decorators/user.decorator'

@Controller('memos')
export class MemosController {
  constructor(private memosService: MemosService) {}

  @Post('new')
  async createMemos(@Body() createMemosDto: createMemosDto, @User() user: UserDecoded){
    return await this.memosService.createMemos(createMemosDto, user.id);
  }

  @Post('delete')
  async deleteMemos(@Body() body: { id: string }) {
    const { id } = body;
    return await this.memosService.deleteMemos(id);
  }

  @Get('all')
  async getAllMemos(
    // @Query() paginationDto: PaginationDto,
    @User() user: UserDecoded
  ): Promise<MemosEntity[]> {
    return this.memosService.getAllMemos(user.id);
  }

  @Post('update')
  async updateMemos(@Body() updateMemosDto: updateMemosDto) {
    return await this.memosService.updateMemos(updateMemosDto);
  }
}
