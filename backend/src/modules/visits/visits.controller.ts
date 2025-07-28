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
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentStatus } from './entities/appointment.entity';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthRequest } from 'src/common/auth-request.interface';

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
    return pendingAppointments;
  }
  @ApiOperation({
    summary:
      'Get all appointments, optionally filtered by status (Admins only)',
    description:
      'Retrieves all appointments. Can be filtered by providing a "status" query parameter (e.g., ?status=APPROVED).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointments successfully obtained.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access FORBIDDEN (JUST ADMIN).',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid appointment status provided.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No appointments found for the specified criteria.',
  })
  @ApiQuery({
    name: 'status',
    enum: AppointmentStatus,
    description:
      'Optional: Filter appointments by status (PENDING, APPROVED, REJECTED, CANCELED).',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page.',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('allAppointments')
  async findAllAppointmentsFiltered(
    @Query('status') status?: AppointmentStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    if (status && !Object.values(AppointmentStatus).includes(status)) {
      throw new BadRequestException(
        `Invalid appointment status: "${status}". Allowed values are: ${Object.values(AppointmentStatus).join(', ')}.`,
      );
    }

    const result = await this.visitsService.findAppointmentsPaginated(
      status,
      +page,
      +limit,
    );

    return result;
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
    description:
      'New appointment status (approved, rejected, cancelled, completed)',
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
      status !== AppointmentStatus.CANCELLED &&
      status !== AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'You can only approve, reject, completed or cancel on this.',
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
  @ApiQuery({
    name: 'status',
    enum: AppointmentStatus,
    description:
      'Optional: Filter appointments by status (PENDING, APPROVED, REJECTED, CANCELED).',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Result page. Default is 1.',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Number of items per page. Default is 10.',
    required: false,
    example: 10,
  })
  @UseGuards(AuthGuard)
  @Get('my-appointments')
  async findMyAppointments(
    @Req() req: AuthRequest,
    @Query('status') status?: AppointmentStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ appointments: Appointment[]; totalCount: number }> {
    const userId = req.user.sub;

    if (page < 1 || limit < 1) {
      throw new BadRequestException(
        'The values for "page" and "limit" must be positive.',
      );
    }
    let result: { appointments: Appointment[]; totalCount: number };

    if (status) {
      if (!Object.values(AppointmentStatus).includes(status)) {
        throw new BadRequestException(
          `Invalid appointment status: "${status}". The allowed values are: ${Object.values(AppointmentStatus).join(', ')}.`,
        );
      }
      result =
        await this.visitsService.findAppointmentsByUserAndStatusWithPagination(
          userId,
          status,
          page,
          limit,
        );
    } else {
      result = await this.visitsService.findAppointmentsByUserWithPagination(
        userId,
        page,
        limit,
      );
    }

    if (result.appointments.length === 0) {
      throw new NotFoundException(
        `No appointments found for user with ID ${userId}${status ? ` and status "${status}"` : ''}.`,
      );
    }

    return result;
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
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Page number. Default is 1.',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Number of visits per page. Default is 5.',
    required: false,
    example: 5,
  })
  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '5') {
    return this.visitsService.findAllVisitsPaginated(+page, +limit);
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
