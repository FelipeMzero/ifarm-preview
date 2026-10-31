# Decisões de arquitetura (ADRs)

Cada arquivo registra uma decisão de arquitetura, com o contexto e as consequências. Um ADR aceito não é reescrito: se a decisão mudar, um novo ADR o substitui.

Os ADRs de 0001 a 0011 foram registrados depois das decisões, em ordem lógica, e não cronológica. A data real de cada decisão está no próprio arquivo. A partir daqui, a numeração segue a ordem em que as decisões são tomadas.

| ADR                     | Decisão                                                                           | Situação |
| ----------------------- | --------------------------------------------------------------------------------- | -------- |
| [ADR-0001](adr-0001.md) | Monorepo com web, mobile, api, db e shared                                        | Aceito   |
| [ADR-0002](adr-0002.md) | Web como SPA em React e Vite, com TanStack Query                                  | Aceito   |
| [ADR-0003](adr-0003.md) | Fatias verticais na API, com Hono e as regras de negócio                          | Aceito   |
| [ADR-0004](adr-0004.md) | Banco com Prisma em packages/db                                                   | Aceito   |
| [ADR-0005](adr-0005.md) | Código e API em inglês; português nas telas, nas URLs de página e nos comentários | Aceito   |
| [ADR-0006](adr-0006.md) | Autenticação com better-auth                                                      | Aceito   |
| [ADR-0007](adr-0007.md) | Schemas Zod no shared como contrato único                                         | Aceito   |
| [ADR-0008](adr-0008.md) | Separação de schema.ts, types.ts e client.ts no shared                            | Aceito   |
| [ADR-0009](adr-0009.md) | Fuso horário por propriedade                                                      | Aceito   |
| [ADR-0010](adr-0010.md) | Fronteiras entre fatias e domínios garantidas por lint                            | Aceito   |
| [ADR-0011](adr-0011.md) | Sessão de manejo como agrupadora de etapas                                        | Aceito   |
