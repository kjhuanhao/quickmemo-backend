import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SubmissionEntity } from "../../entities/submission.eneity"
import { SubmissionsService } from "./submission.service"
import { SubmissionsController } from "./submissions.controller"

@Module({
  imports: [TypeOrmModule.forFeature([SubmissionEntity])],
  providers: [SubmissionsService],
  controllers: [SubmissionsController] ,
  exports: [SubmissionsService]
})
export class SubmissionsModule {}