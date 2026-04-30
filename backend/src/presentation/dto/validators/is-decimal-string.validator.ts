import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export interface DecimalStringOptions {
  /** Maximum total integer digits before the decimal point (default 20). */
  maxIntDigits?: number;
  /** Maximum digits allowed after the decimal point (default 8). */
  maxFractionDigits?: number;
  /** Allow negative numbers (default true). */
  allowNegative?: boolean;
}

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

/**
 * Validates a string holds a finite decimal number with bounded precision.
 *
 * - Rejects scientific notation ("1e6") — required for Prisma `Decimal` parsing.
 * - Money fields use `maxFractionDigits: 2` (Strata convention).
 * - Quantity fields use `maxFractionDigits: 8` (BTC satoshi precision).
 */
export function IsDecimalString(
  options: DecimalStringOptions = {},
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  const {
    maxIntDigits = 20,
    maxFractionDigits = 8,
    allowNegative = true,
  } = options;

  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isDecimalString',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (!DECIMAL_RE.test(value)) return false;
          if (!allowNegative && value.startsWith('-')) return false;
          const unsigned = value.startsWith('-') ? value.slice(1) : value;
          const [intPart, fracPart = ''] = unsigned.split('.');
          if (intPart.length > maxIntDigits) return false;
          if (fracPart.length > maxFractionDigits) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a decimal string with at most ${maxIntDigits} integer digits and ${maxFractionDigits} fractional digits (no scientific notation)`;
        },
      },
    });
  };
}
