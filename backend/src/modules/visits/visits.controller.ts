import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CreateVisitSlotDto } from './dto/create-visit-slot.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';

import { AuthRequest } from 'src/common/auth-request.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Visitas y Agendamientos')
@ApiBearerAuth()
@Controller('visits')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @ApiOperation({ summary: 'Crear una nueva visita (Solo Admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Visita creada exitosamente.',
    type: CreateVisitDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado. Se requiere rol de Administrador.',
  })
  @ApiBody({
    type: CreateVisitDto,
    description: 'Datos para crear una nueva visita',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createVisitDto: CreateVisitDto) {
    return this.visitsService.createVisit(createVisitDto);
  }

  @ApiOperation({
    summary:
      'Obtener todas las visitas disponibles (Todos los usuarios autenticados)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de visitas obtenida exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado. Token JWT inválido o ausente.',
  })
  @UseGuards(AuthGuard)
  @Get()
  async findAll() {
    return this.visitsService.findAllVisits();
  }

  @ApiOperation({
    summary: 'Obtener una visita por su ID (Todos los usuarios autenticados)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visita obtenida exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visita no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado. Token JWT inválido o ausente.',
  })
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.visitsService.findOneVisit(id);
  }

  @ApiOperation({ summary: 'Actualizar una visita existente (Solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita a actualizar',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateVisitDto,
    description: 'Datos para actualizar la visita',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visita actualizada exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visita no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado. Se requiere rol de Administrador.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVisitDto: UpdateVisitDto,
  ) {
    return this.visitsService.updateVisit(id, updateVisitDto);
  }

  @ApiOperation({ summary: 'Eliminar una visita (Solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita a eliminar',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Visita eliminada exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visita no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado. Se requiere rol de Administrador.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.visitsService.removeVisit(id);
  }

  @ApiOperation({
    summary: 'Añadir una franja horaria (slot) a una visita (Solo Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita a la que se añadirá el slot',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: CreateVisitSlotDto,
    description: 'Datos para crear una nueva franja horaria',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Franja horaria creada exitosamente.',
    type: CreateVisitSlotDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o el slot ya existe.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visita no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado. Se requiere rol de Administrador.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/slots')
  @HttpCode(HttpStatus.CREATED)
  async addSlot(
    @Param('id') visitId: string,
    @Body() createVisitSlotDto: CreateVisitSlotDto,
  ) {
    return this.visitsService.addVisitSlot(visitId, createVisitSlotDto);
  }

  @ApiOperation({
    summary:
      'Obtener todas las franjas horarias (slots) de una visita (Todos los usuarios autenticados)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita para la que se buscan los slots',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Franjas horarias obtenidas exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visita no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @UseGuards(AuthGuard)
  @Get(':id/slots')
  async getSlots(@Param('id') visitId: string) {
    return this.visitsService.findVisitSlotsByVisit(visitId);
  }

  @ApiOperation({
    summary:
      'Agendar una nueva cita para un slot disponible (Usuarios Visitadores/Donadores)',
  })
  @ApiBody({
    type: CreateAppointmentDto,
    description: 'Datos para agendar una cita',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cita agendada exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Datos inválidos, slot no encontrado, o capacidad del slot excedida.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado. Se requiere rol de Usuario o Donador.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.USER, UserRole.DONOR_USER)
  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: AuthRequest,
  ) {
    createAppointmentDto.userId = req.user.sub;
    return this.visitsService.createAppointment(createAppointmentDto);
  }

  @ApiOperation({
    summary:
      'Obtener todas las citas agendadas por el usuario actual (Todos los usuarios autenticados)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Citas obtenidas exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @UseGuards(AuthGuard)
  @Get('my-appointments')
  async findMyAppointments(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.visitsService.findAppointmentsByUser(userId);
  }

  @ApiOperation({
    summary:
      'Cancelar una cita agendada (Todos los usuarios autenticados, solo sus propias citas)',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID de la cita a cancelar',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Cita cancelada exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Cita no encontrada o el usuario no tiene permiso para cancelarla.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La cita ya ha sido cancelada o completada.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado.',
  })
  @UseGuards(AuthGuard)
  @Delete('appointments/:appointmentId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelAppointment(
    @Param('appointmentId') appointmentId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.sub;
    await this.visitsService.cancelAppointment(appointmentId, userId);
  }
}
// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Param,
//   Delete,
//   Put,
//   HttpCode,
//   HttpStatus,
//   ValidationPipe,
//   UsePipes,
//   UseGuards,
//   Req,
// } from '@nestjs/common';
// import { VisitsService } from './visits.service';
// import { CreateVisitDto } from './dto/create-visit.dto';
// import { UpdateVisitDto } from './dto/update-visit.dto';
// import { CreateVisitSlotDto } from './dto/create-visit-slot.dto';
// import { CreateAppointmentDto } from './dto/create-appointment.dto';

// import { AuthGuard } from 'src/guards/auth.guards';
// import { RoleGuard } from 'src/guards/auth.guards.admin';
// import { Roles, UserRole } from 'src/decorator/role.decorator';

// import { AuthRequest } from 'src/common/auth-request.interface';
// import {
//   ApiBearerAuth,
//   ApiOperation,
//   ApiResponse,
//   ApiTags,
// } from '@nestjs/swagger';

// @ApiTags('Visitas y Agendamientos')
// @ApiBearerAuth('access-token')
// @Controller('visits')
// @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
// export class VisitsController {
//   constructor(private readonly visitsService: VisitsService) {}

//   @ApiOperation({ summary: 'Crear una nueva visita (Solo Admin)' })
//   @ApiResponse({
//     status: HttpStatus.CREATED,
//     description: 'Visita creada exitosamente.',
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: 'No autorizado.',
//   })
//   @ApiResponse({
//     status: HttpStatus.FORBIDDEN,
//     description: 'Acceso denegado. Se requiere rol de Administrador.',
//   })
//   @UseGuards(AuthGuard, RoleGuard)
//   @Roles(UserRole.ADMIN)
//   @Post()
//   @HttpCode(HttpStatus.CREATED)
//   async create(@Body() createVisitDto: CreateVisitDto) {
//     return this.visitsService.createVisit(createVisitDto);
//   }

//   @UseGuards(AuthGuard)
//   @Get()
//   async findAll() {
//     return this.visitsService.findAllVisits();
//   }

//   @UseGuards(AuthGuard)
//   @Get(':id')
//   async findOne(@Param('id') id: string) {
//     return this.visitsService.findOneVisit(id);
//   }

//   @UseGuards(AuthGuard, RoleGuard)
//   @Roles(UserRole.ADMIN)
//   @Put(':id')
//   async update(
//     @Param('id') id: string,
//     @Body() updateVisitDto: UpdateVisitDto,
//   ) {
//     return this.visitsService.updateVisit(id, updateVisitDto);
//   }

//   @UseGuards(AuthGuard, RoleGuard)
//   @Roles(UserRole.ADMIN)
//   @Delete(':id')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async remove(@Param('id') id: string) {
//     await this.visitsService.removeVisit(id);
//   }

//   @UseGuards(AuthGuard, RoleGuard)
//   @Roles(UserRole.ADMIN)
//   @Post(':id/slots')
//   @HttpCode(HttpStatus.CREATED)
//   async addSlot(
//     @Param('id') visitId: string,
//     @Body() createVisitSlotDto: CreateVisitSlotDto,
//   ) {
//     return this.visitsService.addVisitSlot(visitId, createVisitSlotDto);
//   }

//   @UseGuards(AuthGuard)
//   @Get(':id/slots')
//   async getSlots(@Param('id') visitId: string) {
//     return this.visitsService.findVisitSlotsByVisit(visitId);
//   }

//   @UseGuards(AuthGuard, RoleGuard)
//   @Roles(UserRole.USER, UserRole.DONOR_USER)
//   @HttpCode(HttpStatus.CREATED)
//   async createAppointment(
//     @Body() createAppointmentDto: CreateAppointmentDto,
//     @Req() req: AuthRequest,
//   ) {
//     createAppointmentDto.userId = req.user.sub;
//     return this.visitsService.createAppointment(createAppointmentDto);
//   }

//   @UseGuards(AuthGuard)
//   @Get('my-appointments')
//   async findMyAppointments(@Req() req: AuthRequest) {
//     const userId = req.user.sub;
//     return this.visitsService.findAppointmentsByUser(userId);
//   }

//   @UseGuards(AuthGuard)
//   @Delete('appointments/:appointmentId/cancel')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async cancelAppointment(
//     @Param('appointmentId') appointmentId: string,
//     @Req() req: AuthRequest,
//   ) {
//     const userId = req.user.sub;
//     await this.visitsService.cancelAppointment(appointmentId, userId);
//   }
// }
