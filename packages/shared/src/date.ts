import { z } from "zod";

// Três tipos de data:
//
// - Só o dia (colunas @db.Date: birthDate, purchaseDate, paymentDate...): "AAAA-MM-DD";
//   a conversão para o banco (toDbDate/fromDbDate) é do servidor.
// - Data e hora de um evento da propriedade (manejos, transferências, pesagens...): o banco
//   guarda o instante (UTC) e a hora vale no fuso da propriedade (RN-PROPRIEDADE-05). O
//   cliente envia a hora como o usuário digita, "AAAA-MM-DDTHH:mm" (o <input
//   type="datetime-local">), e o servidor a interpreta no fuso da propriedade; nas respostas,
//   o servidor manda ISO com o deslocamento da propriedade ("2026-10-26T08:00:00-04:00"), e o
//   cliente mostra a data e a hora como vêm, sem converter para o fuso do navegador.
// - Instantes gravados pelo sistema (createdAt, confirmedAt...): de um registro da propriedade,
//   também com o deslocamento dela (assim todas as horas de uma tela são da fazenda e
//   comparáveis entre si); dos registros sem propriedade (usuários, pessoas, cadastros gerais e
//   a própria lista de propriedades), ISO em UTC ("...Z"), mostrado no fuso de quem vê.
//
// toLocalDay/fromLocalDay/today tratam um dia no fuso de quem executa (cálculos de tela: idade,
// gráficos). Regras do servidor que dependem do dia usam o fuso da propriedade (dayInZone).

/** Data opcional: "AAAA-MM-DD" ou vazia. */
export const dateField = z
  .union([z.iso.date("Data inválida"), z.literal("")])
  .optional();

/** "AAAA-MM-DD" → Date à meia-noite local (ex.: cálculo de idade, eixo de gráfico). */
export function toLocalDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → o dia dele ("AAAA-MM-DD") no fuso local. */
export function fromLocalDay(value: Date): string {
  // Montado à mão, sem Intl (toLocaleDateString), que varia entre motores (ex.: Hermes no mobile).
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** Hoje como "AAAA-MM-DD", no fuso local. */
export function today(): string {
  return fromLocalDay(new Date());
}

const DATE_TIME_MESSAGE = "Informe data e hora válidas.";

/**
 * Data e hora como o usuário digita ("AAAA-MM-DDTHH:mm"), no fuso da propriedade: o que o
 * cliente envia. Só confere o calendário; o fuso é aplicado pelo servidor.
 */
export const dateTimeField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, DATE_TIME_MESSAGE)
  .refine(
    (v) => z.iso.date().safeParse(v.slice(0, 10)).success,
    DATE_TIME_MESSAGE,
  );

// ---------------------------------------------------------------------------
// Fuso explícito (identificador IANA, ex.: "America/Cuiaba"). Feito com Intl, que trata o
// histórico de cada fuso (inclusive horário de verão), sem depender do fuso de quem executa.
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.DateTimeFormat>();

function zonedParts(instant: Date, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((p) => [p.type, Number(p.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Deslocamento do fuso em relação ao UTC nesse instante, em minutos (ex.: -240). */
function offsetMinutes(instant: Date, timeZone: string) {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  const seconds = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - seconds) / 60000);
}

/** "AAAA-MM-DDTHH:mm" no fuso informado → o instante. */
export function zonedDateTimeToInstant(value: string, timeZone: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const [hour, minute] = value.slice(11, 16).split(":").map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // O deslocamento depende do próprio instante (horário de verão): calcula, confere e ajusta.
  const first = offsetMinutes(new Date(asUtc), timeZone);
  const second = offsetMinutes(new Date(asUtc - first * 60000), timeZone);
  return new Date(asUtc - second * 60000);
}

/**
 * Instante → ISO no fuso informado, com o deslocamento (ex.: "2026-10-26T08:00:00-04:00").
 * Mantém os milissegundos quando há (instantes gravados pelo sistema, como as entradas e saídas
 * de um lote: a ordem entre eles depende disso).
 */
export function instantToZonedIso(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  const offset = offsetMinutes(instant, timeZone);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const ms = instant.getUTCMilliseconds();
  return (
    `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
    (ms ? `.${String(ms).padStart(3, "0")}` : "") +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/** O dia ("AAAA-MM-DD") de um instante no fuso informado. */
export function dayInZone(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Hoje ("AAAA-MM-DD") no fuso informado. */
export function todayInZone(timeZone: string): string {
  return dayInZone(new Date(), timeZone);
}

/** Agora como "AAAA-MM-DDTHH:mm" no fuso informado (valor padrão dos campos de data e hora). */
export function nowInZone(timeZone: string): string {
  return instantToZonedIso(new Date(), timeZone).slice(0, 16);
}

/**
 * Data e hora vindas do servidor → "AAAA-MM-DDTHH:mm" (valor do <input type="datetime-local">).
 * Evento da propriedade (ISO com deslocamento, ou já "AAAA-MM-DDTHH:mm"): como vem, a hora da
 * propriedade. Instante do sistema (ISO em UTC, "...Z"): no fuso de quem vê.
 */
export function toDateTimeInput(value: string): string {
  if (!value.endsWith("Z")) return value.slice(0, 16);
  const instant = new Date(value);
  return `${fromLocalDay(instant)}T${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
}

// Formatação para a tela. Aceitam qualquer data que a API manda (o dia "AAAA-MM-DD", ou data e
// hora: ver toDateTimeInput) e mostram "—" quando não há.

/** → "DD/MM/AAAA" (o dia, sem criar Date). */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = (
    value.length === 10 ? value : toDateTimeInput(value)
  )
    .slice(0, 10)
    .split("-");
  return `${day}/${month}/${year}`;
}

/** → "DD/MM/AAAA às HH:mm" (só o dia, se o valor não tem hora). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length === 10) return formatDay(value);
  const shown = toDateTimeInput(value);
  return `${formatDay(shown.slice(0, 10))} às ${shown.slice(11, 16)}`;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias inteiros (arredondados) entre duas datas; nunca negativo. `to` padrão: agora. */
export function daysBetween(
  from: string,
  to: string | Date = new Date(),
): number {
  const end = typeof to === "string" ? new Date(to) : to;
  return Math.max(
    0,
    Math.round((end.getTime() - new Date(from).getTime()) / DAY_MS),
  );
}
