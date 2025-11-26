import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async getAppointments(@Query() filters: GetAppointmentsDto) {
    this.logger.log(`Get appointments request: ${JSON.stringify(filters)}`);
    return this.appointmentsService.getAppointments(filters);
  }

  @Get('calendar')
  async getAppointmentsCalendar(@Query() filters: GetAppointmentsDto) {
    this.logger.log(`Calendar request: ${JSON.stringify(filters)}`);
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;
    return this.appointmentsService.getAppointmentsCalendar(start, end);
  }

  @Get('doctor/:doctorId')
  async getAppointmentsByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
  ) {
    const id = BigInt(doctorId);
    return this.appointmentsService.getAppointmentsByDoctor(id);
  }
}
