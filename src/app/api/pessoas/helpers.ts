type EnderecoData = {
  cep: string;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string;
  uf: string;
  pais: string;
};

/**
 * Monta a instrução de escrita da relação `endereco` de uma Pessoa:
 * cria/atualiza quando há dados de endereço no formulário, remove o
 * endereço órfão quando o formulário deixou os campos em branco e
 * já existia um vinculado, ou não toca na relação quando não há nada
 * a fazer (evita erro do Prisma ao tentar apagar uma relação inexistente).
 */
export function buildEnderecoWrite(enderecoData: EnderecoData | null, currentEnderecoId: number | null) {
  if (enderecoData) {
    return { endereco: { upsert: { create: enderecoData, update: enderecoData } } };
  }

  if (currentEnderecoId) {
    return { endereco: { delete: true } };
  }

  return {};
}
