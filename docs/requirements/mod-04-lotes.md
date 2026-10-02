# 📦 Módulo: `MOD-LOTES`

Módulo responsável pelo gerenciamento de lotes, grupos de animais manejados juntos, e pelo histórico das áreas de pastagem ocupadas por cada lote.

Assim como as áreas, os lotes são vinculados a uma propriedade específica. Enquanto está vigente, o lote ocupa uma área de pastagem, que determina a localização do lote inteiro. Além do cadastro, o módulo acompanha o desempenho do lote: peso médio, ganho médio diário (GMD) e a projeção de quando a meta de venda será atingida.

## Dicionário de dados conceitual

| Campo                   | Descrição                                                            | Tipo       | Obrig.      | Restrições                                                                                                         |
| ----------------------- | -------------------------------------------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `Nome`                  | Nome de exibição do lote                                             | Texto      | Sim         | Até 100 caracteres                                                                                                 |
| `Propriedade`           | Propriedade à qual o lote pertence                                   | Referência | Sim         | Propriedade selecionada (`RN-LOTE-01`)                                                                             |
| `Área`                  | Área de pastagem que o lote ocupa atualmente                         | Referência | Sim         | Área ativa e livre da mesma propriedade (`RN-LOTE-01`, `RN-LOTE-02`); lote encerrado não ocupa área (`RN-LOTE-05`) |
| `Descrição`             | Descrição/observação sobre o lote                                    | Texto      | Não         | Até 500 caracteres                                                                                                 |
| `Meta`                  | Indica se o lote tem meta de venda                                   | Lógico     | Não         | Ver `RN-LOTE-04`                                                                                                   |
| `Data para venda`       | Data em que se pretende vender o lote                                | Data       | Condicional | Obrigatória se houver meta (`RN-LOTE-04`)                                                                          |
| `Peso médio para venda` | Peso médio, em kg, que os animais do lote devem atingir para a venda | Decimal    | Condicional | Maior que zero; obrigatório se houver meta (`RN-LOTE-04`)                                                          |
| `Status`                | Indica se o lote está em atividade ou se já cumpriu sua função       | Enum       | Sim         | `Vigente` ou `Encerrado` (`RN-LOTE-05`)                                                                            |
| `Quantidade de animais` | Quantidade de animais ativos no lote                                 | Calculado  | —           | —                                                                                                                  |
| `Peso médio atual`      | Média do peso atual dos animais ativos do lote que possuem peso      | Calculado  | —           | —                                                                                                                  |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-LOTE-01` - Lote Vinculado à Propriedade:** Todo lote pertence a uma única propriedade, e a área que ele ocupa deve ser dessa mesma propriedade.
- **`RN-LOTE-02` - Lote Vinculado à Área:** Todo lote vigente ocupa uma única área por vez, podendo mudar de área. Um lote só pode entrar em uma área em uso e livre (`RN-AREA-03`).
- **`RN-LOTE-03` - Troca de Área:** Na troca de área, o lote sai da área atual e entra na nova na mesma data: um lote vigente nunca fica sem área nem em duas áreas ao mesmo tempo.
- **`RN-LOTE-04` - Meta de Venda:** Um lote pode ter uma meta de venda, composta por uma data para venda e um peso médio, maior que zero, a ser atingido pelos animais até essa data. A meta pode ser definida, alterada ou abandonada a qualquer momento.
- **`RN-LOTE-05` - Vigente/Encerrado:** Um lote está vigente enquanto a cria/engorda dos animais está em curso e passa a encerrado depois de cumprir a sua função. Um lote encerrado não ocupa área e não pode receber animais.
- **`RN-LOTE-06` - Condições para Encerrar:** Um lote só pode ser encerrado se não tiver animais ativos e não for destino de transferências de animais pendentes. Ao ser encerrado, a área que ele ocupava fica livre.
- **`RN-LOTE-07` - Reativação:** Um lote encerrado pode voltar a ser vigente, desde que passe a ocupar uma área em uso e livre.
- **`RN-LOTE-08` - Ganho Médio Diário (GMD):** O GMD de um animal é calculado a partir das suas pesagens dos últimos 180 dias (contados da pesagem mais recente), como a diferença entre o último e o primeiro peso dividida pelo número de dias entre eles. Só há GMD com pelo menos duas pesagens separadas por 14 dias ou mais. O GMD do lote é a média do GMD dos animais que o possuem.
- **`RN-LOTE-09` - Projeção da Meta:** A projeção do peso médio do lote é linear: cada animal com peso ganha peso a partir da sua última pesagem no seu próprio GMD ou, se não tiver GMD, no GMD do lote. O GMD necessário é o ganho diário que, a partir de hoje, leva o peso médio do lote ao peso da meta na data da meta. Em relação à meta, o lote se encontra em uma das situações abaixo:
  - **Meta atingida:** o peso médio atual já alcançou o peso da meta;
  - **No ritmo:** o peso médio projetado na data da meta é igual ou maior que o peso da meta;
  - **Abaixo do ritmo:** o peso médio projetado na data da meta é menor que o peso da meta;
  - **Sem ganho de peso:** o GMD do lote é igual ou menor que zero;
  - **Sem dados suficientes:** não há pesagens suficientes para projetar.
- **`RN-LOTE-10` - Lotação do Lote:** A lotação do lote é a lotação da área que ele ocupa em relação à capacidade dessa área (`RN-AREA-04`). Um lote pode ocupar uma área mesmo que a lotação resultante exceda a capacidade dela; o excesso é uma situação a ser evitada, não uma impossibilidade.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-LOTE-01`: Listagem de Lotes

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar os lotes da propriedade selecionada, com busca, filtro e acesso às ações disponíveis para cada registro.

|                       |                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **visualizar a lista de lotes cadastrados** para localizar um lote e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                                                      |
| **Regras Vinculadas** | `RN-LOTE-01`                                                                                                                                                                           |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                                                    |
| **Versão**            | 1                                                                                                                                                                                      |
| **Status**            | ✅ Aprovado                                                                                                                                                                            |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas os lotes da propriedade selecionada (`RN-LOTE-01`).
- [ ] Deve permitir exibir as colunas `Nome`, `Área`, `Quantidade de animais`, `Peso médio atual` e `Atualizado em`.
- [ ] `Nome` é sempre visível.
- [ ] A ordenação inicial é por `Atualizado em`, do mais recente para o mais antigo.
- [ ] A pesquisa deve considerar o `Nome`.
- [ ] Os filtros disponíveis são: vigentes, encerrados e todos. O filtro inicial é "vigentes".
- [ ] As ações disponíveis para cada lote são: Editar (`RF-LOTE-03`) e Detalhes (`RF-LOTE-05`).
- [ ] Para um lote vigente, também está disponível a ação Encerrar (`RF-LOTE-07`).
- [ ] Para um lote encerrado, também está disponível a ação Reativar (`RF-LOTE-08`).
- [ ] Deve permitir acionar a criação de um novo lote (`RF-LOTE-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de lotes.
2. O sistema exibe os lotes da propriedade selecionada conforme o filtro e a ordenação iniciais, de forma paginada.
3. O usuário localiza o lote desejado, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para o lote.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe os lotes que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa sem resultados (passo A1.2):**
  1. Nenhum lote corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A4 – Novo lote (passo 3):**
  1. O usuário aciona a criação de um novo lote.
  2. O fluxo continua em `RF-LOTE-02`.

</div>

## 2.2 - `RF-LOTE-02`: Criar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar lotes, definindo a área de pastagem que cada lote passa a ocupar.

|                       |                                                                                                                                                                            |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **cadastrar um lote** no sistema para que ele possa ser associado a uma área e ter animais vinculados a ele. |
| **Dependências**      | `RF-AREA-02` (a área deve existir previamente)                                                                                                                             |
| **Regras Vinculadas** | `RN-LOTE-01`, `RN-LOTE-02`, `RN-LOTE-03`, `RN-LOTE-04`                                                                                                                     |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                        |
| **Plataformas**       | Web                                                                                                                                                                        |
| **Versão**            | 1                                                                                                                                                                          |
| **Status**            | ✅ Aprovado                                                                                                                                                                |

### 2.2.2 - Critérios de Aceitação

- [ ] O cadastro deve permitir informar `Nome`, `Área`, `Descrição`, `Meta`, `Data para venda` e `Peso médio para venda`.
- [ ] Os campos `Nome` e `Área` são obrigatórios.
- [ ] A `Área` deve ser escolhida entre as áreas ativas e livres da propriedade selecionada, com possibilidade de busca por nome (`RN-LOTE-02`).
- [ ] Os campos `Data para venda` e `Peso médio para venda` só devem ser solicitados quando o lote tiver meta, e passam a ser obrigatórios nesse caso (`RN-LOTE-04`).
- [ ] O lote criado será vinculado à propriedade selecionada no sistema (`RN-LOTE-01`), com o status vigente.
- [ ] A criação do lote deve registrar a entrada do lote na área escolhida (`RN-LOTE-03`).

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a criação de um novo lote na listagem (`RF-LOTE-01`).
2. O sistema exibe o formulário de cadastro.
3. O usuário preenche os dados do lote, escolhendo a `Área` entre as áreas ativas e livres da propriedade selecionada (`RN-LOTE-02`) e podendo definir uma meta de venda (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados, persiste o lote vinculado à propriedade selecionada com o status vigente (`RN-LOTE-01`), registra a entrada do lote na área escolhida (`RN-LOTE-03`) e exibe a mensagem: _"Registro salvo com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Definição de meta (passo 3):**
  1. O usuário indica que o lote tem meta de venda.
  2. O sistema passa a solicitar `Data para venda` e `Peso médio para venda`, como campos obrigatórios (`RN-LOTE-04`).
  3. O fluxo retorna ao passo 3.

- **A2 – Campos obrigatórios ausentes (passo 5):**
  1. O `Nome` ou a `Área` não foi preenchido.
  2. O sistema impede a gravação e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A3 – Meta incompleta (passo 5):**
  1. O lote tem meta, mas `Data para venda` ou `Peso médio para venda` não foi preenchido (`RN-LOTE-04`).
  2. O sistema impede a gravação e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório quando há meta."_
  3. O fluxo retorna ao passo 3.

- **A4 – Área ocupada por outro lote (passo 5):**
  1. A área escolhida passou a ser ocupada por outro lote antes do salvamento (`RN-LOTE-02`).
  2. O sistema impede a gravação e exibe no campo `Área` a mensagem: _"A área selecionada já está ocupada pelo lote "{lote}"."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-LOTE-03`: Atualizar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados de um lote. Diferentemente da criação, a área não é escolhida diretamente: a área atual é apenas exibida, junto do histórico de áreas, e alterada pela troca de área (`RF-LOTE-04`).

|                       |                                                                                                                                                                             |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **atualizar os dados de um lote já cadastrado** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-LOTE-01`, `RF-LOTE-02`                                                                                                                                                  |
| **Regras Vinculadas** | `RN-LOTE-02`, `RN-LOTE-03`, `RN-LOTE-04`                                                                                                                                    |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                         |
| **Plataformas**       | Web                                                                                                                                                                         |
| **Versão**            | 1                                                                                                                                                                           |
| **Status**            | ✅ Aprovado                                                                                                                                                                 |

### 2.3.2 - Critérios de Aceitação

- [ ] Os campos `Nome`, `Descrição`, `Meta`, `Data para venda` e `Peso médio para venda` podem ser alterados, com as mesmas regras de preenchimento da criação (`RF-LOTE-02`).
- [ ] A meta pode ser incluída, alterada ou removida (`RN-LOTE-04`).
- [ ] A área atual do lote deve ser exibida sem possibilidade de edição direta, com a opção de acionar a troca de área (`RF-LOTE-04`).
- [ ] O histórico de áreas do lote deve poder ser consultado, com o período de ocupação de cada área (ver `RF-LOTE-04`).
- [ ] Uma troca de área definida só é registrada ao salvar a edição do lote.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de um lote na listagem (`RF-LOTE-01`).
2. O sistema exibe o formulário com os dados atuais do lote, a área atual sem possibilidade de edição direta e o histórico de áreas, com o período de ocupação de cada área.
3. O usuário altera os campos desejados, podendo incluir, alterar ou remover a meta e trocar a área do lote (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados, persiste as alterações, registra a troca de área, se houver (`RN-LOTE-03`), e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Troca de área (passo 3):**
  1. O usuário aciona a troca de área do lote.
  2. O sistema executa a troca de área (`RF-LOTE-04`) e passa a exibir a área de destino, que só é registrada ao salvar a edição.
  3. O fluxo retorna ao passo 3.

- **A2 – Remoção da meta (passo 3):**
  1. O usuário indica que o lote não tem meta.
  2. O sistema deixa de solicitar `Data para venda` e `Peso médio para venda`; ao salvar, a meta é removida do lote (`RN-LOTE-04`).
  3. O fluxo retorna ao passo 3.

- **A3 – Campos obrigatórios ausentes (passo 5):**
  1. O usuário removeu o `Nome` do lote ou deixou incompleta a meta.
  2. O sistema impede a gravação e destaca os campos com erro, descrevendo o erro ocorrido.
  3. O fluxo retorna ao passo 3.

</div>

## 2.4 - `RF-LOTE-04`: Trocar Área do Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite trocar a área de um lote, acionada durante a edição do lote.

|                       |                                                                                                                                                                                   |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **trocar a área de um lote** para manter as informações corretas e registrar o histórico de troca de áreas do lote. |
| **Dependências**      | `RF-LOTE-03`, `RF-AREA-02` (a área de destino deve existir previamente)                                                                                                           |
| **Regras Vinculadas** | `RN-LOTE-02`, `RN-LOTE-03`, `RN-LOTE-10`                                                                                                                                          |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                               |
| **Plataformas**       | Web                                                                                                                                                                               |
| **Versão**            | 1                                                                                                                                                                                 |
| **Status**            | ✅ Aprovado                                                                                                                                                                       |

### 2.4.2 - Critérios de Aceitação

- [ ] A troca deve permitir informar a área de destino (obrigatória) e uma descrição da troca (opcional, até 500 caracteres).
- [ ] A área de destino deve ser escolhida entre as áreas ativas e livres da propriedade, diferentes da área atual, com possibilidade de busca por nome (`RN-LOTE-02`).
- [ ] Ao escolher a área de destino, o sistema deve alertar se a lotação resultante exceder a capacidade da área, sem impedir a troca (`RN-LOTE-10`).
- [ ] Ao confirmar a troca, a edição do lote passa a exibir a área de destino; o registro só é efetivado ao salvar a edição (`RF-LOTE-03`).
- [ ] Ao ser efetivada, a troca encerra a ocupação da área atual e registra a entrada na área de destino na data da troca, com a descrição informada (`RN-LOTE-03`).
- [ ] O histórico de áreas do lote é sempre preservado: cada ocupação registra a data de entrada, a data de saída (em aberto enquanto o lote está na área) e a observação, quando informada.

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a troca de área durante a edição do lote (`RF-LOTE-03`).
2. O sistema solicita a área de destino, entre as áreas ativas e livres da propriedade, diferentes da área atual, com possibilidade de busca por nome (`RN-LOTE-02`), e uma descrição opcional da troca.
3. O usuário seleciona a área de destino e, se desejar, informa a descrição.
4. O usuário confirma a troca.
5. O sistema passa a exibir a área de destino na edição do lote. Ao salvar a edição, o sistema encerra a ocupação da área atual e registra a entrada na área de destino, com a descrição informada (`RN-LOTE-03`).
6. O fluxo continua em `RF-LOTE-03`.

**Fluxos alternativos**

- **A1 – Lotação excedida na área de destino (passo 3):**
  1. A lotação da área de destino, somada à do lote, excede a capacidade da área (`RN-LOTE-10`).
  2. O sistema alerta que a lotação será excedida, informando a lotação resultante e a capacidade da área, sem impedir a troca.
  3. O fluxo retorna ao passo 3.

- **A2 – Área de destino não selecionada (passo 4):**
  1. O usuário confirma a troca sem selecionar a área de destino.
  2. O sistema impede a troca e exibe a mensagem: _"A área de destino deve ser selecionada."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.5 - `RF-LOTE-05`: Detalhes do Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite consultar as informações detalhadas de um lote: dados cadastrais, indicadores de desempenho, acompanhamento da meta de venda, animais, movimentações e histórico de áreas.

|                       |                                                                                                                                                                                 |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **consultar os detalhes de um lote cadastrado** para acompanhar seus animais, seu desempenho e sua meta de venda. |
| **Dependências**      | `RF-LOTE-01`, `RF-LOTE-02`                                                                                                                                                      |
| **Regras Vinculadas** | `RN-LOTE-03`, `RN-LOTE-08`, `RN-LOTE-09`, `RN-LOTE-10`                                                                                                                          |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                             |
| **Plataformas**       | Web                                                                                                                                                                             |
| **Versão**            | 1                                                                                                                                                                               |
| **Status**            | 📝 Rascunho                                                                                                                                                                     |

### 2.5.2 - Critérios de Aceitação

- [ ] Exibir `Nome`, `Status`, `Descrição`, a propriedade, a data de criação e, se encerrado, a data de encerramento.
- [ ] Exibir a área atual, desde quando o lote está nela, o tamanho da área e a sua taxa de lotação.
- [ ] Exibir a quantidade de animais ativos do lote, separada por sexo.
- [ ] Exibir o peso médio e o peso total dos animais, indicando quantos animais não têm peso.
- [ ] Exibir o GMD do lote e quantos animais entraram no cálculo (`RN-LOTE-08`).
- [ ] Exibir a lotação atual da área em UA e em percentual da capacidade (`RN-LOTE-10`).
- [ ] Se o lote tiver meta, exibir o `Peso médio para venda`, a `Data para venda`, a previsão de quando a meta será atingida e quantos animais já atingiram o peso da meta.
- [ ] Se o lote tiver meta, exibir o acompanhamento da meta (`RN-LOTE-09`): a situação em relação à meta, o peso médio estimado hoje e quanto falta, os dias restantes até a data da meta, a data prevista para atingir a meta, o GMD necessário e a evolução do peso médio ao longo do tempo com a sua projeção até a meta.
- [ ] No acompanhamento da meta, deve ser possível simular a projeção com outro GMD, sem alterar nenhum dado.
- [ ] Se o lote não tiver meta, indicar isso e permitir acessar a edição do lote para defini-la.
- [ ] Exibir os animais ativos do lote com identificação, sexo, idade, peso atual e data da última pesagem, GMD, tempo no lote e, se houver meta com data, o peso projetado na data da meta, destacando os que já atingiram a meta. A partir de um animal, deve ser possível acessar os seus detalhes (`RF-ANIMAL-08`).
- [ ] Exibir o histórico de entradas e saídas de animais no lote, com as datas, o tempo de permanência e a observação.
- [ ] Exibir as transferências de animais pendentes que envolvem o lote, de entrada e de saída, permitindo acessar cada uma.
- [ ] Exibir o histórico de áreas do lote, com as datas de entrada e saída, o tempo de permanência e a observação de cada ocupação (`RN-LOTE-03`).
- [ ] Exibir a atividade recente do lote, em ordem cronológica decrescente: criação, entradas em áreas, transferências de animais confirmadas e compras de animais recebidas no lote.
- [ ] Permitir acionar a edição do lote (`RF-LOTE-03`) e, se vigente, a transferência de animais para ele.
- [ ] Permitir acionar a exclusão do lote (`RF-LOTE-06`).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de um lote na listagem (`RF-LOTE-01`).
2. O sistema exibe os dados cadastrais do lote, a área atual e os indicadores: quantidade de animais por sexo, peso médio e peso total, GMD (`RN-LOTE-08`) e lotação da área (`RN-LOTE-10`).
3. O sistema exibe o acompanhamento da meta (`RN-LOTE-09`), indicando a situação do lote em relação à meta (por exemplo, no ritmo, com o peso médio projetado na data da meta, ou abaixo do ritmo, com quanto o peso projetado fica abaixo do alvo).
4. O sistema exibe os animais ativos do lote, o histórico de entradas e saídas de animais, as transferências pendentes, o histórico de áreas (`RN-LOTE-03`) e a atividade recente.
5. O usuário consulta as informações (ver fluxos alternativos).
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Lote sem meta (passo 3):**
  1. O lote não tem meta de venda.
  2. O sistema indica que o lote não tem meta e permite acessar a edição do lote para defini-la.
  3. O fluxo continua no passo 4.

- **A2 – Lote sem dados para projetar (passo 3):**
  1. O lote tem meta, mas nenhum animal tem peso registrado.
  2. O sistema indica que não há dados para projetar (`RN-LOTE-09`).
  3. O fluxo continua no passo 4.

- **A3 – Simulação de GMD (passo 5):**
  1. O usuário informa um GMD para simulação no acompanhamento da meta.
  2. O sistema recalcula a projeção com o GMD informado, sem alterar nenhum dado do lote.
  3. O fluxo retorna ao passo 5.

- **A4 – Acesso a um animal (passo 5):**
  1. O usuário aciona o acesso a um animal do lote.
  2. O fluxo continua em `RF-ANIMAL-08`.

- **A5 – Edição (passo 5):**
  1. O usuário aciona a edição do lote.
  2. O fluxo continua em `RF-LOTE-03`.

- **A6 – Transferência de animais (passo 5):**
  1. Com o lote vigente, o usuário aciona a transferência de animais para ele.
  2. O fluxo continua na transferência de animais entre lotes.

- **A7 – Exclusão (passo 5):**
  1. O usuário aciona a exclusão do lote.
  2. O fluxo continua em `RF-LOTE-06`.

</div>

## 2.6 - `RF-LOTE-06`: Excluir Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite excluir um lote cadastrado por engano. Um lote que já cumpriu sua função não é excluído, e sim encerrado (`RF-LOTE-07`).

|                       |                                                                                                                                                       |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **excluir um lote cadastrado** apenas se ele não possuir registro importante vinculado. |
| **Dependências**      | `RF-LOTE-02`, `RF-LOTE-05`                                                                                                                            |
| **Regras Vinculadas** | —                                                                                                                                                     |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                   |
| **Plataformas**       | Web                                                                                                                                                   |
| **Versão**            | 1                                                                                                                                                     |
| **Status**            | 📝 Rascunho                                                                                                                                           |

### 2.6.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário, informando que a ação não poderá ser desfeita.
- [ ] O lote só pode ser excluído se nunca teve animais, não participou de transferências de animais nem de compras e ocupou apenas a área definida na sua criação (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)). Um lote já utilizado deve ser encerrado (`RF-LOTE-07`).
- [ ] Ao excluir o lote, o seu histórico de áreas e a sua meta de venda devem ser excluídos junto.

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a exclusão nos detalhes do lote (`RF-LOTE-05`).
2. O sistema solicita a confirmação da exclusão, informando que a ação não poderá ser desfeita.
3. O usuário confirma a exclusão.
4. O sistema verifica que o lote nunca teve animais nem movimentações, exclui o lote junto com o seu histórico de áreas e a sua meta de venda e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Lote com registro vinculado (passo 4):**
  1. O lote já teve animais ou movimentações.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo termina com falha.

</div>

## 2.7 - `RF-LOTE-07`: Encerrar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.7.1 - Descrição

Permite encerrar um lote depois de ele ter cumprido seu objetivo. Isso mantém o lote nos registros do sistema, mas ele não é mais exibido na listagem padrão de lotes vigentes, deixa de ocupar área e não pode mais receber animais. Um lote encerrado é usado apenas para consultas e relatórios.

|                       |                                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **encerrar um lote** para que ele não seja mais movimentado, sendo útil apenas para consultas e relatórios. |
| **Dependências**      | `RF-LOTE-01`, `RF-LOTE-02`                                                                                                                                                |
| **Regras Vinculadas** | `RN-LOTE-05`, `RN-LOTE-06`                                                                                                                                                |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                                                       |
| **Versão**            | 1                                                                                                                                                                         |
| **Status**            | ✅ Aprovado                                                                                                                                                               |

### 2.7.2 - Critérios de Aceitação

- [ ] O encerramento exige confirmação do usuário, informando que a área ocupada pelo lote ficará livre.
- [ ] Um lote com animais ativos não pode ser encerrado (`RN-LOTE-06`); nesse caso, o sistema deve informar a quantidade de animais e permitir acessar a transferência dos animais para outro lote.
- [ ] Um lote que é destino de transferências pendentes não pode ser encerrado (`RN-LOTE-06`).
- [ ] Ao ser encerrado, o lote deixa de ocupar a sua área, registrando a saída no histórico de áreas (`RN-LOTE-03`).

### 2.7.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Encerrar" de um lote vigente na listagem (`RF-LOTE-01`).
2. O sistema solicita a confirmação, informando que a área ocupada pelo lote ficará livre.
3. O usuário confirma o encerramento.
4. O sistema verifica que o lote não tem animais ativos nem é destino de transferências pendentes (`RN-LOTE-06`).
5. O sistema altera o status do lote para encerrado, registra a saída da área no histórico de áreas, liberando-a (`RN-LOTE-03`), e exibe a mensagem: _"Lote "{lote}" encerrado."_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Encerramento cancelado (passo 3):**
  1. O usuário não confirma o encerramento.
  2. O sistema mantém o lote inalterado.
  3. O fluxo termina.

- **A2 – Lote com animais ativos (passo 4):**
  1. O lote tem animais ativos (`RN-LOTE-06`).
  2. O sistema impede o encerramento e exibe a mensagem: _"O lote "{lote}" tem {quantidade} animal(is) ativo(s). Transfira-os para outro lote e, depois de confirmar a transferência, encerre o lote."_
  3. O sistema permite acessar a transferência dos animais para outro lote.
  4. O fluxo termina com falha.

- **A3 – Lote com transferências pendentes (passo 4):**
  1. O lote é destino de transferências pendentes (`RN-LOTE-06`).
  2. O sistema impede o encerramento e exibe a mensagem: _"O lote é destino de {quantidade} transferência(s) pendente(s). Cancele-as ou altere o destino antes de encerrar."_
  3. O fluxo termina com falha.

</div>

## 2.8 - `RF-LOTE-08`: Reativar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.8.1 - Descrição

Permite reativar um lote encerrado, por exemplo quando ele foi encerrado por engano, fazendo-o voltar a ser vigente e a ocupar uma área.

|                       |                                                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **reativar um lote encerrado** para que ele volte a ser usado e possa receber animais. |
| **Dependências**      | `RF-LOTE-01`, `RF-LOTE-07`                                                                                                                           |
| **Regras Vinculadas** | `RN-LOTE-02`, `RN-LOTE-07`, `RN-LOTE-10`                                                                                                             |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                  |
| **Versão**            | 1                                                                                                                                                    |
| **Status**            | ✅ Aprovado                                                                                                                                          |

### 2.8.2 - Critérios de Aceitação

- [ ] A reativação deve permitir informar a área que o lote passará a ocupar (obrigatória) e o motivo da reativação (opcional, até 500 caracteres).
- [ ] A área deve ser escolhida entre as áreas ativas e livres da propriedade, com possibilidade de busca por nome (`RN-LOTE-02`).
- [ ] Se a última área ocupada pelo lote continuar livre, ela deve vir selecionada; se tiver sido ocupada por outro lote, o sistema deve informar isso ao usuário (`RN-LOTE-07`).
- [ ] Ao escolher a área, o sistema deve alertar se a lotação resultante exceder a capacidade da área, sem impedir a reativação (`RN-LOTE-10`).
- [ ] A reativação deve registrar a entrada do lote na área escolhida, com o motivo informado, iniciando um novo período de ocupação e preservando o histórico anterior ao encerramento.

### 2.8.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Reativar" de um lote encerrado na listagem (`RF-LOTE-01`).
2. O sistema solicita a área que o lote passará a ocupar, entre as áreas ativas e livres da propriedade, com possibilidade de busca por nome (`RN-LOTE-02`), já selecionando a última área ocupada pelo lote, e o motivo da reativação.
3. O usuário mantém a área sugerida ou escolhe outra e, se desejar, informa o motivo.
4. O usuário confirma a reativação.
5. O sistema altera o status do lote para vigente, registra a entrada na área escolhida com o motivo informado, iniciando um novo período de ocupação e preservando o histórico anterior ao encerramento, e exibe a mensagem: _"Lote "{lote}" reativado."_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Área anterior ocupada (passo 2):**
  1. A última área ocupada pelo lote foi ocupada por outro lote (`RN-LOTE-07`).
  2. O sistema não seleciona nenhuma área e exibe a mensagem: _"A área anterior, {área}, foi ocupada por outro lote. Escolha outra área."_
  3. O fluxo retorna ao passo 3.

- **A2 – Lotação excedida na área escolhida (passo 3):**
  1. A lotação resultante da entrada do lote excede a capacidade da área escolhida (`RN-LOTE-10`).
  2. O sistema alerta que a lotação será excedida, sem impedir a reativação.
  3. O fluxo retorna ao passo 3.

</div>

## 2.9 - `RF-LOTE-09`: Criar animais no lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.9.1 - Descrição

Permite criar um grupo de animais diretamente no lote: em vez de serem cadastrados no módulo de animais e depois vinculados ao lote, os animais são criados em grande quantidade e com poucos detalhes já dentro do lote. A ideia é que o lote que use esse recurso passe logo em seguida por um manejo de identificação e pesagem.

|            |             |
| :--------- | :---------- |
| **Versão** | 1           |
| **Status** | 📝 Rascunho |

</div>
