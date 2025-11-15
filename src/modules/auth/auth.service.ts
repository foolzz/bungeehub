import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // TODO: Implement authentication methods in Phase 1
  async validateUser(email: string, password: string): Promise<any> {
    return null;
  }

  async login(user: any) {
    return { access_token: 'Coming in Phase 1' };
  }

  async register(userData: any) {
    return { message: 'Coming in Phase 1' };
  }
}
