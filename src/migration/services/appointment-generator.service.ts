import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';

export interface DoctorContext {
  doctorId: bigint;
  treatments: Array<{ id: bigint; durationMinutes: number | null }>;
  availability: Array<{ startAt: Date; endAt: Date }>;
}

export interface GeneratedAppointment {
  doctorId: bigint;
  patientId: bigint;
  treatmentId: bigint;
  startAt: Date;
  endAt: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
}

@Injectable()
export class AppointmentGeneratorService {
  private readonly logger = new Logger(AppointmentGeneratorService.name);

  generateAppointments(
    doctorsContext: DoctorContext[],
    patientIds: bigint[],
    appointmentsPerDoctor: number = 10,
  ): GeneratedAppointment[] {
    this.logger.log(`Generating appointments...`);
    
    const appointments: GeneratedAppointment[] = [];
    
    for (const doctor of doctorsContext) {
      if (doctor.treatments.length === 0 || doctor.availability.length === 0) {
        this.logger.warn(
          `Doctor ${doctor.doctorId} has no treatments or availability, skipping appointments`,
        );
        continue;
      }

      const doctorAppointments = this.generateAppointmentsForDoctor(
        doctor,
        patientIds,
        appointmentsPerDoctor,
      );
      appointments.push(...doctorAppointments);
    }
    
    this.logger.log(`Generated ${appointments.length} appointments`);
    return appointments;
  }

  private generateAppointmentsForDoctor(
    doctor: DoctorContext,
    patientIds: bigint[],
    count: number,
  ): GeneratedAppointment[] {
    const appointments: GeneratedAppointment[] = [];
    const usedSlots = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Select random availability slot
      const availabilitySlot = faker.helpers.arrayElement(doctor.availability);
      
      // Select random treatment
      const treatment = faker.helpers.arrayElement(doctor.treatments);
      const durationMinutes = treatment.durationMinutes || 30;
      
      // Select random patient
      const patientId = faker.helpers.arrayElement(patientIds);
      
      // Generate appointment time within the availability slot
      const appointment = this.generateAppointmentTime(
        availabilitySlot.startAt,
        availabilitySlot.endAt,
        durationMinutes,
        usedSlots,
      );

      if (appointment) {
        appointments.push({
          doctorId: doctor.doctorId,
          patientId,
          treatmentId: treatment.id,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          status: this.generateAppointmentStatus(),
        });
      }
    }

    return appointments;
  }

  private generateAppointmentTime(
    slotStart: Date,
    slotEnd: Date,
    durationMinutes: number,
    usedSlots: Set<string>,
  ): { startAt: Date; endAt: Date } | null {
    const maxAttempts = 20;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random start time within the slot, leaving room for duration
      const slotDurationMs = slotEnd.getTime() - slotStart.getTime();
      const appointmentDurationMs = durationMinutes * 60 * 1000;
      
      if (slotDurationMs < appointmentDurationMs) {
        return null; // Slot too short for this appointment
      }
      
      const maxStartOffset = slotDurationMs - appointmentDurationMs;
      const randomOffset = Math.floor(Math.random() * maxStartOffset);
      
      const startAt = new Date(slotStart.getTime() + randomOffset);
      const endAt = new Date(startAt.getTime() + appointmentDurationMs);
      
      // Round to nearest 15 minutes for realistic scheduling
      startAt.setMinutes(Math.round(startAt.getMinutes() / 15) * 15, 0, 0);
      endAt.setTime(startAt.getTime() + appointmentDurationMs);
      
      const slotKey = `${startAt.getTime()}-${endAt.getTime()}`;
      
      if (!usedSlots.has(slotKey)) {
        usedSlots.add(slotKey);
        return { startAt, endAt };
      }
    }
    
    // If we couldn't find a non-overlapping slot, just use a random time
    const randomOffset = Math.floor(Math.random() * (slotEnd.getTime() - slotStart.getTime() - durationMinutes * 60 * 1000));
    const startAt = new Date(slotStart.getTime() + randomOffset);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
    
    return { startAt, endAt };
  }

  private generateAppointmentStatus(): 'scheduled' | 'completed' | 'cancelled' {
    const rand = Math.random();
    
    if (rand < 0.7) {
      return 'scheduled'; // 70% scheduled
    } else if (rand < 0.9) {
      return 'completed'; // 20% completed
    } else {
      return 'cancelled'; // 10% cancelled
    }
  }
}


