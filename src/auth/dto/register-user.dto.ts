import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsPhoneNumber,
  IsString,
  Validate,
} from 'class-validator';
import { IsValidAge } from '../../common/validators/age.validator';
import { Transform } from 'class-transformer';

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @IsDate()
  @ApiProperty({
    default: 'MM-DD-YYYY',
  })
  @Validate(IsValidAge, [18])
  @Transform(({ value }) => new Date(value))
  date_of_birth: Date;

  @IsString()
  @IsPhoneNumber('NG')
  @ApiProperty({
    default: '+2348012345678',
  })
  mobile_number: string;

  @IsString()
  @ApiProperty({ type: 'string' })
  first_name: string;

  @IsString()
  @ApiProperty({ type: 'string' })
  last_name: string;

  @IsString()
  @ApiProperty({ type: 'string' })
  middle_name: string;
}
