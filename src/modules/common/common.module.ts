import { Module } from "@nestjs/common"
import { CommonController } from "./common.controller"
import { MinioService } from "../../services/minio.service"

@Module({
  controllers: [CommonController],
  providers: [MinioService],
  exports: [MinioService]
})
export class CommonModule {}