# Relatório de Implementação - Injeção de Ações, Modais e Correção de Contexto de Empilhamento (Z-Index)

## Visão Geral
Este documento relata as alterações realizadas para permitir a criação de novos registros a partir de um campo de busca (`SearchCombobox`), delegando o controle de exibição (renderização da janela modal) ao componente pai da página (`PropertyForm`). Em seguida, detalha a correção de uma anomalia visual (Focus Trap e Stacking Context) que ocultava as listas suspensas (Dropdowns e Comboboxes) quando instanciadas dentro desta nova Janela Modal, normalizando a arquitetura de camadas da interface.

---

## 1. Implementação Estrutural (Modais e Estado)

### 1.1. Modificações em `SearchCombobox.tsx`
A responsabilidade deste componente é estritamente visual (Apresentação). A alteração focou em abrir uma porta (via *props*) para que o componente pai pudesse injetar comportamentos.
- **Inclusão de Imports:** Foram importados os componentes de UI correspondentes (`Button` e o ícone `Plus`) para a renderização da ação.

- **Extensão da Tipagem (Props):** As propriedades do componente foram expandidas com a inclusão de `allowCreate?: boolean` e o callback `onCreateClick?: () => void`.

- **Renderização Condicional no DOM:** A área `ComboboxEmpty` foi modificada para montar o botão no DOM virtual apenas se `allowCreate` for verdadeiro. A prevenção de eventos (`e.stopPropagation()` e `e.preventDefault()`) foi aplicada no botão para não conflitar com o dropdown nativo do combobox.

### 1.2. Modificações em `PropertyForm.tsx`
Sendo o componente inteligente ("Smart Component"), assumiu a responsabilidade por gerenciar a regra de negócio da janela modal, aplicando a Elevação de Estado (State Lifting).
- **Gestão de Estado:** Criação da variável `isPersonModalOpen` para controlar de forma reativa a visibilidade da janela modal.

- **Configuração do Componente:** O atributo `allowCreate={true}` foi passado ao `SearchCombobox` do Titular, juntamente com a injeção da ação `onCreateClick={() => setIsPersonModalOpen(true)}`.

- **Anexação Semântica (Design de DOM):** O `Dialog` contendo o `PersonForm` foi montado em paralelo (fora) do `<form>` principal da Propriedade. Isso evitou o erro crônico do HTML5 de aninhar formulários, que quebra eventos de submissão.

- **Sincronização em Tempo Real:** O callback `onSuccess` do `PersonForm` foi instruído a buscar novamente a lista de titulares ativados e usar `setValue` para auto-selecionar o registro recém-criado, fechando a modal automaticamente.

---

## 2. Resolução da Anomalia de Sobreposição (Z-Index)

### 2.1. Componentes de UI Base (`dialog.tsx`)
Após a criação do modal, foi detectada uma colisão de *React Portals*. A causa raiz foi identificada na sobreposição não padronizada do componente base do Radix UI. Os valores extremos foram rebaixados para a escala padrão do sistema.
- **`apps/web/src/components/ui/dialog.tsx`** [MODIFICADO]:
  - `DialogOverlay`: Elevação rebaixada de `z-[1000]` para o padrão `z-50`.

  - `DialogContent`: Elevação rebaixada de `z-[1000]` para o padrão `z-50`.

### 2.2. Arquivos Analisados (Sem Alteração Final)
Para garantir a integridade da Engenharia de Ferramentas e evitar o mascaramento de sintomas com soluções de força bruta, as tentativas de elevar o z-index das listas individualmente foram descartadas.
- **`apps/web/src/components/ui/combobox.tsx`** [MANTIDO]

- **`apps/web/src/components/ui/select.tsx`** [MANTIDO]

- **`apps/web/src/features/person/PersonForm.tsx`** [MANTIDO]

---

## 3. Impactos e Considerações Finais

- **Responsabilidade Única:** O design isola responsabilidades visuais (`SearchCombobox`) de lógicas (`PropertyForm`), aderindo às melhores práticas de arquitetura front-end.

- **Engenharia de UI e Stacking Context:** O sistema agora aproveita o comportamento nativo de desempate do DOM HTML. Como os modais e os dropdowns operam na mesma camada (`z-50`), a ordem de injeção dos Portals no final do `<body>` garante a sobreposição correta sem hacks de CSS.

- **Prevenção de Dívida Técnica:** A remoção de valores arbitrários (como o z-index `1000`) alinha a interface ao Padrão Profissional de desenvolvimento corporativo.

- **Ponto de Atenção (Componentes de Terceiros):** Ao estabilizar o Modal na camada `50`, componentes de terceiros com elevações agressivas (ex: mapas do Leaflet ou notificações globais do Sonner) podem vazar por cima do overlay. Recomendou-se a futura centralização das variáveis de z-index no `tailwind.config.ts`.
