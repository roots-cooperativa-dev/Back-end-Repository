export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDonator?: boolean;
  exp: number;
  iat?: number;
}
