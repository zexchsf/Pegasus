import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPinDto {
  @ApiProperty({ example: '1234', description: '4 digits PIN code' })
  @IsString()
  @Length(4)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
