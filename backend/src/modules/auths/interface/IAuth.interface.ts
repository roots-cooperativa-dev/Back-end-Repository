export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    birthdate?: Date;
    username?: string;
    phone?: number;
  };
}

export interface IUserAuthResponse {
  id: string;
  name: string;
  email: string;
  birthdate: Date;
  phone: number;
  username: string;
  isAdmin: boolean;
  isDonator: boolean;
}
