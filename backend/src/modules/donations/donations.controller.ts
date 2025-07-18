import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { ResponseDonateDto } from './interface/IDonateResponse';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}
  
  @Post(':id')
  @ApiOperation({ summary: 'Create a new donation associated with a user' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the donating user',
  })
  @ApiBody({ type: CreateDonateDto })
  @ApiResponse({
    status: 201,
    description: 'Donation successfully created',
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
