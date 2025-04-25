import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumberValue = (value: any) => {
  // Return as is if not a valid number
  if (value === null || value === undefined || isNaN(parseFloat(value))) {
    return value;
  }

  const numValue = parseFloat(value);

  // If it's a whole number (no decimals), return without decimal point
  if (Number.isInteger(numValue)) {
    return numValue.toString();
  }

  // If it has decimal places, format to 2 decimal places
  return numValue.toFixed(2);
};
