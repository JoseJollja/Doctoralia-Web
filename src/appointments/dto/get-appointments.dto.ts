import { IsOptional, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAppointmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  doctorId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
