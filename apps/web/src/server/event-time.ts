import { fromLocalDay, toLocalDay, today } from "@ifarm/shared";

// Instante em que um evento informado com data e hora (manejo, transferência) passa a valer.
// Registros antigos, gravados só com o dia (meia-noite), seguem a regra anterior: evento de
// hoje usa o horário atual (fica depois dos eventos anteriores do dia), dia passado fica à
// meia-noite.
export function effectiveAt(date: Date, now: Date) {
  const midnight = toLocalDay(fromLocalDay(date));
  if (date.getTime() !== midnight.getTime()) return date;
  return fromLocalDay(midnight) === today() ? now : date;
}
