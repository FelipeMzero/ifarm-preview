# 📦 Módulo: `MOD-AREAS`

Módulo responsável pelo gerenciamento das áreas de pastagem de cada propriedade (fazenda). O módulo deve possibilitar consulta, criação, alteração, ativação/desativação e exclusão das áreas de pastagem, sendo que os limites de cada área devem ser desenhados sobre um mapa para tornar a sua identificação mais rápida e fácil. Cada área de pastagem está vinculada a uma propriedade específica.

Além do cadastro, o módulo apresenta a situação de cada área no pastejo rotacionado: qual lote está nela, a lotação em relação à capacidade de suporte e há quantos dias ela está ocupada ou em descanso.

## Dicionário de dados conceitual

| Campo              | Descrição                                                                       | Tipo                                       | Obrig. | Restrições                                                                                            |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| `Nome`             | Nome da área, como "Piquete 01"                                                 | Texto                                      | Sim    | Até 100 caracteres                                                                                    |
| `Polígono`         | Contorno da área desenhado no mapa                                              | Contorno geográfico (lista de coordenadas) | Sim    | Mínimo de 3 vértices, sem autointerseção                                                              |
| `Hectares`         | Área total em hectares (ha)                                                     | Decimal                                    | Sim    | Maior que 0 e até 999.999,9999; pode divergir da área calculada a partir do `Polígono` (`RN-AREA-08`) |
| `Taxa de Lotação`  | Taxa de lotação suportada pela área (UA/ha)                                     | Decimal                                    | Sim    | Maior que 0 e até 30                                                                                  |
| `Dias de Ocupação` | Referência de quantos dias um lote costuma permanecer na área                   | Inteiro                                    | Não    | De 1 a 365 (`RN-AREA-06`)                                                                             |
| `Dias de Descanso` | Referência de quantos dias a área fica sem animais para o pasto se recuperar    | Inteiro                                    | Não    | De 1 a 365 (`RN-AREA-06`)                                                                             |
| `Observação`       | Qualquer observação sobre a área, como "Área para engorda com capim-braquiarão" | Texto                                      | Não    | Até 500 caracteres                                                                                    |
| `Propriedade`      | Propriedade à qual a área pertence                                              | Referência                                 | Sim    | Propriedade selecionada; imutável após o cadastro (`RN-AREA-01`)                                      |
| `Status`           | Situação do cadastro                                                            | Enum                                       | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação))                  |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-AREA-01` - Área Vinculada à Propriedade:** Toda área de pastagem pertence fisicamente a uma única propriedade e não passa para outra.
- **`RN-AREA-03` - Ocupação Exclusiva:** Uma área de pastagem é ocupada por no máximo um lote por vez. Uma área retirada de uso não recebe lotes.
- **`RN-AREA-04` - Capacidade de Suporte:** A capacidade de suporte de uma área, em Unidades Animais (UA), é o produto da sua área em hectares pela sua taxa de lotação. A lotação da área é a soma das UA dos animais ativos do lote que a ocupa, conforme a definição de [Unidade Animal (UA)](comum.md#unidade-animal-ua).
- **`RN-AREA-05` - Retirada de Uso de Área Ocupada:** Uma área ocupada por um lote não pode ser retirada de uso; o lote deve ser movido para outra área antes.
- **`RN-AREA-06` - Referências do Rodízio:** No pastejo rotacionado, cada área pode ter uma referência de dias de ocupação e de dias de descanso. Uma área ocupada há mais dias que a referência de ocupação está com o prazo de ocupação excedido. Uma área livre está descansada (pronta para receber um lote) quando o tempo desde a saída do último lote atinge a referência de descanso, ou quando nunca foi ocupada e possui referência de descanso. Sem referência, não há prazo de ocupação nem de descanso a cumprir.
- **`RN-AREA-07` - Situação da Área:** Cada área em uso se encontra em uma das situações abaixo:
  - **Ocupada:** lotação até 80% da capacidade;
  - **Perto do limite:** lotação acima de 80% e até 100% da capacidade;
  - **Lotação excedida:** lotação acima da capacidade;
  - **Livre (em descanso):** sem lote e sem o descanso de referência cumprido (`RN-AREA-06`);
  - **Livre (descansada):** sem lote e com o descanso de referência cumprido (`RN-AREA-06`).
- **`RN-AREA-08` - Divergência de Hectares:** A área em hectares considerada para uma área de pastagem pode diferir da área do seu contorno, por exemplo quando vem de uma medição oficial. Uma diferença acima de 25% é significativa e indica um provável erro na medida ou no contorno.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-AREA-01`: Mapa de Áreas de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as áreas de pastagem da propriedade selecionada, desenhadas sobre um mapa, acompanhando a situação de ocupação e rodízio de cada área e acessando as ações disponíveis para ela.

|                       |                                                                                                                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **visualizar as áreas de pastagem cadastradas da propriedade selecionada através de desenhos de suas formas sobre um mapa** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | `RF-PROPRIEDADE-02` (a propriedade deve existir previamente)                                                                                                                                                                                                                           |
| **Regras Vinculadas** | `RN-AREA-04`, `RN-AREA-06`, `RN-AREA-07`                                                                                                                                                                                                                                               |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                                                                                                                                                    |

### 2.1.2 - Critérios de Aceitação

- [x] O mapa deve exibir as áreas ativas da propriedade selecionada, cada uma identificada pelo seu `Nome` e pela sua situação (`RN-AREA-07`).
- [x] O usuário pode alternar a exibição entre as áreas ativas e as inativas.
- [x] O mapa deve iniciar enquadrando as áreas exibidas.
- [x] Sem áreas a exibir, o mapa deve iniciar na localização da propriedade e, na falta dela, na localização do usuário.
- [x] O usuário pode navegar pelo mapa e aproximar/afastar.
- [x] O usuário pode voltar o mapa à visão inicial.
- [x] O usuário pode alternar entre a visualização de mapa e a de imagem de satélite.
- [x] Para uma área ocupada, deve ser possível consultar no próprio mapa o lote que a ocupa e a quantidade de animais.
- [x] Para uma área ocupada, deve ser possível consultar no próprio mapa a lotação atual e a capacidade em UA, com o percentual de ocupação (`RN-AREA-04`).
- [x] Para uma área ocupada, deve ser possível consultar no próprio mapa há quantos dias o lote está na área, com a indicação de prazo de ocupação excedido (`RN-AREA-06`).
- [x] Para uma área livre, deve ser possível consultar no próprio mapa há quantos dias está em descanso, ou que nunca foi ocupada (`RN-AREA-06`).
- [x] Para uma área livre, deve ser possível consultar no próprio mapa se ela já está pronta para receber um lote ou, se não, quando estará (`RN-AREA-06`).
- [x] As ações disponíveis para uma área ativa são: Editar (`RF-AREA-03`), Detalhes (`RF-AREA-04`), Desativar (`RF-AREA-06`) e Excluir (`RF-AREA-05`).
- [x] A partir de uma área ocupada, o usuário pode acessar o lote que a ocupa (`RF-LOTE-05`).
- [x] As ações disponíveis para uma área inativa são: Reativar (`RF-AREA-06`) e Excluir (`RF-AREA-05`).
- [x] A criação de uma nova área (`RF-AREA-02`) só pode ser acionada durante a exibição das áreas ativas.
- [x] Sem propriedade selecionada, o sistema deve orientar o usuário a selecionar uma.

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa o mapa de áreas de pastagem.
2. O sistema exibe o mapa enquadrando as áreas ativas da propriedade selecionada, cada uma identificada pelo seu `Nome` e pela sua situação (`RN-AREA-07`).
3. O usuário localiza a área desejada e consulta a sua situação, podendo navegar pelo mapa, aproximar/afastar, voltar à visão inicial, alternar entre mapa e satélite ou alternar entre áreas ativas e inativas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a área.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Sem propriedade selecionada (passo 1):**
  1. Não há propriedade selecionada.
  2. O sistema orienta o usuário a selecionar uma propriedade.
  3. O fluxo termina.

- **A2 – Propriedade sem áreas (passo 2):**
  1. A propriedade selecionada não possui áreas a exibir.
  2. O sistema exibe o mapa na localização da propriedade e, na falta dela, na localização do usuário.
  3. O fluxo retorna ao passo 3.

- **A3 – Consulta de área ocupada (passo 3):**
  1. O usuário seleciona uma área ocupada.
  2. O sistema exibe o lote que ocupa a área e a quantidade de animais, a lotação atual e a capacidade em UA com o percentual de ocupação (`RN-AREA-04`) e há quantos dias o lote está na área, indicando se o prazo de ocupação foi excedido (`RN-AREA-06`).
  3. O fluxo retorna ao passo 3.

- **A4 – Consulta de área livre (passo 3):**
  1. O usuário seleciona uma área livre.
  2. O sistema exibe há quantos dias a área está em descanso, ou que nunca foi ocupada, e se ela já está pronta para receber um lote ou, se não, quando estará (`RN-AREA-06`).
  3. O fluxo retorna ao passo 3.

- **A5 – Exibição das áreas inativas (passo 3):**
  1. O usuário alterna a exibição para as áreas inativas.
  2. O sistema exibe as áreas inativas, com as ações Reativar e Excluir, e deixa de permitir a criação de uma nova área.
  3. O fluxo retorna ao passo 3.

- **A6 – Acesso ao lote da área (passo 3):**
  1. O usuário aciona o acesso ao lote que ocupa uma área.
  2. O fluxo continua em `RF-LOTE-05`.

- **A7 – Nova área (passo 3):**
  1. Durante a exibição das áreas ativas, o usuário aciona a criação de uma nova área.
  2. O fluxo continua em `RF-AREA-02`.

</div>

## 2.2 - `RF-AREA-02`: Criar Área de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar áreas de pastagem, desenhando o contorno da área sobre o mapa e preenchendo os demais dados.

|                       |                                                                                                                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **cadastrar uma área desenhando seus limites no mapa** para que ela possa ser gerenciada e vinculada a lotes e animais. |
| **Dependências**      | `RF-PROPRIEDADE-02` (a propriedade deve existir previamente)                                                                                                                          |
| **Regras Vinculadas** | `RN-AREA-01`, `RN-AREA-08`                                                                                                                                                            |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                   |
| **Plataformas**       | Web                                                                                                                                                                                   |

### 2.2.2 - Critérios de Aceitação

- [x] O usuário desenha o `Polígono` da área clicando no mapa até fechar o contorno e, depois, preenche os demais campos.
- [x] Após fechar o contorno, o usuário pode ajustar a geometria movendo os vértices.
- [x] O sistema deve informar a área calculada a partir do `Polígono` e sugeri-la como valor de `Hectares`, recalculando a cada ajuste (`RN-AREA-08`).
- [ ] Se o valor de `Hectares` divergir significativamente do calculado a partir do `Polígono`, o sistema deve alertar o usuário, sem impedir o salvamento (`RN-AREA-08`).
- [x] Os campos `Nome`, `Polígono`, `Hectares` e `Taxa de Lotação` são obrigatórios.
- [x] A área criada será vinculada à propriedade selecionada no sistema (`RN-AREA-01`).
- [x] O usuário pode cancelar a criação a qualquer momento, inclusive pela tecla Esc.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a criação de uma nova área no mapa (`RF-AREA-01`).
2. O sistema habilita o desenho do contorno da área no mapa.
3. O usuário desenha o `Polígono` da área, clicando no mapa até fechar o contorno.
4. O sistema exibe o formulário da área, informando a área calculada a partir do `Polígono` e sugerindo-a como valor de `Hectares` (`RN-AREA-08`).
5. O usuário preenche os demais campos, podendo ajustar o contorno (ver fluxos alternativos).
6. O usuário aciona a ação "Salvar".
7. O sistema valida os dados, persiste o registro vinculado à propriedade selecionada (`RN-AREA-01`) e exibe a mensagem: _"Registro salvo com sucesso!"_
8. O fluxo termina.

**Fluxos alternativos**

- **A1 – Ajuste do contorno (passo 5):**
  1. O usuário move os vértices do `Polígono`.
  2. O sistema recalcula a área a partir do `Polígono` e atualiza a sugestão de `Hectares` (`RN-AREA-08`).
  3. O fluxo retorna ao passo 5.

- **A2 – Divergência de hectares (passos 5 e A1.2):**
  1. O valor de `Hectares` passa a divergir mais de 25% do calculado a partir do `Polígono` (`RN-AREA-08`).
  2. O sistema exibe o alerta: _"O valor informado está bem diferente da área desenhada no mapa"_, sem impedir o salvamento.
  3. O fluxo retorna ao passo 5.

- **A3 – Campos obrigatórios ausentes (passo 7):**
  1. Um ou mais campos obrigatórios não foram preenchidos.
  2. O sistema impede a gravação, mantém os dados já preenchidos e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 5.

- **A4 – Criação cancelada (passos 2 a 6):**
  1. O usuário cancela a criação, inclusive pela tecla Esc.
  2. O sistema descarta o contorno e os dados preenchidos, sem persistir nenhum registro.
  3. O fluxo termina.

</div>

## 2.3 - `RF-AREA-03`: Atualizar Área de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados de uma área de pastagem já cadastrada, incluindo o ajuste do seu contorno no mapa.

|                       |                                                                                                                                                                                          |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **atualizar os dados de uma área de pastagem já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-AREA-01`, `RF-AREA-02`                                                                                                                                                               |
| **Regras Vinculadas** | `RN-AREA-01`, `RN-AREA-08`                                                                                                                                                               |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                      |
| **Plataformas**       | Web                                                                                                                                                                                      |

### 2.3.2 - Critérios de Aceitação

- [x] Ao iniciar a edição, o mapa deve enquadrar a área, e os campos devem vir preenchidos com os dados atuais.
- [x] Todos os campos, exceto `Propriedade`, podem ser alterados, com as mesmas regras de preenchimento da criação (`RF-AREA-02`).
- [x] O `Polígono` pode ser ajustado movendo seus vértices, e o sistema recalcula a sugestão de `Hectares` a cada ajuste (`RN-AREA-08`).
- [ ] Se o valor de `Hectares` divergir significativamente do calculado a partir do `Polígono`, o sistema deve alertar o usuário, sem impedir o salvamento (`RN-AREA-08`).
- [x] O usuário pode cancelar a edição a qualquer momento, inclusive pela tecla Esc, mantendo a área como estava.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de uma área no mapa (`RF-AREA-01`).
2. O sistema enquadra a área no mapa e exibe o formulário com os dados atuais; a `Propriedade` não pode ser alterada (`RN-AREA-01`).
3. O usuário altera os campos desejados, podendo ajustar o contorno (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados, persiste as alterações e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Ajuste do contorno (passo 3):**
  1. O usuário move os vértices do `Polígono`.
  2. O sistema recalcula a área a partir do `Polígono` e atualiza a sugestão de `Hectares` (`RN-AREA-08`).
  3. O fluxo retorna ao passo 3.

- **A2 – Divergência de hectares (passos 3 e A1.2):**
  1. O valor de `Hectares` passa a divergir mais de 25% do calculado a partir do `Polígono` (`RN-AREA-08`).
  2. O sistema exibe o alerta: _"O valor informado está bem diferente da área desenhada no mapa"_, sem impedir o salvamento.
  3. O fluxo retorna ao passo 3.

- **A3 – Campos obrigatórios ausentes (passo 5):**
  1. O usuário removeu o preenchimento de um ou mais campos obrigatórios.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

- **A4 – Edição cancelada (passos 2 a 4):**
  1. O usuário cancela a edição, inclusive pela tecla Esc.
  2. O sistema descarta as alterações, mantendo a área como estava.
  3. O fluxo termina.

</div>

## 2.4 - `RF-AREA-04`: Detalhes da Área de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite consultar as informações detalhadas de uma área de pastagem: dados cadastrais, situação de ocupação atual e histórico de lotes que ocuparam a área.

|                       |                                                                                                                                                                                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **consultar os detalhes de uma área de pastagem cadastrada** para visualizar seus dados, sua ocupação atual e o histórico de lotes que a ocuparam. |
| **Dependências**      | `RF-AREA-01`, `RF-AREA-02`                                                                                                                                                                                       |
| **Regras Vinculadas** | `RN-AREA-04`, `RN-AREA-06`                                                                                                                                                                                       |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                                              |
| **Plataformas**       | Web                                                                                                                                                                                                              |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir todos os campos da área.
- [ ] Exibir a situação de ocupação atual, com as mesmas informações disponíveis no mapa (`RF-AREA-01`), e permitir acessar o lote que ocupa a área (`RF-LOTE-05`).
- [ ] Exibir o histórico de lotes que ocuparam a área, do mais recente para o mais antigo, com o nome do lote e o período de ocupação.
- [ ] Permitir acionar a exclusão da área (`RF-AREA-05`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de uma área no mapa (`RF-AREA-01`).
2. O sistema exibe os campos da área e a situação de ocupação atual, com as mesmas informações disponíveis no mapa (`RN-AREA-04`, `RN-AREA-06`).
3. O sistema exibe o histórico de lotes que ocuparam a área, do mais recente para o mais antigo, com o nome do lote e o período de ocupação.
4. O usuário consulta as informações (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Área sem histórico (passo 3):**
  1. A área nunca foi ocupada por um lote.
  2. O sistema exibe a mensagem: _"Nenhum lote ocupou esta área."_
  3. O fluxo retorna ao passo 4.

- **A2 – Acesso ao lote da área (passo 4):**
  1. O usuário aciona o acesso ao lote que ocupa a área.
  2. O fluxo continua em `RF-LOTE-05`.

- **A3 – Exclusão (passo 4):**
  1. O usuário aciona a exclusão da área.
  2. O fluxo continua em `RF-AREA-05`.

</div>

## 2.5 - `RF-AREA-05`: Excluir Área de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite excluir uma área de pastagem, desde que ela não tenha qualquer outro registro vinculado.

|                       |                                                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **excluir uma área de pastagem** para manter a base de dados organizada e consistente. |
| **Dependências**      | `RF-AREA-01`, `RF-AREA-04`                                                                                                                           |
| **Regras Vinculadas** | —                                                                                                                                                    |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                  |

### 2.5.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário, informando que a ação não poderá ser desfeita.
- [ ] A área de pastagem só pode ser excluída se não tiver outros registros vinculados a ela (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Excluir" de uma área no mapa (`RF-AREA-01`) ou nos detalhes da área (`RF-AREA-04`).
2. O sistema solicita a confirmação da exclusão, informando que a ação não poderá ser desfeita.
3. O usuário confirma a exclusão.
4. O sistema verifica que a área não possui registros vinculados, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Área com registro vinculado (passo 4):**
  1. A área já foi ocupada por algum lote.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo termina com falha.

</div>

## 2.6 - `RF-AREA-06`: Ativar/Desativar Áreas de Pastagem

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite ativar/desativar uma área de pastagem, retirando de uso as áreas que não fazem mais parte do rodízio, sem excluí-las. Áreas inativas não são exibidas por padrão e não podem receber lotes, mas continuam disponíveis para consultas e relatórios.

|                       |                                                                                                                                                                                                                                                     |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador**, **Gerente** ou **Funcionário**, quero **ativar ou desativar uma área de pastagem cadastrada** para ocultá-la das listagens quando ela não tiver mais relacionamento ativo com o negócio, sem perder seus dados e histórico. |
| **Dependências**      | `RF-AREA-01`, `RF-AREA-02`                                                                                                                                                                                                                          |
| **Regras Vinculadas** | `RN-AREA-03`, `RN-AREA-05`                                                                                                                                                                                                                          |
| **Atores**            | Administrador, Gerente, Funcionário                                                                                                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                                                                                                                 |

### 2.6.2 - Critérios de Aceitação

- [ ] A ação deve alternar o status da área de pastagem entre ativa e inativa (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).
- [ ] Uma área ocupada por um lote não pode ser desativada (`RN-AREA-05`); nesse caso, o sistema deve permitir acessar o lote para movê-lo para outra área.

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Desativar" de uma área ativa no mapa (`RF-AREA-01`).
2. O sistema verifica que a área não está ocupada por um lote (`RN-AREA-05`).
3. O sistema altera o status da área para inativa e exibe a mensagem: _"Área desativada com sucesso!"_
4. O fluxo termina.

**Fluxos alternativos**

- **A1 – Área ocupada (passo 2):**
  1. A área está ocupada por um lote (`RN-AREA-05`).
  2. O sistema impede a desativação e exibe a mensagem: _"A área "{área}" está ocupada pelo lote "{lote}". Mova o lote para outra área e depois desative esta."_
  3. O sistema permite acessar o lote para movê-lo para outra área (`RF-LOTE-04`).
  4. O fluxo termina com falha.

- **A2 – Reativação de área inativa (passo 1):**
  1. O usuário aciona a ação "Reativar" de uma área inativa.
  2. O sistema altera o status da área para ativa e exibe a mensagem: _"Área ativada com sucesso!"_
  3. O fluxo termina.

</div>
