# Dicionário de Dados — iFarm

| Item | Valor |
|---|---|
| Sistema | iFarm — gestão de pecuária de corte |
| SGBD | PostgreSQL |
| Mapeamento | Prisma ORM 7 (`packages/db/prisma/schema.prisma`) |
| Fonte da verdade | O schema Prisma. Este documento descreve significado e regras; em caso de divergência, vale o schema |
| Diagrama ER | [`docs/ERD.md`](ERD.md) (gerado a partir do schema) |
| Atualizado em | 27/09/2026 |

## Sumário

1. [Convenções](#1-convenções)
2. [Padrões transversais](#2-padrões-transversais)
3. [Tipos enumerados](#3-tipos-enumerados)
4. [Cadastros básicos](#4-cadastros-básicos) — `person`, `address`, `property`, `breed`
5. [Áreas e lotes](#5-áreas-e-lotes) — `area`, `batch`, `batch_sale_goal`, `batch_area_history`
6. [Animais](#6-animais) — `animal`, `animal_batch_history`, `animal_property_history`
7. [Sessões de manejo](#7-sessões-de-manejo) — `management_session`, `management_participant`
8. [Manejos](#8-manejos) — pesagem, castração, brinco, RFID, marcação, sanitário
9. [Transferências](#9-transferências) — entre lotes e entre propriedades
10. [Compras](#10-compras) — `purchase_event`, `purchase_category`, `purchase_reception`, `purchased_animal`
11. [Usuários e autenticação](#11-usuários-e-autenticação)
12. [Glossário](#12-glossário)
13. [Estruturas previstas e ainda não usadas](#13-estruturas-previstas-e-ainda-não-usadas)

---

## 1. Convenções

### Nomes

- Tabelas e colunas no banco em `snake_case` e no singular (`animal`, `current_batch_id`). No código (Prisma/TypeScript) os mesmos campos aparecem em `camelCase` (`currentBatchId`). Este documento usa os nomes do banco.
- Chaves estrangeiras terminam em `_id` e levam o nome da entidade referenciada (`property_id`, `animal_id`).
- Datas de evento terminam em `_at` (instante) ou `_date` (dia).

### Tipos

| Tipo no documento | Tipo PostgreSQL | Observação |
|---|---|---|
| `uuid` | `uuid` | Gerado pela aplicação (`uuid()` do Prisma). Usado nas entidades principais. |
| `serial` | `integer` + sequência | Usado em tabelas de detalhe/histórico, de alto volume e sem exposição externa. |
| `text` | `text` | Sem limite no banco; os limites de tamanho são aplicados pela aplicação e estão indicados em cada coluna. |
| `numeric(p,s)` | `numeric(p,s)` | Valores monetários, pesos e áreas. Nunca usar ponto flutuante para esses valores. |
| `timestamp` | `timestamp(3) without time zone` | Instante. A aplicação grava no fuso do servidor. |
| `date` | `date` | Dia, sem horário (datas de nascimento, carência, metas). |
| `jsonb` | `jsonb` | Estruturas flexíveis (polígono de área, etapas da sessão). |
| `boolean` | `boolean` | — |
| enum | tipo `enum` do PostgreSQL | Ver [Tipos enumerados](#3-tipos-enumerados). |

### Legenda das tabelas de colunas

- **Nulo**: `N` = aceita nulo; em branco = obrigatório.
- **Chave**: `PK` chave primária, `FK → tabela` chave estrangeira, `UK` valor único, `UK*` único parcial (ver restrições da tabela).
- Colunas de auditoria `created_at` (preenchida na criação) e `updated_at` (atualizada a cada alteração) aparecem em quase todas as tabelas e não são repetidas nas descrições, exceto quando têm regra própria.

### Integridade referencial

Todas as chaves estrangeiras de negócio usam `ON DELETE RESTRICT`: um registro referenciado não pode ser apagado. Registros de negócio são **desativados**, **encerrados** ou **cancelados**, não apagados. As exceções (`CASCADE`) estão só nas tabelas de autenticação e em `user_settings`.

---

## 2. Padrões transversais

Estes padrões se repetem em várias tabelas. As descrições de coluna remetem a eles.

### 2.1 Estado derivado de timestamps

Em vez de uma coluna `status`, o estado de planos e eventos é derivado de colunas de data. Isso preserva quando cada mudança aconteceu.

| Colunas | Estado |
|---|---|
| `cancelled_at` preenchido | Cancelado (prevalece sobre os demais) |
| `confirmed_at` preenchido | Confirmado/efetivado |
| nenhum dos dois | Pendente/planejado |

Na sessão de manejo há um estado a mais: `performed_at` preenchido e ainda não confirmada = **em andamento** (ver 7.1).

### 2.2 Desativação e encerramento

- `deactivated_at` (pessoa, propriedade, raça, tipo sanitário): o registro sai das listas de seleção, mas continua válido nos históricos. A operação é reversível (limpa a coluna).
- `closed_at` (área, lote): o recurso deixa de ser usado. Tem pré-condições (ver cada tabela) e pode ser reaberto.

### 2.3 Históricos com vigência (período aberto único)

`batch_area_history`, `animal_batch_history` e `animal_property_history` registram períodos com `entered_at` e `exited_at`.

- `exited_at` nulo = período vigente.
- Um **índice único parcial** garante no máximo um período vigente por entidade.
- Uma mudança fecha o período vigente (`exited_at` = instante da mudança) e abre um novo. Períodos encerrados nunca são reabertos: reabrir cria outro período.

### 2.4 Campos desnormalizados do animal

`animal.current_batch_id`, `current_property_id`, `current_tag`, `current_rfid`, `current_weight` e `neutered` copiam o estado atual que está nos históricos e nos registros de manejo. Existem porque:

- há restrições que dependem deles (brinco/RFID únicos por propriedade entre animais ativos);
- as listagens e os filtros ficam simples e rápidos.

A aplicação é responsável por mantê-los sincronizados. Toda operação que altera o histórico recalcula o campo na mesma transação. Regra de recálculo de cada um:

| Campo | Fonte |
|---|---|
| `current_batch_id` | Período vigente em `animal_batch_history` |
| `current_property_id` | Período vigente em `animal_property_history` |
| `current_tag` | Registro efetivo mais recente em `animal_tagging` (null se o mais recente for uma remoção) |
| `current_rfid` | Registro efetivo mais recente em `animal_rfid_tagging` |
| `current_weight` | Pesagem efetiva mais recente em `animal_weighing` (por `weighed_at`, depois `id`) |
| `neutered` | Passa a `true` ao registrar castração. Ao excluir a última castração, o usuário decide se o animal continua castrado (pode ter chegado castrado, sem registro). |

### 2.5 Registros de manejo: avulso ou de sessão

As tabelas de registro individual (`animal_weighing`, `animal_neutering`, `animal_tagging`, `animal_rfid_tagging`, `animal_branding`, `health_management_item`) têm um vínculo opcional com um "contêiner" da sessão de manejo (`*_management`):

- `management_id` nulo = registro **avulso**, lançado direto no cadastro do animal.
- `management_id` preenchido = registro feito numa **sessão de manejo**.

### 2.6 Registro efetivo

Um registro de sessão é gravado na tabela definitiva durante o registro, mas **só passa a valer quando a sessão é consolidada** (`management_session.confirmed_at` preenchido). Até lá ele não entra no histórico, nos gráficos nem nos campos `current_*`. Se a sessão for cancelada, o registro fica guardado para auditoria e nunca passa a valer.

> **Registro efetivo** = (avulso **ou** de sessão consolidada) **e** não cancelado (`cancelled_at` nulo, nas tabelas que têm essa coluna).

Toda consulta de histórico, cálculo ou recálculo de `current_*` deve usar esse filtro. Na aplicação, os filtros ficam em `packages/domain/src/management-session/effective.ts`.

### 2.7 Correção com rastro e exclusão lógica

Registros de manejo são fatos históricos: servem de base para peso atual, GMD, custos, carência e rastreabilidade. Por isso, um lançamento errado **não é sobrescrito sem deixar marca nem apagado fisicamente**. O usuário corrige ou exclui o registro, e o banco guarda a memória do que foi lançado.

Isso vale para `animal_weighing`, `animal_neutering`, `animal_tagging` e `animal_rfid_tagging`. `animal_branding` tem só a exclusão lógica.

#### Colunas envolvidas

| Coluna | Papel |
|---|---|
| Colunas de valor (`weight`, `neutered_at`, `technique_id`, `tag`, `rfid`, `notes`…) | Sempre contêm o valor **vigente**, já corrigido. É o que histórico, gráficos e cálculos usam. |
| `original_*` | **Memória do valor lançado originalmente**, antes de qualquer correção. É gravada uma única vez e não muda nas correções seguintes. Nula = o valor nunca foi corrigido. |
| `corrected_at` | Instante da **última** correção. Nulo = o registro nunca foi corrigido. É atualizado a cada nova correção, inclusive quando só a observação muda. |
| `cancelled_at` | **Exclusão lógica.** Preenchido = o registro foi excluído pelo usuário: sai do histórico, dos gráficos e dos cálculos, mas continua no banco para auditoria. Não há desfazer pela interface. |

#### Ciclo de vida de um registro

```
lançado ──corrigir──▶ corrigido ──corrigir──▶ corrigido (de novo)
   │                      │
   └──────excluir─────────┴──────▶ excluído (cancelled_at preenchido; estado final)
```

| Estado | `original_*` | `corrected_at` | `cancelled_at` | Aparece no histórico/cálculos? |
|---|---|---|---|---|
| Lançado | nulo | nulo | nulo | Sim |
| Corrigido | valor original | data da última correção | nulo | Sim, com o valor corrigido |
| Excluído | (mantém o que tinha) | (mantém o que tinha) | data da exclusão | Não |

#### O que cada tabela preserva

As tabelas guardam o rastro de maneiras ligeiramente diferentes:

| Tabela | Campos de memória | Quando são preenchidos | O que **não** é preservado |
|---|---|---|---|
| `animal_weighing` | `original_weight` | Na primeira correção que **muda o peso**. Uma correção só da data ou da observação não preenche. | A data original (`weighed_at` é sobrescrita) e a observação original. |
| `animal_neutering` | `original_neutered_at`, `original_technique_id` | Na **primeira correção de qualquer tipo**: os dois são copiados juntos, mesmo que só um tenha mudado. | A observação original. |
| `animal_tagging` | `original_tag` | Na primeira correção que **muda o brinco**. | A data original (`identified_at`) e a observação original. |
| `animal_rfid_tagging` | `original_rfid` | Na primeira correção que **muda o RFID**. | A data original (`identified_at`) e a observação original. |

Por isso, na castração, `original_neutered_at` preenchido não significa que a data mudou: é preciso comparar com `neutered_at`. A interface faz essa comparação e só mostra o que de fato mudou ("corrigido (era 25/03/2026, Burdizzo)").

#### Exemplo — pesagem

| Momento | Ação | `weight` | `original_weight` | `corrected_at` | `cancelled_at` |
|---|---|---|---|---|---|
| 10/03 | Lançada 3.120 kg (erro de digitação) | 3120,00 | — | — | — |
| 10/03 | Corrigida para 312 kg | 312,00 | 3120,00 | 10/03 | — |
| 12/03 | Corrigida para 321 kg (nova conferência) | 321,00 | 3120,00 | 12/03 | — |
| 15/03 | Excluída (animal errado) | 321,00 | 3120,00 | 12/03 | 15/03 |

O valor intermediário (312 kg) não fica guardado: o banco mantém só o **primeiro** valor e o **atual**.

#### Regras

- **Recálculo dos campos atuais.** Toda correção ou exclusão recalcula, na mesma transação, o campo desnormalizado do animal (ver 2.4): `current_weight`, `current_tag` ou `current_rfid`. Excluir a pesagem mais recente faz o peso atual voltar ao da pesagem anterior; excluir o brinco atual faz o animal voltar ao brinco anterior.
- **Unicidade na correção.** Se o recálculo levar o animal a um brinco ou RFID que outro animal ativo da propriedade já usa, a correção ou exclusão é recusada.
- **Exclusão da última castração.** Se não sobrar nenhuma castração, o usuário decide se o animal continua castrado (pode ter chegado castrado, sem registro). A resposta define `animal.neutered`.
- **Registros de sessão.** O valor pode ser corrigido, mas a data não: ela segue a data da sessão. Só registros de sessão **consolidada** podem ser corrigidos ou excluídos pelo cadastro do animal; enquanto a sessão está em andamento, o registro é desfeito pela própria sessão (e aí é apagado de fato, porque ainda não era efetivo).
- **Datas corrigidas.** Seguem as mesmas regras de um lançamento: não podem ser futuras nem anteriores ao nascimento. Ao trocar só o dia, o horário original é mantido, para não alterar a ordem entre registros do mesmo dia.
- **Interface.** Registros corrigidos aparecem no histórico com a indicação "corrigido (era …)" e a data da correção na dica de tela.

#### Limitações conhecidas

- Não se registra **quem** corrigiu ou excluiu (não há coluna de usuário).
- Valores intermediários entre a primeira e a última correção se perdem.
- Numa correção de brinco/RFID em que o valor original era uma **remoção** (`tag`/`rfid` nulo), `original_*` continua nulo. Nesse caso não dá para distinguir "nunca corrigido" de "originalmente era uma remoção"; use `corrected_at` para saber se houve correção.

Se for necessária auditoria completa (quem, quando, cada valor), o caminho é uma tabela de eventos de alteração, e não mais colunas `original_*`.

### 2.8 Datas de manejo

- Registro avulso lançado com a data de hoje: grava o instante atual.
- Registro avulso em dia passado: grava a meia-noite local do dia.
- Registro de sessão: recebe a data e hora do manejo (`performed_at` da sessão), também na consolidação. Sessões antigas, gravadas só com o dia (meia-noite), seguem a regra anterior: o instante da consolidação se o manejo for de hoje, ou a meia-noite do dia do manejo.
- Registro avulso e correção: recebem a data e hora informadas (registro avulso: padrão agora).
- A data e hora de um manejo não podem ser futuras nem anteriores ao dia do nascimento do animal.

### 2.9 Compromissos pendentes

Validar só o estado atual do animal (ativo, na propriedade, em qual lote) não basta: operações **abertas** já contam com o animal e não podem ser contraditas por outra. Um animal está **comprometido** quando participa de:

| Compromisso | Aberto quando |
|---|---|
| **Recepção** | Sessão com `purchase_reception`, sem `confirmed_at` nem `cancelled_at` (ver 10.3). |
| **Sessão de manejo** | Sessão planejada ou em andamento (ver 7.1), com as chaves das suas etapas (`type`, ou `health:{healthManagementId}`). |
| **Transferência de lote** | `animal_batch_transfer` pendente e **isolada** (`management_session_id` nulo). A transferência da apartação pertence à sessão e conta como a etapa `batch` dela. |

**Conflitos.** Ao incluir o animal A numa nova operação:

| A já está em… | Sessão | Transferência | Troca direta de lote | Registro avulso |
|---|---|---|---|---|
| Recepção aberta | bloqueia | bloqueia | bloqueia | bloqueia |
| Sessão aberta | bloqueia se as duas têm a mesma etapa exclusiva¹ | bloqueia se a sessão tem apartação | bloqueia se a sessão tem apartação | avisa se a sessão tem a mesma etapa² |
| Transferência pendente | bloqueia se a nova sessão tem apartação | bloqueia | bloqueia | — |

¹ São exclusivas todas as etapas, **exceto a pesagem**: castração, brinco, RFID, apartação e o **mesmo** procedimento sanitário (procedimentos diferentes podem coexistir). Duas pesagens pendentes são permitidas, porque cada pesagem é um registro próprio, com a própria data.

² Ex.: castração avulsa num animal com castração pendente numa sessão aberta. Pode ser um procedimento à parte, então só se avisa. Pela mesma lógica, castrar um animal que já é castrado (recastração, por registro errado ou procedimento que falhou) também é só um aviso, e exige o motivo.

A recepção aberta é exclusiva nos dois sentidos: um animal que está em outra operação também impede a consolidação da recepção. Até a recepção ser concluída, o animal ainda pode ser apagado (ver 10.3) e seus manejos de entrada ainda não valem (2.6).

**Quando a regra é checada:**
- ao incluir animais numa sessão (criação, edição do planejamento, inclusão durante o registro) ou numa transferência (criação e edição). Na edição da sessão, quem já participava só é checado contra as etapas **acrescentadas** ao planejamento;
- na troca de lote pelo cadastro do animal e nos registros avulsos de pesagem, castração, brinco e RFID;
- de novo na **consolidação** da sessão e na **confirmação** da transferência, para pegar conflitos gravados antes desta regra e inclusões simultâneas.

**Desempenho.** A busca parte das operações **abertas** (sempre poucas, achadas pelos índices parciais `management_session_open_idx` e `animal_batch_transfer_open_idx`) e só então cruza com os animais pelos índices `(operação, animal)`. Partir dos animais leria todo o histórico de participações deles, que cresce com os anos. Medido com 5.000 animais e 20 anos de sessões mensais (1,2 milhão de participações): checar 2.000 animais de uma vez leva cerca de 15 ms, sem crescer com o histórico.

As checagens travam as linhas dos animais envolvidos (`SELECT … FOR UPDATE`) até o fim da transação, para que duas operações incluindo o mesmo animal ao mesmo tempo sejam checadas uma depois da outra. A própria operação sendo editada ou consolidada não conta como conflito.

**Interface.** O seletor de animais mostra os comprometidos desabilitados, com o motivo, e os ignora em "adicionar todos". Os registros avulsos mostram o aviso antes de salvar.

**Na aplicação:** as regras (função pura, com testes) ficam em `packages/shared/src/animal/commitments.ts`; a busca no banco, a trava e o erro, em `packages/domain/src/animal/commitments.ts`.

---

## 3. Tipos enumerados

### `sex` — sexo do animal

| Valor | Significado |
|---|---|
| `MALE` | Macho |
| `FEMALE` | Fêmea |

### `animal_origin` — como o animal entrou no rebanho

| Valor | Significado |
|---|---|
| `UNDEFINED` | Indefinida (padrão; cadastro sem informação de origem) |
| `BIRTH` | Nascimento na propriedade |
| `PURCHASE` | Compra (há vínculo em `purchased_animal`) |
| `DONATION` | Doação recebida |
| `REFERENCE` | Animal de referência: não existe na fazenda, serve para genealogia |

### `animal_status` — situação do animal

| Valor | Significado |
|---|---|
| `ACTIVE` | Ativo na propriedade. Só animais ativos participam de manejos, transferências e das regras de unicidade de brinco/RFID. |
| `SOLD` | Vendido |
| `DONATED` | Doado |
| `DEAD` | Morto |
| `DISCARDED` | Descartado |
| `SLAUGHTERED` | Abatido |
| `REFERENCE` | Referência (ver `animal_origin`) |

### `person_type` — tipo de pessoa

| Valor | Significado |
|---|---|
| `INDIVIDUAL` | Pessoa física (CPF) |
| `COMPANY` | Pessoa jurídica (CNPJ) |

### `marital_status` — estado civil (pessoa física)

`SINGLE` (solteiro), `MARRIED` (casado), `STABLE_UNION` (união estável), `DIVORCED` (divorciado), `WIDOWED` (viúvo).

### `health_management_dose_type` — regra de dose de procedimento sanitário

| Valor | Significado | Dose por animal |
|---|---|---|
| `NONE` | Procedimento sem dose (exame, banho, curativo) | — |
| `FIXED` | Mesma dose para todos os animais | `dose_ml` |
| `PER_WEIGHT` | Dose proporcional ao peso vivo | `dose_ml` × peso do animal ÷ `dose_weight_kg` |

### `purchase_pricing_type` — forma de preço de uma categoria de compra

| Valor | Significado | Colunas usadas |
|---|---|---|
| `PER_HEAD` | Preço por cabeça | `unit_price` |
| `PER_ARROBA` | Preço por arroba (15 kg; na prática de peso vivo usa-se 30 kg por arroba) | `unit_price`, `invoiced_weight`, `shrink_percent` |
| `LUMP_SUM` | Valor fechado da categoria | `total_price` |

---

## 4. Cadastros básicos

### 4.1 `person` — Pessoa

Pessoa física ou jurídica que se relaciona com a fazenda: titular de propriedade, vendedor de compra, veterinário responsável.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `type` | `person_type` | | | | Pessoa física ou jurídica. Define quais campos se aplicam e como `tax_id` é validado. |
| `tax_id` | text | | | UK | CPF (física) ou CNPJ (jurídica). Obrigatório, com dígitos verificadores validados pela aplicação. |
| `name` | text | | | | Nome completo ou razão social. Até 100 caracteres. |
| `state_registration` | text | N | | UK | Inscrição estadual. Até 20 caracteres. |
| `phone` | text | N | | | Telefone. |
| `email` | text | N | | UK | E-mail. Até 255 caracteres. |
| `deactivated_at` | timestamp | N | | | Desativação reversível (ver 2.2). Pessoa desativada não pode ser escolhida como titular. |
| `trade_name` | text | N | | | Nome fantasia. **Só pessoa jurídica.** Até 200 caracteres. |
| `rg` | text | N | | UK | RG. **Só pessoa física.** Até 20 caracteres. |
| `birth_date` | date | N | | | Nascimento. **Só pessoa física.** |
| `marital_status` | `marital_status` | N | | | Estado civil. **Só pessoa física.** |
| `address_id` | serial | N | | FK → `address`, UK | Endereço (1:1). |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `type`, `name`.

### 4.2 `address` — Endereço

Endereço de uma pessoa ou de uma propriedade. Relação 1:1: cada endereço pertence a uma única pessoa **ou** a uma única propriedade.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `zip_code` | text | | | | CEP. |
| `street` | text | | | | Logradouro. Até 150 caracteres. |
| `number` | text | N | | | Número. Até 15 caracteres. |
| `complement` | text | N | | | Complemento. Até 100 caracteres. |
| `neighborhood` | text | N | | | Bairro. Até 100 caracteres. |
| `city` | text | | | | Município. Até 60 caracteres. |
| `state` | text | | | | UF. |
| `country` | text | | `'Brasil'` | | País. |

**Regra:** o endereço é opcional, mas, se qualquer um de CEP, logradouro, cidade ou UF for informado, os quatro passam a ser obrigatórios.

### 4.3 `property` — Propriedade (fazenda)

Unidade produtiva. Quase todos os dados operacionais (áreas, lotes, animais, sessões, compras) pertencem a uma propriedade. O usuário trabalha sempre com uma "propriedade atual" (ver `user_settings`).

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | | Nome da fazenda. Até 200 caracteres. |
| `total_area` | numeric(10,4) | N | | | Área total, em hectares. |
| `productive_area` | numeric(10,4) | N | | | Área produtiva, em hectares. |
| `car` | text | N | | UK | Cadastro Ambiental Rural. |
| `cib` | text | N | | UK | Cadastro Imobiliário Brasileiro. Até 20 caracteres. |
| `ccir` | text | N | | UK | Certificado de Cadastro de Imóvel Rural (INCRA). |
| `latitude` | double precision | N | | | Latitude da sede (-90 a 90). |
| `longitude` | double precision | N | | | Longitude da sede (-180 a 180). |
| `registered_brand` | text | N | | | Desenho ou código da marca de ferro registrada. |
| `deactivated_at` | timestamp | N | | | Desativação reversível (ver 2.2). |
| `address_id` | serial | N | | FK → `address`, UK | Endereço (1:1). |
| `owner_id` | uuid | | | FK → `person` | Titular. Deve ser uma pessoa ativa. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `name`, `owner_id`.

### 4.4 `breed` — Raça

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | UK | Nome da raça (ex.: Nelore, Angus). Até 60 caracteres. |
| `deactivated_at` | timestamp | N | | | Desativação reversível. Raça desativada não aparece para novos cadastros. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

---

## 5. Áreas e lotes

### 5.1 `area` — Área de pastagem

Piquete ou pasto desenhado no mapa da propriedade. Um lote ocupa uma área por vez (pastejo rotacionado).

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | | Nome (ex.: "Piquete 01"). Até 100 caracteres. |
| `polygon` | jsonb | | | | Contorno desenhado no mapa: lista ordenada de vértices `[{ "lat": number, "lng": number }, …]` em WGS 84. Mínimo de 3 vértices. |
| `hectares` | numeric(10,4) | | | | Área em hectares, maior que 0 e até 999.999,9999. Calculada a partir do polígono e ajustável pelo usuário. |
| `stocking_rate` | numeric(10,4) | | | | Taxa de lotação suportada, em UA/ha, maior que 0 e até 30. Com `hectares`, define a capacidade da área (UA). |
| `default_occupation_days` | integer | N | | | Dias de ocupação de referência (até 365), usados quando não há plano de rodízio. |
| `default_rest_days` | integer | N | | | Dias de descanso de referência (até 365). |
| `notes` | text | N | | | Observação. Até 500 caracteres. |
| `closed_at` | timestamp | N | | | Área desativada (ver 2.2). **Só pode ser desativada se nenhum lote estiver nela.** |
| `property_id` | uuid | | | FK → `property` | Propriedade dona da área. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `property_id`.

### 5.2 `batch` — Lote

Grupo de animais manejados juntos e alocado numa área.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | | Nome (ex.: "Lote Engorda"). Até 100 caracteres. |
| `notes` | text | N | | | Observação. Até 500 caracteres. |
| `closed_at` | timestamp | N | | | Lote encerrado. Pré-condições: nenhum animal ativo no lote e nenhuma transferência pendente com destino a ele. Encerrar fecha o período vigente em `batch_area_history`, liberando a área. Reabrir exige uma área livre e abre um novo período. |
| `property_id` | uuid | | | FK → `property` | Propriedade dona do lote. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `property_id`.
**Regras:**
- Ao criar um lote, informa-se a área inicial, que deve ser ativa, da mesma propriedade e estar livre.
- Lotes encerrados não recebem animais (transferências, apartação, cadastro).

### 5.3 `batch_sale_goal` — Meta de venda do lote

Meta opcional de venda (1:1 com o lote), usada nos indicadores do lote (peso projetado, dias até a meta).

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `target_date` | date | N | | | Data pretendida para a venda. |
| `target_weight` | numeric(10,2) | N | | | Peso médio pretendido por animal (kg). |
| `batch_id` | uuid | | | FK → `batch`, UK | Lote (1:1). |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

### 5.4 `batch_area_history` — Ocupação de áreas pelo lote

Histórico com vigência (ver 2.3) de qual área cada lote ocupou. Base do rodízio: a saída do lote marca o início do descanso da área.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `entered_at` | timestamp | | | | Início da ocupação. |
| `exited_at` | timestamp | N | | | Fim da ocupação. Nulo = o lote está na área agora. |
| `notes` | text | N | | | Observação da troca de área. |
| `batch_id` | uuid | | | FK → `batch` | Lote. |
| `area_id` | uuid | | | FK → `area` | Área ocupada. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:**
- `UNIQUE (batch_id) WHERE exited_at IS NULL`: o lote ocupa no máximo uma área por vez.
- Índice `(area_id) WHERE exited_at IS NULL`: consulta rápida da ocupação atual de cada área.
- Índice `(batch_id, entered_at)`.

**Regra:** a área é exclusiva: a aplicação não deixa dois lotes ocuparem a mesma área ao mesmo tempo.

---

## 6. Animais

### 6.1 `animal` — Animal

Cadastro do bovino. As colunas `current_*` e `neutered` são desnormalizadas (ver 2.4).

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador interno. |
| `code` | serial | | sequência | UK | Número sequencial legível ("ID 37" na interface). Não muda e não depende da propriedade. |
| `name` | text | N | | | Apelido. Até 50 caracteres. |
| `birth_date` | date | N | | | Data de nascimento. Limite inferior para as datas de manejo do animal. |
| `birth_date_estimated` | boolean | | `false` | | `true` quando o nascimento foi estimado a partir de uma idade informada (ex.: compra de animal adulto). A interface mostra a idade como aproximada ("~18 meses"). |
| `origin` | `animal_origin` | | `UNDEFINED` | | Como o animal entrou no rebanho. |
| `sex` | `sex` | | `MALE` | | Sexo. |
| `status` | `animal_status` | | `ACTIVE` | | Situação. Apenas `ACTIVE` participa das operações do dia a dia. |
| `breed_id` | uuid | N | | FK → `breed` | Raça. |
| `current_batch_id` | uuid | N | | FK → `batch` | Lote atual (desnormalizado). Nulo = sem lote. |
| `current_property_id` | uuid | | | FK → `property` | Propriedade atual (desnormalizado). |
| `current_tag` | text | N | | UK* | Brinco atual (desnormalizado). Até 30 caracteres. |
| `current_rfid` | text | N | | UK* | RFID atual (desnormalizado). Até 50 caracteres. |
| `current_weight` | numeric(10,2) | N | | | Peso atual em kg (desnormalizado): o da pesagem efetiva mais recente. |
| `neutered` | boolean | | `false` | | Se o animal é castrado (ver 2.4). |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:**
- `UNIQUE (current_property_id, current_tag) WHERE status = 'ACTIVE' AND current_tag IS NOT NULL`: o brinco é único entre os animais ativos da mesma propriedade. Animais inativos liberam o brinco para reuso.
- `UNIQUE (current_property_id, current_rfid) WHERE status = 'ACTIVE' AND current_rfid IS NOT NULL`: idem para o RFID.
- Índices: `status`, `breed_id`, `current_property_id`.

**Regras:**
- O cadastro cria o animal com o período inicial em `animal_property_history` e em `animal_batch_history`, além dos registros iniciais de pesagem, brinco, RFID e castração que forem informados.
- Com origem `PURCHASE`, o cadastro avulso também cria a compra correspondente (ver 10.4).
- Identificação exibida na interface: brinco, senão RFID, senão "ID {code}".

### 6.2 `animal_batch_history` — Histórico de lotes do animal

Histórico com vigência (ver 2.3) dos lotes por onde o animal passou.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `entered_at` | timestamp | | | | Entrada no lote. |
| `exited_at` | timestamp | N | | | Saída. Nulo = lote atual. |
| `notes` | text | N | | | Motivo da mudança. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `batch_id` | uuid | N | | FK → `batch` | Lote. **Nulo = período em que o animal ficou sem lote.** |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:**
- `UNIQUE (animal_id) WHERE exited_at IS NULL`: um único período vigente por animal.
- Índice `(batch_id) WHERE exited_at IS NULL`: composição atual de cada lote.
- Índice `(animal_id, entered_at)`.

**Regra:** uma troca de lote não pode ter data anterior à entrada no lote atual.

### 6.3 `animal_property_history` — Histórico de propriedades do animal

Histórico com vigência (ver 2.3) das propriedades em que o animal esteve.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `entered_at` | timestamp | | | | Chegada à propriedade. |
| `exited_at` | timestamp | N | | | Saída. Nulo = propriedade atual. |
| `notes` | text | N | | | Observação. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `property_id` | uuid | | | FK → `property` | Propriedade. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:** `UNIQUE (animal_id) WHERE exited_at IS NULL`; índice `(property_id) WHERE exited_at IS NULL`; índice `(animal_id, entered_at)`.

---

## 7. Sessões de manejo

Uma **sessão de manejo** reúne o trabalho feito num grupo de animais no curral: planejamento → registro animal por animal → consolidação. A sessão é genérica e não conhece compras: quando uma compra usa uma sessão para receber animais, é a compra que a incorpora, por meio de `purchase_reception` (ver 10.3).

### 7.1 `management_session` — Sessão de manejo

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `title` | text | | | | Título exibido nas listagens (ex.: "Pesagem mensal da recria"). Até 100 caracteres. |
| `notes` | text | N | | | Observação. Até 500 caracteres. |
| `scheduled_at` | timestamp | | | | Data e hora previstas (planejamento, lembretes). |
| `performed_at` | timestamp | N | | | Data e hora em que o manejo acontece de fato. Preenchida ao **iniciar o registro** (padrão: agora). Não pode ser futura. Todos os registros da sessão recebem essa data e hora. |
| `confirmed_at` | timestamp | N | | | Consolidação: os registros passam a valer (ver 2.6). A sessão não pode mais ser alterada. |
| `cancelled_at` | timestamp | N | | | Cancelamento: nenhum registro da sessão passa a valer. |
| `property_id` | uuid | | | FK → `property` | Propriedade. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Estado (derivado):**

| Estado | Condição | O que é permitido |
|---|---|---|
| Planejada | sem `performed_at`, `confirmed_at` e `cancelled_at` | Editar planejamento, incluir animais, iniciar, cancelar |
| Em andamento | `performed_at` preenchido, sem `confirmed_at`/`cancelled_at` | Registrar etapas, corrigir registros, incluir/remover animais, alterar a data, consolidar, cancelar |
| Consolidada | `confirmed_at` preenchido | Só leitura |
| Cancelada | `cancelled_at` preenchido | Só leitura |

As etapas da sessão ficam em `management_step` (ver 7.2).

**Consolidação** (em uma transação):
1. Remove da sessão os participantes sem nenhum registro.
2. Exige ao menos um animal manejado, todos ativos na propriedade e sem compromisso conflitante em outra operação aberta (ver 2.9), e `performed_at` que não seja futura.
3. Marca `confirmed_at`.
4. Efetiva as etapas na ordem pesagem → castração → brinco → RFID → sanitário → apartação: normaliza as datas dos registros, recalcula `current_weight`, marca `neutered`, atualiza `current_tag`/`current_rfid` e confirma as transferências de lote da apartação.

Etapas puladas num animal simplesmente não têm efeito sobre ele.

**Índices:** `(property_id, scheduled_at)`; parcial `management_session_open_idx` em `property_id` onde `confirmed_at` e `cancelled_at` são nulos (sessões abertas, ver 2.9).

### 7.2 `management_step` — Etapa da sessão

Etapas do manejo, na ordem em que são feitas em cada animal.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `type` | enum `management_step_type` | | | | `WEIGHING` (pesagem), `NEUTERING` (castração), `TAG` (brinco), `RFID`, `HEALTH` (procedimento sanitário) ou `BATCH` (apartação). |
| `position` | integer | | | | Ordem da etapa na sessão, a partir de 0. |
| `management_session_id` | uuid | | | FK → `management_session` | Sessão. Apagada junto com ela (cascade). |
| `health_management_id` | uuid | N | | FK → `health_management`, UK | Só no sanitário: o procedimento aplicado nesta etapa. |

Cada tipo de etapa tem um contêiner, onde ficam os registros e a configuração definida no planejamento (ver 8.1):

| `type` | Contêiner |
|---|---|
| `WEIGHING` | `weighing_management` |
| `NEUTERING` | `neutering_management` (técnica prevista) |
| `TAG` | `tag_management` |
| `RFID` | `rfid_management` |
| `HEALTH` | `health_management` (dados do procedimento), apontado por `health_management_id` |
| `BATCH` | `batch_management` (lotes sugeridos); registros em `animal_batch_transfer` da sessão + `management_participant.batch_kept` |

Regras:
- Cada tipo aparece no máximo uma vez, exceto `HEALTH`, que pode se repetir (vários procedimentos sanitários na mesma sessão).
- A apartação (`BATCH`), quando existe, é sempre a **última** etapa.
- Uma etapa só pode ser removida do planejamento se ainda não tiver registros.
- A chave estável de uma etapa é o tipo, ou `health:{health_management_id}` no sanitário.
- Ao salvar o planejamento, as etapas da sessão são regravadas na nova ordem.

**Restrições e índices:** `UNIQUE (management_session_id, position)`; único parcial `management_step_unique_type` em `(management_session_id, type)` onde `type <> 'HEALTH'`; `UNIQUE (health_management_id)`.

### 7.3 `management_participant` — Animal participante da sessão

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `management_session_id` | uuid | | | FK → `management_session` | Sessão. |
| `animal_id` | uuid | | | FK → `animal` | Animal. Deve estar ativo na propriedade da sessão e sem compromisso conflitante com as etapas dela (ver 2.9). |
| `batch_kept` | boolean | | `false` | | Na apartação, `true` = decisão de **permanecer no lote atual**. Essa decisão não gera transferência; o registro aqui faz a etapa contar como feita. |
| `last_handled_at` | timestamp | N | | | Instante do último registro de etapa no animal. Ordena a lista de manejados. Volta a nulo quando todos os registros do animal são desfeitos. |
| `created_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:** `UNIQUE (management_session_id, animal_id)`; índice `animal_id`.

**Situação do participante (derivada):**
- **A manejar:** nenhuma etapa registrada.
- **Parcial:** algumas etapas registradas.
- **Completo:** todas as etapas registradas.

Remover um participante com registros desfaz os registros dele.

---

## 8. Manejos

Cada tipo de manejo tem uma tabela de **registro individual** (um por animal) e, quando feito em sessão, uma tabela **contêiner** que liga os registros à sessão (ver 2.5).

### 8.1 Contêineres de sessão

`weighing_management`, `neutering_management`, `tag_management`, `rfid_management`, `brand_management` e `batch_management` têm a mesma estrutura:

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `management_session_id` | uuid | | | FK → `management_session`, UK | Sessão (no máximo um contêiner de cada tipo por sessão). |
| `created_at` | timestamp | | now | | Auditoria. |

O contêiner é criado quando a etapa entra no planejamento e apagado quando a etapa sai (só se não houver registros).

`neutering_management` tem, além dessas, a técnica prevista no planejamento:

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `suggested_technique_id` | uuid | N | | FK → `neutering_technique` | Técnica prevista: vem pré-selecionada no registro de cada animal, que pode escolher outra. Escolhida entre as ativas; pode ser mantida se for inativada depois. Nulo = não informada. |

`batch_management` não liga registros individuais: na apartação, quem muda de lote entra numa `animal_batch_transfer` da sessão, e quem fica é marcado em `management_participant.batch_kept`. Ele guarda os lotes sugeridos no planejamento, em `batch_management_suggestion`:

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `management_id` | uuid | | | PK, FK → `batch_management` | Contêiner da apartação. Apagado junto com ele (cascade). |
| `batch_id` | uuid | | | PK, FK → `batch` | Lote sugerido, oferecido como atalho no registro (qualquer outro lote vigente continua disponível). Deve ser da propriedade da sessão e estar vigente ao planejar. Lote sugerido não pode ser excluído. |
| `position` | integer | | | | Ordem em que o lote aparece no registro. |

**Índices:** `batch_id`.

### 8.2 `animal_weighing` — Pesagem

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `weight` | numeric(10,2) | | | | Peso individual em kg. Maior que 0 (até 3.000 em sessão). |
| `notes` | text | N | | | Observação. |
| `weighed_at` | timestamp | | | | Data da pesagem (ver 2.8). |
| `original_weight` | numeric(10,2) | N | | | **Memória do peso lançado originalmente.** Gravado uma única vez, na primeira correção que muda o peso; correções seguintes não o alteram. Nulo = o peso nunca foi corrigido. Não guarda a data original. Ver 2.7. |
| `corrected_at` | timestamp | N | | | Instante da **última** correção (peso, data ou observação). Nulo = nunca corrigida. |
| `cancelled_at` | timestamp | N | | | **Exclusão lógica.** Preenchido = a pesagem foi excluída pelo usuário: sai do histórico, do gráfico, do GMD e do cálculo do peso atual, mas continua no banco. |
| `management_id` | uuid | N | | FK → `weighing_management` | Nulo = avulsa (ver 2.5). |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`.
**Regras:** a pesagem efetiva mais recente define `animal.current_weight`. As pesagens alimentam o gráfico de evolução e os cálculos de ganho médio diário (GMD) do animal e do lote.

### 8.3 `animal_neutering` — Castração

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `technique_id` | uuid | N | | FK → `neutering_technique` | Técnica usada. **Obrigatória** na etapa de sessão e no registro avulso (castração feita na fazenda) e deve estar ativa; opcional só no cadastro de animal que já chegou castrado. Numa correção, não pode ser apagada se o registro já tinha técnica, e pode manter uma técnica inativada depois. |
| `notes` | text | N | | | Observação. **Obrigatória numa recastração** (castração de animal que já é castrado), como justificativa. |
| `neutered_at` | timestamp | | | | Data do procedimento (ver 2.8). |
| `original_neutered_at` | timestamp | N | | | **Memória da data lançada originalmente.** Gravada uma única vez, na **primeira correção de qualquer tipo**, junto com `original_technique_id`, mesmo que a data não tenha mudado; para saber se a data mudou, compare com `neutered_at`. Nulo = nunca corrigida. Ver 2.7. |
| `original_technique_id` | uuid | N | | FK → `neutering_technique` | **Memória da técnica lançada originalmente.** Gravada junto com `original_neutered_at`, na primeira correção. Como a técnica pode ser nula, `original_technique_id` nulo com `corrected_at` preenchido significa que a técnica original estava em branco. |
| `corrected_at` | timestamp | N | | | Instante da **última** correção. Nulo = nunca corrigida; é o indicador confiável de que houve correção. |
| `cancelled_at` | timestamp | N | | | **Exclusão lógica.** Preenchido = castração excluída: sai do histórico e da data de castração exibida. Se era a única, o usuário decide se o animal continua castrado (`animal.neutered`). |
| `management_id` | uuid | N | | FK → `neutering_management` | Nulo = avulsa. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`.
**Regras:** registrar uma castração marca `animal.neutered = true`. Numa sessão, a etapa aparece para todos os animais, com aviso se o animal já é castrado ou é fêmea.

### 8.4 `animal_tagging` — Brinco

Cada registro é uma colocação, troca ou remoção de brinco.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `tag` | text | N | | | Brinco colocado. **Nulo = remoção do brinco.** Até 30 caracteres. |
| `notes` | text | N | | | Motivo (ex.: perda do anterior). |
| `identified_at` | timestamp | | | | Data (ver 2.8). |
| `original_tag` | text | N | | | **Memória do brinco lançado originalmente.** Gravado uma única vez, na primeira correção que muda o brinco. Nulo = o brinco nunca foi corrigido (ou o registro original era uma remoção; nesse caso, use `corrected_at`). Não guarda a data original. Ver 2.7. |
| `corrected_at` | timestamp | N | | | Instante da **última** correção (brinco, data ou observação). Nulo = nunca corrigido. |
| `cancelled_at` | timestamp | N | | | **Exclusão lógica.** Preenchido = registro excluído: sai do histórico, e o brinco atual do animal é recalculado a partir do registro válido anterior. |
| `management_id` | uuid | N | | FK → `tag_management` | Nulo = avulso. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`.
**Regras:**
- O registro efetivo mais recente define `animal.current_tag`.
- O brinco não pode estar em uso por outro animal ativo da propriedade, a menos que esse outro animal receba outro brinco na mesma sessão.
- Numa sessão, dois animais não podem receber o mesmo brinco.
- O novo brinco não pode ser igual ao atual.

### 8.5 `animal_rfid_tagging` — RFID

Mesma estrutura e regras de `animal_tagging`, para o identificador eletrônico.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `rfid` | text | N | | | RFID. **Nulo = remoção.** Até 50 caracteres. |
| `notes` | text | N | | | Observação. |
| `identified_at` | timestamp | | | | Data (ver 2.8). |
| `original_rfid` | text | N | | | **Memória do RFID lançado originalmente.** Mesma regra de `animal_tagging.original_tag`. Ver 2.7. |
| `corrected_at` | timestamp | N | | | Instante da **última** correção. Nulo = nunca corrigido. |
| `cancelled_at` | timestamp | N | | | **Exclusão lógica.** Preenchido = registro excluído; o RFID atual do animal é recalculado a partir do registro válido anterior. |
| `management_id` | uuid | N | | FK → `rfid_management` | Nulo = avulso. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`. O registro efetivo mais recente define `animal.current_rfid`.

### 8.6 `animal_branding` — Marcação a ferro

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `is_counter_brand` | boolean | | `false` | | `true` = contramarca (segunda marca, aplicada após mudança de dono). |
| `notes` | text | N | | | Observação. |
| `branded_at` | timestamp | | | | Data da marcação (ver 2.8). |
| `cancelled_at` | timestamp | N | | | **Exclusão lógica.** Preenchido = marcação excluída, mantida para auditoria. A marcação não tem colunas de correção (`original_*`/`corrected_at`): um erro é corrigido excluindo e lançando de novo. |
| `management_id` | uuid | N | | FK → `brand_management` | Nulo = avulsa. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`. Ver [seção 13](#13-estruturas-previstas-e-ainda-não-usadas).

### 8.7 `health_management` — Procedimento sanitário

Um procedimento (vacina, vermífugo, tratamento, exame…) aplicado a um grupo de animais. Os dados comuns a todos os animais ficam aqui; os de cada animal ficam em `health_management_item`.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `title` | text | N | | | Produto ou descrição (ex.: "Febre aftosa", "Ivermectina 1%"). Até 100 caracteres. |
| `withdrawal_end_date` | date | N | | | Fim da carência: até essa data o animal não pode ser abatido ou ter o leite comercializado. |
| `next_due_date` | date | N | | | Próxima dose/aplicação prevista (lembretes). |
| `dose_type` | `health_management_dose_type` | | `NONE` | | Regra de dose. Com animais já registrados, não pode passar de `NONE` para uma regra com dose, nem o contrário. |
| `dose_ml` | numeric(10,2) | N | | | Dose em ml: por animal (`FIXED`) ou a cada `dose_weight_kg` (`PER_WEIGHT`). Obrigatória e maior que 0 nesses casos; nula em `NONE`. |
| `dose_weight_kg` | numeric(10,2) | N | | | Peso de referência da dose por peso (ex.: 1 ml a cada **50** kg). Obrigatório e maior que 0 em `PER_WEIGHT`; nulo nos demais. |
| `performed_at` | timestamp | | | | Data do procedimento. Em sessão, é provisória até a consolidação, quando recebe a data do manejo. |
| `type_id` | uuid | | | FK → `health_management_type` | Tipo (deve estar ativo). |
| `management_session_id` | uuid | N | | FK → `management_session` | Sessão. Nulo = avulso. Sem restrição de unicidade: uma sessão pode ter vários procedimentos. |
| `veterinarian_id` | uuid | N | | FK → `person` | Veterinário responsável (pessoa ativa). |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `management_session_id`, `next_due_date`.

### 8.8 `health_management_item` — Aplicação no animal

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `notes` | text | N | | | Observação desse animal (reação adversa, aplicação incompleta…). |
| `dose_ml` | numeric(10,2) | N | | | Dose aplicada (ml). **Obrigatória** quando o procedimento tem dose (`FIXED`/`PER_WEIGHT`) e sempre nula em `NONE`. Na etapa da sessão já vem sugerida pela regra do procedimento (`FIXED` = `dose_ml`; `PER_WEIGHT` = `dose_ml` × peso ÷ `dose_weight_kg`, com 1 casa, usando o peso da sessão ou o atual) e pode ser corrigida; sem peso, o operador informa a dose aplicada. Não é calculada depois, na consolidação. |
| `management_id` | uuid | | | FK → `health_management` | Procedimento. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `management_id`. A regra de registro efetivo (2.6) vale pelo procedimento pai: avulso, ou de sessão consolidada.

### 8.9 `health_management_type` — Tipo de procedimento sanitário

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | UK | Nome (ex.: Vacinação, Vermifugação, Controle de ectoparasitas, Tratamento, Exame). |
| `deactivated_at` | timestamp | N | | | Desativação reversível. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

### 8.10 `neutering_technique` — Técnica de castração

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `name` | text | | | UK | Nome (ex.: Burdizzo, Cirúrgica, Elástico). Até 60 caracteres. |
| `deactivated_at` | timestamp | N | | | Desativação reversível. Técnica desativada não aparece para novos registros, mas continua nos já lançados. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Regras:** técnica já usada em alguma castração (inclusive como `original_technique_id`) não pode ser excluída, só desativada.

---

## 9. Transferências

### 9.1 `animal_batch_transfer` — Transferência entre lotes

Plano de mover animais de um ou mais lotes para um lote de destino. Estado derivado (ver 2.1): pendente → confirmada ou cancelada.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `transferred_at` | timestamp | | | | Data e hora da transferência. Não pode ser futura na confirmação, nem anterior à entrada dos animais no lote atual. |
| `notes` | text | N | | | Observação. Até 500 caracteres. |
| `confirmed_at` | timestamp | N | | | Confirmação: os animais mudam de lote. |
| `cancelled_at` | timestamp | N | | | Cancelamento: nenhum animal muda de lote. |
| `destination_batch_id` | uuid | | | FK → `batch` | Lote de destino. Ativo e da mesma propriedade. |
| `property_id` | uuid | | | FK → `property` | Propriedade. |
| `management_session_id` | uuid | N | | FK → `management_session` | Preenchido = transferência gerada pela **apartação** de uma sessão. Uma por lote de destino. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `destination_batch_id`, `property_id`, `management_session_id`; parcial `animal_batch_transfer_open_idx` em `property_id` onde `confirmed_at` e `cancelled_at` são nulos (transferências pendentes, ver 2.9).

**Regras:**
- Os animais podem vir de lotes diferentes (ou de nenhum), mas precisam estar ativos na propriedade e fora do lote de destino, tanto ao salvar quanto ao confirmar.
- Um animal não pode estar em duas transferências pendentes, nem numa transferência pendente e numa sessão aberta com apartação, nem numa recepção aberta (ver 2.9).
- A confirmação registra `origin_batch_id` em cada item, fecha o período vigente em `animal_batch_history`, abre um novo no destino e atualiza `animal.current_batch_id`. Se a data for hoje, usa o instante da confirmação.
- Transferências de sessão ainda não consolidada são geridas só pela sessão: não aparecem na lista de transferências, não podem ser editadas, confirmadas ou canceladas por fora, e são confirmadas (ou canceladas) junto com a sessão.

### 9.2 `animal_batch_transfer_item` — Animal da transferência entre lotes

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `notes` | text | N | | | Observação do animal (na apartação, o motivo). |
| `transfer_id` | uuid | | | FK → `animal_batch_transfer` | Transferência. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `origin_batch_id` | uuid | N | | FK → `batch` | Lote de onde o animal saiu, gravado **na confirmação**. Nulo enquanto pendente, ou se o animal estava sem lote. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `transfer_id`, `origin_batch_id`.

### 9.3 `animal_property_transfer` — Transferência entre propriedades

Envio de animais de uma propriedade para outra, em duas confirmações: a origem confirma o envio e o destino confirma o recebimento.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `transferred_at` | timestamp | | | | Data e hora do envio. |
| `notes` | text | N | | | Observação. |
| `gta_number` | text | N | | | Número da GTA (Guia de Trânsito Animal). |
| `confirmed_at` | timestamp | N | | | Origem confirmou o envio. |
| `received_at` | timestamp | N | | | Destino confirmou o recebimento. |
| `cancelled_at` | timestamp | N | | | Cancelamento. |
| `origin_property_id` | uuid | | | FK → `property` | Propriedade de origem. |
| `destination_property_id` | uuid | | | FK → `property` | Propriedade de destino. |
| `origin_batch_id` | uuid | N | | FK → `batch` | Lote de origem. Nulo = animais sem lote. |
| `destination_batch_id` | uuid | N | | FK → `batch` | Lote de destino, escolhido pelo destino **no recebimento**. |
| `management_session_id` | uuid | N | | FK → `management_session` | Sessão que gerou a transferência. Nulo = transferência isolada. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Estado (derivado):** cancelada → recebida (`received_at`) → enviada (`confirmed_at`) → pendente.
**Índices:** `origin_property_id`, `destination_property_id`, `origin_batch_id`, `destination_batch_id`.

### 9.4 `animal_property_transfer_item` — Animal da transferência entre propriedades

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `notes` | text | N | | | Observação. |
| `transfer_id` | uuid | | | FK → `animal_property_transfer` | Transferência. |
| `animal_id` | uuid | | | FK → `animal` | Animal. |
| `created_at` | timestamp | | now | | Auditoria. |

**Índices:** `animal_id`, `transfer_id`.

---

## 10. Compras

Uma compra tem três dimensões independentes:

- **Negociação:** o que foi combinado (categorias, preços).
- **Financeiro:** fechamento e pagamento.
- **Físico:** a chegada dos animais, em uma ou mais recepções.

Os animais passam a existir na **recepção**: uma sessão de manejo incorporada pela compra por meio de `purchase_reception`. A dependência vai da compra para a sessão; a sessão continua genérica.

```
purchase_event 1──* purchase_category 1──* purchased_animal *──1 animal
      │                                         │ (mesma compra: FKs compostas)
      └── 1──* purchase_reception 1──* ─────────┘
                    │ 1:1
              management_session
```

### 10.1 `purchase_event` — Compra

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `purchase_date` | date | | | | Data da compra (negociação). |
| `gta_number` | text | N | | | Número da GTA. |
| `invoice_number` | text | N | | | Número da nota fiscal. |
| `notes` | text | N | | | Observação. |
| `closed_at` | timestamp | N | | | Negociação fechada: os valores da negociação ficam congelados (a compra e suas categorias não podem mais ser alteradas) e o custo de cada animal (`purchased_animal.cost`) é rateado. Exige os preços da forma escolhida em todas as categorias. Pode acontecer antes, durante ou depois das recepções. |
| `payment_date` | date | N | | | Data do pagamento. Só em compra fechada. |
| `cancelled_at` | timestamp | N | | | Compra cancelada. Só é possível sem animais recebidos e sem pagamento; as recepções ainda vazias são canceladas junto. |
| `seller_id` | uuid | | | FK → `person` | Vendedor. |
| `destination_property_id` | uuid | | | FK → `property` | Propriedade que recebe os animais. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `seller_id`, `destination_property_id`.
**Situação física (derivada):** animais recebidos (`purchased_animal`) comparados com a soma de `expected_quantity` das categorias: nada recebido, parcial ou completa.

### 10.2 `purchase_category` — Categoria da compra

Grupo homogêneo negociado junto (ex.: "30 machos de 12 a 18 meses, por arroba").

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `sex` | `sex` | | | | Sexo dos animais da categoria. |
| `min_age_months` | integer | N | | | Idade mínima, em meses, na data da compra. |
| `max_age_months` | integer | N | | | Idade máxima, em meses. |
| `expected_quantity` | integer | | | | Quantidade de animais negociada. |
| `notes` | text | N | | | Observação. |
| `pricing_type` | `purchase_pricing_type` | | | | Forma de preço (ver seção 3). |
| `unit_price` | numeric(12,2) | N | | | Preço por cabeça (`PER_HEAD`) ou por arroba (`PER_ARROBA`). |
| `total_price` | numeric(12,2) | N | | | Valor fechado da categoria (`LUMP_SUM`). |
| `invoiced_weight` | numeric(12,2) | N | | | Peso de origem/embarque (kg) da categoria, base do pagamento por arroba. |
| `shrink_percent` | numeric(5,2) | N | | | Quebra de peso acordada (%) entre o embarque e a chegada. |
| `breed_id` | uuid | N | | FK → `breed` | Raça, quando a categoria é de uma raça só. |
| `event_id` | uuid | | | FK → `purchase_event` | Compra. |

**Restrições e índices:** `UNIQUE (id, event_id)` (alvo da FK composta de `purchased_animal`); índice `event_id`.
**Regras:** editável enquanto a compra está aberta; uma categoria com animais recebidos não pode ser removida.

### 10.3 `purchase_reception` — Recepção

Chegada física de uma leva de animais de uma compra (uma por viagem/entrega). Incorpora uma sessão de manejo, em que os animais são criados e recebem os primeiros manejos.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | uuid | | uuid | PK | Identificador. |
| `purchase_event_id` | uuid | | | FK → `purchase_event` | Compra. Não pode estar cancelada. |
| `management_session_id` | uuid | | | FK → `management_session`, UK | Sessão usada para receber (1:1). A sessão deve ser da propriedade de destino da compra. |
| `entry_batch_id` | uuid | | | FK → `batch` | **Lote de entrada**: todo animal recebido entra nele (primeiro período de `animal_batch_history`). Ativo e da mesma propriedade. Definido ao abrir a recepção. A apartação da sessão (opcional) pode mandar animais para outros lotes na consolidação. |
| `created_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:** `UNIQUE (id, purchase_event_id)` (alvo da FK composta de `purchased_animal`); índices `purchase_event_id`, `entry_batch_id`.

**Regras da sessão quando ela é uma recepção** (a sessão consulta o módulo de compras):
- **Receber um animal** (sessão em andamento): cria o `animal` já **ativo** (origem `PURCHASE`, sexo e raça da categoria — o sexo pode ser trocado pelo operador, com alerta —, data de nascimento estimada a partir da idade informada, com `birth_date_estimated = true`), os primeiros períodos em `animal_property_history` e `animal_batch_history` (lote de entrada), o `management_participant` e o `purchased_animal`. O animal existe desde o recebimento; os manejos feitos nele seguem a regra de registro efetivo (2.6).
- Não se incluem animais já existentes na recepção: todos os participantes são animais recebidos nela.
- Até a recepção ser consolidada, os animais recebidos **não participam de nenhuma outra operação** (sessão, transferência, troca de lote, registro avulso). Ver 2.9.
- **Tirar um animal da recepção** (antes de consolidar) desfaz o recebimento: os registros da sessão são desfeitos e o animal é **apagado**. Se o animal já tiver outros registros fora da recepção, a remoção é recusada.
- A recepção só pode ser **cancelada** sem animais recebidos.
- Na **consolidação**, nenhum animal recebido sai da sessão (mesmo sem manejos registrados); com a compra fechada, os custos são recalculados.
- Uma recepção pode não ter manejos: nesse caso receber o animal já é o trabalho todo.

### 10.4 `purchased_animal` — Animal comprado

Liga o animal à compra: à categoria em que foi classificado e à recepção em que chegou. É criado no recebimento, junto com o animal.

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | serial | | | PK | Identificador. |
| `cost` | numeric(12,2) | N | | | Custo de aquisição do animal. Nulo enquanto a compra não está fechada. Os **valores da negociação** ficam congelados no fechamento, mas o **rateio** é recalculado a cada recebimento/remoção e a cada recepção consolidada depois disso. Por cabeça: o preço. Por arroba: (peso faturado − quebra) ÷ 30 × preço da arroba — sem peso faturado, usa-se o peso de chegada —, rateado pelo peso de entrada. Valor fechado: o total da categoria rateado pelo peso de entrada. Animais sem pesagem entram com a média dos pesados; sem nenhuma pesagem, o rateio é igual. |
| `purchase_event_id` | uuid | | | FK → `purchase_event` | Compra. Participa das duas FKs compostas abaixo. |
| `category_id` | serial | | | FK → `purchase_category` (composta) | Categoria. FK `(category_id, purchase_event_id)` → `purchase_category (id, event_id)`. |
| `reception_id` | uuid | | | FK → `purchase_reception` (composta) | Recepção em que o animal chegou. FK `(reception_id, purchase_event_id)` → `purchase_reception (id, purchase_event_id)`. |
| `animal_id` | uuid | | | FK → `animal`, UK | Animal. Um animal é comprado no máximo uma vez. |
| `created_at` | timestamp | | now | | Auditoria. |

**Restrições e índices:** as duas **FKs compostas** com `purchase_event_id` garantem, no banco, que categoria e recepção pertencem à mesma compra; índices `purchase_event_id`, `category_id`, `reception_id`.
**Regra:** o peso de entrada do animal é a pesagem feita na sessão da sua recepção.

### 10.5 Área de recepções, compra avulsa e lote de entrada

- **Área de recepções:** a sessão de uma recepção **não** aparece na lista de sessões de manejo; é acessada pela compra. A área de recepções (acessível também a funcionários, sem valores da negociação) lista as compras **a receber** — não canceladas, com menos animais recebidos que o negociado ou com uma recepção em aberto. Ao **abrir uma recepção** escolhem-se o lote de entrada e os manejos; a sessão já é criada iniciada, com a data de hoje (alterável).
- **Compra avulsa:** ao cadastrar um único animal com origem `PURCHASE`, a aplicação cria uma compra já fechada, uma categoria de 1 animal (`LUMP_SUM`, com sexo e raça do animal), uma recepção já consolidada e o `purchased_animal` com o custo informado.
- **Compras de um lote:** a compra não tem lote de destino; as compras de um lote são as que tiveram recepções com ele como lote de entrada (`purchase_reception.entry_batch_id`).

---

## 11. Usuários e autenticação

As tabelas `user`, `session`, `account` e `verification` seguem o esquema da biblioteca **Better Auth** (com o plugin *admin*). Não devem ser alteradas pela aplicação fora da biblioteca. Estão omitidas do diagrama ER.

### 11.1 `user` — Usuário do sistema

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `id` | text | | | PK | Identificador (gerado pela biblioteca). |
| `name` | text | | | | Nome. Até 100 caracteres. |
| `email` | text | | | UK | E-mail de login. Até 255 caracteres. |
| `email_verified` | boolean | | `false` | | E-mail verificado. |
| `image` | text | N | | | URL do avatar. |
| `role` | text | N | | | Papel: `admin`, `manager` (gerente), `technician` (técnico) ou `worker` (funcionário). Define os recursos acessíveis (`packages/shared/src/permissions.ts`); por exemplo, técnicos não acessam lotes nem manejos. |
| `banned` | boolean | N | `false` | | Usuário bloqueado. |
| `ban_reason` | text | N | | | Motivo do bloqueio. |
| `ban_expires` | timestamp | N | | | Fim do bloqueio. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

### 11.2 `session` — Sessão de login

| Coluna | Tipo | Nulo | Chave | Descrição |
|---|---|---|---|---|
| `id` | text | | PK | Identificador. |
| `token` | text | | UK | Token da sessão. |
| `expires_at` | timestamp | | | Expiração. |
| `ip_address` | text | N | | IP de origem. |
| `user_agent` | text | N | | Navegador/cliente. |
| `impersonated_by` | text | N | | Administrador que está personificando o usuário (plugin admin). |
| `user_id` | text | | FK → `user` (CASCADE) | Usuário. |

Não confundir com `management_session` (sessão de manejo).

### 11.3 `account` — Credencial

| Coluna | Tipo | Nulo | Chave | Descrição |
|---|---|---|---|---|
| `id` | text | | PK | Identificador. |
| `account_id` | text | | | Identificador da conta no provedor. |
| `provider_id` | text | | | Provedor (`credential` para e-mail e senha). |
| `access_token`, `refresh_token`, `id_token` | text | N | | Tokens OAuth, quando houver. |
| `access_token_expires_at`, `refresh_token_expires_at` | timestamp | N | | Expiração dos tokens. |
| `scope` | text | N | | Escopos OAuth. |
| `password` | text | N | | Hash da senha (login por e-mail e senha). Nunca em texto puro. |
| `user_id` | text | | FK → `user` (CASCADE) | Usuário. |

### 11.4 `verification` — Verificação

Tokens temporários (verificação de e-mail, redefinição de senha): `id` (PK), `identifier`, `value`, `expires_at`.

### 11.5 `user_settings` — Preferências do usuário

| Coluna | Tipo | Nulo | Padrão | Chave | Descrição e regras |
|---|---|---|---|---|---|
| `user_id` | text | | | PK, FK → `user` (CASCADE) | Usuário (1:1). |
| `current_property_id` | uuid | N | | FK → `property` (CASCADE) | Propriedade em que o usuário está trabalhando. As telas e APIs usam essa propriedade quando nenhuma é informada; se estiver vazia, a aplicação escolhe uma automaticamente. |
| `created_at`, `updated_at` | timestamp | | now | | Auditoria. |

**Índices:** `current_property_id`.

---

## 12. Glossário

| Termo | Significado |
|---|---|
| **Apartação** | Separar os animais em lotes diferentes ao final do manejo, conforme o resultado (peso, avaliação). No sistema, é a última etapa da sessão. |
| **Arroba (@)** | Unidade de peso do gado: 15 kg de carcaça. Para peso vivo usa-se 30 kg por arroba (rendimento de ~50%). |
| **Carência** | Período após um medicamento em que o animal não pode ser abatido ou ter o leite vendido (`withdrawal_end_date`). |
| **CAR / CIB / CCIR** | Cadastros oficiais do imóvel rural: Ambiental Rural, Imobiliário Brasileiro e Certificado do INCRA. |
| **Consolidação** | Efetivar uma sessão de manejo: os registros passam a valer. |
| **Contramarca** | Segunda marca a ferro, aplicada quando o animal muda de dono. |
| **GMD** | Ganho médio diário de peso (kg/dia), calculado a partir das pesagens. |
| **GTA** | Guia de Trânsito Animal, documento obrigatório para transportar animais. |
| **Lotação** | Ocupação de uma área em UA, comparada à capacidade (`hectares` × `stocking_rate`). |
| **Quebra** | Perda de peso dos animais entre o embarque e a chegada, descontada no pagamento por peso. |
| **Recastração** | Nova castração de um animal já castrado, quando o procedimento precisou ser refeito. |
| **Recepção** | Chegada de uma leva de animais comprados, registrada numa sessão de manejo incorporada pela compra (`purchase_reception`). |
| **RFID** | Identificação eletrônica por radiofrequência (brinco ou bolus eletrônico). |
| **UA (Unidade Animal)** | 450 kg de peso vivo. Sem peso registrado, a aplicação estima pela idade: até 12 meses = 0,4; até 24 meses = 0,75; adulto = 1; touro adulto = 1,25; sem idade = 1. |

---

## 13. Estruturas previstas e ainda não usadas

Existem no banco, mas ainda não têm tela ou fluxo na aplicação (ou têm só dados de exemplo). As regras descritas acima são as previstas no modelo.

| Estrutura | Situação |
|---|---|
| `brand_management`, `animal_branding` (marcação a ferro) | Sem tela; a etapa de marcação na sessão de manejo ainda não foi implementada. |
| `animal_property_transfer`, `animal_property_transfer_item` | Sem tela; existem só dados de exemplo no seed. |
| Genealogia (`dam_id`, `sire_id` em `animal`) | Comentadas no schema; não existem no banco. |
