import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current user password',
  })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword456', description: 'New user password' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
