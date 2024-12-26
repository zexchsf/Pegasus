import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateLoginAttemptDto {
  @IsString()
  @ApiProperty()
  ip_address: string;

  @IsString()
  @ApiProperty()
  user_agent: string;

  @IsBoolean()
  @ApiProperty()
  success: boolean;

  @IsString()
  @ApiProperty()
  user_id: string;
}
