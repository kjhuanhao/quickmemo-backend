import { Module } from "@nestjs/common"
import { UserController } from "./user.controller"
import { UserService } from "./user.service"
import { EmailService } from "../../services/email.service"
import { AuthService } from "../../services/auth.service"
import { RedisService } from "../../services/redis.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UserEntity } from "../../entities/user.entity"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports:[TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [UserService, UserService, EmailService, AuthService, RedisService, JwtService]
})
export class UserModule {}