import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
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
import { AddToCartDTO } from './DTO/addToCart.dto';
import { UpdateCartItemDTO } from './DTO/updateCartItem.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('cart')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the authenticated users shopping cart',
  })
  @ApiResponse({
    status: 200,
    description: 'User shopping cart',
  })
  async getMyCart(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getCart(req.user.sub);
  }

  @Post('cart/add')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a product (with size and quantity) to the shopping cart',
  })
  @ApiBody({ type: AddToCartDTO })
  @ApiResponse({
    status: 200,
    description: 'Product added/updated in cart',
  })
  async addProductToCart(
    @Req() req: AuthenticatedRequest,
    @Body() addToCartDTO: AddToCartDTO,
  ) {
    return this.ordersService.addProductToCart(req.user.sub, addToCartDTO);
  }

  @Post('cart/checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Proceed with purchase (convert cart to order)',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully from the cart',
  })
  @ApiResponse({
    status: 400,
    description: 'Empty cart or insufficient stock',
  })
  async checkoutCart(@Req() req: AuthenticatedRequest) {
    return this.ordersService.checkoutCart(req.user.sub);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDTO })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
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
  @ApiResponse({ status: 200, description: 'Order found' })
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
  })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDTO,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto);
  }

  @Put('cart/items/:cartItemId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the quantity of an item in the cart' })
  @ApiParam({
    name: 'cartItemId',
    type: 'string',
    description: 'ID of the cart item to update',
  })
  @ApiBody({ type: UpdateCartItemDTO })
  @ApiResponse({
    status: 200,
    description: 'Cart item quantity updated',
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid quantity or insufficient stock',
  })
  async updateCartItemQuantity(
    @Req() req: AuthenticatedRequest,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @Body() updateCartItemDTO: UpdateCartItemDTO,
  ) {
    return this.ordersService.updateCartItemQuantity(
      req.user.sub,
      cartItemId,
      updateCartItemDTO,
    );
  }

  @Delete('cart/items/:cartItemId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an item from the shopping cart' })
  @ApiParam({
    name: 'cartItemId',
    type: 'string',
    description: 'ID of the cart item to delete',
  })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
  ) {
    return this.ordersService.removeCartItem(req.user.sub, cartItemId);
  }
}
