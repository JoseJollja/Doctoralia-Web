import { IsOptional, IsDateString, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAppointmentsDto {
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10))
  doctorId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

