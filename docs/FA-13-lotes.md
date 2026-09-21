# FA-13: Módulo de Lotes (RF-LOTE-01 a RF-LOTE-04)

## Visão Geral

Implementação do módulo de gerenciamento de lotes, incluindo listagem, criação, edição e troca de área.

## Requisitos Implementados

### RF-LOTE-01: Listagem de Lotes

- Tabela com colunas: Nome, Área, Animais, Peso Médio, Atualizado em
- Busca por nome (com debounce)
- Filtro por status: Vigente / Encerrado / Todos
- Colunas configuráveis (visibilidade toggleável)
- Ordenação por qualquer coluna (padrão: atualizado em, decrescente)
- Paginação server-side
- Botão "Adicionar" para criar novo lote
- Ação "Editar" em cada linha

### RF-LOTE-02: Criar Lote

- Formulário em Sheet (painel lateral)
- Campos: Nome (obrigatório, max 100), Área (SearchCombobox, obrigatório), Descrição (max 500), Meta (checkbox)
- Campos condicionais (habilitados quando Meta marcada): Data para Venda, Peso Médio para Venda
- Validação: campos obrigatórios quando há meta
- Cria registro em `batch`, `batch_sale_goal` (se houver meta) e `batch_area_history`

### RF-LOTE-03: Atualizar Lote

- Mesmo formulário, mas em modo edição
- Campo Área desabilitado (exibe label com nome da área atual)
- Botão "Trocar Área" ao lado do campo de área
- Listagem de histórico de áreas do lote abaixo do campo
- Campos livres para edição: Nome, Descrição, Meta, Data para Venda, Peso Médio para Venda
- Atualiza `batch`, `batch_sale_goal` (cria/atualiza/remove conforme checkbox) e `batch_area_history` (se houver troca)

### RF-LOTE-04: Trocar Área do Lote

- Diálogo (Dialog) aberto a partir do botão "Trocar Área" no formulário de edição
- Campos: Área de Destino (SearchCombobox, obrigatório, exclui área atual), Descrição (max 500)
- A troca não é efetivada imediatamente — o novo valor fica pendente até o salvar do formulário de edição
- Ao salvar: encerra o `batch_area_history` atual (exitedAt = now) e cria novo registro

## Arquitetura

### API Routes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/batch` | GET | Listagem com paginação, busca e filtro |
| `/api/batch` | POST | Criação de lote |
| `/api/batch/[id]` | GET | Detalhes do lote (inclui histórico de áreas) |
| `/api/batch/[id]` | PUT | Atualização (inclui troca de área) |
| `/api/batch/[id]` | DELETE | Exclusão (com verificação de FK) |

### Frontend (features/batch)

| Arquivo | Descrição |
|---------|-----------|
| `BatchList.tsx` | Listagem principal com DataTable |
| `BatchForm.tsx` | Formulário de criação/edição (Sheet) |
| `BatchAreaChangeDialog.tsx` | Diálogo de troca de área |
| `schema.ts` | Schemas de validação Zod (frontend) |
| `services.ts` | Funções de chamada à API |

### Schemas API (app/api/schemas)

| Schema | Uso |
|--------|-----|
| `batchQuerySchema` | Validação de query params da listagem |
| `batchCreateApiSchema` | Validação do body de criação |
| `batchUpdateApiSchema` | Validação do body de atualização |

## Tabelas do Banco Utilizadas

- `batch` — Entidade principal
- `batch_sale_goal` — Meta de venda (1:1 com batch)
- `batch_area_history` — Histórico de transferência entre áreas
- `area` — Áreas de pastagem (referenciada)

## Alterações em Arquivos Existentes

| Arquivo | Alteração |
|---------|-----------|
| `lib/permissions.ts` | Adicionada chave `lotes` ao `RESOURCE_ACCESS` |
| `lib/field-limits.ts` | Adicionado `batch: { name: 100, notes: 500 }` |
| `app/api/schemas.ts` | Adicionados 3 schemas de batch |
| `app/api/batch/route.ts` | Corrigido bug (`b.id照片` → `b.id`) e import de tipo |
| `app/api/dbErrors.ts` | Adicionadas labels de constraint para batch |
| `features/shell/Sidebar.tsx` | Adicionado link "Lotes" com ícone Boxes |
