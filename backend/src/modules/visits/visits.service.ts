import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { VisitSlot } from './entities/visit-slot.entity';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/create-visit.dto';
import { CreateVisitSlotDto } from './dto/create-visit-slot.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { MailService } from '../mail/mail.service';
import { Users } from '../users/Entyties/users.entity';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(VisitSlot)
    private visitSlotsRepository: Repository<VisitSlot>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private readonly mailService: MailService,
  ) {}

  async createVisit(createVisitDto: CreateVisitDto): Promise<Visit> {
    const newVisit = this.visitsRepository.create(createVisitDto);
    return this.visitsRepository.save(newVisit);
  }
  async findAllVisitsPaginated(page = 1, limit = 5): Promise<Visit[]> {
    const skip = (page - 1) * limit;

    const visits = await this.visitsRepository.find({
      skip,
      take: limit,
      relations: ['availableSlots'],
    });

    if (visits.length === 0) {
      throw new NotFoundException('No visits found for this page.');
    }

    return visits;
  }

  async findOneVisit(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: ['availableSlots'],
    });
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found.`);
    }
    return visit;
  }

  async updateVisit(
    id: string,
    updateVisitDto: UpdateVisitDto,
  ): Promise<Visit> {
    const visit = await this.findOneVisit(id);
    Object.assign(visit, updateVisitDto);
    return this.visitsRepository.save(visit);
  }

  async addVisitSlot(
    visitId: string,
    createVisitSlotDto: CreateVisitSlotDto,
  ): Promise<VisitSlot> {
    const visit = await this.findOneVisit(visitId);

    const newSlot = this.visitSlotsRepository.create({
      ...createVisitSlotDto,
      visit: visit,
      visitId: visitId,
    });

    try {
      return await this.visitSlotsRepository.save(newSlot);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new BadRequestException(
          'A slot already exists on this date and time for this visit.',
        );
      }
      throw error;
    }
  }
  async removeVisit(id: string): Promise<void> {
    const visit = await this.visitsRepository.findOne({ where: { id } });
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found.`);
    }

    const visitWithSlotsAndAppointments = await this.visitsRepository.findOne({
      where: { id },
      relations: ['visitSlots', 'visitSlots.appointments'],
    });

    if (visitWithSlotsAndAppointments) {
      let hasActiveAppointments = false;
      const allAppointments: Appointment[] = [];

      visitWithSlotsAndAppointments.visitSlots.forEach((slot) => {
        if (slot.appointments) {
          allAppointments.push(...slot.appointments);
        }
      });
      for (const appointment of allAppointments) {
        if (
          appointment.status === AppointmentStatus.PENDING ||
          appointment.status === AppointmentStatus.APPROVED ||
          appointment.status === AppointmentStatus.COMPLETED
        ) {
          hasActiveAppointments = true;
          break;
        }
      }

      if (hasActiveAppointments) {
        throw new BadRequestException(
          `No se puede eliminar la visita con ID ${id} porque tiene citas pendientes, aprobadas o completadas. ` +
            `Todas las citas asociadas deben estar en estado 'cancelado' o 'rechazado' para poder eliminarla.`,
        );
      }
    }
    const result = await this.visitsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Visit with ID ${id} not found for deletion.`,
      );
    }
  }
  async findVisitSlotsByVisit(visitId: string): Promise<VisitSlot[]> {
    const visitExists = await this.visitsRepository.findOne({
      where: { id: visitId },
    });

    if (!visitExists) {
      throw new NotFoundException(`Visit with ID ${visitId} not found.`);
    }

    const visitSlots = await this.visitSlotsRepository.find({
      where: { visitId },
      order: { date: 'ASC', startTime: 'ASC' },
      relations: ['appointments'],
    });

    if (visitSlots.length === 0) {
      throw new NotFoundException(
        `The visit with ID ${visitId} has no slots to show.`,
      );
    }

    return visitSlots;
  }
  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const { visitSlotId, userId, numberOfPeople } = createAppointmentDto;

    if (!userId) {
      throw new BadRequestException(
        'El ID de usuario no está disponible para crear la cita.',
      );
    }
    if (!numberOfPeople || numberOfPeople <= 0) {
      throw new BadRequestException(
        'El número de personas debe ser al menos 1.',
      );
    }

    const visitSlot = await this.visitSlotsRepository.findOne({
      where: { id: visitSlotId },
      relations: ['visit'],
    });

    if (!visitSlot) {
      throw new NotFoundException(
        `Slot de visita con ID ${visitSlotId} no encontrado.`,
      );
    }

    const pendingAndApprovedAppointments =
      await this.appointmentsRepository.find({
        where: {
          visitSlotId: visitSlot.id,
          status: In([AppointmentStatus.PENDING, AppointmentStatus.APPROVED]),
        },
        select: ['numberOfPeople'],
      });

    const currentBookedPeople = pendingAndApprovedAppointments.reduce(
      (sum, appt) => sum + appt.numberOfPeople,
      0,
    );

    if (currentBookedPeople + numberOfPeople > visitSlot.maxAppointments) {
      const remainingCapacity = visitSlot.maxAppointments - currentBookedPeople;
      throw new BadRequestException(
        `Solo quedan ${remainingCapacity} espacios disponibles en este horario.`,
      );
    }

    const newAppointment = this.appointmentsRepository.create({
      userId: userId,
      visitSlot: visitSlot,
      numberOfPeople: numberOfPeople,
      status: AppointmentStatus.PENDING,
      bookedAt: new Date(),
      description: createAppointmentDto.description,
    });

    const savedAppointment =
      await this.appointmentsRepository.save(newAppointment);
    visitSlot.currentAppointmentsCount += numberOfPeople;
    await this.visitSlotsRepository.save(visitSlot);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    if (!user.phone || (!user.name && !user.username)) {
      throw new BadRequestException(
        'Tu perfil está incompleto. Por favor completa tu dirección, número de teléfono y nombre para agendar una cita.',
      );
    }

    const visitDate =
      typeof visitSlot.date === 'string'
        ? new Date(visitSlot.date)
        : visitSlot.date;
    if (user && visitSlot.visit) {
      await this.mailService.sendAppointmentPendingNotification(
        user.email,
        user.name || user.username || 'Usuario',
        savedAppointment.id,
        visitSlot.visit.title,
        visitDate.toDateString(),
        visitSlot.startTime,
      );
    } else {
      console.warn(
        `No se pudo enviar la notificación: Usuario o datos de visita incompletos para userId: ${userId}`,
      );
    }

    return savedAppointment;
  }
  async findAppointmentsByUser(userId: string): Promise<Appointment[]> {
    const appointments = await this.appointmentsRepository.find({
      where: { userId },
      relations: ['visitSlot', 'visitSlot.visit'],
      order: { bookedAt: 'DESC' },
    });

    if (appointments.length === 0) {
      throw new NotFoundException(
        `No appointments for the user with ID ${userId}.`,
      );
    }

    return appointments;
  }
  async findAppointmentsByUserWithPagination(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ appointments: Appointment[]; totalCount: number }> {
    const [appointments, totalCount] =
      await this.appointmentsRepository.findAndCount({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
      });

    return { appointments, totalCount };
  }

  async findAppointmentsByUserAndStatusWithPagination(
    userId: string,
    status: AppointmentStatus,
    page: number,
    limit: number,
  ): Promise<{ appointments: Appointment[]; totalCount: number }> {
    const [appointments, totalCount] =
      await this.appointmentsRepository.findAndCount({
        where: { userId, status },
        skip: (page - 1) * limit,
        take: limit,
      });

    return { appointments, totalCount };
  }
  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
      relations: ['visitSlot', 'visitSlot.visit', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found or no longer exists.`,
      );
    }
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot change the status of an appointment that is already ${appointment.status}.`,
      );
    }
    if (
      (newStatus === AppointmentStatus.REJECTED ||
        newStatus === AppointmentStatus.CANCELLED) &&
      (appointment.status === AppointmentStatus.PENDING ||
        appointment.status === AppointmentStatus.APPROVED)
    ) {
      if (appointment.visitSlot) {
        appointment.visitSlot.currentAppointmentsCount -=
          appointment.numberOfPeople;
        if (
          appointment.visitSlot.currentAppointmentsCount <
          appointment.visitSlot.maxAppointments
        ) {
          appointment.visitSlot.isBooked = false;
        }
        await this.visitSlotsRepository.save(appointment.visitSlot);
      }
    }

    appointment.status = newStatus;

    const updatedAppointment =
      await this.appointmentsRepository.save(appointment);

    return updatedAppointment;
  }
  async findPendingAppointments(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { status: AppointmentStatus.PENDING },
      relations: ['visitSlot', 'visitSlot.visit', 'user'],
      order: { bookedAt: 'ASC' },
    });
  }
  async findAppointmentsPaginated(
    status?: AppointmentStatus,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const whereClause = status ? { status } : {};

    const [data, total] = await this.appointmentsRepository.findAndCount({
      where: whereClause,
      relations: ['visitSlot', 'visitSlot.visit', 'user'],
      skip,
      take: limit,
      order: { bookedAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findAppointmentsByStatus(
    status: AppointmentStatus,
  ): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { status: status },
      relations: ['visitSlot', 'visitSlot.visit', 'user'],
      order: { bookedAt: 'ASC' },
    });
  }
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId, userId: userId },
      relations: ['user', 'visitSlot', 'visitSlot.visit'],
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found, it does not exist, or you do not have permission to cancel it.`,
      );
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.REJECTED
    ) {
      throw new BadRequestException(
        `The appointment has already been ${appointment.status.toLowerCase()}. It cannot be canceled.`,
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentsRepository.save(appointment);

    if (appointment.visitSlot) {
      appointment.visitSlot.currentAppointmentsCount -=
        appointment.numberOfPeople;

      if (appointment.visitSlot.currentAppointmentsCount < 0) {
        appointment.visitSlot.currentAppointmentsCount = 0;
      }

      if (
        appointment.visitSlot.currentAppointmentsCount <
        appointment.visitSlot.maxAppointments
      ) {
        appointment.visitSlot.isBooked = false;
      }
      await this.visitSlotsRepository.save(appointment.visitSlot);
    }
    if (
      appointment.user &&
      appointment.visitSlot &&
      appointment.visitSlot.visit
    ) {
      await this.mailService.sendAppointmentCancelledNotification(
        appointment.user.email,
        appointment.user.name || appointment.user.username || 'Usuario',
        appointment.id,
        appointment.visitSlot.visit.title,
        appointment.visitSlot.date.toDateString(),
        appointment.visitSlot.startTime,
        reason,
      );
    } else {
      console.warn(
        `Failed to send the cancellation notification: User or visit data is incomplete for appointment ${appointmentId}.`,
      );
    }
  }
}
