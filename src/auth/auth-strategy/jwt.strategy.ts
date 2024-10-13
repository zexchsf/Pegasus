import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { TokenExpiredException } from '../../exceptions/TokenExpiredException';
import { UsersService } from '../../domain/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(public readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: any): Promise<User> {
    if (Date.now() <= payload.exp) {
      throw new TokenExpiredException();
    }

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new ForbiddenException();
    }

    return user;
  }
}
