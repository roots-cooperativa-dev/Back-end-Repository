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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/create-visit.dto';
import { CreateVisitSlotDto } from './dto/create-visit-slot.dto';

import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthRequest } from 'src/common/auth-request.interface';
import { error } from 'console';

@ApiTags('Visits & Appointments')
@ApiBearerAuth()
@Controller('visits')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @ApiOperation({
    summary: 'Get all appointments with pending status (Admins only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending appointments successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access FORBIDDEN (JUST ADMIN).',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('appointments/pending')
  async findPendingAppointments() {
    const pendingAppointments =
      await this.visitsService.findPendingAppointments();
    if (pendingAppointments.length === 0) {
      throw new NotFoundException('No pending appointments found.');
    }
    console.log(error);
    return pendingAppointments;
  }

  @ApiOperation({
    summary:
      'Update the status of an appointment (Approve/Reject) (Admins only)',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID de la cita a actualizar',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'status',
    description: 'New appointment status (approved, rejected, cancelled)',
    enum: AppointmentStatus,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment status updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Appointment not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transition state.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access FORBIDDEN (just admin).',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Put('appointments/:appointmentId/status/:status')
  async updateAppointmentStatus(
    @Param('appointmentId') appointmentId: string,
    @Param('status') status: AppointmentStatus,
  ) {
    if (!Object.values(AppointmentStatus).includes(status)) {
      throw new BadRequestException('Appointment status invalid.');
    }
    if (
      status !== AppointmentStatus.APPROVED &&
      status !== AppointmentStatus.REJECTED &&
      status !== AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'You can only approve, reject or cancel on this.',
      );
    }

    return this.visitsService.updateAppointmentStatus(appointmentId, status);
  }

  @ApiOperation({ summary: 'Create a new visit (Just Admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Visit created succesfully.',
    type: CreateVisitDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. Administrator role required.',
  })
  @ApiBody({
    type: CreateVisitDto,
    description: 'To create a visit',
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
      'Get all appointments scheduled by the current user (All authenticated users)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointments successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @UseGuards(AuthGuard)
  @Get('my-appointments')
  async findMyAppointments(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.visitsService.findAppointmentsByUser(userId);
  }

  @ApiOperation({
    summary: 'Get all available visits (All authenticated users)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visit list successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. Invalid or missing JWT token.',
  })
  @UseGuards(AuthGuard)
  @Get()
  async findAll() {
    return this.visitsService.findAllVisits();
  }

  @ApiOperation({
    summary: 'Get a visit by your ID (All authenticated users)',
  })
  @ApiParam({
    name: 'id',
    description: 'visit ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visit successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visit not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. Invalid or missing JWT token.',
  })
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.visitsService.findOneVisit(id);
  }

  @ApiOperation({ summary: 'Update an existing visit (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'visit ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateVisitDto,
    description: 'Data to update the visit',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visit successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visit not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. Administrator role required..',
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

  @ApiOperation({ summary: 'Delete a visit (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'visit ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Visit successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visit not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. Administrator role required.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.visitsService.removeVisit(id);
  }

  @ApiOperation({
    summary: 'Add a time slot to a visit (Admin Only)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the visit to which the slot will be added',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: CreateVisitSlotDto,
    description: 'Data to create a new time slot',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Time slot created successfully.',
    type: CreateVisitSlotDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or the slot already exists.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visit not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. Administrator role required.',
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
    summary: 'Get all time slots for a visit (All authenticated users)',
  })
  @ApiParam({
    name: 'id',
    description: 'visit ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slots successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visit not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @UseGuards(AuthGuard)
  @Get(':id/slots')
  async getSlots(@Param('id') visitId: string) {
    return this.visitsService.findVisitSlotsByVisit(visitId);
  }

  @ApiOperation({
    summary:
      'Schedule a new appointment for an available slot (Visiting/Donating Users)',
  })
  @ApiBody({
    type: CreateAppointmentDto,
    description: 'Information to schedule an appointment',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Appointment successfully scheduled.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data, slot not found, or slot capacity exceeded.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. User or Donor role required.',
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
      'Cancel a scheduled appointment (All authenticated users, only your own appointments)',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID of the appointment to cancel',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Appointment successfully cancelled.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Appointment not found or the user does not have permission to cancel it.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The appointment has already been cancelled or completed.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
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
