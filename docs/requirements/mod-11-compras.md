# 📦 Módulo: `MOD-COMPRAS`

Módulo responsável pelas compras de animais: o que foi negociado com o vendedor, o pagamento e o custo de aquisição de cada animal.

Uma compra registra a negociação, dividida em categorias de animais com os seus preços. Os animais não são cadastrados na compra: eles passam a existir quando chegam à fazenda, nas recepções da compra, especificadas no [módulo de recepções](mod-11-recepcoes.md). Uma compra pode ter várias recepções, uma por viagem ou entrega. Ao final, com o pagamento registrado e todas as recepções concluídas, a compra é consolidada e o seu valor é rateado entre os animais recebidos.

## Dicionário de dados conceitual

**Compra**

| Campo            | Descrição                                                            | Tipo       | Obrig. | Restrições                                                      |
| ---------------- | -------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------- |
| `Título`         | Identifica a compra, como "Bezerros desmamados — Leilão set/26"      | Texto      | Sim    | Até 100 caracteres                                              |
| `Vendedor`       | Pessoa de quem os animais são comprados                              | Referência | Sim    | Pessoa ativa                                                    |
| `Data da Compra` | Data em que a compra foi negociada                                   | Data       | Sim    | —                                                               |
| `Observação`     | Detalhes da negociação                                               | Texto      | Não    | Até 500 caracteres                                              |
| `Categorias`     | Grupos de animais negociados, com os seus preços                     | Lista      | Sim    | Ao menos uma categoria (`RN-COMPRA-02`)                         |
| `Propriedade`    | Propriedade que recebe os animais                                    | Referência | Sim    | Propriedade selecionada                                         |
| `Situação`       | Situação da compra                                                   | Enum       | Sim    | `Em andamento`, `Consolidada` ou `Cancelada` (`RN-COMPRA-04`)   |
| `Pago em`        | Data do pagamento                                                    | Data       | Não    | Não pode ser futura (`RN-COMPRA-05`)                            |
| `Comprovante`    | Referência do pagamento, como o identificador de um PIX              | Texto      | Não    | Até 200 caracteres                                              |
| `Valor`          | Soma do valor das categorias                                         | Calculado  | —      | Só existe quando todas as categorias têm valor (`RN-COMPRA-03`) |
| `Recebidos`      | Quantidade de animais recebidos nas recepções, comparada à negociada | Calculado  | —      | —                                                               |

**Categoria**

| Campo                | Descrição                                                                        | Tipo       | Obrig.      | Restrições                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `Sexo`               | Sexo dos animais da categoria                                                    | Enum       | Sim         | `Macho` ou `Fêmea`                                                                                          |
| `Idade Mínima`       | Idade mínima, em meses, na data da compra                                        | Inteiro    | Não         | Zero ou mais; não pode ser maior que a `Idade Máxima` (`RN-COMPRA-02`)                                      |
| `Idade Máxima`       | Idade máxima, em meses, na data da compra                                        | Inteiro    | Não         | Zero ou mais                                                                                                |
| `Raça`               | Raça, quando todos os animais da categoria são da mesma raça                     | Referência | Não         | Raça ativa                                                                                                  |
| `Quantidade`         | Quantidade de animais negociada                                                  | Inteiro    | Sim         | Ao menos 1                                                                                                  |
| `Forma de Preço`     | Como o valor da categoria é definido                                             | Enum       | Sim         | `Por cabeça`, `Por arroba` ou `Valor fechado` (`RN-COMPRA-03`)                                              |
| `Preço por Cabeça`   | Preço de cada animal                                                             | Decimal    | Condicional | Zero ou mais; obrigatório na forma `Por cabeça`                                                             |
| `Preço da Arroba`    | Preço de cada arroba de peso vivo                                                | Decimal    | Condicional | Zero ou mais; obrigatório na forma `Por arroba`                                                             |
| `Valor Total`        | Valor fechado da categoria inteira                                               | Decimal    | Condicional | Zero ou mais; obrigatório na forma `Valor fechado`                                                          |
| `Peso Faturado`      | Peso, em kg, que serve de base ao pagamento por arroba                           | Decimal    | Condicional | Zero ou mais; só na forma `Por arroba`; exigido para o pagamento (`RN-COMPRA-05`)                           |
| `Quebra`             | Desconto acordado, em %, sobre o peso de origem (perda no jejum e no transporte) | Decimal    | Não         | De 0 a 100; só na forma `Por arroba`                                                                        |
| `Rateio`             | Como o valor fechado é dividido entre os animais                                 | Enum       | Condicional | `Igual entre os animais` ou `Proporcional ao peso de entrada`; só na forma `Valor fechado` (`RN-COMPRA-07`) |
| `Observação`         | Detalhes da categoria                                                            | Texto      | Não         | Até 500 caracteres                                                                                          |
| `Valor da Categoria` | Valor calculado pela forma de preço                                              | Calculado  | —           | Ver `RN-COMPRA-03`                                                                                          |
| `Custo do Animal`    | Parte do valor da categoria atribuída a cada animal recebido                     | Calculado  | —           | Definido na consolidação (`RN-COMPRA-07`)                                                                   |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-COMPRA-01` - Compra:** Uma compra registra o que foi negociado com um único vendedor para uma propriedade. Os animais comprados só passam a existir quando são recebidos, em uma recepção da compra.
- **`RN-COMPRA-02` - Categorias:** A negociação é dividida em categorias, cada uma com animais do mesmo sexo, uma faixa de idade e, opcionalmente, uma raça. Uma compra tem ao menos uma categoria, e cada categoria, ao menos um animal. A idade mínima não pode ser maior que a máxima. Uma categoria com animais recebidos não pode ser removida.
- **`RN-COMPRA-03` - Valor da Categoria:** O valor de cada categoria segue a sua forma de preço:
  - **Por cabeça:** preço por cabeça × quantidade de animais (a negociada enquanto a compra está em andamento; a recebida depois de consolidada);
  - **Por arroba:** peso faturado × (1 − quebra) ÷ 30 × preço da arroba, considerando a arroba de 30 kg de peso vivo. O peso faturado é o peso de embarque informado pelo vendedor ou, quando a compra é pesada na chegada, a soma dos pesos de chegada dos animais; a quebra não se aplica ao peso de chegada, que já está sem a perda do transporte;
  - **Valor fechado:** o valor total da categoria, independentemente de quantos animais forem recebidos.
- **`RN-COMPRA-04` - Ciclo da Compra:** Uma compra fica em andamento até ser consolidada ou cancelada. Somente uma compra em andamento pode ser alterada; uma compra consolidada ou cancelada não muda mais.
- **`RN-COMPRA-05` - Pagamento:** O pagamento só pode ser registrado com o valor de todas as categorias conhecido, inclusive o peso faturado das categorias por arroba, e em data que não seja futura. Depois de pago, o vendedor, as categorias e os seus valores não podem mudar, a menos que o pagamento seja desfeito.
- **`RN-COMPRA-06` - Consolidação:** Uma compra só pode ser consolidada depois de paga, com ao menos um animal recebido e sem recepções em aberto. Consolidar declara que nenhum outro animal da compra será recebido, mesmo que tenham chegado menos animais que o negociado.
- **`RN-COMPRA-07` - Custo do Animal:** Na consolidação, o valor de cada categoria é rateado entre os seus animais recebidos, de forma que a soma dos custos seja exatamente o valor da categoria:
  - **Por cabeça:** cada animal custa o preço por cabeça;
  - **Por arroba:** o valor é dividido na proporção do peso de entrada de cada animal;
  - **Valor fechado:** o valor é dividido igualmente entre os animais ou na proporção do peso de entrada, conforme o rateio escolhido.

  O peso de entrada é a pesagem feita na recepção do animal. Na divisão por peso, um animal sem pesagem entra com a média dos animais pesados da categoria; se nenhum foi pesado, a divisão é igual.

- **`RN-COMPRA-08` - Cancelamento:** Somente uma compra em andamento, sem animais recebidos e sem pagamento, pode ser cancelada. As recepções ainda vazias são canceladas junto. Uma compra cancelada é desconsiderada, mas continua disponível para consulta.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-COMPRA-01`: Listagem de Compras

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as compras de animais da propriedade selecionada, com busca, filtro e acesso a cada compra.

|                       |                                                                                                                                           |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar as compras de animais** para acompanhar negociações, pagamentos e recebimentos. |
| **Dependências**      | —                                                                                                                                         |
| **Regras Vinculadas** | `RN-COMPRA-03`, `RN-COMPRA-04`                                                                                                            |
| **Atores**            | Administrador, Gerente                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                       |
| **Versão**            | 1                                                                                                                                         |
| **Status**            | 📝 Rascunho                                                                                                                               |

### 2.1.2 - Critérios de Aceitação

- [ ] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [ ] A listagem deve exibir apenas as compras da propriedade selecionada.
- [ ] A listagem deve exibir, de cada compra, a `Data da Compra`, o `Título` e o `Vendedor`, as categorias (quantidade e descrição), os animais recebidos em relação aos negociados, o `Valor` e a `Situação`, indicando também as compras em andamento já pagas.
- [ ] Os recebidos devem ser destacados quando passarem da quantidade negociada.
- [ ] Enquanto a compra está em andamento, o `Valor` é estimado (`RN-COMPRA-03`); ele só é exibido quando todas as categorias têm valor.
- [ ] A ordenação inicial é pela `Data da Compra`, da mais recente para a mais antiga.
- [ ] A pesquisa deve considerar `Título`, `Vendedor`, `Observação` e os números de GTA e de nota fiscal das recepções.
- [ ] Os filtros disponíveis são: em andamento, consolidadas, todas (exceto as canceladas) e canceladas. O filtro inicial é "em andamento".
- [ ] Deve permitir abrir cada compra: para alteração, se estiver em andamento (`RF-COMPRA-03`), ou apenas para consulta, se estiver consolidada ou cancelada.
- [ ] Deve permitir acionar o registro de uma nova compra (`RF-COMPRA-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de compras.
2. O sistema exibe as compras em andamento da propriedade selecionada, da `Data da Compra` mais recente para a mais antiga, de forma paginada.
3. O usuário localiza a compra desejada, podendo pesquisar, filtrar, ordenar ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário abre a compra.
5. O fluxo continua em `RF-COMPRA-03`.

**Fluxos alternativos**

- **A1 – Nenhuma compra (passo 2):**
  1. Não há compras na propriedade selecionada que correspondam ao filtro.
  2. O sistema exibe a mensagem: _"Nenhuma compra encontrada."_
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as compras que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A3 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A4 – Nova compra (passo 3):**
  1. O usuário aciona o registro de uma nova compra.
  2. O fluxo continua em `RF-COMPRA-02`.

</div>

## 2.2 - `RF-COMPRA-02`: Registrar Compra

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite registrar a negociação de uma compra de animais: o vendedor, a data e as categorias negociadas, com os seus preços.

|                       |                                                                                                                                     |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar uma compra de animais** para controlar o que foi negociado com o vendedor. |
| **Dependências**      | `RF-COMPRA-01`, `RF-PESSOA-02` (para o vendedor), `RF-RACA-01` (para a raça das categorias)                                         |
| **Regras Vinculadas** | `RN-COMPRA-01`, `RN-COMPRA-02`, `RN-COMPRA-03`                                                                                      |
| **Atores**            | Administrador, Gerente                                                                                                              |
| **Plataformas**       | Web                                                                                                                                 |
| **Versão**            | 1                                                                                                                                   |
| **Status**            | 📝 Rascunho                                                                                                                         |

### 2.2.2 - Critérios de Aceitação

- [ ] O registro deve permitir informar `Título`, `Vendedor`, `Data da Compra`, `Observação` e as categorias.
- [ ] Os campos `Título`, `Vendedor` e `Data da Compra` são obrigatórios, e deve haver ao menos uma categoria (`RN-COMPRA-02`). A `Data da Compra` vem preenchida com a data de hoje.
- [ ] O `Vendedor` deve ser escolhido entre as pessoas ativas, com busca pelo nome.
- [ ] Cada categoria deve permitir informar `Sexo`, `Idade Mínima`, `Idade Máxima`, `Raça`, `Quantidade`, `Forma de Preço` e `Observação`; a `Raça` deve ser escolhida entre as raças ativas.
- [ ] Conforme a `Forma de Preço`, a categoria deve solicitar apenas os campos correspondentes (`RN-COMPRA-03`):
  - **Por cabeça:** o `Preço por Cabeça`, obrigatório;
  - **Por arroba:** o `Preço da Arroba`, obrigatório, e o `Peso Faturado` e a `Quebra`, opcionais no registro;
  - **Valor fechado:** o `Valor Total`, obrigatório, e o `Rateio`, inicialmente igual entre os animais.
- [ ] Deve ser possível adicionar e remover categorias.
- [ ] A compra é registrada na propriedade selecionada, com a situação `Em andamento`.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona o registro de uma nova compra na listagem (`RF-COMPRA-01`).
2. O sistema exibe o formulário da compra com uma categoria em branco.
3. O usuário informa `Título`, `Vendedor`, `Data da Compra` e `Observação` e preenche as categorias negociadas, podendo adicionar ou remover categorias (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-COMPRA-02`, `RN-COMPRA-03`), registra a compra com a situação `Em andamento` e exibe a mensagem: _"Compra registrada!"_
6. O fluxo continua em `RF-COMPRA-03`, com a compra registrada.

**Fluxos alternativos**

- **A1 – Escolha da forma de preço (passo 3):**
  1. O usuário escolhe a `Forma de Preço` de uma categoria.
  2. O sistema passa a solicitar os campos da forma escolhida e descarta os das demais formas (`RN-COMPRA-03`).
  3. O fluxo retorna ao passo 3.

- **A2 – Campos obrigatórios ausentes (passo 5):**
  1. O `Título` ou a `Data da Compra` não foi preenchido, ou o `Vendedor` não foi escolhido.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_ (no vendedor, _"Selecione o vendedor."_).
  3. O fluxo retorna ao passo 3.

- **A3 – Compra sem categorias (passo 5):**
  1. Todas as categorias foram removidas (`RN-COMPRA-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"Adicione ao menos uma categoria."_
  3. O fluxo retorna ao passo 3.

- **A4 – Categoria incompleta (passo 5):**
  1. Uma categoria está sem `Quantidade` ou sem o preço exigido pela sua forma de preço (`RN-COMPRA-03`).
  2. O sistema impede a gravação e destaca o campo com a mensagem correspondente: _"Informe a quantidade."_, _"Informe o preço por cabeça."_, _"Informe o preço da arroba."_ ou _"Informe o valor total."_
  3. O fluxo retorna ao passo 3.

- **A5 – Faixa de idade inválida (passo 5):**
  1. A `Idade Mínima` de uma categoria é maior que a `Idade Máxima` (`RN-COMPRA-02`).
  2. O sistema impede a gravação e exibe a mensagem: _"A idade mínima não pode ser maior que a máxima."_
  3. O fluxo retorna ao passo 3.

- **A6 – Vendedor inativo (passo 5):**
  1. O vendedor escolhido foi desativado antes da gravação.
  2. O sistema impede a gravação e exibe a mensagem: _"Vendedor inválido."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-COMPRA-03`: Consultar e Alterar Compra

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite acompanhar uma compra, com os animais recebidos, o valor e as recepções, e alterar a negociação enquanto a compra está em andamento.

|                       |                                                                                                                                                         |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **acompanhar e ajustar uma compra** para manter a negociação de acordo com o que foi combinado e recebido. |
| **Dependências**      | `RF-COMPRA-01`, `RF-COMPRA-02`                                                                                                                          |
| **Regras Vinculadas** | `RN-COMPRA-02`, `RN-COMPRA-03`, `RN-COMPRA-04`, `RN-COMPRA-05`                                                                                          |
| **Atores**            | Administrador, Gerente                                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                     |
| **Versão**            | 1                                                                                                                                                       |
| **Status**            | 📝 Rascunho                                                                                                                                             |

### 2.3.2 - Critérios de Aceitação

- [ ] Exibir os dados da compra, a `Situação` e, se paga, a data do pagamento e o `Comprovante`.
- [ ] Exibir uma orientação conforme a situação: o que falta para pagar e consolidar uma compra em andamento, o que fica bloqueado depois do pagamento e quando a compra foi consolidada ou cancelada.
- [ ] Exibir, de cada categoria, os animais recebidos em relação aos negociados e o `Valor da Categoria`, estimado enquanto a compra está em andamento (`RN-COMPRA-03`); depois de consolidada, exibir também a soma dos custos rateados (`RN-COMPRA-07`).
- [ ] Exibir o total de recebidos em relação aos negociados e o `Valor` da compra, quando todas as categorias têm valor.
- [ ] Nas categorias por arroba, exibir a soma dos pesos de chegada dos animais recebidos e quantos deles foram pesados. Com todos os recebidos pesados, deve ser possível usar essa soma como `Peso Faturado`; nesse caso, a `Quebra` é zerada, com aviso, pois o peso de chegada já está sem a perda do transporte (`RN-COMPRA-03`).
- [ ] Exibir as recepções da compra, com título, situação, data, lote de entrada, GTA, nota fiscal e quantidade de animais, permitindo abrir cada uma.
- [ ] Enquanto a compra está em andamento, todos os dados podem ser alterados, com as mesmas validações do registro (`RF-COMPRA-02`), exceto:
  - uma categoria com animais recebidos não pode ser removida (`RN-COMPRA-02`);
  - depois do pagamento, o `Vendedor`, o conjunto de categorias e a forma de preço, os preços, o `Peso Faturado` e a `Quebra` ficam bloqueados (`RN-COMPRA-05`).
- [ ] Uma compra consolidada ou cancelada é exibida apenas para consulta (`RN-COMPRA-04`).
- [ ] Deve permitir acionar o registro do pagamento (`RF-COMPRA-04`), a consolidação (`RF-COMPRA-05`) e o cancelamento (`RF-COMPRA-06`) de uma compra em andamento.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário abre uma compra na listagem (`RF-COMPRA-01`) ou conclui o registro de uma compra (`RF-COMPRA-02`).
2. O sistema exibe os dados da compra, as categorias com os recebidos e os valores, e as recepções.
3. O usuário altera os dados da compra ou das categorias (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-COMPRA-02`, `RN-COMPRA-03`, `RN-COMPRA-05`), persiste as alterações e exibe a mensagem: _"Compra atualizada!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Compra consolidada ou cancelada (passo 2):**
  1. A compra está consolidada ou cancelada (`RN-COMPRA-04`).
  2. O sistema exibe a compra apenas para consulta, informando quando foi consolidada ou cancelada.
  3. O fluxo termina.

- **A2 – Compra paga (passo 3):**
  1. A compra em andamento já foi paga (`RN-COMPRA-05`).
  2. O sistema bloqueia o `Vendedor`, a inclusão e a remoção de categorias e os campos que definem o valor; os demais dados continuam editáveis.
  3. O fluxo retorna ao passo 3.

- **A3 – Peso de chegada como peso faturado (passo 3):**
  1. Em uma categoria por arroba com todos os recebidos pesados, o usuário aciona o uso da soma dos pesos de chegada.
  2. O sistema preenche o `Peso Faturado` com a soma e, se houver `Quebra`, a zera e exibe o aviso: _"Quebra removida: o peso de chegada já está sem a perda do transporte."_
  3. O fluxo retorna ao passo 3.

- **A4 – Remoção de categoria com animais recebidos (passo 5):**
  1. Uma categoria removida já tem animais recebidos (`RN-COMPRA-02`).
  2. O sistema impede a alteração e exibe a mensagem: _"Não é possível remover categorias com animais recebidos ({quantidade} animal(is))."_
  3. O fluxo retorna ao passo 3.

- **A5 – Alteração de valores de uma compra paga (passo 5):**
  1. O vendedor, as categorias ou os seus valores foram alterados em uma compra paga (`RN-COMPRA-05`).
  2. O sistema impede a alteração e exibe a mensagem: _"A compra já foi paga: vendedor, categorias e valores não podem mudar. Desfaça o pagamento para corrigir."_
  3. O fluxo retorna ao passo 3.

- **A6 – Dados inválidos (passo 5):**
  1. Os dados não respeitam as validações do registro.
  2. O sistema impede a alteração e exibe as mensagens previstas nos fluxos alternativos de `RF-COMPRA-02`.
  3. O fluxo retorna ao passo 3.

- **A7 – Abertura de uma recepção (passo 3):**
  1. O usuário abre uma das recepções da compra.
  2. O fluxo continua em `RF-RECEPCAO-04`.

- **A8 – Pagamento, consolidação ou cancelamento (passo 3):**
  1. O usuário aciona o registro do pagamento, a consolidação ou o cancelamento da compra.
  2. O fluxo continua em `RF-COMPRA-04`, `RF-COMPRA-05` ou `RF-COMPRA-06`.

</div>

## 2.4 - `RF-COMPRA-04`: Registrar Pagamento

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite registrar o pagamento de uma compra em andamento e desfazê-lo, para corrigir um registro feito por engano.

|                       |                                                                                                                                    |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **registrar o pagamento de uma compra** para controlar o que já foi pago ao vendedor. |
| **Dependências**      | `RF-COMPRA-03`                                                                                                                     |
| **Regras Vinculadas** | `RN-COMPRA-03`, `RN-COMPRA-05`                                                                                                     |
| **Atores**            | Administrador, Gerente                                                                                                             |
| **Plataformas**       | Web                                                                                                                                |
| **Versão**            | 1                                                                                                                                  |
| **Status**            | 📝 Rascunho                                                                                                                        |

### 2.4.2 - Critérios de Aceitação

- [ ] Somente uma compra em andamento e ainda não paga pode ter o pagamento registrado.
- [ ] O registro deve permitir informar a data do pagamento, obrigatória e inicialmente a data de hoje, e o `Comprovante`, opcional.
- [ ] Ao registrar, exibir o `Valor` da compra, quando conhecido, e informar que o vendedor, as categorias e os valores ficarão bloqueados (`RN-COMPRA-05`).
- [ ] O pagamento exige o valor de todas as categorias conhecido; o sistema deve informar o que falta em cada categoria (`RN-COMPRA-05`).
- [ ] Alterações não salvas da compra devem ser salvas antes de registrar o pagamento.
- [ ] Deve ser possível desfazer o pagamento de uma compra em andamento, mediante confirmação; os valores voltam a ser editáveis.

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Registrar pagamento" de uma compra em andamento e não paga (`RF-COMPRA-03`).
2. O sistema exibe o valor da compra, informa o que ficará bloqueado e solicita a data do pagamento, preenchida com a data de hoje, e o `Comprovante`.
3. O usuário confirma ou altera a data e informa o `Comprovante`, se quiser.
4. O usuário confirma o pagamento.
5. O sistema valida o pagamento (`RN-COMPRA-05`), registra-o e exibe a mensagem: _"Pagamento registrado."_
6. O fluxo continua em `RF-COMPRA-03`, com a compra paga.

**Fluxos alternativos**

- **A1 – Alterações não salvas (passo 1):**
  1. A compra tem alterações ainda não salvas.
  2. O sistema não permite registrar o pagamento e orienta: _"Salve as alterações antes."_
  3. O fluxo continua em `RF-COMPRA-03`.

- **A2 – Data futura (passo 5):**
  1. A data informada é posterior a hoje (`RN-COMPRA-05`).
  2. O sistema impede o registro e exibe a mensagem: _"A data do pagamento não pode ser futura."_
  3. O fluxo retorna ao passo 3.

- **A3 – Valor incompleto (passo 5):**
  1. Alguma categoria ainda não tem o valor conhecido, como uma categoria por arroba sem `Peso Faturado` (`RN-COMPRA-05`).
  2. O sistema impede o registro e exibe a mensagem: _"Informe {o que falta} de "{categoria}" antes de registrar o pagamento."_ (ex.: _"Informe o peso faturado de "Machos · 12–18 meses · Nelore" antes de registrar o pagamento."_).
  3. O fluxo continua em `RF-COMPRA-03`.

- **A4 – Desfazer pagamento (passo 1):**
  1. Em uma compra em andamento e paga, o usuário aciona a ação "Desfazer pagamento".
  2. O sistema solicita a confirmação, informando que os valores voltarão a ser editáveis.
  3. O usuário confirma.
  4. O sistema remove o registro do pagamento e exibe a mensagem: _"Pagamento desfeito. Os valores podem ser corrigidos."_
  5. O fluxo continua em `RF-COMPRA-03`.

</div>

## 2.5 - `RF-COMPRA-05`: Consolidar Compra

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite encerrar uma compra paga e com todas as recepções concluídas, rateando o seu valor entre os animais recebidos.

|                       |                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consolidar uma compra** para encerrá-la e conhecer o custo de aquisição de cada animal. |
| **Dependências**      | `RF-COMPRA-03`, `RF-COMPRA-04`                                                                                                         |
| **Regras Vinculadas** | `RN-COMPRA-04`, `RN-COMPRA-06`, `RN-COMPRA-07`                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                    |
| **Versão**            | 1                                                                                                                                      |
| **Status**            | 📝 Rascunho                                                                                                                            |

### 2.5.2 - Critérios de Aceitação

- [ ] Somente uma compra em andamento pode ser consolidada.
- [ ] A consolidação deve ser impedida se a compra não estiver paga, não tiver animais recebidos ou tiver recepções em aberto, ou se houver alterações não salvas; o sistema deve informar o motivo (`RN-COMPRA-06`).
- [ ] A consolidação exige confirmação do usuário, informando quantos animais foram recebidos em relação aos negociados, quantos faltam (que não serão mais recebidos) e que a compra não poderá mais ser alterada nem receber animais.
- [ ] Na consolidação, o custo de cada animal recebido é rateado conforme `RN-COMPRA-07`, e a compra passa a `Consolidada`.

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Consolidar" de uma compra em andamento (`RF-COMPRA-03`).
2. O sistema solicita a confirmação, informando os animais recebidos em relação aos negociados, quantos faltam e que a compra não poderá mais ser alterada nem receber animais.
3. O usuário confirma a consolidação.
4. O sistema verifica que a consolidação não tem impedimentos (`RN-COMPRA-06`).
5. O sistema altera a situação da compra para `Consolidada`, rateia o custo de cada animal recebido (`RN-COMPRA-07`) e exibe a mensagem: _"Compra consolidada. Os custos dos animais foram rateados."_
6. O fluxo continua em `RF-COMPRA-03`, com a compra apenas para consulta.

**Fluxos alternativos**

- **A1 – Consolidação indisponível (passo 1):**
  1. A compra não está paga, não tem animais recebidos, tem recepções em aberto ou tem alterações não salvas (`RN-COMPRA-06`).
  2. O sistema não permite consolidar e informa o motivo: _"Registre o pagamento antes"_, _"Nenhum animal recebido"_, _"Há recepções em aberto"_ ou _"Salve as alterações antes"_.
  3. O fluxo continua em `RF-COMPRA-03`.

- **A2 – Consolidação não confirmada (passo 3):**
  1. O usuário não confirma a consolidação.
  2. O sistema mantém a compra em andamento.
  3. O fluxo continua em `RF-COMPRA-03`.

- **A3 – Impedimento na verificação (passo 4):**
  1. Entre a confirmação e a verificação, a compra deixou de atender às condições, por exemplo, porque uma recepção foi aberta (`RN-COMPRA-06`).
  2. O sistema impede a consolidação e exibe a mensagem correspondente: _"Registre o pagamento antes de consolidar a compra."_, _"A compra não tem animais recebidos. Sem animais, cancele a compra."_ ou _"Há {quantidade} recepção(ões) em aberto. Conclua ou cancele antes de consolidar."_
  3. O fluxo continua em `RF-COMPRA-03`.

</div>

## 2.6 - `RF-COMPRA-06`: Cancelar Compra

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite cancelar uma compra que não será concluída, ainda sem animais recebidos e sem pagamento.

|                       |                                                                                                                        |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cancelar uma compra** que não vai acontecer, sem perder o seu registro. |
| **Dependências**      | `RF-COMPRA-03`                                                                                                         |
| **Regras Vinculadas** | `RN-COMPRA-04`, `RN-COMPRA-08`                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                 |
| **Plataformas**       | Web                                                                                                                    |
| **Versão**            | 1                                                                                                                      |
| **Status**            | 📝 Rascunho                                                                                                            |

### 2.6.2 - Critérios de Aceitação

- [ ] Somente uma compra em andamento, sem animais recebidos e sem pagamento, pode ser cancelada (`RN-COMPRA-08`).
- [ ] O cancelamento exige confirmação do usuário, informando que as recepções ainda vazias serão canceladas junto e que a compra continuará disponível no filtro de canceladas.
- [ ] Ao cancelar, as recepções em aberto da compra são canceladas junto.

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Cancelar compra" de uma compra em andamento, sem animais recebidos e sem pagamento (`RF-COMPRA-03`).
2. O sistema solicita a confirmação, informando que as recepções ainda vazias serão canceladas junto e que a compra continuará disponível no filtro de canceladas.
3. O usuário confirma o cancelamento.
4. O sistema altera a situação da compra para `Cancelada`, cancela as recepções em aberto e exibe a mensagem: _"Compra cancelada."_
5. O fluxo continua em `RF-COMPRA-03`, com a compra apenas para consulta.

**Fluxos alternativos**

- **A1 – Cancelamento não confirmado (passo 3):**
  1. O usuário não confirma o cancelamento.
  2. O sistema mantém a compra inalterada.
  3. O fluxo continua em `RF-COMPRA-03`.

- **A2 – Compra com animais ou paga (passo 4):**
  1. A compra já tem animais recebidos ou já foi paga (`RN-COMPRA-08`).
  2. O sistema impede o cancelamento e exibe a mensagem: _"A compra tem {quantidade} animal(is) recebido(s) e não pode ser cancelada. Remova-os das recepções antes."_ ou _"Uma compra paga não pode ser cancelada."_
  3. O fluxo continua em `RF-COMPRA-03`.

</div>
