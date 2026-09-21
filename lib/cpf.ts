export function validarCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcDigit = (base: string, factorStart: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += parseInt(base[i], 10) * (factorStart - i);
    }
    const resto = (total * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcDigit(digits.slice(0, 9), 10);
  const digito2 = calcDigit(digits.slice(0, 10), 11);

  return digito1 === parseInt(digits[9], 10) && digito2 === parseInt(digits[10], 10);
}

export function validarCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += parseInt(base[i], 10) * weights[i];
    }
    const resto = total % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const digito2 = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digito1 === parseInt(digits[12], 10) && digito2 === parseInt(digits[13], 10);
}
