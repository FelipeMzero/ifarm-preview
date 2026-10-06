# 📦 Módulo: `MOD-MARCAS`

Módulo responsável pelo gerenciamento das marcas de ferro (marcas a fogo) usadas para identificar a propriedade dos animais do rebanho. O módulo deve possibilitar consulta, criação, atualização, ativação/desativação e exclusão de marcas.

A marca pertence a um proprietário (pessoa física ou jurídica): o mesmo titular pode usar a sua marca nos animais de qualquer uma das suas fazendas. A marca costuma ser registrada em um órgão oficial (prefeitura, órgão estadual de defesa agropecuária ou cartório), que lhe atribui um número de registro válido no município ou na UF do órgão.

## Dicionário de dados conceitual

| Campo                | Descrição                                                                        | Tipo       | Obrig. | Restrições                                                                           |
| -------------------- | -------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------ |
| `Nome`               | Identificação curta da marca, como "Marca principal" ou "Marca da recria"        | Texto      | Sim    | Até 60 caracteres                                                                    |
| `Titular`            | Pessoa física ou jurídica dona da marca                                          | Referência | Sim    | Pessoa ativa (`RN-MARCA-01`)                                                         |
| `Imagem`             | Desenho da marca                                                                 | Imagem     | Não    | PNG, JPG ou WEBP; até 1 MB                                                           |
| `Número de Registro` | Número atribuído à marca pelo órgão de registro                                  | Texto      | Não    | Até 30 caracteres; repetição gera aviso de possível duplicidade (`RN-MARCA-02`)      |
| `Órgão de Registro`  | Órgão em que a marca foi registrada, como prefeitura, órgão estadual ou cartório | Texto      | Não    | Até 100 caracteres                                                                   |
| `Município`          | Município do registro, quando o registro for municipal                           | Texto      | Não    | Até 60 caracteres                                                                    |
| `UF`                 | Unidade Federativa do registro, sigla de 2 letras, por exemplo MT                | Texto      | Não    | Uma das UFs do Brasil                                                                |
| `Data de Registro`   | Data em que a marca foi registrada no órgão                                      | Data       | Não    | Não pode ser futura                                                                  |
| `Status`             | Situação do cadastro                                                             | Enum       | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)) |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-MARCA-01` - Titularidade Obrigatória:** Toda marca tem um titular, pessoa física ou jurídica dona dela. A marca identifica a quem o animal pertence.
- **`RN-MARCA-02` - Registro Identifica a Marca:** Um número de registro identifica uma única marca no órgão que o emitiu, seja ele municipal ou estadual; o mesmo número pode existir em municípios ou UFs diferentes. Duas marcas com o mesmo número no mesmo local indicam um possível cadastro em duplicidade, mas não um impedimento: quem cadastra decide se é a mesma marca, pois a grafia do município e do órgão pode variar.
- **`RN-MARCA-03` - Marca Inativa não é Aplicada:** Uma marca inativa não pode ser aplicada em novos animais. Os animais que já a receberam continuam com ela.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-MARCA-01`: Listagem de Marcas

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as marcas cadastradas, com busca, filtro e acesso às ações disponíveis para cada registro.

|                       |                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar a lista de marcas cadastradas** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                                                      |
| **Regras Vinculadas** | —                                                                                                                                                                                      |
| **Atores**            | Administrador, Gerente                                                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                                                    |
| **Versão**            | 1                                                                                                                                                                                      |
| **Especificação**     | 📌 Definida                                                                                                                                                                            |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] Deve permitir exibir as colunas `Imagem` (miniatura), `Nome`, `Titular`, `Status`, `Número de Registro` e `Atualizado em`. Os demais dados do registro são exibidos nos detalhes (`RF-MARCA-04`).
- [ ] `Imagem` e `Nome` são sempre visíveis; `Número de Registro` e `Atualizado em` iniciam ocultos.
- [ ] Marcas sem `Imagem` devem exibir um indicador de imagem ausente no lugar da miniatura.
- [ ] A ordenação inicial é por `Atualizado em`, do mais recente para o mais antigo.
- [ ] A pesquisa deve considerar o `Nome` da marca, o nome do `Titular` e o `Número de Registro`.
- [ ] Os filtros disponíveis são: ativas, inativas e todas. O filtro inicial é "ativas".
- [ ] As ações disponíveis para cada marca são: Editar (`RF-MARCA-03`), Detalhes (`RF-MARCA-04`) e Ativar/Desativar (`RF-MARCA-06`).
- [ ] Deve permitir acionar a criação de uma nova marca (`RF-MARCA-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de marcas.
2. O sistema exibe as marcas conforme o filtro e a ordenação iniciais, de forma paginada.
3. O usuário localiza a marca desejada, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a marca.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as marcas que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa sem resultados (passo A1.2):**
  1. Nenhuma marca corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A4 – Nova marca (passo 3):**
  1. O usuário aciona a criação de uma nova marca.
  2. O fluxo continua em `RF-MARCA-02`.

</div>

## 2.2 - `RF-MARCA-02`: Criar Marca

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar as marcas de ferro dos titulares, para que possam ser aplicadas nos animais do rebanho.

|                       |                                                                                                                                      |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cadastrar uma marca de ferro** no sistema para registrar a sua aplicação nos animais. |
| **Dependências**      | `RF-PESSOA-02` (o `Titular` deve existir previamente como pessoa)                                                                    |
| **Regras Vinculadas** | `RN-MARCA-01`, `RN-MARCA-02`                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                               |
| **Plataformas**       | Web                                                                                                                                  |
| **Versão**            | 1                                                                                                                                    |
| **Especificação**     | 📌 Definida                                                                                                                          |

### 2.2.2 - Critérios de Aceitação

- [ ] Os campos `Nome` e `Titular` são obrigatórios; os demais são opcionais (`RN-MARCA-01`).
- [ ] O `Titular` deve ser escolhido entre as pessoas ativas, com possibilidade de busca por nome ou documento.
- [ ] Deve ser possível cadastrar uma nova pessoa a partir da escolha do `Titular`, sem sair do cadastro da marca (`RF-PESSOA-02`); a pessoa cadastrada passa a ser o titular.
- [ ] A `Imagem` deve ser enviada a partir de um arquivo PNG, JPG ou WEBP de até 1 MB, com pré-visualização antes de salvar, e pode ser removida ou substituída antes de salvar.
- [ ] Quando já existir outra marca com o mesmo `Número de Registro` e, se informados nas duas marcas, a mesma `UF` e o mesmo `Município`, o sistema deve avisar a possível duplicidade antes de salvar, exibindo a marca existente, e permitir confirmar ou corrigir (`RN-MARCA-02`).
- [ ] A comparação de `Número de Registro` e `Município` deve ignorar maiúsculas e minúsculas, acentos e espaços nas extremidades.
- [ ] A `UF` deve ser escolhida entre as Unidades Federativas do Brasil.
- [ ] A `Data de Registro`, quando informada, não pode ser futura.
- [ ] A marca é criada com `Status` `Ativo`.
- [ ] A criação pode ser acionada a partir de outros cadastros que referenciam uma marca (ex: marca sugerida no manejo de ferra), sem sair deles.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a criação de uma nova marca na listagem (`RF-MARCA-01`).
2. O sistema exibe o formulário de cadastro.
3. O usuário preenche os dados da marca, podendo cadastrar um novo titular e enviar a imagem da marca (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-MARCA-01`, `RN-MARCA-02`), persiste o registro com `Status` `Ativo` e exibe a mensagem: _"Registro salvo com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Cadastro de novo titular (passo 3):**
  1. O titular ainda não está cadastrado como pessoa, e o usuário aciona o cadastro de uma nova pessoa a partir da escolha do `Titular`.
  2. O sistema executa o cadastro da pessoa sem sair do cadastro da marca (`RF-PESSOA-02`).
  3. O sistema seleciona a pessoa cadastrada como `Titular`.
  4. O fluxo retorna ao passo 3.

- **A2 – Envio da imagem (passo 3):**
  1. O usuário escolhe um arquivo de imagem.
  2. O sistema exibe a pré-visualização da imagem escolhida.
  3. O fluxo retorna ao passo 3.

- **A3 – Imagem inválida (passo A2.2):**
  1. O arquivo escolhido não é PNG, JPG ou WEBP, ou tem mais de 1 MB.
  2. O sistema descarta o arquivo e exibe a mensagem: _"A imagem deve ser PNG, JPG ou WEBP com até 1 MB."_
  3. O fluxo retorna ao passo 3.

- **A4 – Cadastro a partir de outro cadastro (passo 1):**
  1. O usuário aciona a criação de uma nova marca a partir de outro cadastro que referencia uma marca (ex: marca sugerida no manejo de ferra).
  2. O fluxo segue do passo 2 ao 5.
  3. O sistema retorna ao cadastro de origem, com a nova marca já selecionada.
  4. O fluxo termina.

- **A5 – Possível registro duplicado (passo 5):**
  1. O `Número de Registro` informado já pertence a outra marca do mesmo local (`RN-MARCA-02`).
  2. O sistema exibe a marca existente, com `Nome`, `Titular` e `Imagem`, e a mensagem: _"Já existe uma marca com este número de registro. Deseja salvar mesmo assim?"_
  3. O usuário confirma, e o fluxo continua no passo 5 sem nova verificação de duplicidade; ou cancela, e o fluxo retorna ao passo 3.

- **A6 – Data de registro futura (passo 5):**
  1. A `Data de Registro` informada é posterior à data atual.
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"A data não pode ser futura."_
  3. O fluxo retorna ao passo 3.

- **A7 – Campos obrigatórios ausentes (passo 5):**
  1. O `Nome` ou o `Titular` não foi preenchido.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-MARCA-03`: Atualizar Marca

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados cadastrais de uma marca já registrada.

|                       |                                                                                                                                                              |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **atualizar os dados de uma marca já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-MARCA-01`, `RF-MARCA-02`                                                                                                                                 |
| **Regras Vinculadas** | `RN-MARCA-01`, `RN-MARCA-02`                                                                                                                                 |
| **Atores**            | Administrador, Gerente                                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                                          |
| **Versão**            | 1                                                                                                                                                            |
| **Especificação**     | 📌 Definida                                                                                                                                                  |

### 2.3.2 - Critérios de Aceitação

- [ ] Todos os campos podem ser alterados, com as mesmas regras de preenchimento da criação (`RF-MARCA-02`).
- [ ] Ao trocar o `Titular`, o novo titular deve ser escolhido entre as pessoas ativas.
- [ ] A `Imagem` atual deve ser exibida e pode ser substituída ou removida.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de uma marca na listagem (`RF-MARCA-01`).
2. O sistema exibe o formulário com os dados atuais da marca, incluindo a sua imagem.
3. O usuário altera os campos desejados, podendo substituir ou remover a imagem (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-MARCA-01`, `RN-MARCA-02`), persiste as alterações e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Substituição da imagem (passo 3):**
  1. O usuário escolhe um novo arquivo de imagem.
  2. O sistema exibe a pré-visualização da nova imagem no lugar da atual.
  3. O fluxo retorna ao passo 3.

- **A2 – Imagem inválida (passo A1.2):**
  1. O arquivo escolhido não é PNG, JPG ou WEBP, ou tem mais de 1 MB.
  2. O sistema descarta o arquivo, mantém a imagem atual e exibe a mensagem: _"A imagem deve ser PNG, JPG ou WEBP com até 1 MB."_
  3. O fluxo retorna ao passo 3.

- **A3 – Remoção da imagem (passo 3):**
  1. O usuário remove a imagem da marca.
  2. O sistema deixa de exibir a imagem; a remoção só é persistida ao salvar.
  3. O fluxo retorna ao passo 3.

- **A4 – Possível registro duplicado (passo 5):**
  1. O `Número de Registro` informado já pertence a outra marca do mesmo local (`RN-MARCA-02`).
  2. O sistema exibe a marca existente, com `Nome`, `Titular` e `Imagem`, e a mensagem: _"Já existe uma marca com este número de registro. Deseja salvar mesmo assim?"_
  3. O usuário confirma, e o fluxo continua no passo 5 sem nova verificação de duplicidade; ou cancela, e o fluxo retorna ao passo 3.

- **A5 – Data de registro futura (passo 5):**
  1. A `Data de Registro` informada é posterior à data atual.
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"A data não pode ser futura."_
  3. O fluxo retorna ao passo 3.

- **A6 – Campos obrigatórios ausentes (passo 5):**
  1. O usuário removeu o `Nome` ou o `Titular` da marca.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.4 - `RF-MARCA-04`: Detalhes da Marca

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite consultar as informações detalhadas de uma marca: dados cadastrais, imagem e os animais em que ela foi aplicada.

|                       |                                                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consultar os detalhes de uma marca cadastrada** para visualizar seus dados e os animais que a portam. |
| **Dependências**      | `RF-MARCA-01`, `RF-MARCA-02`                                                                                                                         |
| **Regras Vinculadas** | —                                                                                                                                                    |
| **Atores**            | Administrador, Gerente                                                                                                                               |
| **Plataformas**       | Web                                                                                                                                                  |
| **Versão**            | 1                                                                                                                                                    |
| **Especificação**     | 📝 Rascunho                                                                                                                                          |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir a `Imagem` da marca em tamanho ampliado.
- [ ] Exibir `Nome` e `Titular`, com o documento do titular formatado.
- [ ] Exibir `Número de Registro`, `Órgão de Registro`, `Município/UF` e `Data de Registro`.
- [ ] Exibir `Status`, `Criado em` e `Atualizado em`.
- [ ] Campos não preenchidos devem ser indicados como tal.
- [ ] Exibir os animais que portam a marca atualmente, com a propriedade em que cada um está.
- [ ] Exibir as marcações já registradas com a marca, avulsas ou em sessão de manejo, com a data e o animal de cada uma.
- [ ] Permitir acionar a exclusão da marca (`RF-MARCA-05`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de uma marca na listagem (`RF-MARCA-01`).
2. O sistema exibe a imagem e os dados cadastrais da marca, indicando os campos não preenchidos.
3. O sistema exibe os animais que portam a marca atualmente e as marcações já registradas com ela.
4. O usuário consulta as informações (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão (passo 4):**
  1. O usuário aciona a exclusão da marca.
  2. O fluxo continua em `RF-MARCA-05`.

</div>

## 2.5 - `RF-MARCA-05`: Excluir Marca

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite excluir uma marca, desde que ela não tenha qualquer outro registro vinculado.

|                       |                                                                                                                                             |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **excluir uma marca cadastrada** apenas se ela não tiver sido aplicada nem prevista em manejo. |
| **Dependências**      | `RF-MARCA-02`, `RF-MARCA-04`                                                                                                                |
| **Regras Vinculadas** | —                                                                                                                                           |
| **Atores**            | Administrador, Gerente                                                                                                                      |
| **Plataformas**       | Web                                                                                                                                         |
| **Versão**            | 1                                                                                                                                           |
| **Especificação**     | 📝 Rascunho                                                                                                                                 |

### 2.5.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário.
- [ ] A marca só pode ser excluída se não tiver outros registros vinculados a ela, como marcações de animais ou manejos de ferra em que foi sugerida (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a exclusão nos detalhes da marca (`RF-MARCA-04`).
2. O sistema solicita a confirmação da exclusão.
3. O usuário confirma a exclusão.
4. O sistema verifica que a marca não possui registros vinculados, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Marca com registro vinculado (passo 4):**
  1. A marca possui registro vinculado.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo termina com falha.

</div>

## 2.6 - `RF-MARCA-06`: Ativar/Desativar Marca

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite ativar/desativar uma marca, retirando de uso as marcas que não são mais aplicadas (ex: marca substituída ou cujo registro foi cancelado), sem excluí-las. Marcas inativas ficam ocultas por padrão nas listagens e não podem ser aplicadas em novos animais, mas continuam disponíveis para consultas e relatórios.

|                       |                                                                                                                                                                                                       |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **ativar ou desativar uma marca cadastrada** para impedir que ela seja aplicada em novos animais quando deixar de ser usada, sem perder o seu histórico. |
| **Dependências**      | `RF-MARCA-01`, `RF-MARCA-02`                                                                                                                                                                          |
| **Regras Vinculadas** | `RN-MARCA-03`                                                                                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                                                                |
| **Plataformas**       | Web                                                                                                                                                                                                   |
| **Versão**            | 1                                                                                                                                                                                                     |
| **Especificação**     | 📌 Definida                                                                                                                                                                                           |

### 2.6.2 - Critérios de Aceitação

- [ ] A ação deve alternar o status da marca entre `Ativo` e `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).
- [ ] A ativação e a desativação exigem confirmação do usuário; a confirmação da desativação deve informar que a marca não poderá mais ser aplicada em novos animais.
- [ ] Uma marca inativa não pode ser escolhida em novas marcações, avulsas ou em sessão de manejo, nem como marca sugerida em um manejo de ferra (`RN-MARCA-03`).
- [ ] A desativação não altera a marca atual dos animais que já a receberam nem as marcações já registradas (`RN-MARCA-03`).

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Desativar" de uma marca com status `Ativo` na listagem (`RF-MARCA-01`).
2. O sistema solicita a confirmação, informando que a marca não poderá mais ser aplicada em novos animais.
3. O usuário confirma a desativação.
4. O sistema altera o status da marca para `Inativo`, a oculta da listagem padrão e a retira das opções de novas marcações.
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Ativação de marca inativa (passo 1):**
  1. O usuário aciona a ação "Ativar" de uma marca com status `Inativo`.
  2. O sistema solicita a confirmação da ativação.
  3. O usuário confirma a ativação.
  4. O sistema altera o status da marca para `Ativo`, volta a exibi-la na listagem padrão e a torna novamente disponível para novas marcações.
  5. O fluxo termina.

- **A2 – Ação cancelada (passos 3 e A1.3):**
  1. O usuário não confirma a ação.
  2. O sistema mantém o status da marca inalterado.
  3. O fluxo termina.

</div>
