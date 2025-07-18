import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonateDto } from './dto/create-donation.dto';
import { ResponseDonateDto } from './interface/IDonateResponse';
import { CreatePreferenceDto } from './dto/create-preference.dto.ts';
import { MercadoPagoService } from './mercadopago.service';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

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
    schema: {
      properties: {
        preferenceId: { type: 'string' },
        initPoint: { type: 'string' },
        sandboxInitPoint: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user not found',
  })
  async createPreference(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createPreferenceDto: CreatePreferenceDto,
  ) {
    return await this.mercadoPagoService.createPreference(
      userId,
      createPreferenceDto,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Mercado Pago webhook notifications' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(@Body() notification: any) {
    await this.mercadoPagoService.handleWebhook(notification);
    return { status: 'success' };
  }

  @Get('payment-status/:paymentId')
  @ApiOperation({ summary: 'Check payment status by payment ID' })
  @ApiParam({
    name: 'paymentId',
    type: String,
    description: 'Mercado Pago payment ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
  })
  async checkPaymentStatus(@Param('paymentId') paymentId: string) {
    return await this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  @Post(':id')
  @ApiOperation({
    summary: 'Create a new donation associated with a user (internal use)',
    description:
      'This endpoint is primarily for internal use. Use create-preference for normal donation flow.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the donating user',
  })
  @ApiBody({ type: CreateDonateDto })
  @ApiResponse({
    status: 201,
    description: 'Donation successfully created',
    type: ResponseDonateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user not found',
  })
  async createDonation(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() createDonationDto: CreateDonateDto,
  ): Promise<ResponseDonateDto> {
    return await this.donationsService.create(userId, createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all donations' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of donations successfully retrieved',
    type: [ResponseDonateDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ResponseDonateDto[]> {
    const pageNumber = page ? Number(page) : undefined;
    const limitNumber = limit ? Number(limit) : undefined;
    return this.donationsService.findAll(pageNumber, limitNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a donation by its ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the donation',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation found',
    type: ResponseDonateDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Donation not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDonateDto> {
    return this.donationsService.findOne(id);
  }
}
