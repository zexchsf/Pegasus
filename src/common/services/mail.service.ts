import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(email: string, first_name: string, token: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Email Veriication',
        template: 'email_verification',
        context: {
          url: `https://pegasus.com/verify/${token}`,
          name: first_name,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(error);
      return { success: false };
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
   try {
       await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset',
        template: 'password_reset',
        context: {
          email,
          token
        },
      });

      return { success: true };

   } catch (error) {
      this.logger.error(error);
      return { success: false };

   } 
  }
}
