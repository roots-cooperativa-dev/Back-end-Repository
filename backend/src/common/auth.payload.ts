export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isDonator?: boolean;
  exp: number;
  iat?: number;
}
