import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export async function validateBody<T extends object>(
  body: any,
  dtoClass: new () => T,
): Promise<T> {
  const instance = plainToInstance(dtoClass, body);
  const errors = await validate(instance);
  if (errors.length > 0) {
    const message = errors
      .map((e) => Object.values(e.constraints || {}))
      .flat()
      .join('; ');
    throw { status: 422, message };
  }
  return instance;
}