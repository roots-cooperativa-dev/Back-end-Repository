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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonateDto } from './dto/create-donation.dto';
import { Donate } from './entities/donation.entity';
import { ResponseDonateDto } from './interface/IDonateResponse';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post(':id')
  @ApiOperation({ summary: 'Crear una nueva donación asociada a un usuario' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del usuario que dona',
  })
  @ApiBody({ type: CreateDonateDto })
  @ApiResponse({
    status: 201,
    description: 'Donación creada con éxito',
    type: Donate,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario no encontrado',
  })
  async createDonation(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() createDonationDto: CreateDonateDto,
  ): Promise<ResponseDonateDto> {
    return await this.donationsService.create(userId, createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las donaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de donaciones obtenida correctamente',
    type: [Donate],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<Donate[]> {
    return this.donationsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una donación por su ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la donación',
  })
  @ApiResponse({
    status: 200,
    description: 'Donación encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Donación no encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Donate> {
    return this.donationsService.findOne(id);
  }
}
