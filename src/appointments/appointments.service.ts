import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { Appointment } from '../generated/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private readonly database: DatabaseService) {}

  async getAppointments(
    filters: GetAppointmentsDto,
  ): Promise<Appointment[]> {
    this.logger.log(`Getting appointments with filters: ${JSON.stringify(filters)}`);

    const where: any = {};

    if (filters.doctorId) {
      where.doctorId = BigInt(filters.doctorId);
    }

    if (filters.startDate || filters.endDate) {
      where.startAt = {};
      if (filters.startDate) {
        where.startAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startAt.lte = new Date(filters.endDate);
      }
    }

    const appointments = await this.database.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    this.logger.log(`Found ${appointments.length} appointments`);
    return appointments;
  }

  async getAppointmentsByDoctor(doctorId: bigint): Promise<Appointment[]> {
    this.logger.log(`Getting appointments for doctor: ${doctorId}`);

    const appointments = await this.database.appointment.findMany({
      where: {
        doctorId,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    this.logger.log(`Found ${appointments.length} appointments for doctor`);
    return appointments;
  }

  async getAppointmentsCalendar(
    startDate?: Date,
    endDate?: Date,
    doctorId?: bigint,
  ): Promise<Appointment[]> {
    this.logger.log(
      `Getting appointments calendar from ${startDate} to ${endDate}${doctorId ? ` for doctor ${doctorId}` : ''}`,
    );

    const where: any = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) {
        where.startAt.gte = startDate;
      }
      if (endDate) {
        where.startAt.lte = endDate;
      }
    }

    const appointments = await this.database.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            city: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
          },
        },
      },
      orderBy: [
        {
          startAt: 'asc',
        },
        {
          doctor: {
            fullName: 'asc',
          },
        },
      ],
    });

    this.logger.log(`Found ${appointments.length} appointments for calendar`);
    return appointments;
  }
}

