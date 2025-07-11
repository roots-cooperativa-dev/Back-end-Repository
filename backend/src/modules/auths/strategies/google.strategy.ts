import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: GoogleStrategy.getEnvVar(configService, 'Google0Auth.clientId'),
      clientSecret: GoogleStrategy.getEnvVar(
        configService,
        'Google0Auth.clientSecret',
      ),
      callbackURL: GoogleStrategy.getEnvVar(
        configService,
        'Google0Auth.callbackUrl',
      ),
      scope: ['email', 'profile'],
    });
  }

  private static getEnvVar(configService: ConfigService, key: string): string {
    const value = configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
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
