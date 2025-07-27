import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderPaymentsService } from './order-payments.service';
import {
  PaymentStatusDto,
  PreferenceResponseDto,
} from '../payments/dto/create-payment.dto';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { CreateCartPreferenceDto } from './dto/create-order-payment.dto';

@ApiTags('Order-payments')
@Controller('order-payments')
export class OrderPaymentsController {
  private readonly logger = new Logger(OrderPaymentsController.name);

  constructor(private readonly orderPaymentsService: OrderPaymentsService) {}

  @Post('create-preference/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment preference for cart purchase' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user making the purchase',
  })
  @ApiBody({ type: CreateCartPreferenceDto })
  @ApiResponse({
    status: 201,
    description: 'Payment preference successfully created',
    type: PreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data, user not found, or cart not found',
  })
  @UseGuards(AuthGuard)
  async createPreference(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createPreferenceDto: CreateCartPreferenceDto,
  ): Promise<PreferenceResponseDto> {
    return await this.orderPaymentsService.createPreference(
      userId,
      createPreferenceDto,
    );
  }

  @Get('status/:paymentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check payment status by payment ID' })
  @ApiParam({
    name: 'paymentId',
    type: String,
    description: 'Payment ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
    type: PaymentStatusDto,
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN || UserRole.DONOR_USER)
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentStatusDto> {
    return await this.orderPaymentsService.getPaymentStatus(paymentId);
  }

  @Get('cart/:cartId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment information by cart ID' })
  @ApiParam({
    name: 'cartId',
    type: String,
    description: 'Cart ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment information retrieved successfully',
  })
  @UseGuards(AuthGuard)
  async getPaymentByCartId(
    @Param('cartId', ParseUUIDPipe) cartId: string,
  ): Promise<any> {
    const payment = await this.orderPaymentsService.getPaymentByCartId(cartId);
    if (!payment) {
      return { message: 'No payment found for this cart' };
    }
    return {
      id: payment.id,
      pagoId: payment.pagoId,
      status: payment.status,
      statusDetail: payment.statusDetail,
      amount: payment.amount,
      currencyId: payment.currencyId,
      paymentTypeId: payment.paymentTypeId,
      paymentMethodId: payment.paymentMethodId,
      dateApproved: payment.dateApproved,
      createdAt: payment.createdAt,
      cartId: payment.cart.id,
      userId: payment.user.id,
    };
  }

  @Get('user/:userId/payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User payments retrieved successfully',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN || UserRole.DONOR_USER)
  async getUserPayments(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<any[]> {
    const payments =
      await this.orderPaymentsService.getPaymentsByUserId(userId);
    return payments.map((payment) => ({
      id: payment.id,
      pagoId: payment.pagoId,
      status: payment.status,
      statusDetail: payment.statusDetail,
      amount: payment.amount,
      currencyId: payment.currencyId,
      paymentTypeId: payment.paymentTypeId,
      paymentMethodId: payment.paymentMethodId,
      dateApproved: payment.dateApproved,
      createdAt: payment.createdAt,
      cartId: payment.cart.id,
    }));
  }
}
