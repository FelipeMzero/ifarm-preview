# 📦 Módulo: `MOD-LOTES`

Módulo responsável pelo gerenciamento de lotes e pelo históricos de lotes sendo transferidos pelas áreas (áreas de pastagem).

Assim como as áreas, os lotes são vinculados a uma propriedade específica, sendo que os lotes são vinculados também a uma área específica, que determina a localização do lote inteiro. Abaixo o dicionário de dados conceitual deste módulo.

| Campo                   | Tipo       | Descrição                                                                                 |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `Nome*`                 | Texto      | Nome de exibição do lote                                                                  |
| `Área*`                 | Referência | Área em que o lote está                                                                   |
| `Descrição`             | Texto      | Descrição/observação sobre o lote                                                         |
| `Atualizado em`         | Data       | Data da última atualização do registro                                                    |
| `Meta`                  | Lógico     | Indica se o lote tem meta ou não                                                          |
| `Data para venda`       | Data       | Data meta para venda do lote                                                              |
| `Peso médio para venda` | Número     | Peso médio estimado dos animais do lote para atingir a meta                               |
| `Quantidade de animais` | Número     | Quantidade de animais no lote                                                             |
| `Peso médio atual`      | Número     | Peso médio atual dos animais do lote                                                      |
| `Status*`               | Enum       | `Vigente` ou `Encerrado` - indica se o lote está em atividade ou se já cumpriu sua função |

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-LOTE-01` - Lote Vinculado à Propriedade:** Todo lote pertence a uma única propriedade.
- **`RN-LOTE-02` - Lote Vinculado à Área:** Todo lote ativo está em uma única área, podendo ser transferido entre as áreas, sendo que cada área só pode conter um lote de cada vez.
- **`RN-LOTE-03` - Histórico de transferências:** Todo o histórico de transferências de áreas de cada lote deve ser registrado.
- **`RN-LOTE-04` - Meta do lote:** Um lote pode ser criado com um propósito, logo ele tem uma meta de peso médio a ser alcançada até determinada data.
- **`RN-LOTE-05` - Vigente/Encerrado:** Um lote está VIGENTE enquanto estiver em atividade, ou seja, a cria/engorda dos animais está em curso. Ele passa para o estado ENCERRADO depois que o lote cumprir a sua função, não tendo mais animais.

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-LOTE-01`: Listagem de Lotes

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Tela de entrada do módulo, responsável por exibir todos os lotes cadastrados no sistema, com busca/filtro e acesso às ações de criar, editar e detalhes.

| Tipo                  | Valor                                                                                                                                                         |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar a lista de lotes cadastrados** para localizar e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                             |
| **Regras Vinculadas** | —                                                                                                                                                             |
| **Atores**            | Administrador, Gerente                                                                                                                                        |
| **Plataformas**       | Web                                                                                                                                                           |

### 2.1.2 - Critérios de Aceitação

- [ ] A listagem deve exibir os campos `Nome`, `Área`, `Quantidade de animais`, `Peso médio atual`, `Atualizado em`.
- [ ] Deve ser possível escolher quais colunas exibir/ocultar, sendo que `Nome` é sempre visível.
- [ ] Deve ser possível ordenar por qualquer coluna, sendo que inicialmente a ordem deve ser do registro mais recente para o mais antigo.
- [ ] Deve ser possível pesquisar por `Nome`.
- [ ] Deve ser possível filtrar por status VIGENTE/ENCERRADO.
- [ ] Cada linha deve prover acesso às ações "Editar", "Detalhes".
- [ ] Deve existir um botão para adicionar um novo registro

### 2.1.3 - Cenários de Uso

**Cenário 1: Listagem carregada com sucesso**

- **Dado que** há lotes cadastrados no sistema;
- **Quando** o usuário acessar a tela de listagem de lotes;
- **Então** o sistema deve exibir a lista com `Nome`, `Área`, `Quantidade de animais`, `Peso médio atual`, `Atualizado em` de cada lote.

**Cenário 2: Busca sem resultados**

- **Dado que** o usuário está na tela de listagem de lotes;
- **Quando** ele buscar por um `Nome` que não corresponda a nenhum registro;
- **Então** o sistema deve exibir a mensagem: _"Nenhum registro encontrado."_.

**Cenário 3: Acesso a uma ação a partir da listagem**

- **Dado que** o usuário está na tela de listagem de lotes;
- **Quando** ele acionar uma ação em uma linha da lista;
- **Então** o sistema deve executar a ação escolhida.

</div>

## 2.2 - `RF-LOTE-02`: Criar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Tela com um formulário destinada ao cadastro de lotes.

| Tipo                  | Valor                                                                                                                                                     |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cadastrar um lote** no sistema para que ele possa ser associado a uma área e ter animais vinculados a ele. |
| **Dependências**      | `RF-AREA-02` (a área deve existir previamente)                                                                                                            |
| **Regras Vinculadas** | `RN-LOTE-01`, `RN-LOTE-02`, `RN-LOTE-03`, `RN-LOTE-04`                                                                                                    |
| **Atores**            | Administrador, Gerente                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                       |

### 2.2.2 - Critérios de Aceitação (Checklist de Homologação)

- [ ] O formulário para cadastro de lote tem os campos: `Nome`, `Área`, `Descrição`, `Meta`, `Data para venda`, `Peso médio para venda`
- [ ] `Nome` é um campo de texto obrigatório com no máximo 100 caracteres.
- [ ] `Área` é um campo combobox obrigatório para filtrar e selecionar áreas já cadastradas.
- [ ] `Descrição` é uma área de texto com no máximo 500 caracteres.
- [ ] `Meta` é um checkbox que indica se o lote tem meta ou não. Se ele estiver selecionado, os campos `Data para venda` e `Peso médio para venda` ficam habilitados, caso contrário eles ficam desabilitados.
- [ ] `Data para venda` é um campo de texto para data, sendo o preechimento obrigatório caso haja meta.
- [ ] `Peso médio para venda` é um campo de texto numérico, sendo o preechimento obrigatório caso haja meta.
- [ ] Botão que salva o registro.

### 2.2.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**

- **Dado que** o usuário está na interface de cadastro de lotes e preencheu corretamente todos os dados obrigatórios e válidos;
- **Quando** ele acionar a ação de "Salvar";
- **Então** o sistema deve persistir os dados no banco de dados e exibir a mensagem: _"Registro salvo com sucesso!"_.

**Cenário 2: Tentativa de cadastro com campos com valores inválido**

- **Dado que** o usuário informou algum valor inválido em algum campo;
- **Quando** ele acionar a ação de "Salvar";
- **Então** a gravação é impedida e os campos com erro são destacados descrevendo o erro ocorrido.

</div>

## 2.3 - `RF-LOTE-03`: Atualizar Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Tela com formulário destinado à edição dos dados de lote. **Este formulário é consideravelmente diferente do formulário de criação apesar de ambos serem para lotes (formulário específico para edição)**.

| Tipo                  | Valor                                                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **atualizar os dados de um lote já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-LOTE-02`                                                                                                                                               |
| **Regras Vinculadas** | `RN-LOTE-01`, `RN-LOTE-02`                                                                                                                                 |
| **Atores**            | Administrador, Gerente                                                                                                                                     |
| **Plataformas**       | Web                                                                                                                                                        |

### 2.3.2 - Critérios de Aceitação

- [ ] O formulário para edição de lote tem os campos: `Nome`, `Área`, `Descrição`, `Meta`, `Data para venda`, `Peso médio para venda`
- [ ] `Nome` é um campo de texto obrigatório com no máximo 100 caracteres que pode ser livremente editado.
- [ ] `Descrição` é uma área de texto com no máximo 500 caracteres que pode ser livremente editado.
- [ ] `Meta` é um checkbox que indica se o lote tem meta ou não. Se ele estiver selecionado, os campos `Data para venda` e `Peso médio para venda` ficam habilitados, caso contrário eles ficam desabilitados. Pode ser editado livremente.
- [ ] `Data para venda` é um campo de texto para data, sendo o preechimento obrigatório caso haja meta e pode ser editado livremente.
- [ ] `Peso médio para venda` é um campo de texto numérico, sendo o preechimento obrigatório caso haja meta e pode ser editado livremente.
- [ ] `Área` é um campo de texto desabilitado (ou apenas um label) que exibe a área atual do lote. Junto dele deve ter um botão que aciona a **troca de lote**. Além disso, próximo a ele deve ter uma listagem mostrando todo o histórico de áreas do lote.
- [ ] Botão que salva o registro.

### 2.3.3 - Cenários de Uso

**Cenário 1: Atualização realizada com sucesso**

- **Dado que** o usuário está na tela de edição de um lote já cadastrado e alterou um ou mais campos com valores válidos;
- **Quando** ele acionar a ação de "Salvar";
- **Então** o sistema deve persistir as alterações e exibir a mensagem: _"Registro atualizado com sucesso!"_.

**Cenário 2: Tentativa de edição com valores inválidos**

- **Dado que** o usuário está na tela de edição de um lote já cadastrada;
- **Quando** ele incluir valores inválidos em qualquer campo e clicar em salvar;
- **Então** o salvamente é abortado e os campos com erro são destacados exibindo o erro.

**Cenário 3: Alteração de área do lote**

- **Dado que** o usuário está na tela de edição de um lote já cadastrado;
- **Quando** ele acionar a ação de "Trocar Área";
- **Então** é exibida a janela de troca de área.

</div>

## 2.4 - `RF-LOTE-04`: Trocar Área do Lote

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Tela com formulário destinado à troca de área de um lote, sendo acionado na tela de edição de lotes.

| Tipo                  | Valor                                                                                                                                                            |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **trocar a área de um lote** para manter as informações corretas e registrar o histórico de troca de áreas do lote. |
| **Dependências**      | `RF-LOTE-02`, `RF-AREA-02` (a área de destino deve existir previamente)                                                                                          |
| **Regras Vinculadas** | `RN-LOTE-01`, `RN-LOTE-02`, `RN-LOTE-03`                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                           |
| **Plataformas**       | Web                                                                                                                                                              |

### 2.4.2 - Critérios de Aceitação

- [ ] O formulário para troca de área do lote tem os campos: `Área` e `Descrição`
- [ ] `Área` é um campo combobox obrigatório para filtrar e selecionar áreas já cadastradas e diferente da área atual. Representa a área de destino, ou seja, a área para onde o lote vai na troca.
- [ ] `Descrição` é uma área de texto com no máximo 500 caracteres.
- [ ] Botão que registra a troca no histórico.

### 2.4.3 - Cenários de Uso

**Cenário 1: Troca de área realizada com sucesso**

- **Dado que** o usuário está na tela de troca de área e selecionou a área de destino;
- **Quando** ele acionar a ação de "Trocar Área";
- **Então** a tela de edição exibe a área pretendida para troca. O registro no banco de dados só é efetivado no salvar da tela de edição.

**Cenário 2: Tentativa de troca de área sem seleção da área**

- **Dado que** o usuário está na tela de troca de área e não selecionou a área de destino;
- **Quando** ele acionar a ação de "Trocar Área";
- **Então** o campo área é destacado exibindo a mensagem de que a área deve ser selecionada.

</div>

## 🚧 2.5 - `RF-LOTE-05`: Detalhes do Lote (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Tela destinada à exibição de informações detalhadas do lote, como: ...

| Tipo                  | Valor                                                                                                                               |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consultar os detalhes de um lote cadastrado** para visualizar seus dados detalhados. |
| **Dependências**      | `RF-LOTE-02`                                                                                                                        |
| **Regras Vinculadas** | `RN-LOTE-03`                                                                                                                        |
| **Atores**            | Administrador, Gerente                                                                                                              |
| **Plataformas**       | Web                                                                                                                                 |

### 2.5.2 - Critérios de Aceitação

- [ ] Exibir um botão para excluir.
- [ ] Exibir os detalhes ...

### 2.5.3 - Cenários de Uso

**Cenário 1: Exibição dos detalhes**

- **Dado que** existe...;
- **Quando** o usuário...;
- **Então** o sistema deve....

</div>

## 🚧 2.6 - `RF-LOTE-06`: Excluir Lote (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Funcionalidade destinada à exclusão de um lote.

| Tipo                  | Valor                                                                                                                                |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **excluir um lote cadastrado** apenas se ele não possuir registro importante vinculado. |
| **Dependências**      | `RF-LOTE-02`                                                                                                                         |
| **Regras Vinculadas** | `RN-LOTE-03`                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                               |
| **Plataformas**       | Web                                                                                                                                  |

### 2.6.2 - Critérios de Aceitação

- [ ] O lote pode ser excluído se não tiver outros registros vinculados a ele.

### 2.6.3 - Cenários de Uso

**Cenário 1: Exclusão de lote sem registros vinculados**

- **Dado que** o usuário está na tela de detalhes de um lote sem nenhum registro vinculado;
- **Quando** ele confirmar a ação de "Excluir";
- **Então** o sistema deve excluir o registro e exibir a mensagem: _"Registro excluído com sucesso!"_.

**Cenário 2: Tentativa de exclusão de lote com registro vinculado**

- **Dado que** o usuário está na tela de detalhes de um lote que possui registro vinculado;
- **Quando** ele confirmar a ação de "Excluir";
- **Então** o sistema deve impedir a exclusão e exibir a mensagem: _"Este registro possui registro vinculado e não pode ser excluído."_

</div>

## 🚧 2.7 - `RF-LOTE-07`: Encerrar Lote (INCOMPLETO)

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.7.1 - Descrição

Funcionalidade destinada ao encerramento de um lote depois dele ter cumprido seu objetivo. Isso mantém o lote nos registros do sistema, mas ele não é mais exibido na listagem de lotes vigentes e não pode mais fazer parte de qualquer tipo de manejo. Um lote encerrado é usado apenas em relatórios.

| Tipo                  | Valor                                                                                                                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **encerrar um lote cadastrado** para que ele nao seja mais movimentado, sendo útil apenas para relatórios. |
| **Dependências**      | `RF-LOTE-02`                                                                                                                                            |
| **Regras Vinculadas** | `RN-LOTE-05`                                                                                                                                            |
| **Atores**            | Administrador, Gerente                                                                                                                                  |
| **Plataformas**       | Web                                                                                                                                                     |

### 2.7.2 - Critérios de Aceitação

- [ ] O campo `Status` de um lote deve ser `Vigente` ou `Encerrado`.

### 2.7.3 - Cenários de Uso

**Cenário 1: Encerramento de lote vigente**

- **Dado que** existe um lote cadastrado com status `Vigente`;
- **Quando** o usuário acionar a ação "Encerrar";
- **Então** o sistema deve alterar seu status para `Encerrado` e ocultá-lo da listagem padrão de lotes vigentes.

**Cenário 2: Reabertura de lote encerrado**

- **Dado que** existe um lote cadastrado com status `Encerrado`;
- **Quando** o usuário acionar a ação "Reabrir";
- **Então** o sistema deve alterar seu status para `Vigente` e voltar a exibi-lo na listagem padrão.

</div>

## 🚧 2.8 - `RF-LOTE-08`: Criar animais no lote (INCOMPLETO)

### 2.8.1 - Descrição

Funcionalidade que cria um grupo de animais no lote, ou seja, os animais não são criados no módulo de animais e depois vinculados ao lado, eles são criados em grande quantidade e com poucos detalhes já dentro do lote. A ideia é que o lote que use esse recuso logo em seguida faça um manejo de identificação e pesagem.
