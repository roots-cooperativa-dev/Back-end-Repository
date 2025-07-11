import { Users } from '../Entyties/users.entity';

export interface IUserResponseDto {
  id: string;
  name: string;
  email: string;
  birthdate: Date;
  phone: number;
  username: string;
}

export class ResponseUserDto {
  static toDTO(user: Users): IUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      birthdate: user.birthdate,
      phone: user.phone,
      username: user.username,
    };
  }

  static toDTOList(users: Users[]): IUserResponseDto[] {
    return users.map((user) => this.toDTO(user));
  }
}

export interface IUserResponseWithAdmin extends IUserResponseDto {
  isAdmin: boolean;
  isDonator: boolean;
}

export class ResponseUserWithAdminDto {
  static toDTO(user: Users): IUserResponseWithAdmin {
    return {
      ...ResponseUserDto.toDTO(user),
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
    };
  }

  static toDTOList(users: Users[]): IUserResponseWithAdmin[] {
    return users.map((user) => this.toDTO(user));
  }
}
