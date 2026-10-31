# Datas e fusos horários

Como escrever código que lida com datas. A decisão e os motivos estão no [ADR-0009](../adr/adr-0009.md).

Cada propriedade tem o seu fuso (`Property.timeZone`). O banco guarda as datas e horas como
instantes (`timestamptz`, em UTC) e as datas civis como o dia (`@db.Date`).

| Tipo                                                                                                                              | Entrada (cliente → API)                                                                                     | Saída (API → cliente)                                                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Data civil (nascimento, pagamento)                                                                                                | `"AAAA-MM-DD"` (`dateField`); no banco com `toDbDate`                                                       | `fromDbDate` → `"AAAA-MM-DD"`                                               |
| Data e hora de um registro de propriedade (manejos, pesagens, transferências; e o `createdAt`, `confirmedAt`... desses registros) | `"AAAA-MM-DDTHH:mm"` (`dateTimeField`), convertido com `zonedDateTimeToInstant(valor, fuso da propriedade)` | `toZonedIso(instante, fuso)`: ISO com o deslocamento (`"…T08:00:00-04:00"`) |
| Instante de registro sem propriedade (usuários, pessoas, cadastros gerais)                                                        | —                                                                                                           | `toISOString()` (`"…Z"`)                                                    |

- O fuso vem sempre do banco, pela propriedade do registro (`propertyTimeZone`,
  `property/time-zone.public.ts`); nunca do cliente. Eventos do animal usam o fuso da propriedade
  onde ele estava no instante (`animalStays`, `timeZoneAt`).
- Regras que dependem do dia usam o fuso da propriedade: `dayInZone`, `todayInZone`.
- Na tela, mostre com `formatDay` / `formatDateTime` e preencha campos com `toDateTimeInput`
  (todos do shared): o valor com deslocamento aparece como veio; o valor em `Z`, no fuso de quem
  vê. Nunca crie `Date` para mostrar um dia.
- O "agora" e o "hoje" sugeridos nos campos (`nowInZone`, `todayInZone`) usam o fuso da
  propriedade **do registro** (o detalhe traz `property.timeZone`); ao criar um registro, o da
  propriedade atual (`useCurrentProperty`).
