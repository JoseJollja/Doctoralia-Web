import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('doctors')
@Public()
export class DoctorsController {
  private readonly logger = new Logger(DoctorsController.name);

  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('search')
  async searchDoctors(@Query() searchDto: SearchDoctorsDto) {
    this.logger.log(`Search request: ${JSON.stringify(searchDto)}`);
    return this.doctorsService.searchDoctors(searchDto);
  }

  @Get(':id')
  async getDoctorById(@Param('id', ParseIntPipe) id: number) {
    const doctorId = BigInt(id);
    return this.doctorsService.getDoctorById(doctorId);
  }

  @Get(':id/availability')
  async getDoctorAvailability(@Param('id', ParseIntPipe) id: number) {
    const doctorId = BigInt(id);
    return this.doctorsService.getDoctorAvailability(doctorId);
  }

  @Get(':id/treatments')
  async getDoctorTreatments(@Param('id', ParseIntPipe) id: number) {
    const doctorId = BigInt(id);
    return this.doctorsService.getDoctorTreatments(doctorId);
  }

  @Get(':id/details')
  async getDoctorWithDetails(@Param('id', ParseIntPipe) id: number) {
    const doctorId = BigInt(id);
    return this.doctorsService.getDoctorWithDetails(doctorId);
  }

  @Get('specialties/list')
  async getAvailableSpecialties() {
    return this.doctorsService.getAvailableSpecialties();
  }

  @Get('cities/list')
  async getAvailableCities() {
    return this.doctorsService.getAvailableCities();
  }
}

