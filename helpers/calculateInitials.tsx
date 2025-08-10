/**
 * Calculates the initials from a user's display name.
 *
 * @param name The full name string.
 * @returns A string containing the initials, typically 1 or 2 characters. Returns an empty string for invalid input.
 *
 * @example
 * calculateInitials("John Doe") // "JD"
 * calculateInitials("Cher") // "C"
 * calculateInitials(" john fitzgerald kennedy ") // "JK"
 * calculateInitials(null) // ""
 * calculateInitials("") // ""
 */
export const calculateInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return '';
  }

  const cleanedName = name.trim();
  // Split by one or more whitespace characters
  const nameParts = cleanedName.split(/\s+/);

  if (nameParts.length === 1) {
    // For a single name, return the first character.
    return nameParts[0].charAt(0).toUpperCase();
  }

  if (nameParts.length > 1) {
    // For multiple names, use the first character of the first and last parts.
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  // This case should theoretically not be reached due to the initial check,
  // but it's here as a fallback.
  return '';
};