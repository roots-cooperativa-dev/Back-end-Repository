import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('Google0Auth.clientId'),
      clientSecret: configService.get<string>('Google0Auth.clientSecret'),
      callbackURL: configService.get<string>('Google0Auth.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, displayName, emails } = profile;
    return {
      id,
      name: displayName,
      email: emails?.[0]?.value,
      accessToken,
    };
  }
}
