export function validateCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const calcCheckDigit = (cpf, factor) => {
    let total = 0;
    for (let i = 0; i < factor - 1; i++) {
      total += cpf[i] * (factor - i);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstCheckDigit = calcCheckDigit(cpf, 10);
  const secondCheckDigit = calcCheckDigit(cpf, 11);

  return (
    firstCheckDigit === parseInt(cpf[9], 10) &&
    secondCheckDigit === parseInt(cpf[10], 10)
  );
}
