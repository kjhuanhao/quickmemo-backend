import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from '../utils/constant';


@Injectable()
export class AuthService {
  private readonly jwtService: JwtService;
  private privateKey: string;
  constructor(@Inject(JwtService) jwtService: JwtService) {
    this.jwtService = jwtService;
  }



  /**
   * 生成 token
   * @param param0
   * @returns
   */
  generateJwtToken({ id, email }: { id: string; email: string }): string {
    const payload = { id, email };
    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: '7d',
    });
  }

  /**
   * 生成 refresh token
   */
  generateRefreshToken({ id, email }: { id: string; email: string }): string {
    const payload = { id, email };
    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: '20d',
    });
  }
  /**
   * 解析 token
   * @param token
   * @returns
   */
  async decodeJwtToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: JWT_SECRET,
      });
      return {
        id: decoded.id,
        email: decoded.email,
        iat: decoded.iat * 1000,
        exp: decoded.exp * 1000,
      };
    } catch (error) {
      return {};
    }
  }
}
