import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
