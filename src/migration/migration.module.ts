import { Module } from '@nestjs/common';
import { MigrationService } from './services/migration.service';
import { DataLoaderService } from './services/data-loader.service';
import { PatientGeneratorService } from './services/patient-generator.service';
import { AppointmentGeneratorService } from './services/appointment-generator.service';

@Module({
  providers: [
    MigrationService,
    DataLoaderService,
    PatientGeneratorService,
    AppointmentGeneratorService,
  ],
  exports: [MigrationService],
})
export class MigrationModule {}


