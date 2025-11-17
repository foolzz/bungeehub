import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Operating hours (e.g., "9:00 AM - 6:00 PM")',
    example: '9:00 AM - 6:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiProperty({
    description: 'Available days of the week',
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @ApiProperty({
    description: 'Preferred delivery time window',
    example: '10:00 AM - 4:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  preferredDeliveryTime?: string;
}
