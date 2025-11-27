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
  private readonly MIN_APPOINTMENTS_PER_DOCTOR_PER_DAY = 3;
  private readonly MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY = 4;
  private readonly MIN_DOCTORS_PER_DAY = 7;

  generateAppointments(
    doctorsContext: DoctorContext[],
    patientIds: bigint[],
    startDate: Date,
    endDate: Date,
  ): GeneratedAppointment[] {
    this.logger.log(
      `Generating appointments from ${startDate.toISOString()} to ${endDate.toISOString()}...`,
    );

    const appointments: GeneratedAppointment[] = [];

    // Filter doctors that have both treatments and availability in the date range
    const eligibleDoctors = doctorsContext.filter(
      (doctor) =>
        doctor.treatments.length > 0 && doctor.availability.length > 0,
    );

    if (eligibleDoctors.length === 0) {
      this.logger.warn('No eligible doctors found for appointment generation');
      return appointments;
    }

    // Generate appointments day by day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        0,
        0,
        0,
      );
      const dayEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        23,
        59,
        59,
      );

      const dayAppointments = this.generateAppointmentsForDay(
        eligibleDoctors,
        patientIds,
        dayStart,
        dayEnd,
      );

      appointments.push(...dayAppointments);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logger.log(`Generated ${appointments.length} appointments`);
    return appointments;
  }

  private generateAppointmentsForDay(
    doctorsContext: DoctorContext[],
    patientIds: bigint[],
    dayStart: Date,
    dayEnd: Date,
  ): GeneratedAppointment[] {
    const appointments: GeneratedAppointment[] = [];

    // Set maximum time to 22:00 (10pm)
    const maxTime = new Date(dayStart);
    maxTime.setHours(22, 0, 0, 0);
    const effectiveDayEnd = maxTime < dayEnd ? maxTime : dayEnd;

    // Filter availability slots for this day and before 10pm
    const doctorsWithDayAvailability = doctorsContext
      .map((doctor) => {
        const dayAvailability = doctor.availability.filter(
          (slot) =>
            slot.startAt >= dayStart &&
            slot.startAt <= effectiveDayEnd &&
            slot.startAt.getHours() < 22, // Ensure start time is before 10pm
        );
        return {
          ...doctor,
          dayAvailability,
        };
      })
      .filter((doctor) => doctor.dayAvailability.length > 0);

    if (doctorsWithDayAvailability.length === 0) {
      return appointments;
    }

    // Shuffle doctors to ensure variety
    const shuffledDoctors = faker.helpers.shuffle(doctorsWithDayAvailability);

    // Select at least MIN_DOCTORS_PER_DAY doctors for this day
    const doctorsToUse = shuffledDoctors.slice(
      0,
      Math.max(
        this.MIN_DOCTORS_PER_DAY,
        Math.min(
          shuffledDoctors.length,
          this.MIN_DOCTORS_PER_DAY + Math.floor(Math.random() * 5),
        ),
      ),
    );

    // Generate appointments for each selected doctor
    for (const doctor of doctorsToUse) {
      const appointmentsPerDoctor =
        this.MIN_APPOINTMENTS_PER_DOCTOR_PER_DAY +
        Math.floor(
          Math.random() *
            (this.MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY -
              this.MIN_APPOINTMENTS_PER_DOCTOR_PER_DAY +
              1),
        );

      const doctorAppointments = this.generateAppointmentsForDoctor(
        doctor,
        patientIds,
        appointmentsPerDoctor,
        doctor.dayAvailability,
      );

      appointments.push(...doctorAppointments);
    }

    return appointments;
  }

  private generateAppointmentsForDoctor(
    doctor: DoctorContext,
    patientIds: bigint[],
    count: number,
    availableSlots: Array<{ startAt: Date; endAt: Date }>,
  ): GeneratedAppointment[] {
    const appointments: GeneratedAppointment[] = [];
    const usedSlots = new Set<string>();

    // Shuffle available slots to distribute appointments better
    const shuffledSlots = faker.helpers.shuffle([...availableSlots]);

    let attempts = 0;
    const maxAttempts = count * 3; // Try up to 3x the desired count

    while (appointments.length < count && attempts < maxAttempts) {
      attempts++;

      // Select a slot (prefer unused slots first)
      const availableUnusedSlots = shuffledSlots.filter(
        (slot) =>
          !usedSlots.has(`${slot.startAt.getTime()}-${slot.endAt.getTime()}`),
      );

      const slotToUse =
        availableUnusedSlots.length > 0
          ? faker.helpers.arrayElement(availableUnusedSlots)
          : faker.helpers.arrayElement(shuffledSlots);

      // Select random treatment
      const treatment = faker.helpers.arrayElement(doctor.treatments);
      const durationMinutes = treatment.durationMinutes || 30;

      // Check if slot can accommodate this treatment
      const slotDurationMs =
        slotToUse.endAt.getTime() - slotToUse.startAt.getTime();
      const appointmentDurationMs = durationMinutes * 60 * 1000;

      if (slotDurationMs < appointmentDurationMs) {
        continue; // Skip this slot if too short
      }

      // Select random patient
      const patientId = faker.helpers.arrayElement(patientIds);

      // Generate appointment time within the availability slot
      const appointment = this.generateAppointmentTime(
        slotToUse.startAt,
        slotToUse.endAt,
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

        // Mark this slot as used
        const slotKey = `${slotToUse.startAt.getTime()}-${slotToUse.endAt.getTime()}`;
        usedSlots.add(slotKey);
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

    // Ensure we don't schedule after 10pm (22:00)
    const maxEndTime = new Date(slotStart);
    maxEndTime.setHours(22, 0, 0, 0);
    const effectiveSlotEnd = slotEnd > maxEndTime ? maxEndTime : slotEnd;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random start time within the slot, leaving room for duration
      const slotDurationMs = effectiveSlotEnd.getTime() - slotStart.getTime();
      const appointmentDurationMs = durationMinutes * 60 * 1000;

      if (slotDurationMs < appointmentDurationMs) {
        return null; // Slot too short for this appointment
      }

      const maxStartOffset = slotDurationMs - appointmentDurationMs;
      const randomOffset = Math.floor(Math.random() * maxStartOffset);

      const startAt = new Date(slotStart.getTime() + randomOffset);
      const endAt = new Date(startAt.getTime() + appointmentDurationMs);

      // Ensure appointment doesn't end after 10pm
      if (endAt.getHours() >= 22) {
        // Adjust to end exactly at 10pm
        const adjustedEnd = new Date(startAt);
        adjustedEnd.setHours(22, 0, 0, 0);
        if (adjustedEnd <= startAt) {
          return null; // Can't fit appointment before 10pm
        }
        endAt.setTime(adjustedEnd.getTime());
      }

      // Round to nearest 15 minutes for realistic scheduling
      startAt.setMinutes(Math.round(startAt.getMinutes() / 15) * 15, 0, 0);
      endAt.setTime(startAt.getTime() + appointmentDurationMs);

      // Double check end time is not after 10pm
      if (endAt.getHours() >= 22) {
        const adjustedEnd = new Date(startAt);
        adjustedEnd.setHours(22, 0, 0, 0);
        if (adjustedEnd <= startAt) {
          return null;
        }
        endAt.setTime(adjustedEnd.getTime());
      }

      const slotKey = `${startAt.getTime()}-${endAt.getTime()}`;

      if (!usedSlots.has(slotKey)) {
        usedSlots.add(slotKey);
        return { startAt, endAt };
      }
    }

    // If we couldn't find a non-overlapping slot, just use a random time
    // But ensure it doesn't go past 10pm (reuse variables already declared above)
    const maxOffset =
      effectiveSlotEnd.getTime() -
      slotStart.getTime() -
      durationMinutes * 60 * 1000;

    if (maxOffset <= 0) {
      return null; // Can't fit appointment before 10pm
    }

    const randomOffset = Math.floor(Math.random() * maxOffset);
    const startAt = new Date(slotStart.getTime() + randomOffset);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    // Final check: ensure end time is not after 10pm
    if (endAt.getHours() >= 22) {
      const adjustedEnd = new Date(startAt);
      adjustedEnd.setHours(22, 0, 0, 0);
      if (adjustedEnd <= startAt) {
        return null;
      }
      endAt.setTime(adjustedEnd.getTime());
    }

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
