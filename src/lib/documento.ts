export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = 11 - (sum % 11);
  const d1 = rest >= 10 ? 0 : rest;
  if (d1 !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = 11 - (sum % 11);
  const d2 = rest >= 10 ? 0 : rest;
  if (d2 !== parseInt(cpf[10])) return false;

  return true;
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = value.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((acc, digit, i) => acc + parseInt(digit) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(cnpj.slice(0, 12), weights1);
  if (d1 !== parseInt(cnpj[12])) return false;

  const d2 = calcDigit(cnpj.slice(0, 12) + d1, weights2);
  if (d2 !== parseInt(cnpj[13])) return false;

  return true;
}

export function isValidDocumento(tipo: string, value: string): boolean {
  return tipo === "FISICA" ? isValidCPF(value) : isValidCNPJ(value);
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatDocumento(tipo: string, value: string): string {
  return tipo === "FISICA" ? formatCPF(value) : formatCNPJ(value);
}
