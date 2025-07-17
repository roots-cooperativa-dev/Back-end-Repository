import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDTO } from './DTO/createOrder.dto';
import { UpdateOrderStatusDTO } from './DTO/updateOrderStatus.dto';
import { Order } from './entities/order.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDTO })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: Order,
  })
  create(@Body() createOrderDTO: CreateOrderDTO) {
    const { userId, products } = createOrderDTO;
    return this.ordersService.createOrder(userId, products);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all available orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of orders' })
  getOrders(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNum = page ? +page : 1;
    const limitNum = limit ? +limit : 10;
    return this.ordersService.getAllOrders(pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve order by ID ',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  getOrderId(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDTO })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
    type: Order,
  })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDTO,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto);
  }
}
