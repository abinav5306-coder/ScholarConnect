/**
 * Front-end URL Validator for Portfolio & Social Links
 */
export function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return true;
  const trimmed = string.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

