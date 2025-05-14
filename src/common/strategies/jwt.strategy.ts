import * as path from 'path';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { readFileSync } from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (process.env.NODE_ENV === 'production' && !request.secure) {
            throw new UnauthorizedException('No secure connection');
          }

          if (!request.cookies) {
            throw new UnauthorizedException('No authentication token provided');
          }

          const data = Object.keys(request.cookies);

          if (!data) {
            throw new UnauthorizedException('No authentication token provided');
          }

          return request.cookies['access_token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: readFileSync(
        path.join(process.cwd(), configService.get('JWT_PUBLIC_KEY_PATH')),
      ),
    });
  }

  async validate(payload: any) {
    return { address: payload.address };
  }
}
