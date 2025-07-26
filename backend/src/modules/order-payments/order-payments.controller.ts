import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderPaymentsService } from './order-payments.service';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';

@Controller('order-payments')
export class OrderPaymentsController {
  constructor(private readonly orderPaymentsService: OrderPaymentsService) {}

  @Post()
  create(@Body() createOrderPaymentDto: CreateOrderPaymentDto) {
    return this.orderPaymentsService.create(createOrderPaymentDto);
  }

  @Get()
  findAll() {
    return this.orderPaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderPaymentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderPaymentDto: UpdateOrderPaymentDto,
  ) {
    return this.orderPaymentsService.update(+id, updateOrderPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderPaymentsService.remove(+id);
  }
}
