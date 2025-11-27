import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { Doctor, DoctorAvailability, Treatment } from '../generated/client';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(private readonly database: DatabaseService) {}

  async searchDoctors(searchDto: SearchDoctorsDto) {
    this.logger.log(
      `Searching doctors with filters: ${JSON.stringify(searchDto)}`,
    );

    const where: any = {};

    if (searchDto.specialty) {
      where.specialty = {
        contains: searchDto.specialty,
        mode: 'insensitive',
      };
    }

    if (searchDto.city) {
      where.city = {
        contains: searchDto.city,
        mode: 'insensitive',
      };
    }

    const doctors = await this.database.doctor.findMany({
      where,
      include: {
        availability: {
          where: {
            startAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            startAt: 'asc',
          },
        },
        treatments: {
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    this.logger.log(`Found ${doctors.length} doctors`);
    return doctors;
  }

  async getDoctorById(id: bigint): Promise<Doctor | null> {
    this.logger.log(`Getting doctor with id: ${id}`);
    return this.database.doctor.findUnique({
      where: { id },
    });
  }

  async getDoctorAvailability(doctorId: bigint): Promise<DoctorAvailability[]> {
    this.logger.log(`Getting availability for doctor: ${doctorId}`);

    const availability = await this.database.doctorAvailability.findMany({
      where: {
        doctorId,
        startAt: {
          gte: new Date(), // Solo horarios futuros
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    this.logger.log(`Found ${availability.length} availability slots`);
    return availability;
  }

  async getDoctorTreatments(doctorId: bigint): Promise<Treatment[]> {
    this.logger.log(`Getting treatments for doctor: ${doctorId}`);

    const treatments = await this.database.treatment.findMany({
      where: {
        doctorId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    this.logger.log(`Found ${treatments.length} treatments`);
    return treatments;
  }

  async getDoctorWithDetails(doctorId: bigint) {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor) {
      return null;
    }

    const [availability, treatments] = await Promise.all([
      this.getDoctorAvailability(doctorId),
      this.getDoctorTreatments(doctorId),
    ]);

    return {
      ...doctor,
      availability,
      treatments,
    };
  }

  async getAvailableSpecialties(): Promise<string[]> {
    this.logger.log('Getting available specialties');
    const doctors = await this.database.doctor.findMany({
      select: {
        specialty: true,
      },
      distinct: ['specialty'],
      orderBy: {
        specialty: 'asc',
      },
    });

    const specialties = doctors.map((d) => d.specialty);
    this.logger.log(`Found ${specialties.length} specialties`);
    return specialties;
  }

  async getAvailableCities(): Promise<string[]> {
    this.logger.log('Getting available cities');
    const doctors = await this.database.doctor.findMany({
      select: {
        city: true,
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc',
      },
    });

    const cities = doctors.map((d) => d.city);
    this.logger.log(`Found ${cities.length} cities`);
    return cities;
  }
}
