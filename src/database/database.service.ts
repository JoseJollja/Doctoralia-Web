import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    this.logger.log('Cleaning database...');

    // Delete in reverse order of dependencies
    await this.$executeRawUnsafe('TRUNCATE TABLE clinic.appointments CASCADE');
    await this.$executeRawUnsafe('TRUNCATE TABLE clinic.patients CASCADE');
    await this.$executeRawUnsafe(
      'TRUNCATE TABLE clinic.doctor_availability CASCADE',
    );
    await this.$executeRawUnsafe('TRUNCATE TABLE clinic.treatments CASCADE');
    await this.$executeRawUnsafe('TRUNCATE TABLE clinic.doctors CASCADE');

    // Reset sequences
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE clinic.appointments_id_seq RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE clinic.patients_id_seq RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE clinic.doctor_availability_id_seq RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE clinic.treatments_id_seq RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE clinic.doctors_id_seq RESTART WITH 1',
    );

    this.logger.log('Database cleaned successfully');
  }
}
