/**
 * Utility functions for working with Protocol Buffer types
 */

/**
 * Safely convert bigint (protobuf int64) to number
 * @param value - The bigint, number, or undefined value to convert
 * @returns A number, or 0 if undefined
 */
export const toNumber = (value: bigint | number | undefined): number => {
  if (value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  return value;
};

/**
 * Convert bigint to string for display
 * @param value - The bigint, number, or undefined value to convert
 * @returns A string representation
 */
export const toString = (value: bigint | number | string | undefined): string => {
  if (value === undefined) return "0";
  return String(value);
};

/**
 * Safely check if a bigint/number is greater than zero
 * @param value - The value to check
 * @returns true if value > 0
 */
export const isPositive = (value: bigint | number | undefined): boolean => {
  if (value === undefined) return false;
  if (typeof value === "bigint") return value > 0n;
  return value > 0;
};
