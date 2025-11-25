import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DataLoaderService } from './data-loader.service';
import { PatientGeneratorService } from './patient-generator.service';
import {
  AppointmentGeneratorService,
  DoctorContext,
} from './appointment-generator.service';
import { Doctor, Patient } from '../../generated/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly dataLoader: DataLoaderService,
    private readonly patientGenerator: PatientGeneratorService,
    private readonly appointmentGenerator: AppointmentGeneratorService,
  ) {}

  async runMigration(): Promise<void> {
    try {
      this.logger.log('========================================');
      this.logger.log('Starting data migration process...');
      this.logger.log('========================================');

      // Step 1: Clean existing data
      await this.database.cleanDatabase();

      // Step 2: Load data from JSON files
      const doctorsData = await this.dataLoader.loadDoctors();
      const treatmentsData = await this.dataLoader.loadTreatments();
      const availabilityData = await this.dataLoader.loadAvailability();

      // Step 3: Insert doctors
      this.logger.log('Inserting doctors into database...');
      const insertedDoctors: Doctor[] = [];
      for (const doctorData of doctorsData) {
        const doctor = await this.database.doctor.create({
          data: {
            fullName: doctorData.fullName,
            specialty: doctorData.specialty,
            city: doctorData.city,
            address: doctorData.address,
            phoneCountryCode: doctorData.phoneCountryCode,
            phoneNumber: doctorData.phoneNumber,
            rating: doctorData.rating ? new Decimal(doctorData.rating) : null,
            reviewCount: doctorData.reviewCount,
            sourceProfileUrl: doctorData.sourceProfileUrl,
          },
        });
        insertedDoctors.push(doctor);
      }
      this.logger.log(`Inserted ${insertedDoctors.length} doctors`);

      // Step 4: Insert treatments
      this.logger.log('Inserting treatments into database...');
      let treatmentCount = 0;
      for (const doctorTreatments of treatmentsData) {
        const doctor = insertedDoctors[doctorTreatments.doctorIndex];
        if (!doctor) {
          this.logger.warn(
            `Doctor index ${doctorTreatments.doctorIndex} not found, skipping treatments`,
          );
          continue;
        }

        for (const treatmentData of doctorTreatments.treatments) {
          await this.database.treatment.create({
            data: {
              doctorId: doctor.id,
              name: treatmentData.name,
              price: treatmentData.price
                ? new Decimal(treatmentData.price)
                : null,
              currency: treatmentData.currency,
              durationMinutes: treatmentData.durationMinutes,
            },
          });
          treatmentCount++;
        }
      }
      this.logger.log(`Inserted ${treatmentCount} treatments`);

      // Step 5: Insert availability
      this.logger.log('Inserting doctor availability into database...');
      let availabilityCount = 0;
      for (const doctorAvailability of availabilityData) {
        const doctor = insertedDoctors[doctorAvailability.doctorIndex];
        if (!doctor) {
          this.logger.warn(
            `Doctor index ${doctorAvailability.doctorIndex} not found, skipping availability`,
          );
          continue;
        }

        for (const slot of doctorAvailability.availabilitySlots) {
          await this.database.doctorAvailability.create({
            data: {
              doctorId: doctor.id,
              startAt: new Date(slot.startAt),
              endAt: new Date(slot.endAt),
              modality: slot.modality,
            },
          });
          availabilityCount++;
        }
      }
      this.logger.log(`Inserted ${availabilityCount} availability slots`);

      // Step 6: Generate and insert patients
      const patientsToGenerate = 100; // Generate 100 fictional patients
      const generatedPatients =
        this.patientGenerator.generatePatients(patientsToGenerate);

      this.logger.log('Inserting patients into database...');
      const insertedPatients: Patient[] = [];
      for (const patientData of generatedPatients) {
        const patient = await this.database.patient.create({
          data: {
            fullName: patientData.fullName,
            documentNumber: patientData.documentNumber,
            phoneNumber: patientData.phoneNumber,
            email: patientData.email,
          },
        });
        insertedPatients.push(patient);
      }
      this.logger.log(`Inserted ${insertedPatients.length} patients`);

      // Step 7: Prepare doctor context for appointment generation
      this.logger.log('Preparing doctor context for appointments...');
      const doctorsContext: DoctorContext[] = [];

      for (const doctor of insertedDoctors) {
        const treatments = await this.database.treatment.findMany({
          where: { doctorId: doctor.id },
          select: { id: true, durationMinutes: true },
        });

        const availability = await this.database.doctorAvailability.findMany({
          where: { doctorId: doctor.id },
          select: { startAt: true, endAt: true },
        });

        doctorsContext.push({
          doctorId: doctor.id,
          treatments,
          availability,
        });
      }

      // Step 8: Generate and insert appointments
      const appointmentsPerDoctor = 15;
      const patientIds = insertedPatients.map((p) => p.id);

      const generatedAppointments =
        this.appointmentGenerator.generateAppointments(
          doctorsContext,
          patientIds,
          appointmentsPerDoctor,
        );

      this.logger.log('Inserting appointments into database...');
      for (const appointmentData of generatedAppointments) {
        await this.database.appointment.create({
          data: {
            doctorId: appointmentData.doctorId,
            patientId: appointmentData.patientId,
            treatmentId: appointmentData.treatmentId,
            startAt: appointmentData.startAt,
            endAt: appointmentData.endAt,
            status: appointmentData.status,
          },
        });
      }
      this.logger.log(`Inserted ${generatedAppointments.length} appointments`);

      // Summary
      this.logger.log('========================================');
      this.logger.log('Migration completed successfully!');
      this.logger.log('========================================');
      this.logger.log(`Total doctors: ${insertedDoctors.length}`);
      this.logger.log(`Total treatments: ${treatmentCount}`);
      this.logger.log(`Total availability slots: ${availabilityCount}`);
      this.logger.log(`Total patients: ${insertedPatients.length}`);
      this.logger.log(`Total appointments: ${generatedAppointments.length}`);
      this.logger.log('========================================');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
