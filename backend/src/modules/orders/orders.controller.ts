import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDTO } from './DTO/createOrder.dto';
import { UpdateOrderStatusDTO } from './DTO/updateOrderStatus.dto';
import { Order } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDTO: CreateOrderDTO) {
    const { userId, products } = createOrderDTO;
    return this.ordersService.createOrder(userId, products);
  }

  @Get()
  getOrders(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNum = page ? +page : 1;
    const limitNum = limit ? +limit : 10;
    return this.ordersService.getAllOrders(pageNum, limitNum);
  }

  @Get(':id')
  getOrderId(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDTO,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto);
  }
}
