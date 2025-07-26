import { Address } from 'src/modules/addresses/entities/address.entity';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    birthdate?: Date;
    address: string;
    username?: string;
    phone?: number;
  };
}

export interface IUserAuthResponse {
  id: string;
  name: string;
  email: string;
  birthdate: Date;
  address: Address;
  phone: number;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDonator: boolean;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}
