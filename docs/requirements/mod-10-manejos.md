# 📦 Módulo: `MOD-MANEJOS`

Módulo responsável pelas sessões de manejo: o trabalho feito em um grupo de animais no curral, em que cada animal passa, um de cada vez, por uma sequência de manejos (pesagem, castração, identificação, procedimentos sanitários e apartação).

Uma sessão é planejada (o que será feito e em quais animais), executada animal por animal e, ao final, consolidada, quando os seus registros passam a valer no histórico dos animais. A recepção de animais comprados também usa uma sessão de manejo, especificada no [módulo de recepções](mod-11-recepcoes.md).

## Dicionário de dados conceitual

| Campo            | Descrição                                                      | Tipo       | Obrig. | Restrições                                                                 |
| ---------------- | -------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------- |
| `Título`         | Identifica a sessão, como "Pesagem mensal da recria"           | Texto      | Sim    | Até 100 caracteres                                                         |
| `Data Prevista`  | Data planejada para o manejo                                   | Data       | Sim    | —                                                                          |
| `Observação`     | Objetivo ou detalhes do manejo                                 | Texto      | Não    | Até 500 caracteres                                                         |
| `Manejos`        | Etapas a realizar em cada animal, na ordem em que serão feitas | Lista      | Sim    | Ao menos um manejo (`RN-MANEJO-02`)                                        |
| `Animais`        | Animais que participam da sessão                               | Lista      | Não    | Ver `RN-MANEJO-04`                                                         |
| `Data do Manejo` | Data em que o manejo é de fato realizado                       | Data       | Não    | Definida ao iniciar o registro; não pode ser futura (`RN-MANEJO-01`)       |
| `Situação`       | Situação da sessão                                             | Enum       | Sim    | `Planejada`, `Em andamento`, `Consolidada` ou `Cancelada` (`RN-MANEJO-03`) |
| `Propriedade`    | Propriedade em que a sessão é feita                            | Referência | Sim    | Propriedade selecionada (`RN-MANEJO-01`)                                   |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-MANEJO-01` - Sessão de Manejo:** Uma sessão de manejo reúne o trabalho feito em um grupo de animais de uma mesma propriedade, em uma mesma data. Todos os manejos da sessão têm a data do manejo, que não pode ser futura.
- **`RN-MANEJO-02` - Etapas:** Os manejos possíveis em uma sessão são pesagem, castração, brinco, RFID, procedimento sanitário e apartação. Cada tipo aparece no máximo uma vez, exceto o procedimento sanitário, que pode se repetir com procedimentos diferentes (ex.: vacina e vermífugo). A ordem das etapas é a ordem em que elas são feitas em cada animal, e a apartação, quando existe, é sempre a última, pois define para onde o animal vai ao sair do curral.
- **`RN-MANEJO-03` - Ciclo da Sessão:** Uma sessão é planejada, depois executada e, por fim, consolidada ou cancelada. Os manejos de uma sessão só têm efeito sobre os animais quando ela é consolidada; uma sessão cancelada não tem efeito sobre eles. Uma sessão consolidada ou cancelada não muda mais.
- **`RN-MANEJO-04` - Participantes:** Só participam de uma sessão os animais ativos da propriedade que não tenham compromisso conflitante com as etapas dela (`RN-ANIMAL-10`). Duas sessões abertas não podem ter o mesmo animal na mesma etapa, exceto a pesagem.
- **`RN-MANEJO-05` - Animal Manejado:** Um animal está manejado quando passou por ao menos uma etapa da sessão; as etapas não feitas nele não têm efeito. Um animal que não foi manejado deixa a sessão na consolidação.
- **`RN-MANEJO-06` - Pesagem:** O peso de um animal deve ser maior que zero e de no máximo 3.000 kg. Uma variação acima de 30% em relação à última pesagem do animal é suspeita e deve ser conferida.
- **`RN-MANEJO-07` - Castração:** A castração feita na sessão exige a técnica utilizada. Castrar uma fêmea ou um animal já castrado é atípico (`RN-ANIMAL-08`).
- **`RN-MANEJO-08` - Identificação:** O brinco (ou RFID) colocado na sessão deve ser diferente do atual do animal, não pode ser dado a dois animais da mesma sessão e não pode estar em uso por outro animal ativo da propriedade, a menos que esse outro animal receba um novo brinco (ou RFID) na mesma sessão (`RN-ANIMAL-01`).
- **`RN-MANEJO-09` - Dose do Procedimento Sanitário:** A dose aplicada em cada animal segue a regra de dose do procedimento: sem dose (ex.: exame, banho); dose fixa por animal; ou dose por peso, calculada como dose (ml) × peso do animal ÷ peso de referência, com uma casa decimal, usando o peso tomado na sessão ou, sem ele, o peso atual. A dose efetivamente aplicada pode diferir da calculada e é a que vale.
- **`RN-MANEJO-10` - Carência:** Até o fim do período de carência de um procedimento, o animal que o recebeu não pode ser abatido nem ter o leite comercializado.
- **`RN-MANEJO-11` - Apartação:** Na apartação, o animal permanece no seu lote atual ou vai para outro lote vigente da propriedade. A mudança de lote só acontece quando a sessão é consolidada.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-MANEJO-01`: Listagem de Sessões de Manejo

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as sessões de manejo da propriedade selecionada, com busca, filtro e acesso às ações disponíveis para cada sessão.

|                       |                                                                                                                                                                   |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **visualizar as sessões de manejo** para acompanhar o que está planejado, em andamento e concluído. |
| **Dependências**      | —                                                                                                                                                                 |
| **Regras Vinculadas** | `RN-MANEJO-03`                                                                                                                                                    |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                               |
| **Plataformas**       | Web                                                                                                                                                               |
| **Versão**            | 1                                                                                                                                                                 |
| **Status**            | ✅ Aprovado                                                                                                                                                       |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas as sessões da propriedade selecionada, sem as sessões usadas em recepções de compra.
- [ ] A listagem deve exibir, de cada sessão, a data (prevista, ou a do manejo quando já iniciada), o `Título`, os manejos planejados, a quantidade de animais e a `Situação`. Nas sessões em andamento, deve exibir também quantos animais já foram manejados.
- [ ] A ordenação inicial é pela data prevista, da mais recente para a mais antiga.
- [ ] A pesquisa deve considerar `Título` e `Observação`.
- [ ] Os filtros disponíveis são: abertas (planejadas e em andamento), consolidadas, canceladas e todas. O filtro inicial é "abertas".
- [ ] As ações disponíveis para cada sessão dependem da sua situação: de uma planejada, editar o planejamento (`RF-MANEJO-02`) e iniciar o registro (`RF-MANEJO-03`); de uma em andamento, editar o planejamento (`RF-MANEJO-02`) e continuar o registro (`RF-MANEJO-04`); de uma aberta, cancelá-la (`RF-MANEJO-12`); de uma consolidada ou cancelada, consultá-la (`RF-MANEJO-02`).
- [ ] Deve permitir acionar o planejamento de uma nova sessão (`RF-MANEJO-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de sessões de manejo.
2. O sistema exibe as sessões abertas da propriedade selecionada, da data prevista mais recente para a mais antiga, de forma paginada.
3. O usuário localiza a sessão desejada, podendo pesquisar, filtrar, ordenar ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a sessão.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Nenhuma sessão aberta (passo 2):**
  1. Não há sessões abertas na propriedade selecionada.
  2. O sistema exibe a mensagem: _"Nenhuma sessão de manejo em aberto."_
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as sessões que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A3 – Pesquisa sem resultados (passo A2.2):**
  1. Nenhuma sessão corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A5 – Nova sessão (passo 3):**
  1. O usuário aciona o planejamento de uma nova sessão.
  2. O fluxo continua em `RF-MANEJO-02`.

</div>

## 2.2 - `RF-MANEJO-02`: Planejar Sessão de Manejo

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite criar e alterar o planejamento de uma sessão: data prevista, manejos a realizar, na ordem em que serão feitos, e animais que participarão.

|                       |                                                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **planejar uma sessão de manejo** para organizar antecipadamente o trabalho do curral. |
| **Dependências**      | `RF-MANEJO-01`, `RF-ANIMAL-02`, `RF-CAST-01` (para a castração), `RF-TSAN-01` (para procedimentos sanitários)                                        |
| **Regras Vinculadas** | `RN-MANEJO-02`, `RN-MANEJO-03`, `RN-MANEJO-04`                                                                                                       |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                  |
| **Versão**            | 1                                                                                                                                                    |
| **Status**            | ✅ Aprovado                                                                                                                                          |

### 2.2.2 - Critérios de Aceitação

- [ ] O planejamento deve permitir informar `Título`, `Data Prevista`, `Observação`, os manejos e os animais.
- [ ] Os campos `Título` e `Data Prevista` são obrigatórios, e deve haver ao menos um manejo.
- [ ] Os manejos devem respeitar `RN-MANEJO-02`, e o usuário pode reordená-los.
- [ ] A castração, o procedimento sanitário e a apartação têm dados próprios no planejamento, especificados em `RF-MANEJO-07`, `RF-MANEJO-09` e `RF-MANEJO-10`.
- [ ] Os animais devem ser escolhidos entre os animais ativos da propriedade, com busca por `ID`, `Brinco`, `RFID` ou `Apelido` e filtros por lote, sexo e faixa de peso. Deve ser possível selecionar individualmente ou todos os animais filtrados.
- [ ] Animais com compromisso conflitante devem aparecer indisponíveis, com o motivo, e não entram na seleção de todos os filtrados (`RN-MANEJO-04`).
- [ ] O planejamento pode ser alterado enquanto a sessão estiver planejada ou em andamento.
- [ ] Um manejo só pode ser removido do planejamento se ainda não tiver registros.
- [ ] Um animal com manejo já registrado não pode ser retirado pelo planejamento, apenas pelo registro (`RF-MANEJO-04`).
- [ ] Ao acrescentar manejos a uma sessão, os animais que já participavam devem ser verificados quanto a compromissos apenas nos manejos acrescentados.
- [ ] Uma sessão consolidada ou cancelada é exibida apenas para consulta.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o planejamento de uma nova sessão na listagem (`RF-MANEJO-01`).
2. O sistema exibe o formulário de planejamento.
3. O usuário informa `Título`, `Data Prevista` e `Observação`, adiciona os manejos na ordem em que serão feitos, podendo reordená-los e informar os dados próprios da castração, do procedimento sanitário e da apartação (`RF-MANEJO-07`, `RF-MANEJO-09`, `RF-MANEJO-10`), e seleciona os animais (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-MANEJO-02`, `RN-MANEJO-04`), cria a sessão com a situação `Planejada` e exibe a mensagem: _"Sessão de manejo planejada!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Seleção de animais (passo 3):**
  1. O usuário pesquisa por `ID`, `Brinco`, `RFID` ou `Apelido` e filtra por lote, sexo e faixa de peso.
  2. O sistema exibe os animais ativos da propriedade que correspondem à pesquisa e aos filtros, indicando como indisponíveis, com o motivo, os animais com compromisso conflitante (`RN-MANEJO-04`).
  3. O usuário seleciona os animais individualmente ou todos os filtrados; os indisponíveis não entram na seleção de todos os filtrados.
  4. O fluxo retorna ao passo 3.

- **A2 – Sessão sem manejos (passo 5):**
  1. Nenhum manejo foi adicionado (`RN-MANEJO-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"Adicione ao menos um manejo."_
  3. O fluxo retorna ao passo 3.

- **A3 – Manejo repetido (passo 5):**
  1. O mesmo manejo, que não seja procedimento sanitário, foi adicionado duas vezes (`RN-MANEJO-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"O manejo "{manejo}" só pode aparecer uma vez."_
  3. O fluxo retorna ao passo 3.

- **A4 – Campos obrigatórios ausentes (passo 5):**
  1. O `Título` ou a `Data Prevista` não foi preenchido.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A5 – Alteração do planejamento (passo 1):**
  1. O usuário aciona a edição do planejamento de uma sessão planejada ou em andamento na listagem (`RF-MANEJO-01`).
  2. O sistema exibe o planejamento atual da sessão.
  3. O usuário altera o planejamento. Ao acrescentar manejos, os animais que já participavam são verificados quanto a compromissos apenas nos manejos acrescentados; um animal com manejo já registrado não pode ser retirado pelo planejamento, apenas pelo registro (`RF-MANEJO-04`).
  4. O usuário aciona a ação "Salvar".
  5. O sistema valida os dados, persiste as alterações e exibe a mensagem: _"Planejamento atualizado!"_
  6. O fluxo termina.

- **A6 – Remoção de manejo com registros (passo A5.5):**
  1. Um manejo removido do planejamento já foi registrado em animais da sessão.
  2. O sistema impede a alteração e exibe a mensagem: _"A pesagem já foi registrada em {quantidade} animal(is). Desfaça os registros antes de removê-la."_ (exemplo para a pesagem).
  3. O fluxo retorna ao passo A5.3.

- **A7 – Consulta de sessão encerrada (passo 1):**
  1. O usuário aciona a consulta de uma sessão consolidada ou cancelada na listagem (`RF-MANEJO-01`).
  2. O sistema exibe o planejamento da sessão apenas para consulta.
  3. O fluxo termina.

</div>

## 2.3 - `RF-MANEJO-03`: Iniciar Registro

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite iniciar a execução de uma sessão planejada, definindo a data em que o manejo está sendo feito.

|                       |                                                                                                                                                  |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **iniciar o registro de uma sessão** para começar a lançar os manejos nos animais. |
| **Dependências**      | `RF-MANEJO-01`, `RF-MANEJO-02`                                                                                                                   |
| **Regras Vinculadas** | `RN-MANEJO-01`, `RN-MANEJO-03`                                                                                                                   |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                              |
| **Plataformas**       | Web                                                                                                                                              |
| **Versão**            | 1                                                                                                                                                |
| **Status**            | ✅ Aprovado                                                                                                                                      |

### 2.3.2 - Critérios de Aceitação

- [ ] Ao iniciar o registro, a `Data do Manejo` é definida, inicialmente como a data de hoje, e a sessão passa a `Em andamento`.
- [ ] A `Data do Manejo` não pode ser futura (`RN-MANEJO-01`).
- [ ] Enquanto a sessão estiver em andamento, a `Data do Manejo` pode ser alterada; todos os registros da sessão passam a ter a nova data.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Iniciar registro" de uma sessão planejada na listagem (`RF-MANEJO-01`).
2. O sistema define a data de hoje como `Data do Manejo`, altera a situação da sessão para `Em andamento` e exibe a mensagem: _"Registro iniciado com a data de hoje."_
3. O fluxo continua em `RF-MANEJO-04`.

**Fluxos alternativos**

- **A1 – Alteração da data do manejo (passo 3):**
  1. Com a sessão em andamento, o usuário altera a `Data do Manejo`.
  2. O sistema valida a data (`RN-MANEJO-01`) e aplica a nova data a todos os registros da sessão.
  3. O fluxo continua em `RF-MANEJO-04`.

- **A2 – Data do manejo futura (passo A1.2):**
  1. A data informada é posterior a hoje (`RN-MANEJO-01`).
  2. O sistema impede a alteração e exibe a mensagem: _"A data do manejo não pode ser futura."_
  3. O fluxo retorna ao passo A1.1.

</div>

## 2.4 - `RF-MANEJO-04`: Acompanhar o Registro da Sessão

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite acompanhar a execução de uma sessão em andamento: localizar o próximo animal a manejar, ver o andamento e ajustar os animais participantes.

|                       |                                                                                                                                                                         |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **acompanhar e conduzir o registro da sessão** para lançar os manejos de cada animal que passa no curral. |
| **Dependências**      | `RF-MANEJO-03`                                                                                                                                                          |
| **Regras Vinculadas** | `RN-MANEJO-04`, `RN-MANEJO-05`                                                                                                                                          |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                     |
| **Plataformas**       | Web                                                                                                                                                                     |
| **Versão**            | 1                                                                                                                                                                       |
| **Status**            | ✅ Aprovado                                                                                                                                                             |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir os animais da sessão separados pela situação no manejo: a manejar (nenhuma etapa registrada), parcial (algumas etapas) e completo (todas as etapas). Os parciais e completos devem aparecer do manejado mais recentemente para o mais antigo.
- [ ] Deve ser possível localizar um animal da sessão por `ID`, `Brinco`, `RFID` ou `Apelido` e abrir diretamente o seu registro (`RF-MANEJO-05`), inclusive pela leitura do brinco ou do RFID.
- [ ] Deve ser possível incluir na sessão animais que chegaram ao curral sem estar planejados, com as mesmas regras do planejamento (`RN-MANEJO-04`).
- [ ] Deve ser possível remover um animal da sessão, mediante confirmação; se o animal já tiver registros, eles devem ser desfeitos, e a confirmação deve informar isso.
- [ ] Deve ser possível alterar a `Data do Manejo` (`RF-MANEJO-03`).
- [ ] Deve ser possível acionar a consolidação (`RF-MANEJO-11`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário inicia o registro de uma sessão (`RF-MANEJO-03`) ou aciona a ação "Continuar registro" de uma sessão em andamento na listagem (`RF-MANEJO-01`).
2. O sistema exibe os animais da sessão separados pela situação no manejo: a manejar, parcial e completo, com os parciais e completos do manejado mais recentemente para o mais antigo (`RN-MANEJO-05`).
3. O usuário localiza o próximo animal por `ID`, `Brinco`, `RFID` ou `Apelido`, digitando o valor ou lendo o brinco ou o RFID (ver fluxos alternativos).
4. O sistema abre o registro do animal localizado.
5. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Animal fora da sessão (passo 4):**
  1. O valor informado não corresponde a nenhum animal da sessão.
  2. O sistema exibe a mensagem: _"Nenhum animal da sessão encontrado."_
  3. O fluxo retorna ao passo 3.

- **A2 – Inclusão de animais (passo 3):**
  1. O usuário inclui na sessão animais que chegaram ao curral sem estar planejados, com as mesmas regras do planejamento (`RN-MANEJO-04`).
  2. O sistema inclui os animais disponíveis e exibe a mensagem: _"{quantidade} animal(is) incluído(s) na sessão."_
  3. O fluxo retorna ao passo 3.

- **A3 – Remoção de animal (passo 3):**
  1. O usuário aciona a remoção de um animal da sessão.
  2. O sistema solicita a confirmação, informando, se o animal já tiver registros, que eles serão desfeitos.
  3. O usuário confirma a remoção.
  4. O sistema remove o animal da sessão, desfazendo os seus registros.
  5. O fluxo retorna ao passo 3.

- **A4 – Alteração da data do manejo (passo 3):**
  1. O usuário altera a `Data do Manejo`.
  2. O sistema aplica a alteração conforme `RF-MANEJO-03`.
  3. O fluxo retorna ao passo 3.

- **A5 – Consolidação (passo 3):**
  1. O usuário aciona a consolidação da sessão.
  2. O fluxo continua em `RF-MANEJO-11`.

</div>

## 2.5 - `RF-MANEJO-05`: Registrar Manejos no Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite registrar, em um animal, as etapas da sessão, na ordem planejada, enquanto ele passa pelo curral. Este requisito trata do que é comum a todas as etapas; o que é próprio de cada tipo de manejo está em `RF-MANEJO-06` a `RF-MANEJO-10`.

|                       |                                                                                                                                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **registrar os manejos de um animal etapa por etapa** para lançar o trabalho enquanto ele é feito. |
| **Dependências**      | `RF-MANEJO-04`                                                                                                                                                   |
| **Regras Vinculadas** | `RN-MANEJO-05`                                                                                                                                                   |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                              |
| **Plataformas**       | Web                                                                                                                                                              |
| **Versão**            | 1                                                                                                                                                                |
| **Status**            | ✅ Aprovado                                                                                                                                                      |

### 2.5.2 - Critérios de Aceitação

- [ ] Exibir a identificação do animal, a sua situação no manejo e as etapas da sessão, indicando as já registradas.
- [ ] As etapas devem ser apresentadas na ordem planejada. O usuário pode registrar a etapa e avançar, pular a etapa ou voltar à anterior; ao concluir a última, retorna ao acompanhamento da sessão.
- [ ] Uma etapa já registrada pode ser registrada novamente, substituindo o registro anterior.
- [ ] Toda etapa aceita uma observação sobre o animal.
- [ ] Deve ser possível desfazer todos os registros do animal na sessão, mediante confirmação.
- [ ] Os registros só podem ser feitos com a sessão em andamento.

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o sistema abre o registro de um animal de uma sessão em andamento (`RF-MANEJO-04`).
2. O sistema exibe a identificação do animal, a sua situação no manejo e as etapas da sessão, indicando as já registradas.
3. O sistema apresenta a próxima etapa, na ordem planejada.
4. O usuário registra a etapa, conforme o tipo de manejo (`RF-MANEJO-06` a `RF-MANEJO-10`), podendo informar uma observação sobre o animal (ver fluxos alternativos).
5. O sistema registra a etapa. Se houver uma próxima etapa, o fluxo retorna ao passo 3.
6. Ao concluir a última etapa, o animal passa à situação "completo", e o sistema exibe a mensagem: _"Registro do animal concluído."_
7. O fluxo continua em `RF-MANEJO-04`.

**Fluxos alternativos**

- **A1 – Etapa pulada (passo 4):**
  1. O usuário pula a etapa, sem registrá-la.
  2. O sistema avança para a próxima etapa.
  3. O fluxo retorna ao passo 3 ou, se era a última etapa, continua em `RF-MANEJO-04`.

- **A2 – Volta à etapa anterior (passo 4):**
  1. O usuário volta à etapa anterior.
  2. O sistema apresenta a etapa anterior.
  3. O fluxo retorna ao passo 4.

- **A3 – Etapa já registrada (passo 4):**
  1. O usuário registra novamente uma etapa já registrada.
  2. O sistema substitui o registro anterior da etapa.
  3. O fluxo continua no passo 5.

- **A4 – Registros desfeitos (passo 4):**
  1. O usuário aciona a ação "Desfazer registro".
  2. O sistema solicita a confirmação.
  3. O usuário confirma.
  4. O sistema apaga os registros do animal nesta sessão e exibe a mensagem: _"Registro desfeito."_
  5. O fluxo continua em `RF-MANEJO-04`.

</div>

## 2.6 - `RF-MANEJO-06`: Manejo de Pesagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite registrar a etapa em que o animal é pesado individualmente.

|                       |                                                                                                                                          |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **pesar os animais na sessão** para acompanhar o ganho de peso do rebanho. |
| **Dependências**      | `RF-MANEJO-05`                                                                                                                           |
| **Regras Vinculadas** | `RN-MANEJO-06`, `RN-ANIMAL-07`                                                                                                           |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                      |
| **Plataformas**       | Web                                                                                                                                      |
| **Versão**            | 1                                                                                                                                        |
| **Status**            | ✅ Aprovado                                                                                                                              |

### 2.6.2 - Critérios de Aceitação

**No registro**

- [ ] O peso é obrigatório e deve respeitar `RN-MANEJO-06`.
- [ ] Exibir a última pesagem do animal e alertar, sem impedir o registro, quando a variação for suspeita (`RN-MANEJO-06`).

**Na consolidação**

- [ ] A pesagem entra no histórico do animal e, se for a mais recente, passa a ser o seu `Peso Atual` (`RN-ANIMAL-07`).

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando a etapa de pesagem é apresentada no registro do animal (`RF-MANEJO-05`).
2. O sistema exibe a última pesagem do animal.
3. O usuário informa o peso.
4. O sistema valida o peso (`RN-MANEJO-06`) e registra a pesagem na sessão.
5. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Animal sem pesagem anterior (passo 2):**
  1. O animal nunca foi pesado.
  2. O sistema exibe a mensagem: _"Animal sem pesagem anterior."_
  3. O fluxo continua no passo 3.

- **A2 – Variação suspeita (passo 3):**
  1. O peso informado varia mais de 30% em relação à última pesagem do animal (`RN-MANEJO-06`).
  2. O sistema exibe o alerta: _"Variação de {variação} em relação à última pesagem. Confira o valor."_, sem impedir o registro.
  3. O fluxo continua no passo 4.

</div>

## 2.7 - `RF-MANEJO-07`: Manejo de Castração

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.7.1 - Descrição

Permite registrar a etapa em que o animal é castrado.

|                       |                                                                                                                                                                 |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **registrar a castração dos animais na sessão** para manter a condição de cada animal atualizada. |
| **Dependências**      | `RF-MANEJO-05`, `RF-CAST-01`                                                                                                                                    |
| **Regras Vinculadas** | `RN-MANEJO-07`, `RN-ANIMAL-08`                                                                                                                                  |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                             |
| **Plataformas**       | Web                                                                                                                                                             |
| **Versão**            | 1                                                                                                                                                               |
| **Status**            | ✅ Aprovado                                                                                                                                                     |

### 2.7.2 - Critérios de Aceitação

**No planejamento**

- [ ] Pode ser indicada a técnica prevista, entre as técnicas ativas, para agilizar o registro.

**No registro**

- [ ] A técnica é obrigatória e deve ser escolhida entre as técnicas ativas (`RN-MANEJO-07`).
- [ ] A técnica prevista no planejamento vem pré-selecionada, se ainda estiver ativa, e pode ser trocada por outra.
- [ ] Alertar, sem impedir o registro, quando o animal for fêmea ou já for castrado, informando a data da castração anterior, se houver (`RN-MANEJO-07`).

**Na consolidação**

- [ ] A castração entra no histórico do animal, e o animal passa a ser castrado (`RN-ANIMAL-08`).

### 2.7.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando a etapa de castração é apresentada no registro do animal (`RF-MANEJO-05`).
2. O sistema exibe a técnica prevista no planejamento já selecionada, se houver e se ainda estiver ativa.
3. O usuário mantém a técnica selecionada ou escolhe outra, entre as técnicas ativas.
4. O sistema valida os dados (`RN-MANEJO-07`) e registra a castração na sessão.
5. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Castração atípica (passo 1):**
  1. O animal é fêmea ou já é castrado (`RN-MANEJO-07`).
  2. O sistema exibe o alerta _"Este animal é uma fêmea."_ ou, se o animal já for castrado, informa a data da castração anterior, se houver, sem impedir o registro.
  3. O fluxo continua no passo 2.

- **A2 – Castração sem técnica (passo 4):**
  1. A técnica não foi escolhida (`RN-MANEJO-07`).
  2. O sistema impede o registro e exibe a mensagem: _"Informe a técnica."_
  3. O fluxo retorna ao passo 3.

- **A3 – Animal já registrado (passo 2):**
  1. A castração já foi registrada neste animal na sessão.
  2. O sistema exibe a técnica registrada, em vez da prevista.
  3. O fluxo continua no passo 3.

</div>

## 2.8 - `RF-MANEJO-08`: Manejo de Identificação (Brinco e RFID)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.8.1 - Descrição

Permite registrar as etapas em que o animal recebe um brinco ou um RFID, novo ou em substituição ao atual. Brinco e RFID são etapas distintas, com as mesmas regras.

|                       |                                                                                                                                                           |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **colocar ou trocar o brinco e o RFID dos animais na sessão** para mantê-los identificados. |
| **Dependências**      | `RF-MANEJO-05`                                                                                                                                            |
| **Regras Vinculadas** | `RN-MANEJO-08`, `RN-ANIMAL-01`, `RN-ANIMAL-02`                                                                                                            |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                                       |
| **Versão**            | 1                                                                                                                                                         |
| **Status**            | ✅ Aprovado                                                                                                                                               |

### 2.8.2 - Critérios de Aceitação

**No registro**

- [ ] Exibir o brinco (ou RFID) atual do animal.
- [ ] O novo brinco (ou RFID) é obrigatório, deve ser digitado ou lido por leitor, e deve respeitar `RN-MANEJO-08`.

**Na consolidação**

- [ ] O brinco (ou RFID) entra no histórico de identificação do animal e passa a ser o seu brinco (ou RFID) atual (`RN-ANIMAL-02`).
- [ ] A consolidação deve ser impedida se o brinco (ou RFID) registrado tiver passado a ser usado por outro animal ativo da propriedade (`RN-MANEJO-08`).

### 2.8.3 - Fluxos

Os fluxos abaixo descrevem o brinco; o RFID segue os mesmos fluxos.

**Fluxo principal**

1. O fluxo começa quando a etapa de brinco é apresentada no registro do animal (`RF-MANEJO-05`).
2. O sistema exibe o brinco atual do animal.
3. O usuário digita o novo brinco ou o lê por leitor.
4. O sistema valida o brinco (`RN-MANEJO-08`) e o registra na sessão.
5. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Brinco já usado na sessão (passo 4):**
  1. O brinco informado foi registrado para outro animal da mesma sessão (`RN-MANEJO-08`).
  2. O sistema impede o registro e exibe a mensagem: _"Brinco já registrado para outro animal nesta sessão."_
  3. O fluxo retorna ao passo 3.

- **A2 – Brinco igual ao atual (passo 4):**
  1. O brinco informado é o que o animal já usa (`RN-MANEJO-08`).
  2. O sistema impede o registro e exibe a mensagem: _"Este já é o brinco atual do animal."_
  3. O fluxo retorna ao passo 3.

- **A3 – Brinco em uso por outro animal ativo (passo 4):**
  1. O brinco informado identifica outro animal ativo da propriedade, que não receberá outro brinco na mesma sessão (`RN-MANEJO-08`).
  2. O sistema impede o registro e informa que o brinco está em uso por outro animal.
  3. O fluxo retorna ao passo 3.

- **A4 – Troca de brincos entre animais da sessão (passo 4):**
  1. O brinco informado é usado por outro animal ativo, que, na mesma sessão, receberá outro brinco (`RN-MANEJO-08`).
  2. O sistema aceita o registro.
  3. O fluxo continua no passo 5.

</div>

## 2.9 - `RF-MANEJO-09`: Manejo Sanitário

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.9.1 - Descrição

Permite registrar a etapa em que o animal recebe um procedimento sanitário (vacina, vermífugo, tratamento, exame, etc.). Uma sessão pode ter vários procedimentos, cada um como uma etapa, com os seus próprios dados:

| Campo                 | Descrição                                                                       | Tipo       | Obrig.      | Restrições                                                  |
| --------------------- | ------------------------------------------------------------------------------- | ---------- | ----------- | ----------------------------------------------------------- |
| `Tipo`                | Tipo de manejo sanitário                                                        | Referência | Sim         | Tipo ativo (`MOD-TIPOS-SANITARIOS`)                         |
| `Produto / Descrição` | Produto ou descrição do procedimento, como "Febre aftosa" ou "Ivermectina 1%"   | Texto      | Não         | Até 100 caracteres                                          |
| `Veterinário`         | Pessoa responsável pelo procedimento                                            | Referência | Não         | Pessoa ativa                                                |
| `Carência Até`        | Fim do período de carência do produto                                           | Data       | Não         | Ver `RN-MANEJO-10`                                          |
| `Próxima Dose`        | Data prevista para a próxima aplicação                                          | Data       | Não         | —                                                           |
| `Regra de Dose`       | Como a dose é definida                                                          | Enum       | Sim         | `Sem dose`, `Dose fixa` ou `Dose por peso` (`RN-MANEJO-09`) |
| `Dose (ml)`           | Dose por animal (dose fixa) ou a cada peso de referência (dose por peso)        | Decimal    | Condicional | Maior que zero; obrigatória com dose fixa ou por peso       |
| `Peso de Referência`  | Peso, em kg, a que corresponde a dose na dose por peso (ex.: 1 ml a cada 50 kg) | Decimal    | Condicional | Maior que zero; obrigatório com dose por peso               |

|                       |                                                                                                                                                                                                       |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **aplicar procedimentos sanitários aos animais na sessão** para manter o controle sanitário, a carência e as próximas doses do rebanho. |
| **Dependências**      | `RF-MANEJO-05`, `RF-TSAN-01`                                                                                                                                                                          |
| **Regras Vinculadas** | `RN-MANEJO-02`, `RN-MANEJO-09`, `RN-MANEJO-10`                                                                                                                                                        |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                                   |
| **Plataformas**       | Web                                                                                                                                                                                                   |
| **Versão**            | 1                                                                                                                                                                                                     |
| **Status**            | ✅ Aprovado                                                                                                                                                                                           |

### 2.9.2 - Critérios de Aceitação

**No planejamento**

- [ ] Para cada procedimento, devem ser informados os seus dados. O `Tipo` é obrigatório e deve ser escolhido entre os tipos ativos, e o `Veterinário`, entre as pessoas ativas.
- [ ] Com dose fixa, a `Dose (ml)` é obrigatória; com dose por peso, também o `Peso de Referência` (`RN-MANEJO-09`).
- [ ] Em um procedimento já registrado em algum animal, não é possível passar de "sem dose" para uma regra com dose, nem o contrário.

**No registro**

- [ ] Exibir os dados do procedimento e solicitar a confirmação da aplicação no animal.
- [ ] Com regra de dose, a dose aplicada é obrigatória e maior que zero, e deve vir sugerida conforme `RN-MANEJO-09`, podendo ser alterada. Sem peso para o cálculo, o usuário deve informar a dose aplicada.

**Na consolidação**

- [ ] O procedimento entra no histórico sanitário de cada animal que o recebeu, com a dose aplicada, a carência (`RN-MANEJO-10`) e a próxima dose.

### 2.9.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando a etapa do procedimento sanitário é apresentada no registro do animal (`RF-MANEJO-05`).
2. O sistema exibe os dados do procedimento e, com regra de dose, sugere a dose aplicada conforme `RN-MANEJO-09` (ex.: com dose por peso de 1 ml a cada 50 kg e o animal pesando 425 kg, sugere 8,5 ml).
3. O usuário confirma a aplicação no animal, mantendo ou alterando a dose sugerida.
4. O sistema registra o procedimento na sessão, com a dose aplicada.
5. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Procedimento sem dose (passo 2):**
  1. A regra de dose do procedimento é "sem dose".
  2. O sistema exibe os dados do procedimento e solicita apenas a confirmação da aplicação.
  3. O fluxo continua no passo 3.

- **A2 – Animal sem peso (passo 2):**
  1. O procedimento tem dose por peso, e o animal não tem peso registrado na sessão nem peso atual.
  2. O sistema solicita: _"Animal sem peso: informe a dose aplicada."_
  3. O fluxo continua no passo 3.

</div>

## 2.10 - `RF-MANEJO-10`: Manejo de Apartação

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.10.1 - Descrição

Permite registrar a etapa em que se define para qual lote o animal vai ao sair do curral: permanecer no lote atual ou ir para outro. É sempre a última etapa da sessão.

|                       |                                                                                                                                                                                 |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **apartar os animais na sessão** para reorganizar os lotes conforme o resultado do manejo (peso, sexo, condição). |
| **Dependências**      | `RF-MANEJO-05`, `RF-LOTE-02`                                                                                                                                                    |
| **Regras Vinculadas** | `RN-MANEJO-02`, `RN-MANEJO-11`, `RN-ANIMAL-03`                                                                                                                                  |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                             |
| **Plataformas**       | Web                                                                                                                                                                             |
| **Versão**            | 1                                                                                                                                                                               |
| **Status**            | ✅ Aprovado                                                                                                                                                                     |

### 2.10.2 - Critérios de Aceitação

**No planejamento**

- [ ] Podem ser indicados lotes sugeridos, entre os lotes vigentes da propriedade, para agilizar a escolha do destino no registro.

**No registro**

- [ ] O usuário escolhe se o animal permanece no lote atual ou vai para outro lote, entre os lotes sugeridos ou qualquer outro lote vigente da propriedade (`RN-MANEJO-11`).

**Na consolidação**

- [ ] Os animais com destino em outro lote saem do lote atual e entram no lote de destino, e a mudança entra no histórico de lotes de cada animal (`RN-ANIMAL-03`).
- [ ] Os animais que permaneceram no lote atual não têm mudança.

### 2.10.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando a etapa de apartação, sempre a última, é apresentada no registro do animal (`RF-MANEJO-05`).
2. O sistema exibe o lote atual do animal e os lotes sugeridos no planejamento.
3. O usuário escolhe se o animal permanece no lote atual ou vai para outro lote, entre os sugeridos ou qualquer outro lote vigente da propriedade, por exemplo conforme o peso registrado na sessão (`RN-MANEJO-11`).
4. O sistema registra o destino do animal na sessão; a mudança de lote só acontece na consolidação.
5. O fluxo continua em `RF-MANEJO-05`.

</div>

## 2.11 - `RF-MANEJO-11`: Consolidar Sessão

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.11.1 - Descrição

Permite encerrar a execução de uma sessão, fazendo os seus registros passarem a valer no histórico dos animais.

|                       |                                                                                                                                                          |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **consolidar uma sessão de manejo** para que os manejos feitos passem a valer nos animais. |
| **Dependências**      | `RF-MANEJO-04`, `RF-MANEJO-05`                                                                                                                           |
| **Regras Vinculadas** | `RN-MANEJO-01`, `RN-MANEJO-03`, `RN-MANEJO-04`, `RN-MANEJO-05`, `RN-MANEJO-08`                                                                           |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                      |
| **Plataformas**       | Web                                                                                                                                                      |
| **Versão**            | 1                                                                                                                                                        |
| **Status**            | ✅ Aprovado                                                                                                                                              |

### 2.11.2 - Critérios de Aceitação

- [ ] Somente sessões em andamento podem ser consolidadas.
- [ ] A consolidação exige confirmação do usuário, informando que a sessão não poderá mais ser alterada e, se houver, quantos animais não foram manejados e serão removidos da sessão (`RN-MANEJO-05`).
- [ ] A consolidação deve ser impedida se: nenhum animal tiver sido manejado; a `Data do Manejo` for futura; algum animal manejado não estiver mais ativo na propriedade; houver compromisso conflitante com outra operação aberta (`RN-MANEJO-04`); ou um brinco (ou RFID) registrado estiver em uso por outro animal (`RN-MANEJO-08`).
- [ ] Na consolidação, os registros passam a valer com a `Data do Manejo` (ou com o horário da consolidação, se o manejo for de hoje), e cada manejo produz o seu efeito nos animais, conforme `RF-MANEJO-06` a `RF-MANEJO-10`.

### 2.11.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a consolidação no acompanhamento de uma sessão em andamento (`RF-MANEJO-04`).
2. O sistema solicita a confirmação, informando que a sessão não poderá mais ser alterada e, se houver, quantos animais não foram manejados e serão removidos da sessão (`RN-MANEJO-05`).
3. O usuário confirma a consolidação.
4. O sistema verifica que a consolidação não tem impedimentos (`RN-MANEJO-01`, `RN-MANEJO-04`, `RN-MANEJO-05`, `RN-MANEJO-08`).
5. O sistema altera a situação da sessão para `Consolidada`, remove os animais não manejados e aplica os registros nos animais com a `Data do Manejo` (ou com o horário da consolidação, se o manejo for de hoje), cada manejo produzindo o seu efeito conforme `RF-MANEJO-06` a `RF-MANEJO-10`.
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Consolidação cancelada (passo 3):**
  1. O usuário não confirma a consolidação.
  2. O sistema mantém a sessão em andamento.
  3. O fluxo continua em `RF-MANEJO-04`.

- **A2 – Nenhum animal manejado (passo 4):**
  1. Nenhum animal da sessão tem etapa registrada (`RN-MANEJO-05`).
  2. O sistema impede a consolidação e exibe a mensagem: _"Nenhum animal foi manejado. Registre ao menos um animal antes de consolidar."_
  3. O fluxo termina com falha.

- **A3 – Animal que saiu do rebanho (passo 4):**
  1. Um animal manejado deixou de estar ativo na propriedade depois do registro (`RN-MANEJO-04`).
  2. O sistema impede a consolidação e exibe a mensagem: _"Animais manejados que não estão mais ativos na propriedade: {animais}. Remova-os da sessão antes de consolidar."_
  3. O fluxo termina com falha.

- **A4 – Outro impedimento (passo 4):**
  1. A `Data do Manejo` é futura (`RN-MANEJO-01`), há compromisso conflitante com outra operação aberta (`RN-MANEJO-04`) ou um brinco (ou RFID) registrado está em uso por outro animal (`RN-MANEJO-08`).
  2. O sistema impede a consolidação e informa o motivo.
  3. O fluxo termina com falha.

</div>

## 2.12 - `RF-MANEJO-12`: Cancelar Sessão

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.12.1 - Descrição

Permite cancelar uma sessão que não será concluída. Os registros feitos nela ficam guardados, mas nenhum passa a valer.

|                       |                                                                                                                                      |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **cancelar uma sessão de manejo** que não será realizada ou concluída. |
| **Dependências**      | `RF-MANEJO-01`, `RF-MANEJO-02`                                                                                                       |
| **Regras Vinculadas** | `RN-MANEJO-03`                                                                                                                       |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                  |
| **Plataformas**       | Web                                                                                                                                  |
| **Versão**            | 1                                                                                                                                    |
| **Status**            | ✅ Aprovado                                                                                                                          |

### 2.12.2 - Critérios de Aceitação

- [ ] Somente sessões planejadas ou em andamento podem ser canceladas.
- [ ] O cancelamento exige confirmação do usuário, informando que nenhum registro da sessão passará a valer.
- [ ] Uma sessão cancelada continua disponível para consulta, com os seus registros.
- [ ] O cancelamento libera os animais dos compromissos da sessão (`RN-ANIMAL-10`).

### 2.12.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o cancelamento de uma sessão planejada ou em andamento na listagem (`RF-MANEJO-01`).
2. O sistema solicita a confirmação, informando que nenhum registro da sessão passará a valer.
3. O usuário confirma o cancelamento.
4. O sistema altera a situação da sessão para `Cancelada`, mantendo os seus registros para consulta, libera os animais dos compromissos da sessão (`RN-ANIMAL-10`) e exibe a mensagem: _"Sessão de manejo cancelada."_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Cancelamento não confirmado (passo 3):**
  1. O usuário não confirma o cancelamento.
  2. O sistema mantém a sessão inalterada.
  3. O fluxo termina.

</div>
