import { Injectable } from '@nestjs/common';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';

@Injectable()
export class OrderPaymentsService {
  create(createOrderPaymentDto: CreateOrderPaymentDto) {
    return 'This action adds a new orderPayment';
  }

  findAll() {
    return `This action returns all orderPayments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} orderPayment`;
  }

  update(id: number, updateOrderPaymentDto: UpdateOrderPaymentDto) {
    return `This action updates a #${id} orderPayment`;
  }

  remove(id: number) {
    return `This action removes a #${id} orderPayment`;
  }
}
