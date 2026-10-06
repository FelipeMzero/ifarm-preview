# 📦 Módulo: `MOD-ABATES`

Módulo responsável pelo registro dos abates feitos na própria fazenda para consumo da propriedade (ex.: alimentação da sede e dos funcionários, ou uma festa). O módulo deve possibilitar consulta, planejamento, revisão, consolidação e cancelamento de abates.

Um abate reúne os animais da propriedade selecionada abatidos na fazenda em uma mesma data. O abate é planejado com antecedência como pendente e pode ser revisado à vontade; os animais só saem do rebanho quando ele é consolidado, depois de realizado.

O abate em frigorífico não faz parte deste módulo: é uma venda com finalidade de abate, especificada no [módulo de vendas](mod-13-vendas.md), e o animal sai do rebanho como `Vendido`.

## Dicionário de dados conceitual

**Abate**

| Campo           | Descrição                                                                      | Tipo       | Obrig. | Restrições                                                                                |
| --------------- | ------------------------------------------------------------------------------ | ---------- | ------ | ----------------------------------------------------------------------------------------- |
| `Título`        | Identifica o abate, como "Consumo da sede de outubro" ou "Festa de fim de ano" | Texto      | Sim    | Até 100 caracteres                                                                        |
| `Data Prevista` | Data planejada para o abate                                                    | Data       | Sim    | Pode ser futura (`RN-ABATE-04`)                                                           |
| `Data do Abate` | Data em que o abate de fato aconteceu                                          | Data       | Não    | Informada na consolidação; não pode ser futura (`RN-ABATE-04`)                            |
| `Observação`    | Finalidade ou outros detalhes do abate                                         | Texto      | Não    | Até 500 caracteres                                                                        |
| `Animais`       | Animais destinados ao abate                                                    | Lista      | Não    | Ao menos um para consolidar                                                               |
| `Situação`      | Situação do abate                                                              | Enum       | Sim    | `Pendente`, `Consolidado` ou `Cancelado` (`RN-ABATE-02`)                                  |
| `Propriedade`   | Propriedade de onde os animais saem para o abate                               | Referência | Sim    | Propriedade selecionada (ver [Propriedade selecionada](comum.md#propriedade-selecionada)) |

**Animal abatido**

| Campo        | Descrição                                             | Tipo       | Obrig. | Restrições                                                  |
| ------------ | ----------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| `Animal`     | Animal destinado ao abate                             | Referência | Sim    | Animal ativo da propriedade (`RN-ABATE-03`, `RN-MANEJO-10`) |
| `Observação` | Detalhes sobre o animal, como uma ocorrência no abate | Texto      | Não    | Até 500 caracteres                                          |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-ABATE-01` - Abate na Fazenda:** Um animal é abatido quando sai do rebanho para ser abatido na própria fazenda, para o consumo da propriedade.
- **`RN-ABATE-02` - Abate Planejado:** O abate é planejado com antecedência: os animais são escolhidos e o abate é agendado. Até o abate acontecer, os animais continuam no rebanho, pois os animais escolhidos podem mudar ou o abate pode não se realizar.
- **`RN-ABATE-03` - Destino Único:** Um animal destinado a um abate não pode estar destinado, ao mesmo tempo, a outro abate ou a uma venda, pois não pode ser entregue duas vezes.
- **`RN-ABATE-04` - Data do Abate:** O abate é previsto para uma data, mas pode acontecer em outra. Ele só é dado como realizado depois de acontecer, e a data em que aconteceu não pode ser anterior à chegada do animal ao lote em que ele estava.
- **`RN-ABATE-05` - Carne para Consumo:** A carne de um animal abatido na fazenda é para consumo da propriedade e não pode ser vendida, pois não passou por um estabelecimento com inspeção sanitária (SIF, SIE ou SIM).

A carência sanitária também se aplica: até o fim do período de carência de um procedimento, o animal que o recebeu não pode ser abatido (`RN-MANEJO-10`).

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-ABATE-01`: Listagem de Abates

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar os abates da propriedade selecionada, com busca, filtro e acesso às ações disponíveis para cada abate.

|                       |                                                                                                                                                                       |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar os abates registrados** para acompanhar os que estão planejados e consultar os já realizados ou cancelados. |
| **Dependências**      | —                                                                                                                                                                     |
| **Regras Vinculadas** | `RN-ABATE-02`                                                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                                |
| **Plataformas**       | Web                                                                                                                                                                   |
| **Versão**            | 1                                                                                                                                                                     |
| **Especificação**     | 📌 Definida                                                                                                                                                           |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas os abates da propriedade selecionada.
- [ ] Deve permitir exibir as colunas data (a `Data Prevista` ou, se consolidado, a `Data do Abate`), `Título`, quantidade de animais, `Situação`, `Observação` e `Atualizado em`.
- [ ] A data e o `Título` são sempre visíveis; `Observação` e `Atualizado em` iniciam ocultas.
- [ ] A ordenação inicial é pela data, da mais recente para a mais antiga.
- [ ] A pesquisa deve considerar `Título` e `Observação`.
- [ ] Os filtros disponíveis são: pendentes, consolidados, cancelados e todos. O filtro inicial é "pendentes".
- [ ] As ações disponíveis para cada abate dependem da sua situação: de um pendente, editar (`RF-ABATE-03`), consolidar (`RF-ABATE-04`) e cancelar (`RF-ABATE-05`); de um consolidado ou cancelado, consultar (`RF-ABATE-03`).
- [ ] Deve permitir acionar o planejamento de um novo abate (`RF-ABATE-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de abates.
2. O sistema exibe os abates pendentes da propriedade selecionada, da data mais recente para a mais antiga, de forma paginada.
3. O usuário localiza o abate desejado, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para o abate.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Nenhum abate pendente (passo 2):**
  1. Não há abates pendentes na propriedade selecionada.
  2. O sistema exibe a mensagem: _"Nenhum abate pendente."_
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe os abates que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A3 – Pesquisa sem resultados (passo A2.2):**
  1. Nenhum abate corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A5 – Novo abate (passo 3):**
  1. O usuário aciona o planejamento de um novo abate.
  2. O fluxo continua em `RF-ABATE-02`.

</div>

## 2.2 - `RF-ABATE-02`: Planejar Abate

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite planejar um abate pendente: os seus dados e os animais destinados a ele. O planejamento não tira os animais do rebanho, o que só acontece na consolidação (`RF-ABATE-04`).

|                       |                                                                                                                                     |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **planejar um abate e selecionar os animais** para organizar o abate com antecedência. |
| **Dependências**      | `RF-ABATE-01`, `RF-ANIMAL-02`                                                                                                       |
| **Regras Vinculadas** | `RN-ABATE-01`, `RN-ABATE-02`, `RN-ABATE-03`, `RN-ABATE-04`, `RN-ABATE-05`, `RN-MANEJO-10`                                           |
| **Atores**            | Administrador, Gerente                                                                                                              |
| **Plataformas**       | Web                                                                                                                                 |
| **Versão**            | 1                                                                                                                                   |
| **Especificação**     | 📌 Definida                                                                                                                         |

### 2.2.2 - Critérios de Aceitação

- [ ] O planejamento é feito em duas etapas: dados do abate e animais. Só é possível avançar para os animais com os dados válidos, e voltar aos dados a qualquer momento.
- [ ] Os campos `Título` e `Data Prevista` são obrigatórios. A `Data Prevista` inicia com a data de hoje e pode ser futura (`RN-ABATE-04`). A `Data do Abate` só é informada na consolidação (`RF-ABATE-04`).
- [ ] Os animais devem ser escolhidos entre os animais ativos da propriedade, com busca por `ID`, `Brinco`, `RFID` ou `Apelido` e filtros por lote, sexo e faixa de peso. Deve ser possível selecionar individualmente ou todos os animais filtrados.
- [ ] Devem aparecer indisponíveis, com o motivo, e não entram na seleção de todos os filtrados, os animais que:
  - já estão em outro abate pendente ou em uma venda em aberto (`RN-ABATE-03`);
  - estarão em período de carência na `Data Prevista`, informando o procedimento e a data de fim da carência (`RN-MANEJO-10`).
- [ ] Animais que estão em uma perda pendente devem ser indicados com um aviso, sem impedir a seleção.
- [ ] Os animais selecionados devem ser exibidos com a sua identificação, o seu lote atual e o seu peso atual, com o total de animais e o peso médio, e podem ser retirados da seleção.
- [ ] Ao alterar a `Data Prevista`, os animais selecionados devem ser verificados novamente quanto à carência, destacando os que passarem a estar em carência na nova data (`RN-MANEJO-10`).
- [ ] Deve ser informado que o abate fica pendente e que os animais só saem do rebanho quando ele for consolidado (`RN-ABATE-02`).
- [ ] O abate pode ser salvo sem animais, mas só pode ser consolidado com ao menos um.
- [ ] O abate é criado com a situação `Pendente`.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o planejamento de um novo abate na listagem (`RF-ABATE-01`).
2. O sistema exibe a etapa de dados do abate, com a `Data Prevista` igual a hoje, e informa que o abate fica pendente até ser consolidado.
3. O usuário informa `Título`, `Data Prevista` e `Observação` e avança para os animais.
4. O sistema valida os dados e exibe a etapa de animais.
5. O usuário seleciona os animais e, se necessário, informa uma observação em algum deles (ver fluxos alternativos).
6. O usuário aciona a ação "Salvar".
7. O sistema valida os animais (`RN-ABATE-03`, `RN-MANEJO-10`), cria o abate com a situação `Pendente` e exibe a mensagem: _"Abate salvo como pendente!"_
8. O fluxo termina.

**Fluxos alternativos**

- **A1 – Seleção de animais (passo 5):**
  1. O usuário pesquisa por `ID`, `Brinco`, `RFID` ou `Apelido` e filtra por lote, sexo e faixa de peso.
  2. O sistema exibe os animais ativos da propriedade que correspondem à pesquisa e aos filtros, indicando como indisponíveis, com o motivo, os que já estão em outro abate pendente ou em uma venda em aberto (`RN-ABATE-03`) e os que estarão em carência na `Data Prevista` (`RN-MANEJO-10`), e indicando com um aviso os que estão em uma perda pendente.
  3. O usuário seleciona os animais individualmente ou todos os filtrados; os indisponíveis não entram na seleção de todos os filtrados.
  4. O sistema acrescenta os animais à seleção e atualiza o total e o peso médio.
  5. O fluxo retorna ao passo 5.

- **A2 – Observação de um animal (passo 5):**
  1. O usuário informa uma observação para um animal selecionado.
  2. O sistema atualiza o animal.
  3. O fluxo retorna ao passo 5.

- **A3 – Retirada de animal (passo 5):**
  1. O usuário retira um animal da seleção.
  2. O sistema retira o animal e atualiza o total e o peso médio.
  3. O fluxo retorna ao passo 5.

- **A4 – Volta aos dados (passo 5):**
  1. O usuário volta à etapa de dados do abate.
  2. O sistema exibe os dados, mantendo os animais selecionados.
  3. O fluxo retorna ao passo 3.

- **A5 – Alteração da data com animais selecionados (passo 3):**
  1. O usuário altera a `Data Prevista` com animais já selecionados.
  2. O sistema verifica novamente a carência dos animais na nova data e destaca os que passarem a estar em carência (`RN-MANEJO-10`).
  3. O fluxo retorna ao passo 3.

- **A6 – Campos obrigatórios ausentes (passo 4):**
  1. O `Título` ou a `Data Prevista` não foi preenchido.
  2. O sistema impede o avanço, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A7 – Animal indisponível (passo 7):**
  1. Um animal acrescentado ao abate deixou de estar ativo na propriedade, passou a estar em outro abate ou venda em aberto (`RN-ABATE-03`) ou estará em carência na `Data Prevista` (`RN-MANEJO-10`).
  2. O sistema impede a gravação e informa os animais indisponíveis, com o motivo.
  3. O fluxo retorna ao passo 5.

</div>

## 2.3 - `RF-ABATE-03`: Revisar Abate

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite revisar e editar um abate pendente, quantas vezes for necessário até a sua consolidação, e consultar um abate consolidado ou cancelado.

|                       |                                                                                                                                    |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **revisar um abate pendente** para ajustar os animais e a data até o abate acontecer. |
| **Dependências**      | `RF-ABATE-01`, `RF-ABATE-02`                                                                                                       |
| **Regras Vinculadas** | `RN-ABATE-02`, `RN-ABATE-03`, `RN-ABATE-04`, `RN-MANEJO-10`                                                                        |
| **Atores**            | Administrador, Gerente                                                                                                             |
| **Plataformas**       | Web                                                                                                                                |
| **Versão**            | 1                                                                                                                                  |
| **Especificação**     | 📌 Definida                                                                                                                        |

### 2.3.2 - Critérios de Aceitação

- [ ] Um abate pendente pode ser editado com as mesmas etapas e regras do planejamento (`RF-ABATE-02`): todos os dados podem ser alterados, e animais podem ser acrescentados ou retirados.
- [ ] Um abate consolidado ou cancelado é exibido apenas para consulta, informando a data e a hora em que foi consolidado ou cancelado.
- [ ] Na edição de um abate pendente, os animais que não estão mais ativos na propriedade devem ser destacados, com a sua situação atual, conforme [Operações com animais selecionados](comum.md#operações-com-animais-selecionados).
- [ ] Na edição de um abate pendente, os animais que estarão em carência na `Data Prevista` devem ser destacados, com o procedimento e a data de fim da carência (`RN-MANEJO-10`).
- [ ] Na consulta de um abate consolidado, cada animal deve ser exibido com o lote de onde saiu.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de um abate pendente na listagem (`RF-ABATE-01`).
2. O sistema exibe os dados e os animais atuais do abate, destacando os que não estão mais ativos ou que estarão em carência, e informa que ele continua pendente até ser consolidado.
3. O usuário altera os dados ou os animais, como no planejamento (`RF-ABATE-02`).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-ABATE-03`, `RN-MANEJO-10`), persiste as alterações e exibe a mensagem: _"Abate atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Consulta de abate encerrado (passo 1):**
  1. O usuário aciona a consulta de um abate consolidado ou cancelado na listagem (`RF-ABATE-01`).
  2. O sistema exibe o abate apenas para consulta, com a data e a hora da consolidação ou do cancelamento e, se consolidado, o lote de onde cada animal saiu.
  3. O fluxo termina.

- **A2 – Abate encerrado durante a edição (passo 5):**
  1. O abate foi consolidado ou cancelado enquanto era editado (`RN-ABATE-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"Somente abates pendentes podem ser alterados."_
  3. O fluxo termina com falha.

- **A3 – Dados inválidos (passo 5):**
  1. Os dados ou os animais não respeitam as regras do planejamento (`RF-ABATE-02`, fluxos A6 e A7).
  2. O sistema impede a gravação e informa o motivo, como no planejamento.
  3. O fluxo retorna ao passo 3.

</div>

## 2.4 - `RF-ABATE-04`: Consolidar Abate

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite encerrar um abate pendente depois de realizado, fazendo os animais saírem do rebanho como abatidos.

|                       |                                                                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consolidar um abate realizado** para que os animais abatidos deixem de constar no rebanho ativo. |
| **Dependências**      | `RF-ABATE-01`, `RF-ABATE-02`                                                                                                                    |
| **Regras Vinculadas** | `RN-ABATE-01`, `RN-ABATE-02`, `RN-ABATE-04`, `RN-MANEJO-10`                                                                                     |
| **Atores**            | Administrador, Gerente                                                                                                                          |
| **Plataformas**       | Web                                                                                                                                             |
| **Versão**            | 1                                                                                                                                               |
| **Especificação**     | 📌 Definida                                                                                                                                     |

### 2.4.2 - Critérios de Aceitação

- [ ] Somente abates pendentes podem ser consolidados.
- [ ] A consolidação exige que seja informada a `Data do Abate`, que inicia com a `Data Prevista`, se ela não for futura, ou com a data de hoje (`RN-ABATE-04`).
- [ ] A consolidação exige confirmação do usuário, informando quantos animais sairão do rebanho como abatidos, na `Data do Abate`, e que o abate não poderá mais ser alterado.
- [ ] A consolidação deve ser impedida se: o abate não tiver animais; a `Data do Abate` for futura ou anterior à entrada de algum animal no seu lote atual (`RN-ABATE-04`); algum animal estiver em carência na `Data do Abate` (`RN-MANEJO-10`); ou algum animal não estiver mais ativo na propriedade (ver [Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
- [ ] A carência deve ser verificada novamente na consolidação, pois um procedimento sanitário pode ter sido registrado depois do planejamento.
- [ ] A consolidação não é impedida por outras operações em aberto dos animais, como uma sessão de manejo ou uma transferência de lote; essas operações é que passam a destacar os animais abatidos ([Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
- [ ] Na consolidação, cada animal passa à situação `Abatido` e sai do seu lote na `Data do Abate` (ou com o horário da consolidação, se o abate for de hoje), e o seu brinco e o seu RFID passam a poder ser usados por outro animal (`RN-ANIMAL-01`, `RN-ANIMAL-04`).
- [ ] O lote de onde cada animal saiu fica registrado no abate.

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Consolidar" de um abate pendente na listagem (`RF-ABATE-01`).
2. O sistema solicita a `Data do Abate`, já preenchida com a `Data Prevista`, se ela não for futura, ou com a data de hoje, e a confirmação, informando quantos animais sairão do rebanho como abatidos e que o abate não poderá mais ser alterado.
3. O usuário mantém ou ajusta a `Data do Abate` e confirma a consolidação.
4. O sistema verifica que a consolidação não tem impedimentos (`RN-ABATE-04`, `RN-MANEJO-10`).
5. O sistema altera a situação do abate para `Consolidado`, registra o lote de onde cada animal saiu e aplica a saída de cada animal (`RN-ANIMAL-01`, `RN-ANIMAL-04`).
6. O sistema exibe a mensagem: _"Abate consolidado! Os animais saíram do rebanho."_
7. O fluxo termina.

**Fluxos alternativos**

- **A1 – Consolidação não confirmada (passo 3):**
  1. O usuário não confirma a consolidação.
  2. O sistema mantém o abate pendente.
  3. O fluxo termina.

- **A2 – Abate sem animais (passo 4):**
  1. O abate não tem animais.
  2. O sistema impede a consolidação e exibe a mensagem: _"Adicione ao menos um animal antes de consolidar o abate."_
  3. O fluxo termina com falha.

- **A3 – Data do abate inválida (passo 4):**
  1. A `Data do Abate` é futura ou anterior à entrada de algum animal no seu lote atual (`RN-ABATE-04`).
  2. O sistema impede a consolidação e exibe a mensagem: _"A data do abate não pode ser futura."_ ou _"A data do abate é anterior à entrada no lote atual de: {animais}."_
  3. O fluxo termina com falha.

- **A4 – Animal em carência (passo 4):**
  1. Algum animal está em período de carência na `Data do Abate` (`RN-MANEJO-10`).
  2. O sistema impede a consolidação e exibe a mensagem: _"Animais em carência na data do abate: {animais}. Remova-os ou ajuste a data para consolidar."_
  3. O fluxo termina com falha.

- **A5 – Animal que saiu do rebanho (passo 4):**
  1. Um animal do abate deixou de estar ativo na propriedade depois de ser incluído nele (ver [Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
  2. O sistema impede a consolidação e exibe a mensagem: _"Animais que não estão mais ativos na propriedade: {animais}. Remova-os antes de consolidar."_
  3. O fluxo termina com falha.

</div>

## 2.5 - `RF-ABATE-05`: Cancelar Abate

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite cancelar um abate pendente que não será realizado, por exemplo quando o evento para o qual ele foi planejado não vai mais acontecer. O abate fica guardado para consulta, mas nenhum animal sai do rebanho.

|                       |                                                                                                                                            |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cancelar um abate pendente** que não será realizado, sem que nenhum animal saia do rebanho. |
| **Dependências**      | `RF-ABATE-01`, `RF-ABATE-02`                                                                                                               |
| **Regras Vinculadas** | `RN-ABATE-02`, `RN-ABATE-03`                                                                                                               |
| **Atores**            | Administrador, Gerente                                                                                                                     |
| **Plataformas**       | Web                                                                                                                                        |
| **Versão**            | 1                                                                                                                                          |
| **Especificação**     | 📝 Rascunho                                                                                                                                |

### 2.5.2 - Critérios de Aceitação

- [ ] Somente abates pendentes podem ser cancelados.
- [ ] O cancelamento exige confirmação do usuário, informando que nenhum animal sairá do rebanho e que o abate continuará disponível no filtro de cancelados.
- [ ] O cancelamento libera os animais para serem destinados a outro abate ou a uma venda (`RN-ABATE-03`).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Cancelar" de um abate pendente na listagem (`RF-ABATE-01`).
2. O sistema solicita a confirmação, informando que nenhum animal sairá do rebanho e que o abate continuará disponível no filtro de cancelados.
3. O usuário confirma o cancelamento.
4. O sistema altera a situação do abate para `Cancelado`, mantendo os seus animais para consulta, e exibe a mensagem: _"Abate cancelado."_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Cancelamento não confirmado (passo 3):**
  1. O usuário não confirma o cancelamento.
  2. O sistema mantém o abate inalterado.
  3. O fluxo termina.

</div>
