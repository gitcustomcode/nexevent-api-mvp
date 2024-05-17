export function createDateExpiration(date) {
  return new Date(date.getTime() + 120 * 60000);
}
