import {
  isDefined,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'

export function IsGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'IsGreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          const relatedValue = args.object[relatedPropertyName]
          return relatedValue ? value > relatedValue : isDefined(value)
        },
        defaultMessage(args?: ValidationArguments): string {
          return `"${propertyName}" must be greater than ${JSON.stringify(
            args?.constraints[0],
          )}`
        },
      },
    })
  }
}
