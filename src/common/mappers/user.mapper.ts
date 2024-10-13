import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UserMapper {
  public toPublicData(user: User) {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      middeName: user.middle_name,
      email: user.email,
      verified: user.verified,
    };
  }
}
