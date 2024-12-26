import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ required: true, example: "kjfaho3osouo3iks0ojw" })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ required: true, example: 'new_pasword' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
