import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payment.service';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from './dto/create-payment.dto';
import { WebhookNotificationDto } from './interface/patment.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-preference/:userId')
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
    return await this.paymentsService.createPreference(
      userId,
      createPreferenceDto,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive payment webhook notifications' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Body() notification: WebhookNotificationDto,
  ): Promise<{ status: string }> {
    await this.paymentsService.handleWebhook(notification);
    return { status: 'success' };
  }

  @Get('status/:paymentId')
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
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentStatusDto> {
    return await this.paymentsService.getPaymentStatus(paymentId);
  }
}
