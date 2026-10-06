# 📦 Módulo: `MOD-PERDAS`

Módulo responsável pelo registro das perdas do rebanho: animais que morreram ou desapareceram. O módulo deve possibilitar consulta, registro, revisão, consolidação e cancelamento de perdas.

Uma perda reúne, em uma mesma data, os animais da propriedade selecionada que saíram do rebanho por morte ou desaparecimento (ex.: as mortes causadas por uma descarga elétrica, ou os animais que faltaram na contagem do mês). A perda é registrada como pendente e pode ser revisada à vontade; os animais só saem do rebanho quando ela é consolidada.

## Dicionário de dados conceitual

**Perda**

| Campo           | Descrição                                                                       | Tipo       | Obrig. | Restrições                                                                                |
| --------------- | ------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------- |
| `Título`        | Identifica a perda, como "Mortes pela descarga elétrica" ou "Contagem de março" | Texto      | Sim    | Até 100 caracteres                                                                        |
| `Data da Perda` | Data em que os animais morreram ou foram dados como desaparecidos               | Data       | Sim    | Não pode ser futura (`RN-PERDA-04`)                                                       |
| `Observação`    | Circunstâncias ou detalhes da perda                                             | Texto      | Não    | Até 500 caracteres                                                                        |
| `Animais`       | Animais perdidos, cada um com o seu tipo de perda                               | Lista      | Não    | Ao menos um para consolidar                                                               |
| `Situação`      | Situação da perda                                                               | Enum       | Sim    | `Pendente`, `Consolidada` ou `Cancelada` (`RN-PERDA-02`)                                  |
| `Propriedade`   | Propriedade em que a perda ocorreu                                              | Referência | Sim    | Propriedade selecionada (ver [Propriedade selecionada](comum.md#propriedade-selecionada)) |

**Animal perdido**

| Campo        | Descrição                                               | Tipo       | Obrig. | Restrições                                   |
| ------------ | ------------------------------------------------------- | ---------- | ------ | -------------------------------------------- |
| `Animal`     | Animal que saiu do rebanho                              | Referência | Sim    | Animal ativo da propriedade (`RN-PERDA-03`)  |
| `Tipo`       | Tipo de perda do animal                                 | Enum       | Sim    | `Morte` ou `Desaparecimento` (`RN-PERDA-01`) |
| `Observação` | Detalhes sobre o animal, como a causa provável da morte | Texto      | Não    | Até 500 caracteres                           |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-PERDA-01` - Morte e Desaparecimento:** Um animal é perdido quando morre ou desaparece, ou seja, quando falta no rebanho e não é encontrado. A causa da perda é de cada animal: uma mesma ocorrência, como um temporal, pode matar alguns animais e dispersar outros.
- **`RN-PERDA-02` - Apuração da Perda:** Uma perda só é dada como certa depois de apurada. Até lá, os animais continuam no rebanho, pois um animal dado como desaparecido pode ser encontrado e uma morte suspeita pode não se confirmar.
- **`RN-PERDA-03` - Perda Única:** Só pode ser perdido um animal que está no rebanho da propriedade, e um animal se perde uma única vez.
- **`RN-PERDA-04` - Data da Perda:** A perda acontece em uma data que já passou e não pode ser anterior à chegada do animal ao lote em que ele estava.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-PERDA-01`: Listagem de Perdas

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as perdas da propriedade selecionada, com busca, filtro e acesso às ações disponíveis para cada perda.

|                       |                                                                                                                                                                        |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar as perdas registradas** para acompanhar as que estão pendentes de consolidação e consultar as já encerradas. |
| **Dependências**      | —                                                                                                                                                                      |
| **Regras Vinculadas** | `RN-PERDA-02`                                                                                                                                                          |
| **Atores**            | Administrador, Gerente                                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                                    |
| **Versão**            | 1                                                                                                                                                                      |
| **Especificação**     | 📌 Definida                                                                                                                                                            |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas as perdas da propriedade selecionada.
- [ ] Deve permitir exibir as colunas `Data da Perda`, `Título`, quantidade de animais (com quantos mortos e quantos desaparecidos), `Situação`, `Observação` e `Atualizado em`.
- [ ] `Data da Perda` e `Título` são sempre visíveis; `Observação` e `Atualizado em` iniciam ocultas.
- [ ] A ordenação inicial é pela `Data da Perda`, da mais recente para a mais antiga.
- [ ] A pesquisa deve considerar `Título` e `Observação`.
- [ ] Os filtros disponíveis são: pendentes, consolidadas, canceladas e todas. O filtro inicial é "pendentes".
- [ ] As ações disponíveis para cada perda dependem da sua situação: de uma pendente, editar (`RF-PERDA-03`), consolidar (`RF-PERDA-04`) e cancelar (`RF-PERDA-05`); de uma consolidada ou cancelada, consultar (`RF-PERDA-03`).
- [ ] Deve permitir acionar o registro de uma nova perda (`RF-PERDA-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de perdas.
2. O sistema exibe as perdas pendentes da propriedade selecionada, da data mais recente para a mais antiga, de forma paginada.
3. O usuário localiza a perda desejada, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a perda.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Nenhuma perda pendente (passo 2):**
  1. Não há perdas pendentes na propriedade selecionada.
  2. O sistema exibe a mensagem: _"Nenhuma perda pendente."_
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as perdas que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A3 – Pesquisa sem resultados (passo A2.2):**
  1. Nenhuma perda corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A5 – Nova perda (passo 3):**
  1. O usuário aciona o registro de uma nova perda.
  2. O fluxo continua em `RF-PERDA-02`.

</div>

## 2.2 - `RF-PERDA-02`: Registrar Perda

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite registrar uma perda pendente: os seus dados e os animais que morreram ou desapareceram, cada um com o seu tipo de perda. O registro não tira os animais do rebanho, o que só acontece na consolidação (`RF-PERDA-04`).

|                       |                                                                                                                                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar uma perda e selecionar os animais perdidos** para que o rebanho reflita os animais que de fato existem. |
| **Dependências**      | `RF-PERDA-01`, `RF-ANIMAL-02`                                                                                                                                    |
| **Regras Vinculadas** | `RN-PERDA-01`, `RN-PERDA-02`, `RN-PERDA-03`, `RN-PERDA-04`                                                                                                       |
| **Atores**            | Administrador, Gerente                                                                                                                                           |
| **Plataformas**       | Web                                                                                                                                                              |
| **Versão**            | 1                                                                                                                                                                |
| **Especificação**     | 📌 Definida                                                                                                                                                      |

### 2.2.2 - Critérios de Aceitação

- [ ] O registro é feito em duas etapas: dados da perda e animais. Só é possível avançar para os animais com os dados válidos, e voltar aos dados a qualquer momento.
- [ ] Os campos `Título` e `Data da Perda` são obrigatórios. A `Data da Perda` inicia com a data de hoje e não pode ser futura (`RN-PERDA-04`).
- [ ] Os animais devem ser escolhidos entre os animais ativos da propriedade, com busca por `ID`, `Brinco`, `RFID` ou `Apelido` e filtros por lote, sexo e faixa de peso. Deve ser possível selecionar individualmente ou todos os animais filtrados.
- [ ] Animais que já estão em outra perda pendente devem ser indicados com um aviso, sem impedir a seleção, para evitar que a mesma perda seja lançada duas vezes (`RN-PERDA-03`).
- [ ] Deve haver um tipo de perda padrão (`Morte` ou `Desaparecimento`) para os animais selecionados, que pode ser trocado individualmente em cada animal, com uma observação opcional por animal (`RN-PERDA-01`).
- [ ] Os animais selecionados devem ser exibidos com a sua identificação, o seu lote atual e o seu tipo de perda, com o total de mortos e de desaparecidos, e podem ser retirados da seleção.
- [ ] Deve ser informado que a perda fica pendente e que os animais só saem do rebanho quando ela for consolidada (`RN-PERDA-02`).
- [ ] A perda pode ser salva sem animais, mas só pode ser consolidada com ao menos um.
- [ ] A perda é criada com a situação `Pendente`.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o registro de uma nova perda na listagem (`RF-PERDA-01`).
2. O sistema exibe a etapa de dados da perda, com a `Data da Perda` igual a hoje, e informa que a perda fica pendente até ser consolidada.
3. O usuário informa `Título`, `Data da Perda` e `Observação` e avança para os animais.
4. O sistema valida os dados (`RN-PERDA-04`) e exibe a etapa de animais.
5. O usuário escolhe o tipo de perda padrão, seleciona os animais e, se necessário, troca o tipo de perda ou informa uma observação em algum animal (ver fluxos alternativos).
6. O usuário aciona a ação "Salvar".
7. O sistema valida os animais (`RN-PERDA-03`), cria a perda com a situação `Pendente` e exibe a mensagem: _"Perda salva como pendente!"_
8. O fluxo termina.

**Fluxos alternativos**

- **A1 – Seleção de animais (passo 5):**
  1. O usuário pesquisa por `ID`, `Brinco`, `RFID` ou `Apelido` e filtra por lote, sexo e faixa de peso.
  2. O sistema exibe os animais ativos da propriedade que correspondem à pesquisa e aos filtros, indicando com um aviso os que já estão em outra perda pendente (`RN-PERDA-03`).
  3. O usuário seleciona os animais individualmente ou todos os filtrados.
  4. O sistema acrescenta os animais à seleção com o tipo de perda padrão.
  5. O fluxo retorna ao passo 5.

- **A2 – Troca do tipo de perda de um animal (passo 5):**
  1. O usuário troca o tipo de perda de um animal selecionado ou informa uma observação para ele.
  2. O sistema atualiza o animal e o total de mortos e de desaparecidos.
  3. O fluxo retorna ao passo 5.

- **A3 – Retirada de animal (passo 5):**
  1. O usuário retira um animal da seleção.
  2. O sistema retira o animal e atualiza os totais.
  3. O fluxo retorna ao passo 5.

- **A4 – Volta aos dados (passo 5):**
  1. O usuário volta à etapa de dados da perda.
  2. O sistema exibe os dados, mantendo os animais selecionados.
  3. O fluxo retorna ao passo 3.

- **A5 – Data da perda futura (passo 4):**
  1. A `Data da Perda` informada é posterior a hoje (`RN-PERDA-04`).
  2. O sistema impede o avanço e destaca o campo com a mensagem: _"A data não pode ser futura."_
  3. O fluxo retorna ao passo 3.

- **A6 – Campos obrigatórios ausentes (passo 4):**
  1. O `Título` ou a `Data da Perda` não foi preenchido.
  2. O sistema impede o avanço, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A7 – Animal indisponível (passo 7):**
  1. Um animal acrescentado à perda deixou de estar ativo na propriedade antes de a perda ser salva (`RN-PERDA-03`).
  2. O sistema impede a gravação e informa os animais indisponíveis, com o motivo.
  3. O fluxo retorna ao passo 5.

</div>

## 2.3 - `RF-PERDA-03`: Revisar Perda

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite revisar e editar uma perda pendente, quantas vezes for necessário até a sua consolidação, e consultar uma perda consolidada ou cancelada.

|                       |                                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **revisar uma perda pendente** para corrigir os animais e os dados à medida que a situação é apurada, antes de consolidá-la. |
| **Dependências**      | `RF-PERDA-01`, `RF-PERDA-02`                                                                                                                                              |
| **Regras Vinculadas** | `RN-PERDA-01`, `RN-PERDA-02`, `RN-PERDA-03`, `RN-PERDA-04`                                                                                                                |
| **Atores**            | Administrador, Gerente                                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                                       |
| **Versão**            | 1                                                                                                                                                                         |
| **Especificação**     | 📌 Definida                                                                                                                                                               |

### 2.3.2 - Critérios de Aceitação

- [ ] Uma perda pendente pode ser editada com as mesmas etapas e regras do registro (`RF-PERDA-02`): todos os dados podem ser alterados, e animais podem ser acrescentados, retirados ou ter o tipo de perda trocado.
- [ ] Uma perda consolidada ou cancelada é exibida apenas para consulta, informando a data e a hora em que foi consolidada ou cancelada.
- [ ] Na edição de uma perda pendente, os animais que não estão mais ativos na propriedade devem ser destacados, com a sua situação atual, conforme [Operações com animais selecionados](comum.md#operações-com-animais-selecionados).
- [ ] Na consulta de uma perda consolidada, cada animal deve ser exibido com o lote de onde saiu.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de uma perda pendente na listagem (`RF-PERDA-01`).
2. O sistema exibe os dados e os animais atuais da perda, informando que ela continua pendente até ser consolidada.
3. O usuário altera os dados ou os animais, como no registro (`RF-PERDA-02`).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-PERDA-03`, `RN-PERDA-04`), persiste as alterações e exibe a mensagem: _"Perda atualizada com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Consulta de perda encerrada (passo 1):**
  1. O usuário aciona a consulta de uma perda consolidada ou cancelada na listagem (`RF-PERDA-01`).
  2. O sistema exibe a perda apenas para consulta, com a data e a hora da consolidação ou do cancelamento e, se consolidada, o lote de onde cada animal saiu.
  3. O fluxo termina.

- **A2 – Perda encerrada durante a edição (passo 5):**
  1. A perda foi consolidada ou cancelada enquanto era editada (`RN-PERDA-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"Somente perdas pendentes podem ser alteradas."_
  3. O fluxo termina com falha.

- **A3 – Dados inválidos (passo 5):**
  1. Os dados ou os animais não respeitam as regras do registro (`RF-PERDA-02`, fluxos A5 a A7).
  2. O sistema impede a gravação e informa o motivo, como no registro.
  3. O fluxo retorna ao passo 3.

</div>

## 2.4 - `RF-PERDA-04`: Consolidar Perda

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite encerrar uma perda pendente, fazendo os animais saírem do rebanho como mortos ou desaparecidos.

|                       |                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consolidar uma perda** para que os animais perdidos deixem de constar no rebanho ativo. |
| **Dependências**      | `RF-PERDA-01`, `RF-PERDA-02`                                                                                                           |
| **Regras Vinculadas** | `RN-PERDA-01`, `RN-PERDA-02`, `RN-PERDA-03`, `RN-PERDA-04`                                                                             |
| **Atores**            | Administrador, Gerente                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                    |
| **Versão**            | 1                                                                                                                                      |
| **Especificação**     | 📌 Definida                                                                                                                            |

### 2.4.2 - Critérios de Aceitação

- [ ] Somente perdas pendentes podem ser consolidadas.
- [ ] A consolidação exige confirmação do usuário, informando quantos animais sairão do rebanho como mortos e quantos como desaparecidos, na `Data da Perda`, e que a perda não poderá mais ser alterada.
- [ ] A consolidação deve ser impedida se: a perda não tiver animais; a `Data da Perda` for futura ou anterior à entrada de algum animal no seu lote atual; ou algum animal não estiver mais ativo na propriedade (`RN-PERDA-04`; ver [Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
- [ ] A consolidação não é impedida por outras operações em aberto dos animais, como uma sessão de manejo ou uma venda; essas operações é que passam a destacar os animais perdidos ([Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
- [ ] Na consolidação, cada animal passa à situação `Morto` ou `Desaparecido`, conforme o seu tipo de perda, e sai do seu lote na `Data da Perda` (ou com o horário da consolidação, se a perda for de hoje), e o seu brinco e o seu RFID passam a poder ser usados por outro animal (`RN-ANIMAL-01`, `RN-ANIMAL-04`).
- [ ] O lote de onde cada animal saiu fica registrado na perda.

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Consolidar" de uma perda pendente na listagem (`RF-PERDA-01`).
2. O sistema solicita a confirmação, informando quantos animais sairão do rebanho como mortos e quantos como desaparecidos, a `Data da Perda` e que a perda não poderá mais ser alterada.
3. O usuário confirma a consolidação.
4. O sistema verifica que a consolidação não tem impedimentos (`RN-PERDA-03`, `RN-PERDA-04`).
5. O sistema altera a situação da perda para `Consolidada`, registra o lote de onde cada animal saiu e aplica a saída de cada animal (`RN-ANIMAL-01`, `RN-ANIMAL-04`).
6. O sistema exibe a mensagem: _"Perda consolidada! Os animais saíram do rebanho."_
7. O fluxo termina.

**Fluxos alternativos**

- **A1 – Consolidação não confirmada (passo 3):**
  1. O usuário não confirma a consolidação.
  2. O sistema mantém a perda pendente.
  3. O fluxo termina.

- **A2 – Perda sem animais (passo 4):**
  1. A perda não tem animais.
  2. O sistema impede a consolidação e exibe a mensagem: _"Adicione ao menos um animal antes de consolidar a perda."_
  3. O fluxo termina com falha.

- **A3 – Data da perda inválida (passo 4):**
  1. A `Data da Perda` é futura ou anterior à entrada de algum animal no seu lote atual (`RN-PERDA-04`).
  2. O sistema impede a consolidação e exibe a mensagem: _"A data da perda é futura. Ajuste a data para consolidar."_ ou _"A data da perda é anterior à entrada no lote atual de: {animais}."_
  3. O fluxo termina com falha.

- **A4 – Animal que saiu do rebanho (passo 4):**
  1. Um animal da perda deixou de estar ativo na propriedade depois de ser incluído nela (ver [Operações com animais selecionados](comum.md#operações-com-animais-selecionados)).
  2. O sistema impede a consolidação e exibe a mensagem: _"Animais que não estão mais ativos na propriedade: {animais}. Remova-os antes de consolidar."_
  3. O fluxo termina com falha.

</div>

## 2.5 - `RF-PERDA-05`: Cancelar Perda

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite cancelar uma perda pendente que não será consolidada, por exemplo quando os animais dados como desaparecidos foram encontrados. A perda fica guardada para consulta, mas nenhum animal sai do rebanho.

|                       |                                                                                                                                           |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cancelar uma perda pendente** que não se confirmou, sem que nenhum animal saia do rebanho. |
| **Dependências**      | `RF-PERDA-01`, `RF-PERDA-02`                                                                                                              |
| **Regras Vinculadas** | `RN-PERDA-02`                                                                                                                             |
| **Atores**            | Administrador, Gerente                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                       |
| **Versão**            | 1                                                                                                                                         |
| **Especificação**     | 📝 Rascunho                                                                                                                               |

### 2.5.2 - Critérios de Aceitação

- [ ] Somente perdas pendentes podem ser canceladas.
- [ ] O cancelamento exige confirmação do usuário, informando que nenhum animal sairá do rebanho e que a perda continuará disponível no filtro de canceladas.

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Cancelar" de uma perda pendente na listagem (`RF-PERDA-01`).
2. O sistema solicita a confirmação, informando que nenhum animal sairá do rebanho e que a perda continuará disponível no filtro de canceladas.
3. O usuário confirma o cancelamento.
4. O sistema altera a situação da perda para `Cancelada`, mantendo os seus animais para consulta, e exibe a mensagem: _"Perda cancelada."_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Cancelamento não confirmado (passo 3):**
  1. O usuário não confirma o cancelamento.
  2. O sistema mantém a perda inalterada.
  3. O fluxo termina.

</div>
