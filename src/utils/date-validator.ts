import { UnprocessableEntityException } from '@nestjs/common';
import {
  addYears,
  isAfter,
  isBefore,
  isValid,
  parse,
  subYears,
} from 'date-fns';

export function validateBirth(
  dateBirth: string,
  eighteenthBirthdayValidation: boolean,
) {
  const parsedDate = parse(dateBirth, 'yyyy-MM-dd', new Date());

  if (!isValid(parsedDate)) {
    throw new UnprocessableEntityException('Invalid Date birth format');
  }

  const now = new Date();

  if (isAfter(parsedDate, now)) {
    throw new UnprocessableEntityException('Date is in the future');
  }

  const oldestAllowedDate = subYears(now, 110);
  if (isBefore(parsedDate, oldestAllowedDate)) {
    throw new UnprocessableEntityException('Date is too far in the past');
  }
  if (eighteenthBirthdayValidation) {
    const eighteenthBirthday = addYears(parsedDate, 18);
    if (!isAfter(now, eighteenthBirthday)) {
      throw new UnprocessableEntityException('Must be at least 18 years old');
    }
  }

  return;
}
