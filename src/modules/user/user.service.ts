import { Injectable } from '@nestjs/common';
import { generateRandomNumber } from '../../utils/email';
import { EmailService } from '../../services/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../entities/user.entity';
import type { Repository } from 'typeorm';
import type { CreateUserDto, LoginDto } from '../../dtos/user.dto';
import { RedisService } from '../../services/redis.service';
import { VERIFY_CODE_PREFIX } from '../../utils/constant';
import { hashPassword } from '../../utils/user';
import { AuthService } from '../../services/auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private emailService: EmailService,
    private redisService: RedisService,
    private authService: AuthService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private async refreshCount(email: string) {
    const redisClient = this.redisService.getClient();
    const key = `code::count::${email}`;
    let countRes = await redisClient.get(key);
    const exist = await redisClient.exists(key);
    const count = Number(countRes);
    if (exist && count > 5) {
      throw Error('请求太过频繁，请稍后再试');
    }
    if (exist) {
      const ttl = await redisClient.ttl(key);
      await redisClient.set(key, count + 1);
      await redisClient.expire(key, ttl);
    } else {
      await redisClient.setex(key, 1, 60 * 60 * 12); // 一天
    }
  }

  /**
   * 发送验证码
   */
  async sendVerifyCode(email: string): Promise<true> {
    // 检查是否已有缓存，防止频繁发送验证码
    const cache = await this.redisService.get(`code::cache::${email}`);
    if (cache) {
      throw new Error('请稍后再发送验证码');
    }

    // 刷新发送验证码的计数
    this.refreshCount(email);

    // 设置缓存，防止60秒内重复发送
    await this.redisService.set(`code::cache::${email}`, true, 60);

    // 生成验证码
    const code = generateRandomNumber();
    const text = `您的验证码是:${code}，5分钟内有效`;

    // 发送邮件
    await this.emailService.sendMail(email, 'QuickMemo注册', text);

    // 设置验证码的有效期为5分钟
    await this.redisService.set(`${VERIFY_CODE_PREFIX}:${email}`, code, 5 * 60);

    return true;
  }

  /**
   * 创建用户
   * @param createUserDto
   * @returns
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { email, password, confirmPassword } = createUserDto;
    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }
    const code = await this.redisService.get(`${VERIFY_CODE_PREFIX}:${email}`);
    if (!code) {
      throw new Error('验证码已过期');
    }
    const isEmailExist = await this.getUserByEmail(email);
    if (isEmailExist) {
      throw new Error('用户已存在');
    }
    // 删除验证码
    await this.redisService.del(`${VERIFY_CODE_PREFIX}:${email}`);

    // 使用 bcrypt 进行密码哈希
    const saltRounds = 10; // 你可以根据需要调整盐的轮数
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const res = await this.userRepository.save({
      email,
      password: hashedPassword,
      username: `用户${Date.now()}`,
      role: 'user'
    });
    return res;
  }

  /**
   *  登入
   * @param user
   * @returns
   */
  async login(user: LoginDto) {
    const entity = await this.getUserByEmail(user.email);
    if (!entity) {
      throw new Error('邮箱或密码错误');
    }
    console.log(entity);

    const isPasswordValid = await bcrypt.compare(
      user.password,
      entity.password,
    );
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }
    const { id, email } = entity;
    const accessToken = this.authService.generateJwtToken({ id, email });
    const refreshToken = this.authService.generateRefreshToken({ id, email });
    return { accessToken, refreshToken };
  }

  async getRefreshToken(token: string) {
    const decoded = await this.authService.decodeJwtToken(token);
    const { id, email } = decoded;
    const accessToken = this.authService.generateJwtToken({ id, email });
    const refreshToken = this.authService.generateRefreshToken({ id, email });
    return { accessToken, refreshToken };
  }

  async getUserByEmailAndPassword(email: string, password: string) {
    return this.userRepository.findOne({ where: { email, password } });
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserInfo(
    id: string,
  ): Promise<Omit<
    UserEntity,
    'password' | 'updatedTime' | 'createdTime'
  > | null> {
    if (id === undefined || id === null) {
      throw new Error('id不能为空');
    }
    const userInfo = await this.userRepository.findOneBy({ id });
    if (!userInfo) {
      return null;
    }
    delete userInfo.password;
    delete userInfo.updatedTime;
    delete userInfo.createdTime;
    return userInfo;
  }
}
