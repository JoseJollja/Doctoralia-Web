import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  DoctorData,
  DoctorTreatmentsData,
  DoctorAvailabilityData,
} from '../interfaces/dummy-data.interface';

@Injectable()
export class DataLoaderService {
  private readonly logger = new Logger(DataLoaderService.name);
  private readonly dataPath = join(process.cwd(), 'data');

  async loadDoctors(): Promise<DoctorData[]> {
    this.logger.log('Loading doctors data from JSON...');
    const filePath = join(this.dataPath, 'doctors.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const doctors = JSON.parse(fileContent) as DoctorData[];
    this.logger.log(`Loaded ${doctors.length} doctors`);
    return doctors;
  }

  async loadTreatments(): Promise<DoctorTreatmentsData[]> {
    this.logger.log('Loading treatments data from JSON...');
    const filePath = join(this.dataPath, 'treatments.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const treatments = JSON.parse(fileContent) as DoctorTreatmentsData[];
    this.logger.log(`Loaded treatments for ${treatments.length} doctors`);
    return treatments;
  }

  async loadAvailability(): Promise<DoctorAvailabilityData[]> {
    this.logger.log('Loading availability data from JSON...');
    const filePath = join(this.dataPath, 'availability.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const availability = JSON.parse(fileContent) as DoctorAvailabilityData[];
    this.logger.log(`Loaded availability for ${availability.length} doctors`);
    return availability;
  }
}
