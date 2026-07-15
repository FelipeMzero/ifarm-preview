# 📦 Módulo: `MOD-PESSOAS`

Módulo responsável pelo gerenciamento de pessoas físicas e jurídicas. O módulo deve possibilitar criação, leitura, atualização e exclusão para registros de pessoas.

Uma pessoa pode ser titular de uma propriedade, entre outros papéis que venham a existir no sistema, como fornecedores, transportadores, compradores e etc.

Toda Pessoa é do tipo Física ou Jurídica. A maioria dos campos é comum aos dois tipos; alguns (Nome Fantasia, RG, Data de Nascimento, Estado Civil) só se aplicam a um tipo específico, conforme indicado na descrição de cada campo.

| Campo | Tipo | Descrição |
|-|-|-|
| `Tipo*` | Enum | `Física` ou `Jurídica` — define qual das estruturas abaixo (`Pessoa Física` ou `Pessoa Jurídica`) se aplica |
| `Documento*` | Texto | CPF para PF e CNPJ para PJ
| `Nome*` | Texto | Nome de exibição da pessoa (nome completo para Pessoa Física, razão social para Pessoa Jurídica) |
| `Inscrição Estadual` | Texto/Único | Inscrição Estadual
| `Telefone` | Texto | Telefone principal |
| `Email` | Texto/Único | E-mail principal |
| `Endereço` | Referência | Endereço da pessoa |
| `Nome Fantasia` | Texto | Apenas para PJ
| `RG` | Texto/Único | Registro geral apenas para PF
| `Data de Nascimento` | Data | Data de nascimento apenas para PF
| `Estado Civil` | Enum | Apenas para PF (Solteiro, Casado, União Estável, Divorciado, Viúvo)












# 1 - Regras de Negócio do Módulo (RN)

* **`RN-PESSOA-01` - Legitimidade de Identificação Fiscal:** Todo CPF ou CNPJ precisa ser verificado de acordo com os algoritmos oficiais da Receita Federal do Brasil, garantindo a integridade fiscal e jurídica do registro.
* **`RN-PESSOA-02` - Documento como Identidade Legal:** O CPF/CNPJ é o identificador único da pessoa física/jurídica; duas pessoas não podem existir com o mesmo documento.
* **`RN-PESSOA-03` - Preservação de Registro:** Pessoas (físicas ou jurídicas) que possuam registros associados não podem ser excluídas.
* **`RN-PESSOA-04` - Multiplicidade de Papéis:** Uma mesma entidade (física ou jurídica) pode atuar simultaneamente em diferentes papéis de negócio (ex: um mesmo parceiro comercial pode ser classificado concomitantemente como Fornecedor e Comprador).







# 2 - Requisitos Funcionais (RF)


## ✅ 2.1 - `RF-PESSOA-01`: Listagem de Pessoas
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição
Tela de entrada do módulo, responsável por exibir todas as pessoas físicas e jurídicas cadastradas no sistema, com busca/filtro e acesso às ações de criar, editar, detalhes e ativar/desativar.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **visualizar a lista de pessoas cadastradas** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ela. |
| **Dependências** | — |
| **Regras Vinculadas**| — |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.1.2 - Critérios de Aceitação
* [ ] A listagem pode exibir os campos `Tipo`, `Documento`, `Nome`, `Email`, `Telefone`, `Status` (Ativo ou Inativo), sendo que por padrão `Email` e `Telefone` ficam ocultos.
* [ ] Deve ser possível escolher quais colunas exibir/ocultar, sendo que `Tipo` e `Documento` são sempre visíveis.
* [ ] Deve ser possível ordenar por qualquer coluna, sendo que inicialmente a ordem deve ser do registro mais recente para o mais antigo.
* [ ] Deve ser possível pesquisar por `Documento` e `Nome`.
* [ ] Deve ser possível filtrar por pessoa física, pessoa jurídica, status ativo, status inativo, sendo que por padrão a tela abre filtrando apenas pelos ativos.
* [ ] Cada linha deve prover acesso às ações "Editar", "Detalhes" e "Ativar/Desativar".
* [ ] Deve existir um botão para adicionar um novo registro

### 2.1.3 - Cenários de Uso

**Cenário 1: Listagem carregada com sucesso**
* **Dado que** existem pessoas cadastradas no sistema;
* **Quando** o Gerente acessar a tela de listagem de pessoas;
* **Então** o sistema deve exibir a lista com `Tipo`, `Documento`, `Nome` e `Status` de cada pessoa.

**Cenário 2: Busca sem resultados**
* **Dado que** o Gerente está na tela de listagem de pessoas;
* **Quando** ele buscar por um `Nome` ou `Documento` que não corresponda a nenhum registro;
* **Então** o sistema deve exibir a mensagem: *"Nenhum registro encontrado."*.

**Cenário 3: Acesso a uma ação a partir da listagem**
* **Dado que** o Gerente está na tela de listagem de pessoas;
* **Quando** ele acionar uma ação em uma linha da lista;
* **Então** o sistema deve executar a ação escolhida.

</div>




## ✅ 2.2 - `RF-PESSOA-02`: Criar Pessoa
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição
Tela com um formulário destinada ao cadastro de pessoas físicas ou jurídicas, viabilizando o registro de novos agentes que interagem com as atividades do negócio.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como um **Gerente**, quero **cadastrar uma pessoa física ou jurídica** no sistema para que ela possa ser associada a transações comerciais, financeiras e contratuais. |
| **Dependências** | — |
| **Regras Vinculadas**| `RN-PESSOA-01`, `RN-PESSOA-02` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.2.2 - Critérios de Aceitação (Checklist de Homologação)
* [ ] Os campos `Tipo` (Física/Jurídica), `Documento` (CPF/CNPJ) e `Nome` são obrigatórios.
* [ ] Os campos `Documento`, `Inscrição Estadual`, `Email` e `RG` são únicos.
* [ ] O campo `Documento` deve ser validado matematicamente (cálculo de dígitos verificadores) de acordo com o `Tipo` selecionado.
* [ ] A interface deve adaptar dinamicamente os campos exibidos com base no `Tipo`:
  * **Se Jurídica:** Exibir `Nome` (como Razão Social), `Nome Fantasia` e `Inscrição Estadual`. Ocultar campos exclusivos de Pessoa Física.
  * **Se Física:** Exibir `Nome` (como Nome Completo), `RG`, `Data de Nascimento` e `Estado Civil`. Ocultar campos exclusivos de Pessoa Jurídica.

### 2.2.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**
* **Dado que** o Gerente está na interface de cadastro de pessoas e preencheu corretamente todos os dados obrigatórios e válidos;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir os dados no banco de dados e exibir a mensagem: *"Registro salvo com sucesso!"*.

**Cenário 2: Tentativa de cadastro com documento inválido**
* **Dado que** o Gerente informou um CPF ou CNPJ com numeração matematicamente inválida;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo documento exibindo o erro: *"Valor inválido."* (Aplica `RN-PESSOA-01`).

**Cenário 3: Tentativa de cadastro com campo duplicado**
* **Dado que** o Gerente informou um CPF ou CNPJ que já pertence a outra pessoa registrada;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo duplicado exibindo o erro: *"Este valor já está em uso."* (Aplica `RN-PESSOA-02`).

**Cenário 4: Tentativa de cadastro com campos obrigatórios ausentes**
* **Dado que** o Gerente está na interface de cadastro de pessoas;
* **E** deixou de preencher um ou mais campos obrigatórios (como `Tipo`, `Documento` ou `Nome`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já digitados no formulário e destacar visualmente os campos ausentes com uma mensagem de erro (ex: *"Este campo é obrigatório"*).

</div>






## ✅ 2.3 - `RF-PESSOA-03`: Atualizar Pessoa
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição
Tela com formulário destinado à edição dos dados cadastrais de uma pessoa física ou jurídica já registrada no sistema.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como um **Gerente**, quero **atualizar os dados de uma pessoa já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências** | `RF-PESSOA-02` |
| **Regras Vinculadas**| `RN-PESSOA-01`, `RN-PESSOA-02` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.3.2 - Critérios de Aceitação (Checklist de Homologação)
* [ ] Os campos devem ser exibidos de acordo com o tipo da pessoa
* [ ] Os campos `Tipo` e `Documento` são imutáveis após o cadastro - não podem ser alterados na edição, apenas exibidos como somente leitura.
* [ ] O campo `Nome` é editável e obrigatório.
* [ ] Os campos `Inscrição Estadual`, `Email` e `RG` são únicos.


### 2.3.3 - Cenários de Uso

**Cenário 1: Atualização realizada com sucesso**
* **Dado que** o Gerente está na tela de edição de uma pessoa já cadastrada e alterou um ou mais campos com valores válidos;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir as alterações e exibir a mensagem: *"Registro atualizado com sucesso!"*.

**Cenário 2: Tentativa de edição dos campos imutáveis**
* **Dado que** o Gerente está na tela de edição de uma pessoa já cadastrada;
* **Quando** ele visualizar os campos `Tipo` e `Documento`;
* **Então** o sistema deve exibi-los como somente leitura, impedindo qualquer alteração em seus valores.

**Cenário 3: Tentativa de atualização com campo duplicado**
* **Dado que** o Gerente informou um `Email`, `RG` ou `Inscrição Estadual` que já pertence a outra pessoa registrada;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo duplicado exibindo o erro: *"Este valor já está em uso."* (Aplica `RN-PESSOA-02`).

**Cenário 4: Tentativa de atualização com campos obrigatórios ausentes**
* **Dado que** o Gerente está na interface de edição de pessoas;
* **E** deixou de preencher um ou mais campos obrigatórios (`Nome`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já digitados no formulário e destacar visualmente os campos ausentes com uma mensagem de erro (ex: *"Este campo é obrigatório"*).

</div>




## 🚧 2.4 - `RF-PESSOA-04`: Detalhes da Pessoa (INCOMPLETO)
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição
Tela destinada à exibição de informações mais detalhadas da pessoa, como: ...

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **consultar os detalhes de uma pessoa cadastrada** para visualizar seus dados detalhados. |
| **Dependências** | `RF-PESSOA-02` |
| **Regras Vinculadas**| `RN-PESSOA-03` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.4.2 - Critérios de Aceitação
* [ ] Exibir um botão para excluir.
* [ ] Exibir os detalhes ...

### 2.4.3 - Cenários de Uso

**Cenário 1: Exibição dos detalhes**
* **Dado que** existe uma pessoa cadastrada;
* **Quando** o Gerente acionar a ação "Detalhes";
* **Então** o sistema deve exibir ....



</div>




## ✅ 2.5 - `RF-PESSOA-05`: Excluir Pessoa
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição
Funcionalidade destinada à exclusão de uma pessoa física ou jurídica cadastrada no sistema desde que ela não tenha qualquer outro registro vinculado.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **excluir uma pessoa cadastrada** apenas se ela não possuir qualquer registro vinculado. |
| **Dependências** | `RF-PESSOA-02` |
| **Regras Vinculadas**| `RN-PESSOA-03` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.5.2 - Critérios de Aceitação
* [ ] A pessoa só pode ser excluída se não tiver outros registros vinculados a ela.

### 2.5.3 - Cenários de Uso

**Cenário 1: Exclusão de pessoa sem registros vinculados**
* **Dado que** o Gerente está na tela de detalhes de uma pessoa sem nenhum registro vinculado;
* **Quando** ele confirmar a ação de "Excluir";
* **Então** o sistema deve excluir o registro e exibir a mensagem: *"Registro excluído com sucesso!"*.

**Cenário 2: Tentativa de exclusão de pessoa com registro vinculado**
* **Dado que** o Gerente está na tela de detalhes de uma pessoa que possui registro vinculado;
* **Quando** ele confirmar a ação de "Excluir";
* **Então** o sistema deve impedir a exclusão e exibir a mensagem: *"Este registro possui registro vinculado e não pode ser excluído."* (Aplica `RN-PESSOA-03`).

</div>



## ✅ 2.6 - `RF-PESSOA-06`: Ativar/Desativar Pessoa
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição
Funcionalidade destinada à ativação/desativação de uma pessoa física ou jurídica, permitindo marcar como inativos os registros que não têm mais relacionamento ativo com o negócio (ex: clientes ou fornecedores antigos), sem excluí-los. Pessoas inativas ficam ocultas por padrão nas listagens, mas continuam disponíveis para consultas e relatórios.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **ativar ou desativar uma pessoa cadastrada** para ocultá-la das listagens quando ela não tiver mais relacionamento ativo com o negócio sem ter que excluí-la. |
| **Dependências** | `RF-PESSOA-02` |
| **Regras Vinculadas**| — |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.6.2 - Critérios de Aceitação
* [ ] O status da pessoa deve alternar entre `Ativo` e `Inativo`.


### 2.6.3 - Cenários de Uso

**Cenário 1: Desativação de pessoa ativa**
* **Dado que** existe uma pessoa cadastrada com status `Ativo`;
* **Quando** o Gerente acionar a ação "Desativar";
* **Então** o sistema deve alterar seu status para `Inativo` e ocultá-la da listagem padrão.

**Cenário 2: Ativação de pessoa inativa**
* **Dado que** existe uma pessoa cadastrada com status `Inativo`;
* **Quando** o Gerente acionar a ação "Ativar";
* **Então** o sistema deve alterar seu status para `Ativo` e voltar a exibi-la na listagem padrão.

</div>