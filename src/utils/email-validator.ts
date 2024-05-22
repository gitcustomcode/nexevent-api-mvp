export function validateEmail(email: string) {
  // Expressão regular para validar o formato do email
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
