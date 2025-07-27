import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Logger,
  HttpCode,
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
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
  WebhookNotificationDto,
} from '../payments/dto/create-payment.dto';
import {
  isWebhookNotification,
  WebhookNotificationDto as WebhookNotificationInterface,
} from '../payments/interface/patment.interface';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';

@ApiTags('Order-payments')
@Controller('order-payments')
export class OrderPaymentsController {
  private readonly logger = new Logger(OrderPaymentsController.name);
  constructor(private readonly orderPaymentsService: OrderPaymentsService) {}

  @Post('create-preference/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment preference for donation' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user making the donation',
  })
  @ApiBody({ type: CreatePreferenceDto })
  @ApiResponse({
    status: 201,
    description: 'Payment preference successfully created',
    type: PreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user not found',
  })
  async createPreference(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createPreferenceDto: CreatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    return await this.orderPaymentsService.createPreference(
      userId,
      createPreferenceDto,
    );
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive payment webhook notifications' })
  @ApiBody({ type: WebhookNotificationDto })
  async handleWebhook(
    @Body() notification: WebhookNotificationInterface,
  ): Promise<{ status: string }> {
    if (!isWebhookNotification(notification)) {
      this.logger.warn('Invalid webhook notification structure received');
      return { status: 'invalid_structure' };
    }

    try {
      await this.orderPaymentsService.handleWebhook(notification);
      return { status: 'success' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Webhook processing error: ${message}`);
      return { status: 'error' };
    }
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
}
