# 📦 Módulo: `MOD-PROPRIEDADES`

Módulo responsável pelo gerenciamento dos dados das propriedades (fazendas). O módulo deve possibilitar consulta, criação e alteração dos dados das propriedades que serão gerenciadas.

O sistema deve tratar as propriedades de forma independente, ou seja, cada propriedade terá suas próprias áreas, lotes e animais. Por outro lado, pode haver transações entre entre propriedades, como a transferência de animais de uma fazenda para outra, por exemplo. Por isso, é importante que a propriedade esteja bem definida.

Os dados identificados para propriedades são:

| Campo | Tipo | Descrição |
|-|-|-|
| `Nome*` | Texto | Nome da propriedade, como "Fazendão São João" |
| `Área Total` | Número | Área total da propriedade em hectares (ha) |
| `Área Produtiva` | Número | Área produtiva da propriedade em hectares (ha) |
| `CAR` | Texto | Cadastro Ambiental Rural, teo o formato UF-1234567-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX, por exemplo MT-5107909-E8C2B3F6D1A94E8BB7F5C3E2A1D0B9C8 |
| `CIB` | Texto | Cadastro Imobiliário Brasileiro, tendo o padrão AAAAAAA-D, por exemplo ABC1234-5 |
| `CCIR` | Texto | Certificado de Cadastro de Imóvel Rural no INCRA, tem o formato 999.999.999.999-9 |
| `Latitude` | Número | Latitude da propriedade |
| `Longitude` | Número | Longitude da propriedade |
| `Endereço` | Referência | Endereço da propriedade |
| `Titular*` | Referência | Pessoa (física ou jurídica) responsável legal pela propriedade |




# 1 - Regras de Negócio do Módulo (RN)

* **`RN-PROPRIEDADE-01` - Unicidade de Identificação Fundiária:** Os campos `CIB`, `CCIR` e `CAR`, quando informados, devem ser únicos entre as propriedades cadastradas, garantindo que cada registro fundiário oficial esteja vinculado a uma única propriedade no sistema.
* **`RN-PROPRIEDADE-02` - Titularidade Obrigatória:** Toda propriedade deve estar vinculada a um `Titular` (Pessoa física ou jurídica).
* **`RN-PROPRIEDADE-03` - Consistência de Área:** A `Área Produtiva` de uma propriedade não pode ser maior que sua `Área Total`.
* **`RN-PROPRIEDADE-04` - Preservação de Histórico:** Propriedades que possuam áreas, lotes, animais ou movimentações vinculadas não podem ter sua existência ou histórico apagados, garantindo a rastreabilidade do negócio.




# 2 - Requisitos Funcionais (RF)


## 2.1 - `RF-PROPRIEDADE-01`: Listagem de Propriedades
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição
Tela de entrada do módulo, responsável por exibir todas as propriedades cadastradas no sistema, com busca/filtro e acesso às ações de criar, editar e consultar detalhes.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **visualizar a lista de propriedades cadastradas** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ela. |
| **Dependências** | — |
| **Regras Vinculadas**| — |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.1.2 - Critérios de Aceitação
* [ ] A listagem pode exibir os campos `Nome`, `Área Total`, `Município/UF` (a partir do `Endereço`) e `Titular`.
* [ ] Deve ser possível escolher quais colunas exibir/ocultar, sendo que `Nome` é sempre visível.
* [ ] Deve ser possível ordenar por qualquer coluna, sendo que inicialmente a ordem deve ser do registro mais recente para o mais antigo.
* [ ] Deve ser possível pesquisar por `Nome` ou `Titular`.
* [ ] Cada linha deve prover acesso às ações "Editar" e "Detalhes".
* [ ] Deve existir um botão para adicionar um novo registro.

### 2.1.3 - Cenários de Uso

**Cenário 1: Listagem carregada com sucesso**
* **Dado que** existem propriedades cadastradas no sistema;
* **Quando** o Gerente acessar a tela de listagem de propriedades;
* **Então** o sistema deve exibir a lista com `Nome`, `Área Total`, `Município/UF` e `Titular` de cada propriedade.

**Cenário 2: Busca sem resultados**
* **Dado que** o Gerente está na tela de listagem de propriedades;
* **Quando** ele buscar por um `Nome` ou `Titular` que não corresponda a nenhum registro;
* **Então** o sistema deve exibir a mensagem: *"Nenhum registro encontrado."*.

**Cenário 3: Acesso a uma ação a partir da listagem**
* **Dado que** o Gerente está na tela de listagem de propriedades;
* **Quando** ele acionar uma ação em uma linha da lista;
* **Então** o sistema deve executar a ação escolhida.

</div>




## ✅ 2.2 - `RF-PROPRIEDADE-02`: Criar Propriedade
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição
Tela com um formulário destinada ao cadastro de propriedades (fazendas), viabilizando o registro de novos imóveis rurais para que suas áreas, lotes e animais possam ser gerenciados de forma independente.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como um **Gerente**, quero **cadastrar uma propriedade** no sistema para que ela possa ter suas áreas, lotes e animais gerenciados de forma independente. |
| **Dependências** | `RF-PESSOA-02` (o `Titular` deve existir previamente como Pessoa) |
| **Regras Vinculadas**| `RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.2.2 - Critérios de Aceitação
* [ ] Os campos `Nome` e `Titular` são obrigatórios.
* [ ] Os campos `CIB`, `CCIR` e `CAR` são opcionais, mas únicos quando informados.
* [ ] O campo `Titular` deve referenciar uma Pessoa já cadastrada no sistema.
* [ ] Os campos `Área Total`, `Área Produtiva`, `Latitude` e `Longitude` são opcionais e numéricos.
* [ ] O sistema deve impedir o cadastro e avisar caso `Área Produtiva` seja maior que `Área Total`.

### 2.2.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**
* **Dado que** o Gerente está na interface de cadastro de propriedades e preencheu corretamente todos os dados obrigatórios e válidos;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir os dados no banco de dados e exibir a mensagem: *"Registro salvo com sucesso!"*.

**Cenário 2: Tentativa de cadastro com área produtiva maior que a área total**
* **Dado que** o Gerente informou uma `Área Produtiva` maior que a `Área Total`;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo `Área Produtiva` exibindo o alerta: *"A área produtiva não pode ser maior que a área total."* (Aplica `RN-PROPRIEDADE-03`).

**Cenário 3: Tentativa de cadastro com documento fundiário duplicado**
* **Dado que** o Gerente informou um `CIB`, `CCIR` ou `CAR` que já pertence a outra propriedade registrada;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo duplicado exibindo o alerta: *"Este valor já está em uso."* (Aplica `RN-PROPRIEDADE-01`).

**Cenário 4: Tentativa de cadastro com campos obrigatórios ausentes**
* **Dado que** o Gerente está na interface de cadastro de propriedades;
* **E** deixou de preencher um ou mais campos obrigatórios (como `Nome` ou `Titular`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já digitados no formulário e destacar visualmente os campos ausentes com uma mensagem de alerta (ex: *"Este campo é obrigatório"*).

</div>




## 2.3 - `RF-PROPRIEDADE-03`: Atualizar Propriedade
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição
Tela com formulário destinado à edição dos dados cadastrais de uma propriedade já registrada no sistema.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como um **Gerente**, quero **atualizar os dados de uma propriedade já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências** | `RF-PROPRIEDADE-02` |
| **Regras Vinculadas**| `RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.3.2 - Critérios de Aceitação (Checklist de Homologação)
* [ ] O campo `Nome` é editável e obrigatório.
* [ ] O campo `Titular` é editável, mas deve sempre referenciar uma Pessoa já cadastrada.
* [ ] Os campos `CIB`, `CCIR` e `CAR` continuam únicos após a edição.
* [ ] O sistema deve impedir a atualização caso `Área Produtiva` seja maior que `Área Total`.

### 2.3.3 - Cenários de Uso

**Cenário 1: Atualização realizada com sucesso**
* **Dado que** o Gerente está na tela de edição de uma propriedade já cadastrada e alterou um ou mais campos com valores válidos;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir as alterações e exibir a mensagem: *"Registro atualizado com sucesso!"*.

**Cenário 2: Tentativa de atualização com área produtiva maior que a área total**
* **Dado que** o Gerente alterou a `Área Produtiva` para um valor maior que a `Área Total`;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo `Área Produtiva` exibindo o alerta: *"A área produtiva não pode ser maior que a área total."* (Aplica `RN-PROPRIEDADE-03`).

**Cenário 3: Tentativa de atualização com documento fundiário duplicado**
* **Dado que** o Gerente alterou o `CIB`, `CCIR` ou `CAR` para um valor que já pertence a outra propriedade registrada;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação e destacar o campo duplicado exibindo o alerta: *"Este valor já está em uso."* (Aplica `RN-PROPRIEDADE-01`).

**Cenário 4: Tentativa de atualização com campos obrigatórios ausentes**
* **Dado que** o Gerente está na tela de edição de uma propriedade já cadastrada;
* **E** removeu o preenchimento de um ou mais campos obrigatórios (como `Nome` ou `Titular`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já digitados no formulário e destacar visualmente os campos ausentes com uma mensagem de alerta (ex: *"Este campo é obrigatório"*).

</div>




## 🚧 2.4 - `RF-PROPRIEDADE-04`: Detalhes da Propriedade
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição
Tela destinada à exibição de informações mais detalhadas da propriedade, como: dados cadastrais completos, áreas/lotes vinculados e o histórico de animais e movimentações associados a ela.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente**, quero **consultar a ficha completa de uma propriedade cadastrada** para visualizar seus dados detalhados e o histórico de lotes, animais e movimentações vinculados a ela. |
| **Dependências** | `RF-PROPRIEDADE-02` |
| **Regras Vinculadas**| `RN-PROPRIEDADE-04` |
| **Atores** | Administrador, Gerente |
| **Plataformas**| Web |

### 2.4.2 - Critérios de Aceitação
* [ ] Exibir os dados cadastrais completos da propriedade, incluindo `Endereço` e `Titular`.
* [ ] Exibir os lotes e animais vinculados à propriedade (depende dos módulos `MOD-LOTE`/`MOD-ANIMAL`).
* [ ] Indicar quando não houver histórico vinculado.

### 2.4.3 - Cenários de Uso

**Cenário 1: Exibição dos detalhes com histórico vinculado**
* **Dado que** existe uma propriedade cadastrada com lotes ou animais vinculados a ela;
* **Quando** o Gerente acionar a ação "Detalhes" a partir da listagem;
* **Então** o sistema deve exibir os dados cadastrais da propriedade e o histórico de lotes e animais vinculados a ela.

**Cenário 2: Exibição da ficha sem histórico vinculado**
* **Dado que** existe uma propriedade cadastrada sem nenhum lote ou animal vinculado a ela;
* **Quando** o Gerente acionar a ação "Detalhes" a partir da listagem;
* **Então** o sistema deve exibir os dados cadastrais da propriedade e indicar que não há histórico vinculado.

</div>
