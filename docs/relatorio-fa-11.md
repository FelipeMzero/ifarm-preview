# Relatório de Implementação - FA-11: Restrições de Tamanho nos Campos de Texto

## Visão Geral

Este documento relata as alterações e inserções realizadas para a tarefa **FA-11**, que teve como objetivo aplicar limites de tamanho em todos os campos de texto livre da aplicação (Frontend e Backend) para garantir segurança, evitar erros e manter a consistência dos dados.

## Arquivos Alterados e Inseridos

### 1. Fonte Única de Verdade (Novo Arquivo)

Foi criado o arquivo de configuração contendo os limites estabelecidos para todas as entidades:

- **`apps/web/src/lib/field-limits.ts`** [NOVO]: Centraliza e exporta a constante `FIELD_LIMITS` com os tamanhos máximos (`maxLength`) agrupados pelas entidades: `person`, `property`, `animal`, `area`, `breed`, `address`, `user`.

### 2. Backend (API Schemas)

Foi adicionada a validação de limite máximo (`.max()`) baseada no `field-limits.ts` para garantir que a API rejeite entradas que excedam os tamanhos.

- **`apps/web/src/app/api/schemas.ts`** [MODIFICADO]:
  - `animalApiSchema`
  - `personApiSchema`
  - `propertyApiSchema`
  - `areaApiSchema`
  - `breedApiSchema`

### 3. Frontend (Form Schemas)

Os esquemas de validação do lado do cliente (Zod + React Hook Form) foram atualizados para validar antes do envio e notificar o usuário adequadamente.

- **`apps/web/src/features/animal/schema.ts`** [MODIFICADO]
- **`apps/web/src/features/person/schema.ts`** [MODIFICADO]
- **`apps/web/src/features/property/schema.ts`** [MODIFICADO]
- **`apps/web/src/features/area/schema.ts`** [MODIFICADO]
- **`apps/web/src/features/user/UserList.tsx`** [MODIFICADO]: Atualizado o `newUserSchema` para aplicar as regras na criação do usuário.

### 4. Interface de Usuário (Componentes de Formulário)

Para melhorar a experiência de usuário, o atributo HTML `maxLength` foi adicionado diretamente aos componentes de input (`<Input>`, `<Textarea>`, e `<IMaskInput>`). Isso fisicamente impede que o usuário digite mais caracteres que o permitido.

- **`apps/web/src/features/animal/AnimalForm.tsx`** [MODIFICADO]
- **`apps/web/src/features/person/PersonForm.tsx`** [MODIFICADO]
- **`apps/web/src/features/property/PropertyForm.tsx`** [MODIFICADO]
- **`apps/web/src/features/area/AreaForm.tsx`** [MODIFICADO]
- **`apps/web/src/features/user/UserList.tsx`** [MODIFICADO]

### 5. Componentes Genéricos

A propriedade `maxLength` foi propagada no componente genérico de listagem e edição em linha, permitindo seu uso no módulo de Raças.

- **`apps/web/src/components/our/InlineEditableList.tsx`** [MODIFICADO]: Adicionado a prop `maxLength` na interface da coluna, repassando para o componente interno de formulário.
- **`apps/web/src/features/breed/BreedList.tsx`** [MODIFICADO]: Configurado o limite de caracteres para o campo "Nome" das raças na tabela.

## Impactos e Considerações

- **Segurança e Estabilidade**: A aplicação agora possui limites fortes no frontend (formulário + Zod) e backend (Zod), prevenindo payloads incorretos ou maliciosos nas requisições.
- **Limitação Conhecida (Better-Auth)**: Para a funcionalidade de Criação de Usuário (lado servidor/API), a biblioteca `better-auth` (`authClient.admin.createUser`) não impõe validação customizada de tamanho para `name` e `email` no nível da rota provida pelo pacote. A barreira de segurança primária permanece no frontend através de validação Zod no cliente e bloqueio nativo via `<Input maxLength={N}>`. Como não havia diretiva para estender rotas customizadas no backend do better-auth neste momento, esse caso foi documentado.
- **Padronização**: A adição da nova estrutura `field-limits.ts` permite que os limites sejam definidos em apenas um local (DRY - _Don't Repeat Yourself_), o que facilita muito manutenções futuras. Alterar um limite de campo agora requer apenas modificação neste arquivo, refletindo para toda a stack (Zod Frontend, Formulário HTML e Zod Backend).
