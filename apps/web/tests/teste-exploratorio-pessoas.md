# 🧪 Relatório de Teste Exploratório — Módulo Pessoas (`MOD-PESSOAS`)

| Informação             | Valor                                         |
| ---------------------- | --------------------------------------------- |
| **Task**               | `FA-9` — Teste Exploratório no módulo Pessoas |
| **Testador**           | alosnosales                                   |
| **Data de Execução**   | 22 de julho de 2026                           |
| **Ambiente**           | Web (localhost / desenvolvimento)             |
| **Base de Requisitos** | `docs/requirements/mod-01-pessoas.md`         |

---

## 📊 Resumo Geral

| Métrica           | Quantidade |
| :---------------- | :--------: |
| Total de cenários |     30     |
| ✅ Aprovados      |     21     |
| ❌ Reprovados     |     6      |
| ⏭️ Não executados |     3      |

### Visão por Charter

| Charter | Tema                                    | ✅  | ❌  | ⏭️  |
| ------- | --------------------------------------- | :-: | :-: | :-: |
| 1       | Validação Fiscal (CPF / CNPJ)           |  5  |  0  |  0  |
| 2       | Casos de Borda e Injeção                |  2  |  3  |  0  |
| 3       | Integração ViaCEP e Endereço            |  4  |  1  |  0  |
| 4       | Segurança de API e Unicidade            |  1  |  1  |  3  |
| 5       | Integridade Referencial e Ciclo de Vida |  4  |  0  |  0  |
| 6       | Usabilidade da Tabela e Filtros         |  4  |  0  |  0  |
| 7       | Concorrência e Resiliência              |  1  |  1  |  0  |

---

## 📋 Resultados Detalhados

---

### Charter 1: Validação de Identificação Fiscal (CPF / CNPJ)

> Regras: `RN-PESSOA-01`, `RN-PESSOA-02` · Requisito: `RF-PESSOA-02`

|   ID    | Cenário                                           |  Resultado  | Observação                                                            |
| :-----: | ------------------------------------------------- | :---------: | --------------------------------------------------------------------- |
| TC-01.1 | CPF com dígitos repetidos (`111.111.111-11`)      | ✅ Aprovado | O sistema bloqueou a gravação e exibiu "CPF inválido".                |
| TC-01.2 | CNPJ com dígitos repetidos (`00.000.000/0000-00`) | ✅ Aprovado | Bloqueio imediato com mensagem "CNPJ inválido".                       |
| TC-01.3 | Dígito verificador incorreto                      | ✅ Aprovado | Campo destacado com erro de validação; gravação impedida.             |
| TC-01.4 | Troca dinâmica de tipo (PJ → PF)                  | ✅ Aprovado | O formulário ocultou os campos de PJ ao trocar para PF.               |
| TC-01.5 | Caracteres não numéricos no CPF/CNPJ              | ✅ Aprovado | A máscara (`IMaskInput`) filtrou corretamente caracteres alfabéticos. |

---

### Charter 2: Casos de Borda, Limites e Injeção de Dados

|   ID    | Cenário                                                |    Resultado     | Observação                                                                                                                                                                                                                                                               |
| :-----: | ------------------------------------------------------ | :--------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-02.1 | Data de Nascimento no futuro (`01/01/2099`)            | ❌ **Reprovado** | **O sistema aceitou a data `01/01/2099` sem nenhum bloqueio.** Não há validação de intervalo no schema Zod — qualquer data, incluindo datas futuras, é aceita e persistida no banco de dados.                                                                            |
| TC-02.2 | Injeção XSS / HTML nos campos de texto                 |   ✅ Aprovado    | Ao tentar salvar conteúdo com tags `<script>`, o sistema retornou _"Verifique os campos destacados"_ e impediu a gravação. O conteúdo malicioso não foi persistido.                                                                                                      |
| TC-02.3 | Nomes e campos extremamente longos (4.000+ caracteres) | ❌ **Reprovado** | **O sistema aceitou e salvou valores com mais de 4.000 caracteres nos campos `Nome`, `E-mail` e `Logradouro`** sem qualquer validação de tamanho máximo. Isso pode causar quebra de layout nas telas de listagem e detalhes, além de consumo excessivo de armazenamento. |
| TC-02.4 | Inscrição Estadual com caracteres alfanuméricos        |   ✅ Aprovado    | O campo aceitou formatos válidos sem rejeição indevida.                                                                                                                                                                                                                  |
| TC-02.5 | Espaços em branco nas extremidades (trim)              | ❌ **Reprovado** | **A operação resultou em erro, porém a mensagem exibida ao usuário não é específica** — não indica qual campo causou o problema nem orienta a correção. O sistema não aplica `trim()` antes de validar/salvar.                                                           |

---

### Charter 3: Integração de Endereço via ViaCEP

|   ID    | Cenário                                |    Resultado     | Observação                                                                                                                                                                                          |
| :-----: | -------------------------------------- | :--------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-03.1 | CEP válido e autopreenchimento         |   ✅ Aprovado    | Ao informar um CEP válido e desfocar o campo, os campos Logradouro, Bairro, Município e UF foram preenchidos automaticamente.                                                                       |
| TC-03.2 | CEP inexistente (`99999-999`)          |   ✅ Aprovado    | Exibiu toast _"CEP não encontrado"_ e manteve os campos de endereço editáveis para preenchimento manual.                                                                                            |
| TC-03.3 | Falha / offline na API do ViaCEP       |   ✅ Aprovado    | Exibiu mensagem _"Não foi possível buscar o endereço pelo CEP"_ e manteve a edição manual ativa.                                                                                                    |
| TC-03.4 | Preenchimento parcial do endereço      |   ✅ Aprovado    | Ao preencher apenas `Número` sem os campos obrigatórios do grupo, o endereço foi descartado conforme comportamento esperado da regra `addressStarted`.                                              |
| TC-03.5 | Alteração manual pós autopreenchimento | ❌ **Reprovado** | **Ao alterar manualmente o Logradouro após o autopreenchimento pelo CEP, o sistema retornou um erro genérico** sem especificar a causa. Não ficou claro se a edição manual foi aceita ou rejeitada. |

---

### Charter 4: Segurança da API, Unicidade e Imutabilidade

|   ID    | Cenário                                        |    Resultado     | Observação                                                                                                                                                                                                                                                                                                   |
| :-----: | ---------------------------------------------- | :--------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-04.1 | Bypass de imutabilidade na edição (PUT API)    | ⏭️ Não executado | Teste requer ferramenta de requisição HTTP direta (Postman/cURL).                                                                                                                                                                                                                                            |
| TC-04.2 | Duplicidade de Documento (`taxId`)             | ❌ **Reprovado** | **Ao cadastrar uma pessoa com CPF já existente, o sistema retornou um erro genérico.** A mensagem esperada _"Este valor já está em uso"_ não foi exibida no campo `Documento`. O tratamento de unicidade (`uniqueConstraintErrors`) não está mapeando corretamente o campo `taxId` para feedback ao usuário. |
| TC-04.3 | Duplicidade de E-mail, RG e Inscrição Estadual |   ✅ Aprovado    | Ao tentar cadastrar campos únicos duplicados, o sistema impediu a gravação com destaque no campo correspondente.                                                                                                                                                                                             |
| TC-04.4 | Acesso sem autenticação / sessão expirada      | ⏭️ Não executado | Teste requer chamada HTTP direta sem cookie de sessão.                                                                                                                                                                                                                                                       |
| TC-04.5 | Injeção de parâmetros na query string          | ⏭️ Não executado | Teste requer chamada HTTP direta com payloads na URL.                                                                                                                                                                                                                                                        |

---

### Charter 5: Integridade Referencial e Ciclo de Vida

> Regras: `RN-PESSOA-03` · Requisitos: `RF-PESSOA-05`, `RF-PESSOA-06`

|   ID    | Cenário                                      |  Resultado  | Observação                                                                            |
| :-----: | -------------------------------------------- | :---------: | ------------------------------------------------------------------------------------- |
| TC-05.1 | Exclusão de pessoa sem registros vinculados  | ✅ Aprovado | Registro excluído com sucesso e mensagem _"Registro excluído com sucesso!"_ exibida.  |
| TC-05.2 | Exclusão de pessoa com propriedade vinculada | ✅ Aprovado | Exclusão impedida com mensagem informando que o registro possui vínculo.              |
| TC-05.3 | Desativar pessoa ativa                       | ✅ Aprovado | Status alterado para `Inativo` e pessoa ocultada da listagem padrão (filtro "Ativo"). |
| TC-05.4 | Reativar pessoa inativa                      | ✅ Aprovado | Status retornou para `Ativo` e pessoa voltou a aparecer na listagem padrão.           |

---

### Charter 6: Usabilidade da Tabela, Filtros e Navegação

> Requisito: `RF-PESSOA-01`

|   ID    | Cenário                             |  Resultado  | Observação                                                                              |
| :-----: | ----------------------------------- | :---------: | --------------------------------------------------------------------------------------- |
| TC-06.1 | Busca combinada (Nome e Documento)  | ✅ Aprovado | A busca filtrou corretamente por fragmento de nome e por números do documento.          |
| TC-06.2 | Controle de visibilidade de colunas | ✅ Aprovado | Colunas `E-mail` e `Telefone` foram exibidas/ocultadas corretamente via menu "Colunas". |
| TC-06.3 | Paginação com filtros aplicados     | ✅ Aprovado | Ao aplicar filtro estando na página 2, a paginação resetou para a página 1.             |
| TC-06.4 | Estado de lista vazia               | ✅ Aprovado | Mensagem _"Nenhum registro encontrado."_ exibida com ícone explicativo.                 |

---

### Charter 7: Concorrência, Rede e Resiliência

|   ID    | Cenário                                   |    Resultado     | Observação                                                                                                                                                                                                                                                                                                                                      |
| :-----: | ----------------------------------------- | :--------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-07.1 | Submissão rápida / multi-clique no Salvar | ❌ **Reprovado** | **O sistema criou a requisição corretamente na primeira tentativa, porém o botão "Salvar" não foi desabilitado durante o envio.** Cliques subsequentes geraram múltiplas requisições ao backend, resultando em mensagens de erro repetidas na tela. O flag `isSubmitting` do `react-hook-form` não está bloqueando o botão visualmente a tempo. |
| TC-07.2 | Navegação rápida (unmount de componente)  |   ✅ Aprovado    | Ao navegar para fora durante uma requisição, não houve warnings de memory leak no console.                                                                                                                                                                                                                                                      |

---

## 🐛 Bugs Encontrados — Resumo Consolidado

### Bug 1 — Data de Nascimento aceita datas no futuro

- **Cenário:** `TC-02.1`
- **Severidade:** Média
- **Descrição:** O campo `Data de Nascimento` aceita qualquer data, incluindo datas futuras como `01/01/2099`. Não existe validação de intervalo no schema de validação Zod (frontend nem backend).
- **Impacto:** Permite cadastrar pessoas físicas com datas de nascimento impossíveis, comprometendo a integridade dos dados.
- **Sugestão de Correção:** Adicionar validação no schema Zod (tanto em `schema.ts` quanto em `schemas.ts`) para rejeitar datas futuras e datas anteriores a um limite razoável (ex: 150 anos atrás).

---

### Bug 2 — Campos de texto sem limite de tamanho

- **Cenário:** `TC-02.3`
- **Severidade:** Média
- **Descrição:** Os campos `Nome`, `E-mail` e `Logradouro` aceitam e salvam valores com mais de 4.000 caracteres sem nenhuma restrição de tamanho máximo.
- **Impacto:** Pode causar quebra visual nas telas de listagem e detalhes, além de consumo desnecessário de armazenamento no banco de dados.
- **Sugestão de Correção:** Adicionar `.max(255)` (ou valor adequado) nos campos `string()` do schema Zod e nos atributos HTML dos inputs.

---

### Bug 3 — Espaços em branco geram erro sem mensagem específica

- **Cenário:** `TC-02.5`
- **Severidade:** Baixa
- **Descrição:** Ao inserir valores com espaços em branco nas extremidades (ex: `"  João da Silva  "`), o sistema retorna um erro genérico sem indicar qual campo causou o problema.
- **Impacto:** O usuário não sabe o que corrigir. Além disso, a ausência de `trim()` pode causar problemas de busca e unicidade.
- **Sugestão de Correção:** Aplicar `.trim()` nos campos de texto do schema Zod para sanitizar automaticamente antes de validar e persistir.

---

### Bug 4 — Erro genérico ao editar endereço pós autopreenchimento

- **Cenário:** `TC-03.5`
- **Severidade:** Baixa
- **Descrição:** Após o autopreenchimento pelo CEP via ViaCEP, ao alterar manualmente o campo `Logradouro` e tentar salvar, o sistema retorna um erro sem mensagem específica.
- **Impacto:** O usuário não consegue identificar a causa do erro nem sabe se a alteração manual é permitida.
- **Sugestão de Correção:** Investigar a causa raiz do erro (possível conflito de estado no `react-hook-form` após `setValue` do autopreenchimento) e garantir mensagem de erro descritiva.

---

### Bug 5 — Duplicidade de CPF/CNPJ retorna erro sem mensagem adequada

- **Cenário:** `TC-04.2`
- **Severidade:** Alta
- **Descrição:** Ao tentar cadastrar uma pessoa com CPF/CNPJ já existente no banco de dados, o sistema retorna um erro genérico em vez de destacar o campo `Documento` com a mensagem esperada _"Este valor já está em uso"_.
- **Impacto:** O usuário não entende que o documento é duplicado e não consegue resolver o problema sozinho. Viola a `RN-PESSOA-02` que exige feedback claro sobre duplicidade.
- **Sugestão de Correção:** Verificar o mapeamento de campos no `uniqueConstraintErrors` (arquivo `dbErrors.ts`) para garantir que a constraint `tax_id` retorne o erro localizado no campo correto do formulário.

---

### Bug 6 — Botão "Salvar" não é desabilitado durante submissão

- **Cenário:** `TC-07.1`
- **Severidade:** Alta
- **Descrição:** Ao clicar múltiplas vezes rapidamente no botão "Salvar", o botão não é desabilitado visualmente durante o processamento da requisição. Isso resulta em múltiplas chamadas ao backend e erros repetidos na interface.
- **Impacto:** Pode causar criação de registros duplicados no banco de dados por race condition, além de degradar a experiência do usuário com múltiplas mensagens de erro.
- **Sugestão de Correção:** Garantir que o atributo `disabled={isSubmitting}` do botão esteja efetivamente reagindo ao estado do `react-hook-form`. Verificar se o `handleSubmit` está bloqueando reentradas corretamente.

---

## ✅ Conclusão

O módulo de Cadastro de Pessoas apresenta boa cobertura funcional para os fluxos principais (CRUD, ativação/desativação, busca e filtros). As validações de CPF/CNPJ estão corretas e a integração com ViaCEP funciona adequadamente nos cenários normais.

Foram identificados **6 bugs**, sendo **2 de severidade alta** (duplicidade de documento sem feedback e multi-clique no salvar), **2 de severidade média** (data futura e campos sem limite) e **2 de severidade baixa** (trim e erro genérico no endereço). Recomenda-se a correção prioritária dos bugs de severidade alta antes do deploy em produção.

Os 3 cenários não executados (`TC-04.1`, `TC-04.4`, `TC-04.5`) dependem de ferramentas de requisição HTTP direta e devem ser testados em uma sessão complementar.
