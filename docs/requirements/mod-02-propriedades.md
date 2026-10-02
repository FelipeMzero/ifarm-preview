# 📦 Módulo: `MOD-PROPRIEDADES`

Módulo responsável pelo gerenciamento dos dados das propriedades (fazendas). O módulo deve possibilitar consulta, criação, atualização, ativação/desativação e exclusão das propriedades que serão gerenciadas.

Cada propriedade constitui uma unidade independente de gestão dentro do sistema, ou seja, cada propriedade terá suas próprias áreas, lotes e animais. Por outro lado, pode haver transações entre propriedades, como a transferência de animais de uma fazenda para outra, por exemplo. Por isso, é importante que a propriedade esteja bem definida.

## Dicionário de dados conceitual

| Campo            | Descrição                                                    | Tipo       | Obrig. | Restrições                                                                                                                                       |
| ---------------- | ------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Nome`           | Nome da propriedade, como "Fazendão São João"                | Texto      | Sim    | Até 200 caracteres                                                                                                                               |
| `Titular`        | Pessoa física ou jurídica responsável legal pela propriedade | Referência | Sim    | Pessoa ativa (`RN-PROPRIEDADE-02`)                                                                                                               |
| `Área Total`     | Área total da propriedade em hectares (ha)                   | Decimal    | Não    | Maior que 0 e até 999.999,9999                                                                                                                   |
| `Área Produtiva` | Área produtiva da propriedade em hectares (ha)               | Decimal    | Não    | Maior que 0 e até 999.999,9999; não pode ser maior que a `Área Total` (`RN-PROPRIEDADE-03`)                                                      |
| `CAR`            | Cadastro Ambiental Rural                                     | Texto      | Não    | Único (`RN-PROPRIEDADE-01`); formato UF-9999999-XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX.XXXX, ex.: MT-5107909-E8C2.A75A.C69A.4A7C.8C26.99F5.CC59.9B9A |
| `CIB`            | Cadastro Imobiliário Brasileiro                              | Texto      | Não    | Único (`RN-PROPRIEDADE-01`); formato AAAAAAA-D, ex.: ABC1234-5                                                                                   |
| `CCIR`           | Certificado de Cadastro de Imóvel Rural no INCRA             | Texto      | Não    | Único (`RN-PROPRIEDADE-01`); formato 999.999.999.999-9                                                                                           |
| `Latitude`       | Latitude da propriedade                                      | Real       | Não    | Entre -90 e 90                                                                                                                                   |
| `Longitude`      | Longitude da propriedade                                     | Real       | Não    | Entre -180 e 180                                                                                                                                 |
| `Endereço`       | Endereço da propriedade                                      | Referência | Não    | Ver [Endereço](comum.md#endereço)                                                                                                                |
| `Status`         | Situação do cadastro                                         | Enum       | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação))                                                             |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-PROPRIEDADE-01` - Identificação Fundiária Única:** Um registro fundiário oficial (CIB, CCIR ou CAR) identifica uma única propriedade; duas propriedades não podem ter o mesmo registro.
- **`RN-PROPRIEDADE-02` - Titularidade Obrigatória:** Toda propriedade tem um titular, pessoa física ou jurídica responsável legal por ela.
- **`RN-PROPRIEDADE-03` - Consistência de Área:** A área produtiva de uma propriedade não pode ser maior que a sua área total.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-PROPRIEDADE-01`: Listagem de Propriedades

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite consultar as propriedades cadastradas, com busca, filtro e acesso às ações disponíveis para cada registro.

|                       |                                                                                                                                                                                              |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **visualizar a lista de propriedades cadastradas** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ele. |
| **Dependências**      | —                                                                                                                                                                                            |
| **Regras Vinculadas** | —                                                                                                                                                                                            |
| **Atores**            | Administrador, Gerente                                                                                                                                                                       |
| **Plataformas**       | Web                                                                                                                                                                                          |

### 2.1.2 - Critérios de Aceitação

- [x] Segue o [padrão de listagem](comum.md#padrão-de-listagem).
- [x] Deve permitir exibir as colunas `Nome`, `Área Total`, `Município/UF` (a partir do `Endereço`), `Titular`, `Status` e `Atualizado em`.
- [x] `Nome` é sempre visível; `Área Total` inicia oculta.
- [x] A ordenação inicial é por `Atualizado em`, do mais recente para o mais antigo.
- [x] A pesquisa deve considerar o `Nome` da propriedade e o nome do `Titular`.
- [x] Os filtros disponíveis são: ativas, inativas e todas. O filtro inicial é "ativas".
- [x] As ações disponíveis para cada propriedade são: Editar (`RF-PROPRIEDADE-03`), Detalhes (`RF-PROPRIEDADE-04`) e Ativar/Desativar (`RF-PROPRIEDADE-06`).
- [x] Deve permitir acionar a criação de uma nova propriedade (`RF-PROPRIEDADE-02`).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a listagem de propriedades.
2. O sistema exibe as propriedades conforme o filtro e a ordenação iniciais, de forma paginada.
3. O usuário localiza a propriedade desejada, podendo pesquisar, filtrar, ordenar, escolher as colunas visíveis ou navegar entre as páginas (ver fluxos alternativos).
4. O usuário aciona uma das ações disponíveis para a propriedade.
5. O fluxo continua no requisito da ação escolhida.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as propriedades que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Pesquisa sem resultados (passo A1.2):**
  1. Nenhuma propriedade corresponde ao termo informado.
  2. O sistema exibe a mensagem: _"Nenhum registro encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Ajuste da listagem (passo 3):**
  1. O usuário altera o filtro, a ordenação, as colunas visíveis ou a página exibida.
  2. O sistema atualiza a listagem conforme a alteração.
  3. O fluxo retorna ao passo 3.

- **A4 – Nova propriedade (passo 3):**
  1. O usuário aciona a criação de uma nova propriedade.
  2. O fluxo continua em `RF-PROPRIEDADE-02`.

</div>

## 2.2 - `RF-PROPRIEDADE-02`: Criar Propriedade

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição

Permite cadastrar propriedades (fazendas), registrando novos imóveis rurais para que suas áreas, lotes e animais possam ser gerenciados de forma independente.

|                       |                                                                                                                                                                             |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **cadastrar uma propriedade** no sistema para que ela possa ter suas áreas, lotes e animais gerenciados de forma independente. |
| **Dependências**      | `RF-PESSOA-02` (o `Titular` deve existir previamente como pessoa)                                                                                                           |
| **Regras Vinculadas** | `RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03`                                                                                                               |
| **Atores**            | Administrador, Gerente                                                                                                                                                      |
| **Plataformas**       | Web                                                                                                                                                                         |

### 2.2.2 - Critérios de Aceitação

- [x] Os campos `Nome` e `Titular` são obrigatórios; os demais são opcionais (`RN-PROPRIEDADE-02`).
- [x] O `Titular` deve ser escolhido entre as pessoas ativas, com possibilidade de busca por nome.
- [x] Deve ser possível cadastrar uma nova pessoa a partir da escolha do `Titular`, sem sair do cadastro da propriedade (`RF-PESSOA-02`); a pessoa cadastrada passa a ser o titular.
- [x] Os campos `CIB`, `CCIR` e `CAR` são únicos quando informados (`RN-PROPRIEDADE-01`) e devem seguir os seus formatos oficiais.
- [x] A `Área Produtiva` não pode ser maior que a `Área Total` quando os dois valores forem informados (`RN-PROPRIEDADE-03`).
- [x] O `Endereço` segue as regras de [Endereço](comum.md#endereço), inclusive o preenchimento automático a partir do CEP.
- [x] Ao ser informado um CEP válido, o sistema deve consultar a localização no serviço OpenStreetMap e preencher automaticamente `Latitude` e `Longitude`.
- [x] Deve ser possível definir `Latitude` e `Longitude` escolhendo um ponto em um mapa.
- [x] A localização informada deve ser exibida em um mapa.

### 2.2.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a criação de uma nova propriedade na listagem (`RF-PROPRIEDADE-01`).
2. O sistema exibe o formulário de cadastro, com um mapa para a localização da propriedade.
3. O usuário preenche os dados da propriedade, podendo cadastrar um novo titular, informar o `Endereço` pelo CEP e definir a localização no mapa (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03`), persiste o registro com `Status` `Ativo` e exibe a mensagem: _"Registro salvo com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Cadastro de novo titular (passo 3):**
  1. O titular ainda não está cadastrado como pessoa, e o usuário aciona o cadastro de uma nova pessoa a partir da escolha do `Titular`.
  2. O sistema executa o cadastro da pessoa sem sair do cadastro da propriedade (`RF-PESSOA-02`).
  3. O sistema seleciona a pessoa cadastrada como `Titular` e exibe a mensagem: _"Titular vinculado à propriedade com sucesso."_
  4. O fluxo retorna ao passo 3.

- **A2 – Preenchimento do endereço pelo CEP (passo 3):**
  1. O usuário informa o `CEP`.
  2. O sistema preenche automaticamente os demais campos do endereço (ver [Endereço](comum.md#endereço)), consulta a localização no serviço OpenStreetMap, preenche `Latitude` e `Longitude` e exibe a localização no mapa.
  3. O fluxo retorna ao passo 3.

- **A3 – CEP não encontrado (passo A2.2):**
  1. O CEP informado não é encontrado.
  2. O sistema exibe a mensagem: _"CEP não encontrado."_
  3. O fluxo retorna ao passo 3.

- **A4 – Localização pelo mapa (passo 3):**
  1. O usuário escolhe um ponto no mapa.
  2. O sistema preenche `Latitude` e `Longitude` com as coordenadas do ponto escolhido.
  3. O fluxo retorna ao passo 3.

- **A5 – Área produtiva maior que a área total (passo 5):**
  1. A `Área Produtiva` informada é maior que a `Área Total` (`RN-PROPRIEDADE-03`).
  2. O sistema impede a gravação e destaca o campo `Área Produtiva` com a mensagem: _"A área produtiva não pode ser maior que a área total."_
  3. O fluxo retorna ao passo 3.

- **A6 – Documento fundiário duplicado (passo 5):**
  1. O `CIB`, o `CCIR` ou o `CAR` informado já pertence a outra propriedade (`RN-PROPRIEDADE-01`).
  2. O sistema impede a gravação e destaca o campo duplicado com a mensagem: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo 3.

- **A7 – Campos obrigatórios ausentes (passo 5):**
  1. O `Nome` ou o `Titular` não foi preenchido.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.3 - `RF-PROPRIEDADE-03`: Atualizar Propriedade

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição

Permite editar os dados cadastrais de uma propriedade já registrada.

|                       |                                                                                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **atualizar os dados de uma propriedade já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências**      | `RF-PROPRIEDADE-01`, `RF-PROPRIEDADE-02`                                                                                                                           |
| **Regras Vinculadas** | `RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03`                                                                                                      |
| **Atores**            | Administrador, Gerente                                                                                                                                             |
| **Plataformas**       | Web                                                                                                                                                                |

### 2.3.2 - Critérios de Aceitação

- [x] Todos os campos podem ser alterados, com as mesmas regras de preenchimento da criação (`RF-PROPRIEDADE-02`).
- [x] Ao trocar o `Titular`, o novo titular deve ser escolhido entre as pessoas ativas.

### 2.3.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Editar" de uma propriedade na listagem (`RF-PROPRIEDADE-01`).
2. O sistema exibe o formulário com os dados atuais da propriedade e a sua localização no mapa.
3. O usuário altera os campos desejados, podendo informar o `Endereço` pelo CEP e ajustar a localização no mapa (ver fluxos alternativos).
4. O usuário aciona a ação "Salvar".
5. O sistema valida os dados (`RN-PROPRIEDADE-01`, `RN-PROPRIEDADE-02`, `RN-PROPRIEDADE-03`), persiste as alterações e exibe a mensagem: _"Registro atualizado com sucesso!"_
6. O fluxo termina.

**Fluxos alternativos**

- **A1 – Preenchimento do endereço pelo CEP (passo 3):**
  1. O usuário informa o `CEP`.
  2. O sistema preenche automaticamente os demais campos do endereço (ver [Endereço](comum.md#endereço)), consulta a localização no serviço OpenStreetMap, preenche `Latitude` e `Longitude` e exibe a localização no mapa.
  3. O fluxo retorna ao passo 3.

- **A2 – CEP não encontrado (passo A1.2):**
  1. O CEP informado não é encontrado.
  2. O sistema exibe a mensagem: _"CEP não encontrado."_
  3. O fluxo retorna ao passo 3.

- **A3 – Localização pelo mapa (passo 3):**
  1. O usuário escolhe um ponto no mapa.
  2. O sistema preenche `Latitude` e `Longitude` com as coordenadas do ponto escolhido.
  3. O fluxo retorna ao passo 3.

- **A4 – Área produtiva maior que a área total (passo 5):**
  1. A `Área Produtiva` informada é maior que a `Área Total` (`RN-PROPRIEDADE-03`).
  2. O sistema impede a gravação e destaca o campo `Área Produtiva` com a mensagem: _"A área produtiva não pode ser maior que a área total."_
  3. O fluxo retorna ao passo 3.

- **A5 – Documento fundiário duplicado (passo 5):**
  1. O `CIB`, o `CCIR` ou o `CAR` informado já pertence a outra propriedade (`RN-PROPRIEDADE-01`).
  2. O sistema impede a gravação e destaca o campo duplicado com a mensagem: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo 3.

- **A6 – Campos obrigatórios ausentes (passo 5):**
  1. O usuário removeu o `Nome` ou o `Titular` da propriedade.
  2. O sistema impede a gravação, mantém os dados já digitados e destaca os campos ausentes com a mensagem: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo 3.

</div>

## 2.4 - `RF-PROPRIEDADE-04`: Detalhes da Propriedade

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição

Permite consultar as informações detalhadas de uma propriedade: dados cadastrais, localização e os registros vinculados a ela.

|                       |                                                                                                                                                           |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **consultar os detalhes de uma propriedade cadastrada** para visualizar seus dados completos em um só lugar. |
| **Dependências**      | `RF-PROPRIEDADE-01`, `RF-PROPRIEDADE-02`                                                                                                                  |
| **Regras Vinculadas** | —                                                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                                       |

### 2.4.2 - Critérios de Aceitação

- [ ] Exibir `Nome` e `Titular`.
- [ ] Exibir `Área Total`, `Área Produtiva`, `CIB`, `CCIR` e `CAR`.
- [ ] Exibir `Endereço`, `Latitude` e `Longitude`.
- [ ] Campos não preenchidos devem ser indicados como tal.
- [ ] Exibir os lotes e os animais vinculados à propriedade.
- [ ] Permitir acionar a exclusão da propriedade (`RF-PROPRIEDADE-05`).

### 2.4.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Detalhes" de uma propriedade na listagem (`RF-PROPRIEDADE-01`).
2. O sistema exibe os dados cadastrais e a localização da propriedade, indicando os campos não preenchidos.
3. O sistema exibe os lotes e os animais vinculados à propriedade.
4. O usuário consulta as informações (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão (passo 4):**
  1. O usuário aciona a exclusão da propriedade.
  2. O fluxo continua em `RF-PROPRIEDADE-05`.

</div>

## 2.5 - `RF-PROPRIEDADE-05`: Excluir Propriedade

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição

Permite excluir uma propriedade, desde que ela não tenha qualquer outro registro vinculado.

|                       |                                                                                                                                           |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **excluir uma propriedade cadastrada** para manter a base de dados organizada e consistente. |
| **Dependências**      | `RF-PROPRIEDADE-02`, `RF-PROPRIEDADE-04`                                                                                                  |
| **Regras Vinculadas** | —                                                                                                                                         |
| **Atores**            | Administrador, Gerente                                                                                                                    |
| **Plataformas**       | Web                                                                                                                                       |

### 2.5.2 - Critérios de Aceitação

- [ ] A exclusão exige confirmação do usuário.
- [ ] A propriedade só pode ser excluída se não tiver outros registros vinculados a ela (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.5.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a exclusão nos detalhes da propriedade (`RF-PROPRIEDADE-04`).
2. O sistema solicita a confirmação da exclusão.
3. O usuário confirma a exclusão.
4. O sistema verifica que a propriedade não possui registros vinculados, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Exclusão cancelada (passo 3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo termina.

- **A2 – Propriedade com registro vinculado (passo 4):**
  1. A propriedade possui registro vinculado.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo termina com falha.

</div>

## 2.6 - `RF-PROPRIEDADE-06`: Ativar/Desativar Propriedade

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição

Permite ativar/desativar uma propriedade, retirando de uso as propriedades que não fazem mais parte do negócio, sem excluí-las. Propriedades inativas ficam ocultas por padrão nas listagens, mas continuam disponíveis para consultas e relatórios.

|                       |                                                                                                                                                                                                                               |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **ativar ou desativar uma propriedade cadastrada** para ocultá-la das listagens quando ela não tiver mais relacionamento ativo com o negócio, sem perder seus dados e histórico. |
| **Dependências**      | `RF-PROPRIEDADE-01`, `RF-PROPRIEDADE-02`                                                                                                                                                                                      |
| **Regras Vinculadas** | —                                                                                                                                                                                                                             |
| **Atores**            | Administrador, Gerente                                                                                                                                                                                                        |
| **Plataformas**       | Web                                                                                                                                                                                                                           |

### 2.6.2 - Critérios de Aceitação

- [ ] A ação deve alternar o status da propriedade entre `Ativo` e `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).
- [ ] A ativação e a desativação exigem confirmação do usuário; a confirmação da desativação deve informar que a propriedade deixará de aparecer nas listagens de novos cadastros.
- [ ] Uma propriedade inativa não pode ser a propriedade selecionada (ver [Propriedade selecionada](comum.md#propriedade-selecionada)).
- [ ] Uma propriedade inativa não pode receber novas áreas.

### 2.6.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário aciona a ação "Desativar" de uma propriedade com status `Ativo` na listagem (`RF-PROPRIEDADE-01`).
2. O sistema solicita a confirmação, informando que a propriedade deixará de aparecer nas listagens de novos cadastros.
3. O usuário confirma a desativação.
4. O sistema altera o status da propriedade para `Inativo`, a oculta da listagem padrão e a retira das opções de propriedade selecionada.
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Ativação de propriedade inativa (passo 1):**
  1. O usuário aciona a ação "Ativar" de uma propriedade com status `Inativo`.
  2. O sistema solicita a confirmação da ativação.
  3. O usuário confirma a ativação.
  4. O sistema altera o status da propriedade para `Ativo`, volta a exibi-la na listagem padrão e a torna novamente disponível como propriedade selecionada.
  5. O fluxo termina.

- **A2 – Ação cancelada (passos 3 e A1.3):**
  1. O usuário não confirma a ação.
  2. O sistema mantém o status da propriedade inalterado.
  3. O fluxo termina.

</div>
