/**
 * Business Entity Profile utilities
 * Handles optional field validation and clean display formatting.
 * Treats empty strings, "0", "-", and similar placeholders as non-rendered values.
 */

export const hasValidProfileValue = (val?: string | null): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed !== '' &&
    trimmed !== '0' &&
    trimmed !== '-' &&
    trimmed !== '00' &&
    trimmed !== '--' &&
    trimmed.toLowerCase() !== 'n/a' &&
    trimmed.toLowerCase() !== 'null' &&
    trimmed.toLowerCase() !== 'undefined'
  );
};

export const getCleanProfileValue = (val?: string | null): string | undefined => {
  return hasValidProfileValue(val) ? val!.trim() : undefined;
};
