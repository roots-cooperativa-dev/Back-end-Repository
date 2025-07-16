import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { VisitSlot } from './entities/visit-slot.entity';
import { Appointment } from './entities/appointment.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CreateVisitSlotDto } from './dto/create-visit-slot.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(VisitSlot)
    private visitSlotsRepository: Repository<VisitSlot>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async createVisit(createVisitDto: CreateVisitDto): Promise<Visit> {
    const newVisit = this.visitsRepository.create(createVisitDto);
    return this.visitsRepository.save(newVisit);
  }

  async findAllVisits(): Promise<Visit[]> {
    return this.visitsRepository.find({ relations: ['availableSlots'] });
  }

  async findOneVisit(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: ['availableSlots'],
    });
    if (!visit) {
      throw new NotFoundException(`Visita con ID ${id} no encontrada.`);
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

  async removeVisit(id: string): Promise<void> {
    const result = await this.visitsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Visita con ID ${id} no encontrada para eliminar.`,
      );
    }
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
          'Ya existe un slot en esta fecha y hora para esta visita.',
        );
      }
      throw error;
    }
  }

  async findVisitSlotsByVisit(visitId: string): Promise<VisitSlot[]> {
    return this.visitSlotsRepository.find({
      where: { visitId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const { visitSlotId, userId, numberOfPeople } = createAppointmentDto;

    if (!userId) {
      throw new BadRequestException(
        'User ID no disponible para crear la cita.',
      );
    }

    const visitSlot = await this.visitSlotsRepository.findOne({
      where: { id: visitSlotId },
      relations: ['visit'],
    });

    if (!visitSlot) {
      throw new NotFoundException(
        `Espacio de visita con ID ${visitSlotId} no encontrado.`,
      );
    }

    if (visitSlot.isBooked && visitSlot.maxAppointments === 1) {
      throw new BadRequestException(
        'Este espacio ya está completamente reservado.',
      );
    }

    if (
      visitSlot.currentAppointmentsCount + (numberOfPeople || 1) >
      visitSlot.maxAppointments
    ) {
      throw new BadRequestException(
        `Solo quedan ${visitSlot.maxAppointments - visitSlot.currentAppointmentsCount} espacios disponibles en este horario.`,
      );
    }

    const newAppointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      userId: userId,
      visitSlot: visitSlot,
    });

    const savedAppointment =
      await this.appointmentsRepository.save(newAppointment);

    visitSlot.currentAppointmentsCount += numberOfPeople || 1;
    if (visitSlot.currentAppointmentsCount >= visitSlot.maxAppointments) {
      visitSlot.isBooked = true;
    }
    await this.visitSlotsRepository.save(visitSlot);

    return savedAppointment;
  }

  async findAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { userId },
      relations: ['visitSlot', 'visitSlot.visit'],
      order: { bookedAt: 'DESC' },
    });
  }

  async cancelAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId, userId },
      relations: ['visitSlot'],
    });

    if (!appointment) {
      throw new NotFoundException(
        'Cita no encontrada o no tienes permiso para cancelarla.',
      );
    }
    if (
      appointment.status === 'cancelled' ||
      appointment.status === 'completed'
    ) {
      throw new BadRequestException(
        'La cita ya ha sido cancelada o completada.',
      );
    }

    appointment.status = 'cancelled';
    await this.appointmentsRepository.save(appointment);

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
}
