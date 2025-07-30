import { OrderDetail } from 'src/modules/orders/entities/orderDetails.entity';
import { Users } from '../Entyties/users.entity';
import { AppointmentStatus } from 'src/modules/visits/entities/appointment.entity';
import { VisitSlot } from 'src/modules/visits/entities/visit-slot.entity';
import { CartItem } from 'src/modules/orders/entities/cartItem.entity';

export interface IUserResponseDto {
  id: string;
  name: string;
  email: string;
  birthdate: Date;
  phone: number;
  address: string | IAddress;
  username: string;
  isAdmin?: boolean;
  isDonator?: boolean;
  isSuperAdmin?: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  donates?: IDonateResponseDtoUser[];
  orders?: IOrderResponseDto[];
  appointments?: IAppointmentResponseDto[];
  cart?: ICartResponseDto;
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

export interface MapboxGeocodingResponse {
  features: {
    center: [number, number];
  }[];
}

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

export enum OrderStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PROCESSED = 'processed',
  FINALIZED = 'finalized',
}

export interface IOrderResponseDto {
  id: string;
  date: Date;
  status: OrderStatus;
  orderDetail: OrderDetail;
}

export interface IAppointmentResponseDto {
  id: string;
  status: AppointmentStatus;
  bookedAt: Date;
  numberOfPeople: number;
  visitSlotId: string;
  description?: string;
  visitSlot: VisitSlot;
}
export interface IAddress {
  id: string;
  street: string;
  lat: number;
  long: number;
}
export interface ICartResponseDto {
  id: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
}

export class ResponseUserDto {
  static toDTO(user: Users): IUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      birthdate: user.birthdate,
      phone: user.phone,
      address:
        typeof user.address === 'string'
          ? user.address
          : {
              id: user.address?.id,
              street: user.address?.street,
              lat: user.address?.latitude,
              long: user.address?.longitude,
            },

      username: user.username,
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt ?? new Date(0),
      deletedAt: user.deletedAt,

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
      orders:
        user.orders?.map((order) => ({
          id: order.id,
          date: order.date,
          status: order.status as OrderStatus,
          orderDetail: order.orderDetail,
        })) ?? [],
      appointments:
        user.appointments?.map((appointment) => ({
          id: appointment.id,
          status: appointment.status,
          bookedAt: appointment.bookedAt,
          numberOfPeople: appointment.numberOfPeople,
          visitSlotId: appointment.visitSlotId,
          description: appointment.description,
          visitSlot: appointment.visitSlot,
        })) ?? [],
      cart: user.cart
        ? {
            id: user.cart.id,
            total: user.cart.total,
            createdAt: user.cart.createdAt,
            updatedAt: user.cart.updatedAt,
            items: user.cart.items ?? [],
          }
        : {
            id: '',
            total: 0,
            createdAt: new Date(0),
            updatedAt: new Date(0),
            items: [],
          },
    };
  }

  static toDTOList(users: Users[]): IUserResponseDto[] {
    return users.map((user) => this.toDTO(user));
  }
}

export interface IUserResponseWithAdmin extends IUserResponseDto {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDonator: boolean;
  password: string;
}

export class ResponseUserWithAdminDto {
  static toDTO(user: Users): IUserResponseWithAdmin {
    return {
      ...ResponseUserDto.toDTO(user),
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
      password: user.password,
    };
  }

  static toDTOList(users: Users[]): IUserResponseWithAdmin[] {
    return users.map((user) => this.toDTO(user));
  }
}
