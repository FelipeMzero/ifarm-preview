# 📦 Módulo: `MOD-RECEPCOES`

Módulo responsável pela recepção dos animais comprados: a chegada à fazenda de cada leva de animais de uma compra (`MOD-COMPRAS`), uma por viagem ou entrega.

Na recepção, cada animal que desce do caminhão é cadastrado e pode passar pelos manejos de chegada, como brinco, RFID e pesagem. Por isso, a recepção é feita em uma sessão de manejo (`MOD-MANEJOS`): este módulo especifica apenas o que é próprio da recepção e referencia os requisitos de manejo para o restante, como o registro das etapas em cada animal e a consolidação.

A recepção é feita na área de recepções, que mostra as compras sem os valores da negociação e é acessível também aos funcionários.

## Dicionário de dados conceitual

**Recepção**

| Campo              | Descrição                                                         | Tipo       | Obrig. | Restrições                                                                                     |
| ------------------ | ----------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------- |
| `Título`           | Identifica a recepção, como "Recepção 2 — Bezerros desmamados"    | Texto      | Sim    | Gerado pelo sistema: número da recepção na compra e título da compra                           |
| `Compra`           | Compra cujos animais são recebidos                                | Referência | Sim    | Compra em andamento (`RN-RECEPCAO-01`)                                                         |
| `Lote de Entrada`  | Lote em que os animais recebidos entram                           | Referência | Sim    | Lote vigente da propriedade de destino da compra (`RN-RECEPCAO-01`)                            |
| `GTA`              | Número da Guia de Trânsito Animal da carga                        | Texto      | Não    | Até 30 caracteres                                                                              |
| `Nota Fiscal`      | Número da nota fiscal da carga                                    | Texto      | Não    | Até 30 caracteres                                                                              |
| `Data da Recepção` | Data em que os animais chegaram                                   | Data       | Sim    | Inicialmente a data de hoje; não pode ser futura (`RN-MANEJO-01`)                              |
| `Manejos`          | Etapas feitas em cada animal recebido, na ordem em que são feitas | Lista      | Não    | Mesmas regras dos manejos da sessão (`RN-MANEJO-02`), mas podem não existir (`RN-RECEPCAO-01`) |
| `Situação`         | Situação da recepção                                              | Enum       | Sim    | `Em andamento`, `Concluída` ou `Cancelada` (`RN-RECEPCAO-04`)                                  |

**Animal recebido**

| Campo            | Descrição                                                           | Tipo       | Obrig. | Restrições                                                          |
| ---------------- | ------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| `Categoria`      | Categoria da compra em que o animal é classificado                  | Referência | Sim    | Categoria da compra da recepção                                     |
| `Sexo`           | Sexo do animal                                                      | Enum       | Sim    | Inicialmente o da categoria (`RN-RECEPCAO-02`)                      |
| `Idade Estimada` | Idade, em meses, estimada no recebimento, como pela arcada dentária | Inteiro    | Não    | De 0 a 360; gera a data de nascimento estimada (`RN-RECEPCAO-02`)   |
| `Apelido`        | Apelido do animal                                                   | Texto      | Não    | Mesmas restrições do apelido no cadastro de animais (`MOD-ANIMAIS`) |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-RECEPCAO-01` - Recepção:** Uma recepção é a chegada de uma leva de animais de uma compra em andamento, na propriedade de destino da compra. Ela é feita em uma sessão de manejo (`RN-MANEJO-01`) e tem um lote de entrada, vigente, em que todos os animais recebidos entram. Diferente das demais sessões, uma recepção pode não ter manejos: nesse caso, receber os animais é todo o trabalho.
- **`RN-RECEPCAO-02` - Animal Recebido:** Os animais de uma recepção são apenas os recebidos nela; animais já cadastrados não podem ser incluídos. Ao ser recebido, o animal passa a existir já ativo, com origem `Compra`, a raça da categoria e o sexo da categoria, que pode ser trocado, pois quem decide é quem vê o animal. Ele entra na propriedade e no lote de entrada na data da recepção. Se a idade for estimada, a data de nascimento é calculada a partir dela e fica marcada como estimada. Receber um animal de sexo ou faixa de idade diferentes dos da categoria, ou além da quantidade negociada, é atípico, mas permitido.
- **`RN-RECEPCAO-03` - Desfazer Recebimento:** Retirar um animal de uma recepção em andamento desfaz o seu recebimento: os registros da recepção são desfeitos e o animal é apagado. Se o animal já tiver registros fora da recepção, a retirada é recusada.
- **`RN-RECEPCAO-04` - Ciclo da Recepção:** Uma recepção fica em andamento até ser concluída ou cancelada. Na conclusão, todos os animais recebidos permanecem, mesmo sem nenhum manejo registrado, e os manejos registrados passam a valer (`RN-MANEJO-03`). Somente uma recepção sem animais recebidos pode ser cancelada. Enquanto a recepção está em andamento, os animais recebidos não participam de outras operações (`RN-ANIMAL-10`).
- **`RN-RECEPCAO-05` - Sigilo da Negociação:** A área de recepções não exibe os valores da negociação: preços, valores, custos e pagamento da compra.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-RECEPCAO-01`: Listagem de Compras a Receber

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar, na área de recepções, as compras da propriedade selecionada que ainda têm animais a receber, para localizar a compra de uma carga que chegou.

|                       |                                                                                                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **ver as compras com animais a receber** para preparar e registrar a chegada das cargas. |
| **Dependências**      | `RF-COMPRA-02`                                                                                                                                         |
| **Regras Vinculadas** | `RN-RECEPCAO-05`                                                                                                                                       |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                    |
| **Versão**            | 1                                                                                                                                                      |
| **Especificação**     | 📝 Rascunho                                                                                                                                            |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas as compras não canceladas da propriedade selecionada, sem os valores da negociação (`RN-RECEPCAO-05`).
- [ ] A listagem deve exibir, de cada compra, a data da compra, o título e o vendedor, as categorias, os animais recebidos em relação aos negociados e a situação do recebimento: `Em andamento` (com recepção em aberto), `A receber` (com menos animais recebidos que o negociado), `Recebida` (com todos os negociados recebidos) ou `Consolidada`.
- [ ] A ordenação inicial é pela data da compra, da mais recente para a mais antiga.
- [ ] A pesquisa deve considerar o título da compra, o vendedor e o número da GTA das recepções.
- [ ] Os filtros disponíveis são: a receber (compras em andamento com animais a receber ou com uma recepção em aberto) e todas. O filtro inicial é "a receber".
- [ ] Deve permitir abrir cada compra (`RF-RECEPCAO-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a área de recepções.
2. O sistema exibe as compras a receber da propriedade selecionada, da data da compra mais recente para a mais antiga, de forma paginada.
3. O usuário localiza a compra desejada, podendo pesquisar, filtrar, ordenar ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário abre a compra.
5. O fluxo continua em `RF-RECEPCAO-02`.

**Fluxos alternativos**

- **A1 – Nenhuma compra a receber (passo 2):**
  1. Não há compras a receber na propriedade selecionada.
  2. O sistema exibe a mensagem: _"Nenhuma compra a receber."_
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as compras que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A3 – Pesquisa sem resultados (passo A2.2):**
  1. Nenhuma compra corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhuma compra encontrada."_
  3. O fluxo retorna ao passo 3.

- **A4 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

</div>

## 2.2 - `RF-RECEPCAO-02`: Acompanhar o Recebimento da Compra

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite acompanhar, na área de recepções, o recebimento de uma compra: o que foi negociado, o que já chegou e as recepções feitas.

|                       |                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **acompanhar o recebimento de uma compra** para saber o que já chegou e abrir uma recepção quando chegar uma nova carga. |
| **Dependências**      | `RF-RECEPCAO-01`                                                                                                                                                                       |
| **Regras Vinculadas** | `RN-RECEPCAO-05`                                                                                                                                                                       |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                                                    |
| **Versão**            | 1                                                                                                                                                                                      |
| **Especificação**     | 📝 Rascunho                                                                                                                                                                            |

### 2.2.2 - Critérios de Aceitação

- [ ] Exibir o título, o vendedor, a data e a observação da compra, a situação da compra quando consolidada ou cancelada e o total de animais recebidos em relação aos negociados, sem os valores da negociação (`RN-RECEPCAO-05`).
- [ ] Exibir as categorias negociadas, cada uma com os animais recebidos em relação aos negociados, destacando quando o recebido passar do negociado.
- [ ] Exibir as recepções da compra, com título, situação, data, lote de entrada, GTA, nota fiscal e quantidade de animais, permitindo abrir cada uma (`RF-RECEPCAO-04`).
- [ ] Deve permitir abrir uma nova recepção (`RF-RECEPCAO-03`) somente em compras em andamento.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário abre uma compra na área de recepções (`RF-RECEPCAO-01`).
2. O sistema exibe os dados da compra, as categorias com os recebidos e as recepções.
3. O usuário abre uma das recepções.
4. O fluxo continua em `RF-RECEPCAO-04`.

**Fluxos alternativos**

- **A1 – Compra sem recepções (passo 2):**
  1. A compra ainda não tem recepções.
  2. O sistema exibe a mensagem: _"Nenhum animal recebido ainda."_
  3. O fluxo continua no passo A2.1.

- **A2 – Nova recepção (passo 3):**
  1. Com a compra em andamento, o usuário aciona a abertura de uma nova recepção.
  2. O fluxo continua em `RF-RECEPCAO-03`.

- **A3 – Compra consolidada ou cancelada (passo 2):**
  1. A compra está consolidada ou cancelada.
  2. O sistema exibe a compra apenas para consulta, sem a opção de abrir uma nova recepção.
  3. O fluxo continua no passo 3.

</div>

## 2.3 - `RF-RECEPCAO-03`: Abrir Recepção

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite abrir uma recepção para uma carga que chegou, definindo o lote de entrada, os documentos da carga e os manejos que serão feitos em cada animal recebido.

|                       |                                                                                                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **abrir uma recepção quando uma carga chega** para cadastrar os animais e fazer os manejos de chegada. |
| **Dependências**      | `RF-RECEPCAO-02`, `RF-LOTE-02` (deve existir um lote vigente)                                                                                                        |
| **Regras Vinculadas** | `RN-RECEPCAO-01`, `RN-MANEJO-02`                                                                                                                                     |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                                  |
| **Versão**            | 1                                                                                                                                                                    |
| **Especificação**     | 📝 Rascunho                                                                                                                                                          |

### 2.3.2 - Critérios de Aceitação

- [ ] Somente uma compra em andamento pode receber uma nova recepção (`RN-RECEPCAO-01`).
- [ ] A abertura deve permitir informar o `Lote de Entrada`, obrigatório e escolhido entre os lotes vigentes da propriedade de destino da compra, o `GTA` e a `Nota Fiscal`, opcionais, e os `Manejos`.
- [ ] Os `Manejos` seguem as mesmas regras e têm os mesmos dados próprios do planejamento de uma sessão de manejo (`RF-MANEJO-02`), exceto que podem não existir (`RN-RECEPCAO-01`). Inicialmente, são sugeridos brinco, RFID e pesagem.
- [ ] A recepção é criada já iniciada, com a data de hoje como `Data da Recepção`, e recebe o título com o número da recepção na compra e o título da compra.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a abertura de uma nova recepção no recebimento da compra (`RF-RECEPCAO-02`).
2. O sistema exibe o formulário da recepção, com os manejos sugeridos.
3. O usuário escolhe o `Lote de Entrada`, informa o `GTA` e a `Nota Fiscal`, se tiver, e ajusta os `Manejos`, podendo acrescentar, remover e reordenar etapas e informar os seus dados próprios (`RF-MANEJO-02`).
4. O usuário aciona a ação "Iniciar recepção".
5. O sistema valida os dados (`RN-RECEPCAO-01`, `RN-MANEJO-02`), cria a recepção já iniciada, com a data de hoje, e exibe a mensagem: _"Recepção aberta."_
6. O fluxo continua em `RF-RECEPCAO-04`.

**Fluxos alternativos**

- **A1 – Lote de entrada ausente (passo 5):**
  1. O `Lote de Entrada` não foi escolhido.
  2. O sistema impede a abertura e exibe a mensagem: _"Selecione o lote de entrada."_
  3. O fluxo retorna ao passo 3.

- **A2 – Lote de entrada inválido (passo 5):**
  1. O lote escolhido foi encerrado ou não é da propriedade de destino da compra (`RN-RECEPCAO-01`).
  2. O sistema impede a abertura e exibe a mensagem: _"Lote de entrada inválido ou encerrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Manejos inválidos (passo 5):**
  1. Os manejos não respeitam as regras do planejamento (`RN-MANEJO-02`).
  2. O sistema impede a abertura e exibe as mensagens previstas em `RF-MANEJO-02`.
  3. O fluxo retorna ao passo 3.

- **A4 – Compra encerrada (passo 5):**
  1. A compra foi consolidada ou cancelada antes da abertura (`RN-RECEPCAO-01`).
  2. O sistema impede a abertura e exibe a mensagem: _"Recepções só podem ser abertas em compras em andamento."_
  3. O fluxo continua em `RF-RECEPCAO-02`.

</div>

## 2.4 - `RF-RECEPCAO-04`: Acompanhar a Recepção

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite conduzir uma recepção: receber os animais conforme descem do caminhão, localizar cada animal para registrar os manejos de chegada e ajustar os dados da recepção. A recepção funciona como o acompanhamento do registro de uma sessão de manejo (`RF-MANEJO-04`), com as diferenças descritas aqui.

|                       |                                                                                                                                                                         |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **conduzir a recepção de uma carga** para cadastrar os animais e lançar os manejos de chegada de cada um. |
| **Dependências**      | `RF-RECEPCAO-03`, `RF-MANEJO-04`                                                                                                                                        |
| **Regras Vinculadas** | `RN-RECEPCAO-02`, `RN-RECEPCAO-03`, `RN-RECEPCAO-04`, `RN-RECEPCAO-05`                                                                                                  |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                     |
| **Plataformas**       | Web                                                                                                                                                                     |
| **Versão**            | 1                                                                                                                                                                       |
| **Especificação**     | 📝 Rascunho                                                                                                                                                             |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir o título e a situação da recepção, a compra e o vendedor, o `Lote de Entrada`, a `Data da Recepção`, o `GTA`, a `Nota Fiscal` e os `Manejos` da recepção (ou que ela não tem manejos), sem os valores da negociação (`RN-RECEPCAO-05`).
- [ ] Exibir as categorias da compra, cada uma com os animais recebidos nesta recepção e os recebidos na compra em relação aos negociados.
- [ ] Os animais recebidos são exibidos, localizados e abertos para o registro dos manejos como no acompanhamento de uma sessão (`RF-MANEJO-04`), indicando a categoria de cada um. O registro dos manejos em cada animal segue `RF-MANEJO-05` a `RF-MANEJO-10`.
- [ ] Em uma recepção em andamento, deve ser possível receber animais (`RF-RECEPCAO-05`). Animais já cadastrados não podem ser incluídos (`RN-RECEPCAO-02`).
- [ ] Retirar um animal da recepção desfaz o seu recebimento, mediante confirmação que informe que o animal será apagado (`RN-RECEPCAO-03`).
- [ ] Enquanto a recepção está em andamento, devem ser possíveis alterar a `Data da Recepção`, conforme a alteração da data do manejo (`RF-MANEJO-03`), e informar ou alterar o `GTA` e a `Nota Fiscal`.
- [ ] Deve permitir acionar a conclusão (`RF-RECEPCAO-06`) e o cancelamento (`RF-RECEPCAO-07`) da recepção.
- [ ] Uma recepção concluída ou cancelada é exibida apenas para consulta.

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário abre uma recepção (`RF-RECEPCAO-02`) ou conclui a abertura de uma recepção (`RF-RECEPCAO-03`).
2. O sistema exibe os dados da recepção, as categorias da compra com os recebidos e os animais recebidos, separados pela situação no manejo (`RF-MANEJO-04`).
3. O usuário recebe um animal que desceu do caminhão (`RF-RECEPCAO-05`).
4. Se a recepção tem manejos, o usuário abre o registro do animal, localizando-o como no acompanhamento de uma sessão (`RF-MANEJO-04`), e registra os manejos (`RF-MANEJO-05`).
5. O fluxo retorna ao passo 3 até que todos os animais da carga tenham sido recebidos.
6. O fluxo continua em `RF-RECEPCAO-06`.

**Fluxos alternativos**

- **A1 – Animal da recepção não encontrado (passo 4):**
  1. O valor informado na busca não corresponde a nenhum animal da recepção.
  2. O sistema exibe a mensagem: _"Nenhum animal da recepção encontrado."_
  3. O fluxo retorna ao passo 3.

- **A2 – Desfazer recebimento (passo 3):**
  1. O usuário aciona a retirada de um animal da recepção.
  2. O sistema solicita a confirmação, informando que o animal será apagado, com o seu cadastro, a entrada no lote e os registros desta recepção (`RN-RECEPCAO-03`).
  3. O usuário confirma.
  4. O sistema desfaz o recebimento e exibe a mensagem: _"Recebimento desfeito."_
  5. O fluxo retorna ao passo 3.

- **A3 – Animal com registros fora da recepção (passo A2.4):**
  1. O animal já tem registros fora da recepção (`RN-RECEPCAO-03`).
  2. O sistema impede a retirada e exibe a mensagem: _"O animal já tem registros fora desta recepção e não pode ser removido."_
  3. O fluxo retorna ao passo 3.

- **A4 – Documentos da carga (passo 3):**
  1. O usuário aciona a informação ou a alteração dos documentos da carga.
  2. O sistema solicita o `GTA` e a `Nota Fiscal`.
  3. O usuário informa os documentos e confirma.
  4. O sistema grava os documentos e exibe a mensagem: _"Documentos da carga salvos."_
  5. O fluxo retorna ao passo 3.

- **A5 – Alteração da data da recepção (passo 3):**
  1. O usuário altera a `Data da Recepção`.
  2. O sistema aplica a alteração conforme a alteração da data do manejo (`RF-MANEJO-03`), com os mesmos impedimentos, e exibe a mensagem: _"Data da recepção alterada."_
  3. O fluxo retorna ao passo 3.

- **A6 – Recepção sem manejos (passo 4):**
  1. A recepção não tem manejos (`RN-RECEPCAO-01`).
  2. Não há registro de manejos a fazer: o recebimento é todo o trabalho.
  3. O fluxo continua no passo 5.

- **A7 – Recepção concluída ou cancelada (passo 2):**
  1. A recepção já foi concluída ou cancelada.
  2. O sistema exibe a recepção apenas para consulta.
  3. O fluxo termina.

- **A8 – Cancelamento (passo 3):**
  1. Sem animais recebidos, o usuário aciona o cancelamento da recepção.
  2. O fluxo continua em `RF-RECEPCAO-07`.

</div>

## 2.5 - `RF-RECEPCAO-05`: Receber Animal

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite cadastrar, na recepção, um animal que desceu do caminhão, classificando-o em uma categoria da compra.

|                       |                                                                                                                                                                             |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **receber cada animal que desce do caminhão** para que ele passe a fazer parte do rebanho já ligado à compra. |
| **Dependências**      | `RF-RECEPCAO-04`                                                                                                                                                            |
| **Regras Vinculadas** | `RN-RECEPCAO-02`                                                                                                                                                            |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                         |
| **Plataformas**       | Web                                                                                                                                                                         |
| **Versão**            | 1                                                                                                                                                                           |
| **Especificação**     | 📝 Rascunho                                                                                                                                                                 |

### 2.5.2 - Critérios de Aceitação

- [ ] Somente uma recepção em andamento, de uma compra em andamento e com o lote de entrada vigente, pode receber animais.
- [ ] O recebimento deve permitir escolher a `Categoria` e informar o `Sexo`, a `Idade Estimada` e o `Apelido`.
- [ ] A categoria escolhida permanece selecionada para os próximos animais, pois uma carga costuma trazer uma categoria só. Inicialmente, é sugerida a primeira categoria que ainda não recebeu toda a quantidade negociada.
- [ ] O `Sexo` vem preenchido com o da categoria e pode ser trocado (`RN-RECEPCAO-02`).
- [ ] O sistema deve alertar, sem impedir o recebimento, quando o sexo for diferente do da categoria, quando a idade estiver fora da faixa da categoria ou quando a categoria já tiver recebido toda a quantidade negociada (`RN-RECEPCAO-02`).
- [ ] Com manejos na recepção, deve ser possível receber o animal e abrir em seguida o seu registro de manejos (`RF-MANEJO-05`), ou apenas recebê-lo e continuar recebendo.
- [ ] O animal recebido é cadastrado conforme `RN-RECEPCAO-02` e entra na recepção.

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando um animal desce do caminhão em uma recepção em andamento (`RF-RECEPCAO-04`).
2. O sistema exibe a categoria em recebimento e o `Sexo` da categoria.
3. O usuário mantém ou troca a `Categoria` e informa o `Sexo`, a `Idade Estimada` e o `Apelido`, se for o caso.
4. O usuário aciona a ação "Receber e manejar".
5. O sistema cadastra o animal (`RN-RECEPCAO-02`), inclui-o na recepção e exibe a mensagem: _"Animal recebido ({categoria})."_
6. O sistema abre o registro de manejos do animal.
7. O fluxo continua em `RF-MANEJO-05`.

**Fluxos alternativos**

- **A1 – Recebimento sem abrir os manejos (passo 4):**
  1. O usuário aciona a ação "Receber", ou a recepção não tem manejos.
  2. O sistema cadastra o animal, inclui-o na recepção e exibe a mensagem: _"Animal recebido ({categoria})."_
  3. O fluxo continua em `RF-RECEPCAO-04`, pronto para o próximo animal.

- **A2 – Recebimento atípico (passo 3):**
  1. O sexo é diferente do da categoria, a idade está fora da faixa da categoria ou a categoria já recebeu toda a quantidade negociada (`RN-RECEPCAO-02`).
  2. O sistema exibe o alerta correspondente, sem impedir o recebimento: _"Sexo diferente do da categoria ({machos ou fêmeas})."_, _"Idade fora da faixa negociada para a categoria."_ ou _"A categoria já recebeu {recebidos} de {negociados} animais negociados."_
  3. O fluxo continua no passo 4.

- **A3 – Categoria não escolhida (passo 5):**
  1. Nenhuma categoria foi escolhida.
  2. O sistema impede o recebimento e exibe a mensagem: _"Escolha a categoria do animal."_
  3. O fluxo retorna ao passo 3.

- **A4 – Recebimento impedido (passo 5):**
  1. A compra foi consolidada ou cancelada, ou o lote de entrada foi encerrado depois da abertura da recepção.
  2. O sistema impede o recebimento e exibe a mensagem correspondente: _"A compra já foi consolidada."_, _"A compra foi cancelada."_ ou _"O lote de entrada "{lote}" está encerrado."_
  3. O fluxo continua em `RF-RECEPCAO-04`.

</div>

## 2.6 - `RF-RECEPCAO-06`: Concluir Recepção

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite encerrar uma recepção, fazendo os manejos registrados passarem a valer. A conclusão segue a consolidação de uma sessão de manejo (`RF-MANEJO-12`), com as diferenças descritas aqui.

|                       |                                                                                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **concluir uma recepção** para que os animais recebidos e os seus manejos de chegada passem a valer. |
| **Dependências**      | `RF-RECEPCAO-04`, `RF-MANEJO-12`                                                                                                                                   |
| **Regras Vinculadas** | `RN-RECEPCAO-04`, `RN-MANEJO-03`                                                                                                                                   |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                |
| **Plataformas**       | Web                                                                                                                                                                |
| **Versão**            | 1                                                                                                                                                                  |
| **Especificação**     | 📝 Rascunho                                                                                                                                                        |

### 2.6.2 - Critérios de Aceitação

- [ ] A conclusão segue os critérios da consolidação de uma sessão de manejo (`RF-MANEJO-12`), exceto:
  - todos os animais recebidos permanecem na recepção, mesmo sem manejos registrados (`RN-RECEPCAO-04`);
  - a conclusão é impedida se nenhum animal tiver sido recebido.
- [ ] A confirmação deve informar quantos animais foram recebidos e, se houver, quantos têm manejos pendentes, deixando claro que só o que foi registrado será aplicado e que nenhum animal recebido sai da recepção.
- [ ] A conclusão não define o custo dos animais, que só é rateado na consolidação da compra (`RF-COMPRA-05`).

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Concluir recepção" de uma recepção em andamento com animais recebidos (`RF-RECEPCAO-04`).
2. O sistema solicita a confirmação, informando quantos animais foram recebidos e, se houver, quantos têm manejos pendentes, e que a recepção não poderá mais ser alterada.
3. O usuário confirma a conclusão.
4. O sistema verifica os impedimentos da consolidação de uma sessão (`RF-MANEJO-12`).
5. O sistema conclui a recepção, aplica os manejos registrados nos animais (`RN-MANEJO-03`) e exibe a mensagem: _"Recepção concluída: {quantidade} animal(is) recebido(s)."_
6. O fluxo continua em `RF-RECEPCAO-04`, com a recepção apenas para consulta.

**Fluxos alternativos**

- **A1 – Conclusão não confirmada (passo 3):**
  1. O usuário não confirma a conclusão.
  2. O sistema mantém a recepção em andamento.
  3. O fluxo continua em `RF-RECEPCAO-04`.

- **A2 – Nenhum animal recebido (passo 4):**
  1. A recepção não tem animais recebidos.
  2. O sistema impede a conclusão e exibe a mensagem: _"Nenhum animal foi recebido. Receba ao menos um animal antes de consolidar."_
  3. O fluxo continua em `RF-RECEPCAO-04`.

- **A3 – Outro impedimento (passo 4):**
  1. A conclusão tem um dos impedimentos da consolidação de uma sessão, como a data futura ou um brinco em uso por outro animal (`RF-MANEJO-12`).
  2. O sistema impede a conclusão e informa o motivo, como na consolidação de uma sessão.
  3. O fluxo continua em `RF-RECEPCAO-04`.

</div>

## 2.7 - `RF-RECEPCAO-07`: Cancelar Recepção

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.7.1 - Descrição

Permite cancelar uma recepção aberta sem que nenhum animal tenha sido recebido, por exemplo, quando a carga não chegou. O cancelamento segue o cancelamento de uma sessão de manejo (`RF-MANEJO-13`), com as diferenças descritas aqui.

|                       |                                                                                                                                                                               |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **cancelar uma recepção aberta por engano ou cuja carga não chegou** para que ela não fique pendente na compra. |
| **Dependências**      | `RF-RECEPCAO-04`, `RF-MANEJO-13`                                                                                                                                              |
| **Regras Vinculadas** | `RN-RECEPCAO-04`                                                                                                                                                              |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                           |
| **Plataformas**       | Web                                                                                                                                                                           |
| **Versão**            | 1                                                                                                                                                                             |
| **Especificação**     | 📝 Rascunho                                                                                                                                                                   |

### 2.7.2 - Critérios de Aceitação

- [ ] O cancelamento segue os critérios do cancelamento de uma sessão de manejo (`RF-MANEJO-13`), exceto que só é possível em uma recepção sem animais recebidos (`RN-RECEPCAO-04`).
- [ ] A confirmação deve informar que nenhum animal foi recebido e que a recepção continuará visível na compra.

### 2.7.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Cancelar recepção" de uma recepção em andamento sem animais recebidos (`RF-RECEPCAO-04`).
2. O sistema solicita a confirmação, informando que nenhum animal foi recebido e que a recepção continuará visível na compra.
3. O usuário confirma o cancelamento.
4. O sistema cancela a recepção e exibe a mensagem: _"Recepção cancelada."_
5. O fluxo continua em `RF-RECEPCAO-02`.

**Fluxos alternativos**

- **A1 – Cancelamento não confirmado (passo 3):**
  1. O usuário não confirma o cancelamento.
  2. O sistema mantém a recepção inalterada.
  3. O fluxo continua em `RF-RECEPCAO-04`.

- **A2 – Recepção com animais recebidos (passo 4):**
  1. A recepção já tem animais recebidos (`RN-RECEPCAO-04`).
  2. O sistema impede o cancelamento e exibe a mensagem: _"A recepção tem {quantidade} animal(is) recebido(s). Remova-os antes de cancelar."_
  3. O fluxo continua em `RF-RECEPCAO-04`.

</div>
