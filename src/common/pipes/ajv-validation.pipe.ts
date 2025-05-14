import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ValidateFunction } from 'ajv';

@Injectable()
export class AjvValidationPipe implements PipeTransform {
  constructor(private readonly validate: ValidateFunction) {}

  transform(value: any, metadata: any) {
    if (metadata?.type === 'param') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse string value:', e);
      }
    }

    const valid = this.validate(value);

    if (!valid) {
      const errors = this.validate.errors;
      console.error('Validation errors:', JSON.stringify(errors));
      throw new BadRequestException({
        message: 'Validation error',
        errors: errors?.map((err) => ({
          path: err.instancePath || '/',
          message: err.message,
        })),
      });
    }

    return value;
  }
}
