# Tipo novo de etapa de manejo

O que é preciso para criar um tipo de etapa. O modelo das sessões está no [ADR-0011](../adr/adr-0011.md).

1. **Banco** (pela equipe): valor no enum `ManagementStepType` e a tabela contêiner da etapa
   (modelo: `WeighingManagement`).
2. **Shared**: o tipo em `management-session/steps.ts` (`STEP_TYPES`, `STEP_TYPE_LABELS` e,
   se repetível, `REPEATABLE_STEP_TYPES`); o schema de planejamento em `plan-steps.ts`
   (incluído na união `planStepSchema`); o schema de registro em `step-payloads.ts`.
3. **API**: `apps/api/src/features/management-session/steps/<tipo>.ts` com `defineStep`, usando
   os schemas do shared (`planSchema` e `payloadSchema`), registrado em `STEP_MODULES`
   (`steps/index.ts`). O que depende do banco fica no `prepare` / `save`; o `save` grava a data do
   registro com o `at` que recebe (a hora em que foi feito, não a da sessão). Se o registro
   aparece no histórico do animal, crie o filtro em `management-session/effective.public.ts`.
4. **Compromissos**: decida se a etapa é exclusiva entre sessões abertas (`isExclusiveStep`,
   em `shared/animal/commitments.ts`).
5. **UI**: a tela em `features/management-session/steps/<tipo>/` (com o schema de registro do
   shared), o registro em `CLIENT_STEP_MODULES` (`steps/registry.ts`) e o ícone em
   `STEP_ICONS` (`display.tsx`); no planejamento, o campo em `planStepFormSchema` e no
   `toStepPayload` (tipado com o contrato).
