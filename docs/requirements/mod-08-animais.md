# 📦 Módulo: `MOD-ANIMAIS`

Módulo responsável pelo cadastro dos animais (bovinos) e pelo acompanhamento individual de cada um ao longo da sua vida no rebanho: identificação, lote, pesagens, castração e o histórico dos manejos recebidos.

Cada animal pertence a uma propriedade e, enquanto está no rebanho, a um lote dela. Os manejos individuais (pesagem, identificação e castração) podem ser registrados diretamente no cadastro do animal (registros avulsos) ou em uma sessão de manejo, que trata vários animais de uma vez e é especificada em módulo próprio.

## Dicionário de dados conceitual

| Campo                | Descrição                                                                         | Tipo       | Obrig. | Restrições                                                                                 |
| -------------------- | --------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------ |
| `ID`                 | Número sequencial que identifica o animal no sistema                              | Número     | Sim    | Atribuído no cadastro; imutável                                                            |
| `Brinco`             | Identificação visual do animal                                                    | Texto      | Não    | Até 30 caracteres; único entre os animais ativos da propriedade (`RN-ANIMAL-01`)           |
| `RFID`               | Identificação eletrônica (chip)                                                   | Texto      | Não    | Até 50 caracteres; único entre os animais ativos da propriedade (`RN-ANIMAL-01`)           |
| `Apelido`            | Nome pelo qual o animal é conhecido                                               | Texto      | Não    | Até 50 caracteres                                                                          |
| `Sexo`               | Sexo do animal                                                                    | Enum       | Sim    | `Macho` ou `Fêmea`                                                                         |
| `Data de Nascimento` | Data de nascimento, informada ou estimada                                         | Data       | Não    | —                                                                                          |
| `Raça`               | Raça do animal                                                                    | Referência | Não    | Raça ativa (`MOD-RACAS`)                                                                   |
| `Origem`             | Como o animal entrou no rebanho                                                   | Enum       | Sim    | `Nascimento`, `Compra`, `Doação`, `Indefinida` ou `Referência`; imutável após o cadastro   |
| `Situação`           | Situação do animal no rebanho                                                     | Enum       | Sim    | `Ativo`, `Vendido`, `Doado`, `Morto`, `Descarte`, `Abate` ou `Referência` (`RN-ANIMAL-04`) |
| `Propriedade`        | Propriedade em que o animal está                                                  | Referência | Sim    | Ver `RN-ANIMAL-03`                                                                         |
| `Lote`               | Lote em que o animal está                                                         | Referência | Não    | Lote vigente da propriedade; todo animal no rebanho tem lote (`RN-ANIMAL-03`)              |
| `Data de Entrada`    | Data em que o animal entrou na propriedade                                        | Data       | Não    | Sem data informada, a data do cadastro (`RN-ANIMAL-06`)                                    |
| `Castrado`           | Indica se o animal é castrado                                                     | Lógico     | Sim    | Ver `RN-ANIMAL-08`                                                                         |
| `Peso Atual`         | Peso, em kg, da pesagem mais recente                                              | Calculado  | —      | Ver `RN-ANIMAL-07`                                                                         |
| `Idade`              | Idade a partir da `Data de Nascimento`; aproximada quando o nascimento é estimado | Calculado  | —      | —                                                                                          |
| `Ganho Médio Diário` | GMD do animal                                                                     | Calculado  | —      | Ver `RN-LOTE-08`                                                                           |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-ANIMAL-01` - Identificação do Animal:** Um animal pode ser identificado por brinco, por RFID ou por ambos, e pode ficar temporariamente sem nenhum deles (ex.: perdeu o brinco). Um mesmo brinco ou RFID não pode identificar, ao mesmo tempo, dois animais ativos da mesma propriedade. Quando o animal sai do rebanho, o seu brinco e o seu RFID podem ser reutilizados.
- **`RN-ANIMAL-02` - Troca de Identificação:** O brinco e o RFID de um animal podem ser trocados ou retirados ao longo da sua vida. A identificação do animal é sempre a do brinco (ou RFID) colocado mais recentemente; se ele foi retirado, o animal fica sem essa identificação.
- **`RN-ANIMAL-03` - Propriedade e Lote:** Todo animal pertence a uma propriedade. Enquanto está no rebanho, o animal está em um único lote vigente dessa propriedade (`RN-LOTE-05`). Ao mudar de lote, o animal sai do lote atual e entra no novo na mesma data.
- **`RN-ANIMAL-04` - Situação do Animal:** Um animal ativo está no rebanho e é o único que participa das operações do dia a dia: manejos, trocas de lote e transferências. Um animal sai do rebanho por venda, doação, morte, descarte ou abate. Um animal de referência não existe na fazenda e serve apenas para registrar genealogia.
- **`RN-ANIMAL-05` - Origem por Compra:** Um animal comprado foi adquirido de um vendedor, por um valor, em uma data de aquisição.
- **`RN-ANIMAL-06` - Datas dos Manejos:** Um manejo (pesagem, identificação, castração, troca de lote) não pode ter data futura nem anterior ao nascimento do animal.
- **`RN-ANIMAL-07` - Peso Atual:** O peso atual do animal é o da pesagem mais recente.
- **`RN-ANIMAL-08` - Castração:** Um animal passa a ser castrado quando é castrado, ou pode chegar ao rebanho já castrado. Castrar novamente um animal já castrado (recastração, por procedimento que falhou) não é rotineiro e exige um motivo.
- **`RN-ANIMAL-09` - Correção de Manejos:** Os manejos são a base do peso atual, do GMD, da carência e da rastreabilidade do animal. Um manejo informado com erro pode ser corrigido ou desconsiderado, mas, para fins de rastreabilidade, o valor informado originalmente não se perde. A data de um manejo feito em sessão de manejo é sempre a data da sessão.
- **`RN-ANIMAL-10` - Compromissos do Animal:** Um animal que já participa de uma operação em aberto (recepção de compra, sessão de manejo ou transferência de lote) não pode ser incluído em outra operação que a contradiga:
  - um animal em recepção de compra aberta não pode trocar de lote nem receber manejos fora dela;
  - um animal em sessão de manejo aberta com apartação, ou em transferência de lote pendente, não pode trocar de lote por outro caminho;
  - um animal em sessão de manejo aberta com a mesma etapa (castração, identificação ou o mesmo procedimento sanitário) pode receber o manejo à parte, mas deve-se considerar que o da sessão também valerá quando ela for consolidada. A pesagem não conflita, pois cada pesagem é um fato próprio.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-ANIMAL-01`: Listagem de Animais

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar os animais da propriedade selecionada, com busca, filtros e acesso às ações disponíveis para cada registro.

|                       |                                                                                                                                                                                          |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar a lista de animais da propriedade** para localizar rapidamente um animal e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                                                        |
| **Regras Vinculadas** | `RN-ANIMAL-03`, `RN-ANIMAL-04`                                                                                                                                                           |
| **Atores**            | Administrador, Gerente                                                                                                                                                                   |
| **Plataformas**       | Web                                                                                                                                                                                      |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas os animais da propriedade selecionada.
- [ ] Deve permitir exibir as colunas identificação, `Sexo`, `Peso Atual`, `Origem`, `Situação` e `Atualizado em`.
- [ ] A identificação exibida é o `Brinco`; na falta dele, o `RFID`; na falta dos dois, o `ID`.
- [ ] A identificação é sempre visível; `Origem` inicia oculta.
- [ ] A ordenação inicial é por `Atualizado em`, do mais recente para o mais antigo.
- [ ] A pesquisa deve considerar `ID`, `Brinco`, `RFID` e `Apelido`.
- [ ] Deve ser possível filtrar, de forma combinada com a busca e entre si, por:
  - `Situação` (inicialmente, apenas os ativos);
  - faixa etária: até 12 meses, de 12 a 24 meses, acima de 24 meses ou sem data de nascimento;
  - `Lote`, entre os lotes vigentes da propriedade, ou animais sem lote;
  - `Sexo`;
  - castrados ou não castrados;
  - faixa de `Peso Atual` (mínimo e/ou máximo);
  - `Raça`;
  - `Origem`.
- [ ] Os filtros aplicados devem ficar visíveis, podendo ser removidos individualmente ou todos de uma vez.
- [ ] A busca e os filtros devem ser preservados no endereço da página, para que sobrevivam ao recarregamento e possam ser compartilhados.
- [ ] As ações disponíveis para cada animal são: Editar (`RF-ANIMAL-03`), Detalhes (`RF-ANIMAL-08`) e Excluir (`RF-ANIMAL-09`).
- [ ] Deve permitir acionar o cadastro de um novo animal (`RF-ANIMAL-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de animais.
2. O sistema exibe os animais ativos da propriedade selecionada, conforme a ordenação inicial, de forma paginada.
3. O usuário localiza o animal desejado, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para o animal.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe os animais que correspondem ao termo informado. Uma busca por número, com ou sem "#" (ex.: "37" ou "#37"), exibe o animal com esse `ID`, além dos que tiverem o número no `Brinco`, no `RFID` ou no `Apelido`.
  3. O fluxo retorna ao passo 3.

- **A2 – Filtros (passo 3):**
  1. O usuário aplica ou remove filtros, individualmente ou todos de uma vez.
  2. O sistema exibe os filtros aplicados, atualiza a listagem combinando os filtros com a busca e preserva a busca e os filtros no endereço da página.
  3. O fluxo retorna ao passo 3.

- **A3 – Pesquisa ou filtro sem resultados (passos A1.2 e A2.2):**
  1. A busca e os filtros aplicados não correspondem a nenhum animal.
  2. O sistema exibe a mensagem: _"Nenhum animal encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Ajuste da listagem (passo 3):**
  1. O usuário altera a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A5 – Novo animal (passo 3):**
  1. O usuário aciona o cadastro de um novo animal.
  2. O fluxo continua em `RF-ANIMAL-02`.

</div>

## 2.2 - `RF-ANIMAL-02`: Cadastrar Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar individualmente um animal na propriedade selecionada, já com a sua identificação, lote e os dados iniciais de peso e castração.

|                       |                                                                                                                                              |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cadastrar um animal** para que ele possa ser identificado, manejado e acompanhado no rebanho. |
| **Dependências**      | `RF-LOTE-02` (deve existir um lote vigente), `RF-PESSOA-02` (para o vendedor, na origem `Compra`)                                            |
| **Regras Vinculadas** | `RN-ANIMAL-01`, `RN-ANIMAL-03`, `RN-ANIMAL-05`, `RN-ANIMAL-06`, `RN-ANIMAL-08`, `RN-LOTE-10`                                                 |
| **Atores**            | Administrador, Gerente                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                          |

### 2.2.2 - Critérios de Aceitação

- [ ] O cadastro deve permitir informar `Brinco`, `RFID`, `Apelido`, `Sexo`, `Data de Nascimento`, `Data de Entrada`, `Raça`, peso, `Lote`, castração e `Origem`.
- [ ] Os campos `Sexo`, `Origem` e `Lote` são obrigatórios. Inicialmente, o `Sexo` é `Macho` e a `Origem` é `Indefinida`.
- [ ] O `Brinco` e o `RFID` não podem estar em uso por outro animal ativo da propriedade (`RN-ANIMAL-01`).
- [ ] A `Raça` deve ser escolhida entre as raças ativas.
- [ ] O `Lote` deve ser escolhido entre os lotes vigentes da propriedade, com possibilidade de busca por nome.
- [ ] Deve ser possível cadastrar um novo lote a partir da escolha do `Lote`, sem sair do cadastro do animal (`RF-LOTE-02`); o lote cadastrado passa a ser o lote do animal.
- [ ] Ao escolher o `Lote`, o sistema deve alertar, sem impedir o cadastro, se a entrada do animal fizer a lotação da área do lote exceder a capacidade (`RN-LOTE-10`).
- [ ] Se o animal for castrado, deve ser possível informar a data da castração e a técnica, escolhida entre as técnicas ativas.
- [ ] Se a `Origem` for `Compra`, devem ser informados o vendedor e o valor da compra (obrigatórios), a data de aquisição e uma observação (opcionais) (`RN-ANIMAL-05`). O vendedor deve ser escolhido entre as pessoas ativas, e deve ser possível cadastrar uma nova pessoa sem sair do cadastro do animal (`RF-PESSOA-02`).
- [ ] As datas informadas devem respeitar `RN-ANIMAL-06`. Sem `Data de Entrada`, o animal entra na propriedade na data do cadastro.
- [ ] O animal cadastrado é vinculado à propriedade selecionada, com a situação `Ativo`, e o `ID` é atribuído automaticamente.
- [ ] O cadastro deve registrar, na `Data de Entrada`, a entrada do animal na propriedade e no lote e, quando informados, a pesagem inicial, o brinco e o RFID iniciais e a castração (na data da castração ou, sem ela, na `Data de Entrada`).
- [ ] Com a `Origem` `Compra`, o cadastro deve registrar a compra do animal, já concluída e com o valor informado; se houver valor, a compra fica registrada como paga na data de aquisição.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o cadastro de um novo animal na listagem (`RF-ANIMAL-01`).
2. O sistema exibe o formulário de cadastro, com o `Sexo` inicialmente `Macho` e a `Origem` inicialmente `Indefinida`.
3. O usuário preenche os dados do animal, escolhendo o `Lote` entre os lotes vigentes da propriedade e podendo cadastrar um novo lote, informar a castração e os dados da compra (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-ANIMAL-01`, `RN-ANIMAL-06`), persiste o animal na propriedade selecionada com a situação `Ativo` e o `ID` atribuído automaticamente, registra na `Data de Entrada` a entrada do animal na propriedade e no lote e, quando informados, a pesagem inicial, o brinco e o RFID iniciais, a castração e a compra, e exibe a mensagem: _"Registro salvo com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Lotação excedida no lote escolhido (passo 3):**
  1. A entrada do animal faz a lotação da área do lote escolhido exceder a capacidade (`RN-LOTE-10`).
  2. O sistema alerta que a lotação será excedida, sem impedir o cadastro.
  3. O fluxo retorna ao passo 3.

- **A2 – Cadastro de novo lote (passo 3):**
  1. O usuário aciona o cadastro de um novo lote a partir da escolha do `Lote`.
  2. O sistema executa o cadastro do lote sem sair do cadastro do animal (`RF-LOTE-02`) e seleciona o lote cadastrado como `Lote` do animal.
  3. O fluxo retorna ao passo 3.

- **A3 – Animal castrado (passo 3):**
  1. O usuário indica que o animal é castrado.
  2. O sistema passa a solicitar a data da castração e a técnica, escolhida entre as técnicas ativas.
  3. O fluxo retorna ao passo 3.

- **A4 – Origem por compra (passo 3):**
  1. O usuário escolhe a `Origem` `Compra`.
  2. O sistema passa a solicitar o vendedor e o valor da compra, obrigatórios, e a data de aquisição e uma observação, opcionais (`RN-ANIMAL-05`). O vendedor é escolhido entre as pessoas ativas, podendo ser cadastrada uma nova pessoa sem sair do cadastro do animal (`RF-PESSOA-02`).
  3. O fluxo retorna ao passo 3.

- **A5 – Brinco ou RFID em uso (passo 5):**
  1. O `Brinco` ou o `RFID` informado pertence a outro animal ativo da propriedade (`RN-ANIMAL-01`).
  2. O sistema impede a gravação e destaca o campo com a mensagem: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo 3.

- **A6 – Compra sem vendedor ou valor (passo 5):**
  1. A `Origem` é `Compra`, mas o vendedor ou o valor da compra não foi informado (`RN-ANIMAL-05`).
  2. O sistema impede a gravação e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório para compra."_
  3. O fluxo retorna ao passo 3.

- **A7 – Campos obrigatórios ausentes (passo 5):**
  1. Um ou mais campos obrigatórios, como o `Lote`, não foram preenchidos.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-ANIMAL-03`: Atualizar Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados cadastrais de um animal. Os dados que dependem de manejos (identificação, lote, peso e castração) são exibidos com o seu valor atual e alterados pelas funcionalidades próprias (`RF-ANIMAL-04` a `RF-ANIMAL-07`), que preservam o histórico.

|                       |                                                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **atualizar os dados de um animal** para manter o seu cadastro correto. |
| **Dependências**      | `RF-ANIMAL-01`, `RF-ANIMAL-02`                                                                                       |
| **Regras Vinculadas** | `RN-ANIMAL-02`, `RN-ANIMAL-09`                                                                                       |
| **Atores**            | Administrador, Gerente                                                                                               |
| **Plataformas**       | Web                                                                                                                  |

### 2.3.2 - Critérios de Aceitação

- [ ] Os campos `Apelido`, `Sexo`, `Data de Nascimento` e `Raça` podem ser alterados, com as mesmas regras de preenchimento do cadastro (`RF-ANIMAL-02`).
- [ ] O `Brinco`, o `RFID`, o `Lote`, o `Peso Atual` e a castração devem ser exibidos com o seu valor atual, sem edição direta, e permitir acionar, respectivamente, a identificação (`RF-ANIMAL-06`), a troca de lote (`RF-ANIMAL-04`), as pesagens (`RF-ANIMAL-05`) e a castração (`RF-ANIMAL-07`).
- [ ] O `ID`, a `Origem` e a `Situação` não podem ser alterados na edição.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de um animal na listagem (`RF-ANIMAL-01`) ou nos detalhes do animal (`RF-ANIMAL-08`).
2. O sistema exibe o formulário com os dados atuais do animal. O `Brinco`, o `RFID`, o `Lote`, o `Peso Atual` e a castração são exibidos com o seu valor atual, sem edição direta, e o `ID`, a `Origem` e a `Situação` não podem ser alterados.
3. O usuário altera os campos desejados, podendo trocar o lote do animal e acessar as pesagens, a identificação e a castração (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados, persiste as alterações, registra a troca de lote, se houver, e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Troca de lote (passo 3):**
  1. O usuário aciona a troca de lote do animal.
  2. O sistema executa a troca de lote (`RF-ANIMAL-04`) e passa a exibir o lote de destino, que só é registrado ao salvar a edição.
  3. O fluxo retorna ao passo 3.

- **A2 – Pesagens, identificação ou castração (passo 3):**
  1. O usuário aciona as pesagens, a identificação ou a castração do animal.
  2. O fluxo continua no requisito correspondente (`RF-ANIMAL-05`, `RF-ANIMAL-06` ou `RF-ANIMAL-07`).

</div>

## 2.4 - `RF-ANIMAL-04`: Trocar Lote do Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite mover um animal para outro lote da mesma propriedade, acionada durante a edição do animal. Para mover vários animais de uma vez, usa-se a transferência de animais entre lotes, especificada em módulo próprio.

|                       |                                                                                                                                                  |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **trocar o lote de um animal** para refletir onde ele está e manter o histórico de lotes do animal. |
| **Dependências**      | `RF-ANIMAL-03`                                                                                                                                   |
| **Regras Vinculadas** | `RN-ANIMAL-03`, `RN-ANIMAL-10`, `RN-LOTE-10`                                                                                                     |
| **Atores**            | Administrador, Gerente                                                                                                                           |
| **Plataformas**       | Web                                                                                                                                              |

### 2.4.2 - Critérios de Aceitação

- [ ] A troca deve permitir informar o lote de destino (obrigatório) e uma observação (opcional).
- [ ] O lote de destino deve ser escolhido entre os lotes vigentes da propriedade do animal.
- [ ] Ao escolher o lote de destino, o sistema deve alertar, sem impedir a troca, se a lotação resultante exceder a capacidade da área do lote (`RN-LOTE-10`).
- [ ] A troca só é registrada ao salvar a edição do animal (`RF-ANIMAL-03`).
- [ ] Ao ser registrada, a troca encerra a permanência do animal no lote atual e registra a entrada no lote de destino na data da troca, com a observação informada (`RN-ANIMAL-03`).
- [ ] A troca deve ser impedida quando conflitar com uma operação em aberto do animal (`RN-ANIMAL-10`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a troca de lote durante a edição do animal (`RF-ANIMAL-03`).
2. O sistema verifica que a troca não conflita com uma operação em aberto do animal (`RN-ANIMAL-10`).
3. O sistema solicita o lote de destino, entre os lotes vigentes da propriedade do animal, e uma observação opcional.
4. O usuário escolhe o lote de destino e, se desejar, informa a observação.
5. O usuário confirma a troca.
6. O sistema passa a exibir o lote de destino na edição do animal. Ao salvar a edição, o sistema encerra a permanência do animal no lote atual e registra a entrada no lote de destino na data da troca, com a observação informada (`RN-ANIMAL-03`).
7. O fluxo continua em `RF-ANIMAL-03`.

**Fluxos alternativos**

- **A1 – Animal com operação em aberto (passo 2):**
  1. O animal participa de uma operação em aberto que conflita com a troca, como uma transferência de lote pendente (`RN-ANIMAL-10`).
  2. O sistema impede a troca e informa a operação em aberto que a impede.
  3. O fluxo termina com falha.

- **A2 – Lotação excedida no lote de destino (passo 4):**
  1. A lotação resultante excede a capacidade da área do lote de destino (`RN-LOTE-10`).
  2. O sistema alerta que a lotação será excedida, sem impedir a troca.
  3. O fluxo retorna ao passo 4.

</div>

## 2.5 - `RF-ANIMAL-05`: Pesagens do Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite consultar o histórico de pesagens de um animal, registrar uma nova pesagem avulsa e corrigir ou anular pesagens lançadas com erro.

|                       |                                                                                                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar e corrigir as pesagens de um animal** para acompanhar o seu ganho de peso com dados corretos. |
| **Dependências**      | `RF-ANIMAL-03`                                                                                                                                         |
| **Regras Vinculadas** | `RN-ANIMAL-06`, `RN-ANIMAL-07`, `RN-ANIMAL-09`, `RN-ANIMAL-10`                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                    |

### 2.5.2 - Critérios de Aceitação

- [ ] Exibir as pesagens válidas do animal, da mais recente para a mais antiga, com data, peso, observação e se foi feita em sessão de manejo. Pesagens de sessões ainda não consolidadas não entram no histórico.
- [ ] Pesagens corrigidas devem indicar o valor lançado originalmente e a data da correção (`RN-ANIMAL-09`).
- [ ] Deve ser possível registrar uma pesagem avulsa informando o peso (obrigatório, maior que zero), a data (inicialmente hoje) e uma observação. A data deve respeitar `RN-ANIMAL-06`.
- [ ] Deve ser possível corrigir o peso, a data e a observação de uma pesagem. A data de uma pesagem feita em sessão de manejo não pode ser corrigida (`RN-ANIMAL-09`).
- [ ] Deve ser possível anular uma pesagem, mediante confirmação do usuário. A pesagem anulada sai do histórico e dos cálculos.
- [ ] O registro, a correção ou a anulação de uma pesagem deve atualizar o `Peso Atual` do animal (`RN-ANIMAL-07`).
- [ ] Se o animal estiver em uma operação em aberto relacionada, o sistema deve informar o conflito antes do registro (`RN-ANIMAL-10`).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona as pesagens durante a edição do animal (`RF-ANIMAL-03`).
2. O sistema exibe as pesagens válidas do animal, da mais recente para a mais antiga, indicando nas pesagens corrigidas o valor lançado originalmente e a data da correção (`RN-ANIMAL-09`).
3. O usuário informa o peso, a data (inicialmente hoje) e, se desejar, uma observação, podendo também corrigir ou anular uma pesagem (ver fluxos alternativos).
4. O usuário aciona o registro da pesagem.
5. O sistema valida os dados (`RN-ANIMAL-06`), registra a pesagem, atualiza o `Peso Atual` se ela for a mais recente (`RN-ANIMAL-07`) e exibe a mensagem: _"Pesagem de {peso} registrada."_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Animal em operação em aberto (passo 3):**
  1. O animal está em uma operação em aberto relacionada (`RN-ANIMAL-10`).
  2. O sistema informa o conflito antes do registro.
  3. O fluxo retorna ao passo 3.

- **A2 – Data futura (passo 5):**
  1. A data informada é posterior a hoje (`RN-ANIMAL-06`).
  2. O sistema impede o registro e exibe a mensagem: _"A data não pode ser futura."_
  3. O fluxo retorna ao passo 3.

- **A3 – Correção de pesagem (passo 3):**
  1. O usuário corrige o peso, a data ou a observação de uma pesagem. A data de uma pesagem feita em sessão de manejo não pode ser corrigida (`RN-ANIMAL-09`).
  2. O sistema registra a correção, mantendo conhecido o valor lançado originalmente, e atualiza o `Peso Atual` do animal (`RN-ANIMAL-07`).
  3. O fluxo termina.

- **A4 – Anulação de pesagem (passo 3):**
  1. O usuário aciona a anulação de uma pesagem.
  2. O sistema solicita a confirmação da anulação.
  3. O usuário confirma a anulação.
  4. O sistema retira a pesagem do histórico e dos cálculos, atualiza o `Peso Atual` do animal, que passa a ser o da pesagem anterior quando a anulada era a mais recente (`RN-ANIMAL-07`), e exibe a mensagem: _"Pesagem excluída."_
  5. O fluxo termina.

- **A5 – Anulação cancelada (passo A4.3):**
  1. O usuário não confirma a anulação.
  2. O sistema mantém a pesagem inalterada.
  3. O fluxo retorna ao passo 3.

</div>

## 2.6 - `RF-ANIMAL-06`: Identificação do Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite consultar o histórico de brincos e de RFID de um animal, registrar uma troca ou remoção da identificação e corrigir ou anular registros lançados com erro. Brinco e RFID têm históricos independentes e seguem as mesmas regras.

|                       |                                                                                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **trocar e corrigir o brinco e o RFID de um animal** para mantê-lo corretamente identificado, sem perder o histórico. |
| **Dependências**      | `RF-ANIMAL-03`                                                                                                                                                     |
| **Regras Vinculadas** | `RN-ANIMAL-01`, `RN-ANIMAL-02`, `RN-ANIMAL-09`, `RN-ANIMAL-10`                                                                                                     |
| **Atores**            | Administrador, Gerente                                                                                                                                             |
| **Plataformas**       | Web                                                                                                                                                                |

### 2.6.2 - Critérios de Aceitação

- [ ] Exibir o histórico de brincos (ou de RFID) do animal, do mais recente para o mais antigo, com data, valor ou indicação de remoção, observação e se foi feito em sessão de manejo.
- [ ] Registros corrigidos devem indicar o valor lançado originalmente e a data da correção (`RN-ANIMAL-09`).
- [ ] Deve ser possível registrar um novo brinco (ou RFID), com uma observação opcional, na data de hoje. O novo valor deve ser diferente do atual.
- [ ] Deve ser possível remover o brinco (ou RFID) atual, mediante confirmação do usuário; a remoção entra no histórico (`RN-ANIMAL-02`).
- [ ] Deve ser possível corrigir o valor, a data e a observação de um registro. A data de um registro feito em sessão de manejo não pode ser corrigida, e nenhuma data pode ser futura (`RN-ANIMAL-09`).
- [ ] Deve ser possível anular um registro, mediante confirmação do usuário. O registro anulado sai do histórico.
- [ ] O registro, a correção ou a anulação deve atualizar o `Brinco` (ou `RFID`) atual do animal para o do registro válido mais recente.
- [ ] O registro, a correção ou a anulação deve ser impedida se levar o animal a um brinco (ou RFID) em uso por outro animal ativo da propriedade (`RN-ANIMAL-01`).
- [ ] Se o animal estiver em uma operação em aberto relacionada, o sistema deve informar o conflito antes do registro (`RN-ANIMAL-10`).

### 2.6.3 - Fluxos

Os fluxos abaixo descrevem o brinco; o RFID segue os mesmos fluxos.

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a identificação durante a edição do animal (`RF-ANIMAL-03`).
2. O sistema exibe o histórico de brincos do animal, do mais recente para o mais antigo, indicando nos registros corrigidos o valor lançado originalmente e a data da correção (`RN-ANIMAL-09`).
3. O usuário informa o novo brinco e, se desejar, uma observação, podendo também remover o brinco atual ou corrigir e anular registros (ver fluxos alternativos).
4. O usuário aciona o registro do brinco.
5. O sistema valida o brinco (`RN-ANIMAL-01`), registra a troca no histórico na data de hoje e atualiza o `Brinco` atual do animal (`RN-ANIMAL-02`).
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Animal em operação em aberto (passo 3):**
  1. O animal está em uma operação em aberto relacionada (`RN-ANIMAL-10`).
  2. O sistema informa o conflito antes do registro.
  3. O fluxo retorna ao passo 3.

- **A2 – Brinco em uso por outro animal (passos 5, A5.2 e A6.4):**
  1. O brinco resultante já identifica outro animal ativo da propriedade (`RN-ANIMAL-01`).
  2. O sistema impede a operação e exibe a mensagem: _"Brinco {brinco} já está em uso pelo animal de ID {ID}."_
  3. O fluxo retorna ao passo 3.

- **A3 – Brinco igual ao atual (passo 5):**
  1. O brinco informado é o mesmo que o animal já possui.
  2. O sistema impede o registro e exibe a mensagem: _"Este já é o brinco atual do animal."_
  3. O fluxo retorna ao passo 3.

- **A4 – Remoção do brinco (passo 3):**
  1. O usuário aciona a remoção do brinco atual.
  2. O sistema solicita a confirmação da remoção.
  3. O usuário confirma a remoção.
  4. O sistema registra a remoção no histórico, e o animal fica sem brinco (`RN-ANIMAL-02`).
  5. O fluxo termina.

- **A5 – Correção de registro (passo 3):**
  1. O usuário corrige o valor, a data ou a observação de um registro. A data de um registro feito em sessão de manejo não pode ser corrigida, e nenhuma data pode ser futura (`RN-ANIMAL-09`).
  2. O sistema registra a correção, mantendo conhecido o valor lançado originalmente, e atualiza o `Brinco` atual do animal para o do registro válido mais recente.
  3. O fluxo termina.

- **A6 – Anulação de registro (passo 3):**
  1. O usuário aciona a anulação de um registro, por exemplo de um brinco atual lançado por engano.
  2. O sistema solicita a confirmação da anulação.
  3. O usuário confirma a anulação.
  4. O sistema retira o registro do histórico e atualiza o `Brinco` atual do animal para o do registro válido mais recente.
  5. O fluxo termina.

- **A7 – Ação cancelada (passos A4.3 e A6.3):**
  1. O usuário não confirma a ação.
  2. O sistema mantém o histórico inalterado.
  3. O fluxo retorna ao passo 3.

</div>

## 2.7 - `RF-ANIMAL-07`: Castração do Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.7.1 - Descrição

Permite consultar o histórico de castrações de um animal, registrar uma castração avulsa e corrigir ou anular castrações lançadas com erro.

|                       |                                                                                                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar e corrigir a castração de um animal** para manter correta a condição e o histórico do animal. |
| **Dependências**      | `RF-ANIMAL-03`, `RF-CAST-01` (técnicas de castração)                                                                                                   |
| **Regras Vinculadas** | `RN-ANIMAL-06`, `RN-ANIMAL-08`, `RN-ANIMAL-09`, `RN-ANIMAL-10`                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                    |

### 2.7.2 - Critérios de Aceitação

- [ ] Exibir as castrações válidas do animal, com data, técnica, observação e se foi feita em sessão de manejo.
- [ ] Castrações corrigidas devem indicar os valores lançados originalmente que mudaram e a data da correção (`RN-ANIMAL-09`).
- [ ] Deve ser possível registrar uma castração avulsa informando a data (inicialmente hoje), a técnica (obrigatória), escolhida entre as técnicas ativas, e uma observação. A data deve respeitar `RN-ANIMAL-06`.
- [ ] Se o animal já for castrado, o registro é uma recastração e a observação, com o motivo, passa a ser obrigatória (`RN-ANIMAL-08`).
- [ ] O registro de uma castração torna o animal castrado.
- [ ] Deve ser possível corrigir a data, a técnica e a observação de uma castração. A data de uma castração feita em sessão de manejo não pode ser corrigida (`RN-ANIMAL-09`). Na correção, a técnica já registrada pode ser mantida mesmo que tenha sido desativada.
- [ ] Deve ser possível anular uma castração, mediante confirmação do usuário. Ao anular a única castração válida, o usuário deve informar se o animal continua castrado (`RN-ANIMAL-08`).
- [ ] Se o animal estiver em uma operação em aberto com castração, o sistema deve avisar antes do registro (`RN-ANIMAL-10`).

### 2.7.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a castração durante a edição do animal (`RF-ANIMAL-03`).
2. O sistema exibe as castrações válidas do animal, indicando nas castrações corrigidas os valores lançados originalmente que mudaram e a data da correção (`RN-ANIMAL-09`).
3. O usuário informa a data (inicialmente hoje), a técnica, escolhida entre as técnicas ativas, e, se desejar, uma observação, podendo também corrigir ou anular uma castração (ver fluxos alternativos).
4. O usuário aciona o registro da castração.
5. O sistema valida os dados (`RN-ANIMAL-06`), registra a castração, e o animal passa a ser castrado (`RN-ANIMAL-08`).
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Animal em operação em aberto com castração (passo 3):**
  1. O animal está em uma operação em aberto com castração (`RN-ANIMAL-10`).
  2. O sistema avisa sobre a operação em aberto antes do registro.
  3. O fluxo retorna ao passo 3.

- **A2 – Recastração (passo 3):**
  1. O animal já é castrado.
  2. O sistema indica que o registro é uma recastração e passa a exigir a observação, com o motivo (`RN-ANIMAL-08`).
  3. O fluxo retorna ao passo 3.

- **A3 – Recastração sem motivo (passo 5):**
  1. O animal já é castrado, e a observação não foi informada (`RN-ANIMAL-08`).
  2. O sistema impede o registro e exibe a mensagem: _"Informe o motivo da recastração."_
  3. O fluxo retorna ao passo 3.

- **A4 – Correção de castração (passo 3):**
  1. O usuário corrige a data, a técnica ou a observação de uma castração. A data de uma castração feita em sessão de manejo não pode ser corrigida, e a técnica já registrada pode ser mantida mesmo que tenha sido desativada (`RN-ANIMAL-09`).
  2. O sistema registra a correção, mantendo conhecidos os valores lançados originalmente.
  3. O fluxo termina.

- **A5 – Anulação de castração (passo 3):**
  1. O usuário aciona a anulação de uma castração.
  2. O sistema solicita a confirmação da anulação.
  3. O usuário confirma a anulação.
  4. O sistema anula a castração.
  5. O fluxo termina.

- **A6 – Anulação da única castração (passo A5.4):**
  1. A castração anulada é a única castração válida do animal.
  2. O sistema pergunta se o animal continua castrado (por exemplo, se já chegou castrado) e mantém a condição conforme a resposta (`RN-ANIMAL-08`).
  3. O fluxo termina.

- **A7 – Anulação cancelada (passo A5.3):**
  1. O usuário não confirma a anulação.
  2. O sistema mantém a castração inalterada.
  3. O fluxo retorna ao passo 3.

</div>

## 2.8 - `RF-ANIMAL-08`: Detalhes do Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.8.1 - Descrição

Permite consultar as informações detalhadas de um animal: dados cadastrais, indicadores, compra e o histórico completo da sua vida no rebanho.

|                       |                                                                                                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consultar os detalhes de um animal** para conhecer a sua situação atual e tudo o que aconteceu com ele. |
| **Dependências**      | `RF-ANIMAL-01`, `RF-ANIMAL-02`                                                                                                                         |
| **Regras Vinculadas** | `RN-ANIMAL-02`, `RN-ANIMAL-03`, `RN-ANIMAL-07`, `RN-LOTE-08`                                                                                           |
| **Atores**            | Administrador, Gerente                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                    |

### 2.8.2 - Critérios de Aceitação

- [ ] Exibir a identificação, a `Situação`, a `Origem` e se o animal é castrado.
- [ ] Exibir `Apelido`, `Sexo`, `Raça`, `Data de Nascimento`, desde quando o animal está na propriedade e a data do cadastro.
- [ ] Exibir o `Peso Atual` e a data da pesagem, a `Idade` (indicando quando é aproximada), o `Ganho Médio Diário` (`RN-LOTE-08`) e o lote atual.
- [ ] Se o animal foi comprado, exibir o vendedor, a data e o valor da compra, o peso de entrada, o preço por arroba (quando houver), o número da GTA e as observações.
- [ ] Exibir a evolução do peso ao longo do tempo e a lista de pesagens.
- [ ] Exibir o histórico de lotes, de identificação (brincos e RFID), de castrações, de propriedades e dos manejos sanitários recebidos, estes com data, procedimento, veterinário, carência, próxima dose e dose aplicada.
- [ ] Exibir a atividade recente do animal, em ordem cronológica decrescente, reunindo pesagens, trocas de lote e de propriedade, identificações, castrações, manejos sanitários e a compra.
- [ ] Os históricos devem considerar apenas os registros válidos: manejos anulados e manejos de sessões não consolidadas não são exibidos.
- [ ] Permitir acionar a edição (`RF-ANIMAL-03`) e a exclusão do animal (`RF-ANIMAL-09`).

### 2.8.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de um animal na listagem (`RF-ANIMAL-01`).
2. O sistema exibe a identificação, a `Situação`, a `Origem`, se o animal é castrado, os dados cadastrais e os indicadores: `Peso Atual` e data da pesagem, `Idade`, indicando quando é aproximada (ex.: "~18 meses"), `Ganho Médio Diário` (`RN-LOTE-08`) e lote atual.
3. O sistema exibe a evolução do peso, a lista de pesagens, os históricos de lotes, de identificação, de castrações, de propriedades e de manejos sanitários e a atividade recente, considerando apenas os registros válidos.
4. O usuário consulta as informações (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Animal comprado (passo 2):**
  1. O animal foi comprado.
  2. O sistema exibe também o vendedor, a data e o valor da compra, o peso de entrada, o preço por arroba (quando houver), o número da GTA e as observações.
  3. O fluxo continua no passo 3.

- **A2 – Edição (passo 4):**
  1. O usuário aciona a edição do animal.
  2. O fluxo continua em `RF-ANIMAL-03`.

- **A3 – Exclusão (passo 4):**
  1. O usuário aciona a exclusão do animal.
  2. O fluxo continua em `RF-ANIMAL-09`.

</div>

## 2.9 - `RF-ANIMAL-09`: Excluir Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.9.1 - Descrição

Permite desfazer o cadastro de um animal feito por engano (duplicado, com dados errados ou na propriedade errada). Um animal que já tem história no rebanho não é excluído: ele sai do rebanho pela mudança de situação (`RF-ANIMAL-10`).

|                       |                                                                                                                                         |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **excluir um animal cadastrado por engano** para manter o rebanho registrado corretamente. |
| **Dependências**      | `RF-ANIMAL-02`                                                                                                                          |
| **Regras Vinculadas** | —                                                                                                                                       |
| **Atores**            | Administrador, Gerente                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                     |

### 2.9.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário, informando que a ação não poderá ser desfeita.
- [ ] O animal só pode ser excluído se não tiver registros além dos criados pelo próprio cadastro (`RF-ANIMAL-02`). A exclusão deve ser impedida, com o motivo, quando o animal:
  - não estiver ativo;
  - tiver sido movimentado entre propriedades ou lotes;
  - tiver participado de sessão de manejo, recebido manejo sanitário ou marcação, ou tiver mais de um registro de pesagem, brinco, RFID ou castração;
  - estiver vinculado a uma compra que envolva outros registros além dele.
- [ ] Ao excluir o animal, os registros criados pelo cadastro devem ser excluídos junto: a entrada na propriedade e no lote, a pesagem, o brinco, o RFID e a castração iniciais e, se houver, a compra registrada no cadastro.

### 2.9.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Excluir" de um animal na listagem (`RF-ANIMAL-01`) ou nos detalhes do animal (`RF-ANIMAL-08`).
2. O sistema solicita a confirmação da exclusão, informando que a ação não poderá ser desfeita.
3. O usuário confirma a exclusão.
4. O sistema verifica que o animal não tem registros além dos criados pelo próprio cadastro, exclui o animal junto com esses registros e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Animal com manejos (passo 4):**
  1. O animal já recebeu manejos além dos do cadastro.
  2. O sistema impede a exclusão e exibe a mensagem: _"Não é possível excluir: o animal já possui manejos registrados."_
  3. O fluxo termina com falha.

- **A3 – Animal movimentado (passo 4):**
  1. O animal já trocou de lote ou de propriedade.
  2. O sistema impede a exclusão e exibe a mensagem: _"Não é possível excluir: o animal já foi movimentado entre propriedades ou lotes."_
  3. O fluxo termina com falha.

- **A4 – Outro impedimento (passo 4):**
  1. O animal não está ativo ou está vinculado a uma compra que envolve outros registros além dele.
  2. O sistema impede a exclusão e informa o motivo.
  3. O fluxo termina com falha.

</div>

## 🚧 2.10 - `RF-ANIMAL-10`: Registrar Saída do Animal (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.10.1 - Descrição

Permite registrar a saída de um animal do rebanho, por venda, doação, morte, descarte ou abate. O animal continua registrado, com todo o seu histórico, mas deixa de participar das operações do dia a dia.

|                       |                                                                                                                                                       |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar a saída de um animal do rebanho** para que o rebanho reflita os animais que de fato existem. |
| **Dependências**      | `RF-ANIMAL-02`                                                                                                                                        |
| **Regras Vinculadas** | `RN-ANIMAL-01`, `RN-ANIMAL-04`                                                                                                                        |
| **Atores**            | Administrador, Gerente                                                                                                                                |
| **Plataformas**       | Web                                                                                                                                                   |

### 2.10.2 - Critérios de Aceitação

- [ ] A saída deve registrar o motivo (venda, doação, morte, descarte ou abate) e a data, que deve respeitar `RN-ANIMAL-06`.
- [ ] Ao sair, o animal deixa o seu lote, e o seu brinco e o seu RFID passam a poder ser usados por outro animal (`RN-ANIMAL-01`).
- [ ] A saída deve ser impedida quando conflitar com uma operação em aberto do animal (`RN-ANIMAL-10`).
- [ ] ... (dados específicos de cada motivo, como comprador e valor na venda, a definir)

</div>
