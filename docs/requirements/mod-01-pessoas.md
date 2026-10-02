# 📦 Módulo: `MOD-PESSOAS`

Módulo responsável pelo gerenciamento de pessoas físicas e jurídicas. O módulo deve possibilitar consulta, criação, atualização, ativação/desativação e exclusão de registros de pessoas.

Uma pessoa pode ser titular de uma propriedade, vendedora de animais em uma compra, veterinária responsável por um procedimento sanitário, entre outros papéis que venham a existir no sistema, como fornecedores, transportadores e compradores.

Toda pessoa é do tipo Física ou Jurídica. A maioria dos campos é comum aos dois tipos; alguns (Nome Fantasia, Inscrição Estadual, RG, Data de Nascimento, Estado Civil) só se aplicam a um tipo específico, conforme indicado no dicionário de dados conceitual abaixo.

## Dicionário de dados conceitual

| Campo                | Descrição                                                           | Tipo       | Obrig. | Restrições                                                                           |
| -------------------- | ------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------ |
| `Tipo`               | Natureza da pessoa                                                  | Enum       | Sim    | `Física` ou `Jurídica`; imutável após o cadastro (`RN-PESSOA-02`)                    |
| `Documento`          | CPF para pessoa física e CNPJ para pessoa jurídica                  | Texto      | Sim    | Único; imutável; dígitos verificadores válidos (`RN-PESSOA-01`, `RN-PESSOA-02`)      |
| `Nome`               | Nome completo para pessoa física, razão social para pessoa jurídica | Texto      | Sim    | Até 100 caracteres                                                                   |
| `Telefone`           | Telefone principal, fixo ou celular                                 | Texto      | Não    | Com DDD                                                                              |
| `Email`              | E-mail principal                                                    | Texto      | Não    | Formato válido; até 255 caracteres                                                   |
| `Endereço`           | Endereço da pessoa                                                  | Referência | Não    | Ver [Endereço](comum.md#endereço)                                                    |
| `Nome Fantasia`      | Nome comercial. Apenas para pessoa jurídica                         | Texto      | Não    | Até 200 caracteres                                                                   |
| `Inscrição Estadual` | Inscrição estadual. Apenas para pessoa jurídica                     | Texto      | Não    | Até 20 caracteres                                                                    |
| `RG`                 | Registro geral. Apenas para pessoa física                           | Texto      | Não    | Até 20 caracteres                                                                    |
| `Data de Nascimento` | Data de nascimento. Apenas para pessoa física                       | Data       | Não    | —                                                                                    |
| `Estado Civil`       | Estado civil. Apenas para pessoa física                             | Enum       | Não    | Solteiro, Casado, União Estável, Divorciado ou Viúvo                                 |
| `Status`             | Situação do cadastro                                                | Enum       | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)) |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-PESSOA-01` - Legitimidade de Identificação Fiscal:** Todo CPF ou CNPJ deve ser válido segundo as regras de dígitos verificadores da Receita Federal do Brasil.
- **`RN-PESSOA-02` - Documento como Identidade Legal:** O CPF/CNPJ é o identificador único da pessoa física/jurídica; duas pessoas não podem existir com o mesmo documento. Por identificar a pessoa, o tipo e o documento não mudam depois do cadastro.
- **`RN-PESSOA-03` - Multiplicidade de Papéis:** Uma mesma pessoa (física ou jurídica) pode atuar simultaneamente em diferentes papéis de negócio (ex: um mesmo parceiro comercial pode ser, ao mesmo tempo, fornecedor e comprador).

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-PESSOA-01`: Listagem de Pessoas

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as pessoas físicas e jurídicas cadastradas, com busca, filtros e acesso às ações disponíveis para cada registro.

|                       |                                                                                                                                                                                         |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar a lista de pessoas cadastradas** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                                                       |
| **Regras Vinculadas** | —                                                                                                                                                                                       |
| **Atores**            | Administrador, Gerente                                                                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                                                     |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] Deve permitir exibir as colunas `Documento`, `Nome`, `Telefone`, `Email`, `Status` e `Atualizado em`.
- [ ] O `Tipo` de cada pessoa deve ser identificável na listagem.
- [ ] `Documento` é sempre visível; `Telefone` e `Email` iniciam ocultos.
- [ ] A ordenação inicial é por `Atualizado em`, do mais recente para o mais antigo.
- [ ] A pesquisa deve considerar `Documento` e `Nome`.
- [ ] Os filtros disponíveis são: ativas, inativas, físicas, jurídicas e todas. O filtro inicial é "ativas".
- [ ] As ações disponíveis para cada pessoa são: Editar (`RF-PESSOA-03`), Detalhes (`RF-PESSOA-04`) e Ativar/Desativar (`RF-PESSOA-06`).
- [ ] Deve permitir acionar a criação de uma nova pessoa (`RF-PESSOA-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de pessoas.
2. O sistema exibe as pessoas conforme o filtro e a ordenação iniciais, de forma paginada.
3. O usuário localiza a pessoa desejada, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a pessoa.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as pessoas que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa sem resultados (passo A1.2):**
  1. Nenhuma pessoa corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A4 – Nova pessoa (passo 3):**
  1. O usuário aciona a criação de uma nova pessoa.
  2. O fluxo continua em `RF-PESSOA-02`.

</div>

## 2.2 - `RF-PESSOA-02`: Criar Pessoa

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar pessoas físicas ou jurídicas, registrando novos agentes que interagem com as atividades do negócio.

|                       |                                                                                                                                                                                                                     |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cadastrar uma pessoa física ou jurídica** no sistema para que ela possa exercer papéis no negócio, como titular de propriedade, vendedora de animais ou veterinária. |
| **Dependências**      | —                                                                                                                                                                                                                   |
| **Regras Vinculadas** | `RN-PESSOA-01`, `RN-PESSOA-02`                                                                                                                                                                                      |
| **Atores**            | Administrador, Gerente                                                                                                                                                                                              |
| **Plataformas**       | Web                                                                                                                                                                                                                 |

### 2.2.2 - Critérios de Aceitação

- [x] Os campos `Tipo`, `Documento` e `Nome` são obrigatórios. O `Tipo` inicia como pessoa física.
- [ ] O `Documento` é único entre as pessoas cadastradas (`RN-PESSOA-02`). `Inscrição Estadual`, `Email` e `RG` podem se repetir.
- [x] O `Documento` deve ser validado de acordo com o `Tipo` (CPF ou CNPJ) (`RN-PESSOA-01`).
- [x] O `Email`, quando informado, deve ter formato válido.
- [x] Devem ser solicitados apenas os campos que se aplicam ao `Tipo` escolhido: `Nome Fantasia` e `Inscrição Estadual` para pessoa jurídica; `RG`, `Data de Nascimento` e `Estado Civil` para pessoa física.
- [x] O rótulo do `Nome` deve refletir o `Tipo`: nome para pessoa física e razão social para pessoa jurídica.
- [x] O `Endereço` segue as regras de [Endereço](comum.md#endereço), inclusive o preenchimento automático a partir do CEP.
- [ ] A pessoa é criada com `Status` `Ativo`.
- [ ] A criação pode ser acionada a partir de outros cadastros que referenciam uma pessoa (ex: vendedor no cadastro de animal, `RF-ANIMAL-02`), sem sair deles.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a criação de uma nova pessoa na listagem (`RF-PESSOA-01`).
2. O sistema exibe o formulário de cadastro com o `Tipo` inicialmente como pessoa física, solicitando apenas os campos que se aplicam a ele.
3. O usuário preenche os dados da pessoa, podendo alterar o `Tipo` e informar o `Endereço` pelo CEP (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-PESSOA-01`, `RN-PESSOA-02`), persiste o registro com `Status` `Ativo` e exibe a mensagem: _"Registro salvo com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Alteração do tipo (passo 3):**
  1. O usuário altera o `Tipo` (de pessoa física para jurídica ou vice-versa).
  2. O sistema passa a solicitar apenas os campos do novo `Tipo`, descarta os valores já informados nos campos exclusivos do `Tipo` anterior e ajusta o rótulo do `Nome` (nome ou razão social).
  3. O fluxo retorna ao passo 3.

- **A2 – Preenchimento do endereço pelo CEP (passo 3):**
  1. O usuário informa o `CEP`.
  2. O sistema preenche automaticamente os demais campos do endereço (ver [Endereço](comum.md#endereço)).
  3. O fluxo retorna ao passo 3.

- **A3 – CEP não encontrado (passo A2.2):**
  1. O CEP informado não é encontrado.
  2. O sistema exibe a mensagem: _"CEP não encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Cadastro a partir de outro cadastro (passo 1):**
  1. O usuário aciona a criação de uma nova pessoa a partir de outro cadastro que referencia uma pessoa (ex: vendedor em `RF-ANIMAL-02`).
  2. O fluxo segue do passo 2 ao 5.
  3. O sistema retorna ao cadastro de origem, com a nova pessoa já selecionada.
  4. O fluxo termina.

- **A5 – Documento inválido (passo 5):**
  1. O CPF ou CNPJ informado possui dígitos verificadores inválidos (`RN-PESSOA-01`).
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"CPF inválido."_ ou _"CNPJ inválido."_, conforme o `Tipo`.
  3. O fluxo retorna ao passo 3.

- **A6 – Email inválido (passo 5):**
  1. O `Email` informado não tem formato válido.
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"Email inválido."_
  3. O fluxo retorna ao passo 3.

- **A7 – Documento duplicado (passo 5):**
  1. O `Documento` informado já pertence a outra pessoa (`RN-PESSOA-02`).
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo 3.

- **A8 – Campos obrigatórios ausentes (passo 5):**
  1. Um ou mais campos obrigatórios não foram preenchidos.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A9 – Endereço incompleto (passo 5):**
  1. O `Endereço` foi iniciado, mas `CEP`, `Logradouro`, `Município` ou `UF` ficou em branco.
  2. O sistema impede a gravação e destaca os campos do endereço ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-PESSOA-03`: Atualizar Pessoa

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados cadastrais de uma pessoa física ou jurídica já registrada.

|                       |                                                                                                                                                               |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **atualizar os dados de uma pessoa já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-PESSOA-01`, `RF-PESSOA-02`                                                                                                                                |
| **Regras Vinculadas** | `RN-PESSOA-02`                                                                                                                                                |
| **Atores**            | Administrador, Gerente                                                                                                                                        |
| **Plataformas**       | Web                                                                                                                                                           |

### 2.3.2 - Critérios de Aceitação

- [x] O `Tipo` e o `Documento` são exibidos, mas não podem ser alterados (`RN-PESSOA-02`).
- [x] Os demais campos podem ser alterados, com as mesmas regras de preenchimento da criação (`RF-PESSOA-02`).

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de uma pessoa na listagem (`RF-PESSOA-01`).
2. O sistema exibe o formulário com os dados atuais da pessoa e os campos que se aplicam ao seu `Tipo`; `Tipo` e `Documento` são exibidos sem permitir alteração (`RN-PESSOA-02`).
3. O usuário altera os campos desejados, podendo informar o `Endereço` pelo CEP (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados, persiste as alterações e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Preenchimento do endereço pelo CEP (passo 3):**
  1. O usuário informa o `CEP`.
  2. O sistema preenche automaticamente os demais campos do endereço (ver [Endereço](comum.md#endereço)).
  3. O fluxo retorna ao passo 3.

- **A2 – CEP não encontrado (passo A1.2):**
  1. O CEP informado não é encontrado.
  2. O sistema exibe a mensagem: _"CEP não encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Email inválido (passo 5):**
  1. O `Email` informado não tem formato válido.
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"Email inválido."_
  3. O fluxo retorna ao passo 3.

- **A4 – Campos obrigatórios ausentes (passo 5):**
  1. O usuário removeu o `Nome` da pessoa.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca o campo com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A5 – Endereço incompleto (passo 5):**
  1. O `Endereço` foi iniciado, mas `CEP`, `Logradouro`, `Município` ou `UF` ficou em branco.
  2. O sistema impede a gravação e destaca os campos do endereço ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 🚧 2.4 - `RF-PESSOA-04`: Detalhes da Pessoa (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite consultar as informações detalhadas de uma pessoa: dados cadastrais e os papéis que ela exerce no negócio.

|                       |                                                                                                                                                              |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consultar os detalhes de uma pessoa cadastrada** para visualizar seus dados e os seus vínculos com o negócio. |
| **Dependências**      | `RF-PESSOA-01`, `RF-PESSOA-02`                                                                                                                               |
| **Regras Vinculadas** | `RN-PESSOA-03`                                                                                                                                               |
| **Atores**            | Administrador, Gerente                                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                                          |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir `Nome`, `Tipo` e `Documento` formatado.
- [ ] Exibir `Telefone`, `Email` e `Endereço`.
- [ ] Exibir `Status`, `Criado em` e `Atualizado em`.
- [ ] Exibir os campos específicos do `Tipo`: `RG`, `Data de Nascimento` e `Estado Civil` para pessoa física; `Nome Fantasia` e `Inscrição Estadual` para pessoa jurídica.
- [ ] Campos não preenchidos devem ser indicados como tal.
- [ ] Exibir as propriedades das quais a pessoa é titular.
- [ ] Exibir as compras de animais em que a pessoa é vendedora.
- [ ] Exibir os procedimentos sanitários em que a pessoa é a veterinária responsável.
- [ ] Permitir acionar a exclusão da pessoa (`RF-PESSOA-05`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de uma pessoa na listagem (`RF-PESSOA-01`).
2. O sistema exibe os dados cadastrais da pessoa, incluindo os campos específicos do seu `Tipo`, `Status`, `Criado em` e `Atualizado em`, indicando os campos não preenchidos.
3. O sistema exibe os vínculos da pessoa: as propriedades das quais é titular, as compras de animais em que é vendedora e os procedimentos sanitários em que é a veterinária responsável.
4. O usuário consulta as informações (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão (passo 4):**
  1. O usuário aciona a exclusão da pessoa.
  2. O fluxo continua em `RF-PESSOA-05`.

</div>

## 🚧 2.5 - `RF-PESSOA-05`: Excluir Pessoa (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite excluir uma pessoa física ou jurídica, desde que ela não tenha qualquer outro registro vinculado.

|                       |                                                                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **excluir uma pessoa cadastrada** apenas se ela não possuir qualquer registro vinculado. |
| **Dependências**      | `RF-PESSOA-02`, `RF-PESSOA-04`                                                                                                        |
| **Regras Vinculadas** | —                                                                                                                                     |
| **Atores**            | Administrador, Gerente                                                                                                                |
| **Plataformas**       | Web                                                                                                                                   |

### 2.5.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário.
- [ ] A pessoa só pode ser excluída se não tiver outros registros vinculados a ela (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a exclusão nos detalhes da pessoa (`RF-PESSOA-04`).
2. O sistema solicita a confirmação da exclusão.
3. O usuário confirma a exclusão.
4. O sistema verifica que a pessoa não possui registros vinculados, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Pessoa com registro vinculado (passo 4):**
  1. A pessoa possui registro vinculado.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo termina com falha.

</div>

## 2.6 - `RF-PESSOA-06`: Ativar/Desativar Pessoa

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite ativar/desativar uma pessoa física ou jurídica, marcando como inativos os registros que não têm mais relacionamento ativo com o negócio (ex: clientes ou fornecedores antigos), sem excluí-los. Pessoas inativas ficam ocultas por padrão nas listagens e não podem ser escolhidas para novos vínculos, mas continuam disponíveis para consultas e relatórios.

|                       |                                                                                                                                                                                                             |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **ativar ou desativar uma pessoa cadastrada** para ocultá-la das listagens quando ela não tiver mais relacionamento ativo com o negócio sem ter que excluí-la. |
| **Dependências**      | `RF-PESSOA-01`, `RF-PESSOA-02`                                                                                                                                                                              |
| **Regras Vinculadas** | —                                                                                                                                                                                                           |
| **Atores**            | Administrador, Gerente                                                                                                                                                                                      |
| **Plataformas**       | Web                                                                                                                                                                                                         |

### 2.6.2 - Critérios de Aceitação

- [ ] A ação deve alternar o status da pessoa entre `Ativo` e `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).
- [ ] A ativação e a desativação exigem confirmação do usuário; a confirmação da desativação deve informar que a pessoa deixará de aparecer na listagem padrão e não poderá ser selecionada em novos cadastros

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Desativar" de uma pessoa com status `Ativo` na listagem (`RF-PESSOA-01`).
2. O sistema solicita a confirmação, informando que a pessoa deixará de aparecer nas listagens de novos cadastros.
3. O usuário confirma a desativação.
4. O sistema altera o status da pessoa para `Inativo` e a oculta da listagem padrão.
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Ativação de pessoa inativa (passo 1):**
  1. O usuário aciona a ação "Ativar" de uma pessoa com status `Inativo`.
  2. O sistema solicita a confirmação da ativação.
  3. O usuário confirma a ativação.
  4. O sistema altera o status da pessoa para `Ativo` e volta a exibi-la na listagem padrão.
  5. O fluxo termina.

- **A2 – Ação cancelada (passos 3 e A1.3):**
  1. O usuário não confirma a ação.
  2. O sistema mantém o status da pessoa inalterado.
  3. O fluxo termina.

</div>
