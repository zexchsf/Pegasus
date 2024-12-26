
import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponse<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ required: false, description: 'Optional data returned by the operation' })
  data?: T;

  constructor(message: string, data?: T) {
    this.success = true;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}
