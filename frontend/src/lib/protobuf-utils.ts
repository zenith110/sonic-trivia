/**
 * Utility functions for working with Protocol Buffer types
 */

/**
 * Safely convert bigint (protobuf int64) to number
 * @param value - The bigint, number, or undefined value to convert
 * @returns A number, or 0 if undefined
 */
export const toNumber = (value: bigint | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
};

/**
 * Convert bigint to string for display
 * @param value - The bigint, number, or undefined value to convert
 * @returns A string representation
 */
export const toString = (
  value: bigint | number | string | undefined | null,
): string => {
  if (value === undefined || value === null) return "0";
  return String(value);
};

/**
 * Safely check if a bigint/number is greater than zero
 * @param value - The value to check
 * @returns true if value > 0
 */
export const isPositive = (
  value: bigint | number | undefined | null,
): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "bigint") return value > 0n;
  if (typeof value === "number") return value > 0;
  return false;
};
