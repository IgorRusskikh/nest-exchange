import { ValidateFunction } from 'ajv';
import ajv from 'src/utils/ajv-instance.util';

export function createValidator<T>(schema: object): ValidateFunction<T> {
  return ajv.compile<T>(schema);
}
