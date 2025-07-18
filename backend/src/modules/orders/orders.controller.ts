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
    summary: 'Obtener el carrito de compras del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito de compras del usuario',
  })
  async getMyCart(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getCart(req.user.sub);
  }

  @Post('cart/add')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agregar un producto (con talla y cantidad) al carrito de compras',
  })
  @ApiBody({ type: AddToCartDTO })
  @ApiResponse({
    status: 200,
    description: 'Producto agregado/actualizado en el carrito',
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
    summary: 'Proceder con la compra (convertir carrito en orden)',
  })
  @ApiResponse({
    status: 201,
    description: 'Orden creada exitosamente desde el carrito',
  })
  @ApiResponse({
    status: 400,
    description: 'Carrito vacío o stock insuficiente',
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
  @ApiOperation({ summary: 'Actualizar la cantidad de un ítem en el carrito' })
  @ApiParam({
    name: 'cartItemId',
    type: 'string',
    description: 'ID del ítem del carrito a actualizar',
  })
  @ApiBody({ type: UpdateCartItemDTO })
  @ApiResponse({
    status: 200,
    description: 'Cantidad del ítem del carrito actualizada',
  })
  @ApiResponse({ status: 404, description: 'Ítem del carrito no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Cantidad inválida o stock insuficiente',
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
  @ApiOperation({ summary: 'Eliminar un ítem del carrito de compras' })
  @ApiParam({
    name: 'cartItemId',
    type: 'string',
    description: 'ID del ítem del carrito a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Ítem eliminado del carrito' })
  @ApiResponse({ status: 404, description: 'Ítem del carrito no encontrado' })
  async removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
  ) {
    return this.ordersService.removeCartItem(req.user.sub, cartItemId);
  }
}
