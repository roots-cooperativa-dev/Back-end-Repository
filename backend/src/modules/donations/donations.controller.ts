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

@ApiTags('Donations')
@ApiBearerAuth()
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN || UserRole.DONOR_USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDonateDto> {
    return this.donationsService.findOne(id);
  }
}
