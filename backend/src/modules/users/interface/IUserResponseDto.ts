import { Users } from '../Entyties/users.entity';

export interface IUserResponseDto {
  id: string;
  name: string;
  email: string;
  birthdate: Date;
  phone: number;
  username: string;
  isAdmin?: boolean;
  isDonator?: boolean;
  donates?: IDonateResponseDtoUser[];
}

export interface IDonateResponseDtoUser {
  id: string;
  pagoId: string;
  status: string;
  statusDetail: string;
  amount: number;
  currencyId: string;
  paymentTypeId: string;
  paymentMethodId: string;
  dateApproved: Date;
  createdAt: Date;
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
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
      donates:
        user.donates?.map((donate) => ({
          id: donate.id,
          pagoId: donate.pagoId,
          status: donate.status,
          statusDetail: donate.statusDetail,
          amount: donate.amount,
          currencyId: donate.currencyId,
          paymentTypeId: donate.paymentTypeId,
          paymentMethodId: donate.paymentMethodId,
          dateApproved: donate.dateApproved,
          createdAt: donate.createdAt,
        })) ?? [],
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
