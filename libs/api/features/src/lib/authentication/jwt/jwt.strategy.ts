import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/authentication.service';
import { ConfigService } from '@nestjs/config';

console.log('JwtStrategy module is being loaded');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    console.log('JWT_SECRET:', jwtSecret); // Log the JWT secret for debugging

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    console.log('JWT validate method called with payload:', payload);
    const { userId } = payload;
    console.log('Looking up user with ID:', userId);
    const user = await this.authService.findUserById(userId);
    console.log('User found:', !!user, user ? user._id : 'not found');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // User exists, return the user object which will be attached to the request
    return user;
  }
}
