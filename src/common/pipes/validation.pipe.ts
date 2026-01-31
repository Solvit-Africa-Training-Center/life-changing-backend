import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]) {
    return errors.reduce((acc, err) => {
      if (err.children && err.children.length > 0) {
        // Handle nested objects
        err.children.forEach((childErr: any) => {
          childErr.children?.forEach((nestedErr: any) => {
            acc[nestedErr.property] = Object.values(nestedErr.constraints || {});
          });
        });
      } else {
        acc[err.property] = Object.values(err.constraints || {});
      }
      return acc;
    }, {});
  }
}
