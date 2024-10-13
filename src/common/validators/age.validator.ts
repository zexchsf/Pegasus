import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidAge', async: false })
export class IsValidAge implements ValidatorConstraintInterface {
  validate(age: string, args: ValidationArguments) {
    const minAge = args.constraints[0]; // Minimum age constraint
    const now = new Date().toDateString();
    const diff = Date.parse(now) - Date.parse(age);
    const diffYear = new Date(diff).getUTCFullYear();
    return diffYear >= minAge;
  }

  defaultMessage(args: ValidationArguments) {
    const minAge = args.constraints[0]; // Minimum age constraint
    return `Age must be greater than or equal to ${minAge}.`;
  }
}
