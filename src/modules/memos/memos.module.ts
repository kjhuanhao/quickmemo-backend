import { Module } from "@nestjs/common"
import { MemosService } from "./memos.service"
import { MemosController } from "./memos.controller"
import { TypeOrmModule } from "@nestjs/typeorm"
import { MemosEntity } from "../../entities/memos.entity"
import { CommonModule } from "../common/common.module"
import { SubmissionsModule } from '../submission/submission.module';

@Module({
  imports: [TypeOrmModule.forFeature([MemosEntity]), CommonModule, SubmissionsModule],
  controllers:[MemosController],
  providers: [MemosService],
  exports: [MemosService],
})
export class MemosModule {}