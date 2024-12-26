import * as crypto from 'crypto';

export function generateRandomDigits(length: number): string {
  return crypto
    .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
    .toString();
}
