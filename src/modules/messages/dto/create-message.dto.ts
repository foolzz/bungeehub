import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  hubId?: string;

  @ApiPropertyOptional({ example: 'Hub Application Question' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'I have a question about your hub application...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
