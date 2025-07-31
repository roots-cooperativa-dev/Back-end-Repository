// donations.controller.ts - Versión corregida
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { ResponseDonateDto } from './interface/IDonateResponse';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import {
  DonationSearchQueryDtoExtended,
  PaginatedDonateDto,
} from './dto/donations.paginate';
import { PaymentStatus } from './dto/create-donation.dto';

@ApiTags('Donations')
@ApiBearerAuth()
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all donations with optional search filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description: 'Filter donations by payment status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'dateApproved', 'amount'],
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order: ASC or DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'List of donations successfully retrieved',
    type: PaginatedDonateDto,
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  async findAllDon(
    @Query() searchQuery: DonationSearchQueryDtoExtended,
  ): Promise<PaginatedDonateDto> {
    const { items, ...meta } =
      await this.donationsService.findAllDonationsExtended(searchQuery);

    const donateItems = ResponseDonateDto.toDTOList(items);

    return {
      ...meta,
      items: donateItems,
    };
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.DONOR_USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDonateDto> {
    return this.donationsService.findOne(id);
  }
}
