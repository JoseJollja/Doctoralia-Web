import { IsString, IsOptional } from 'class-validator';

export class SearchDoctorsDto {
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

