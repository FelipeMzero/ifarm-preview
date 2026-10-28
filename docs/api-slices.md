# Fatias da API

A API (`apps/api`) é organizada em fatias verticais: cada operação tem a própria pasta em
`src/features/<domínio>/<operação>/` e leva consigo o seu pedaço de cada camada técnica.

## Fatias × camadas

Cada coluna é uma fatia (uma operação), agrupada no seu domínio; as linhas são as camadas. O
diagrama mostra **que código pertence a cada operação**, não a ordem das chamadas (ver
[Sequência](#sequência-de-uma-requisição)) nem quem depende de quem (ver
[Dependências](#dependências)). As fatias são exemplos reais; a célula vazia em `rules` é de uma
fatia sem regra.

```mermaid
block-beta
  columns 6

  space
  animal["domínio animal"]:3
  lote["domínio lote"]:2

  block:layers:1
    columns 1
    lh[" "]
    lr["Apresentação"]
    lhd["Aplicação"]
    lru["Domínio"]
    lp["Infraestrutura"]
  end

  block:createAnimal:1
    columns 1
    t1["criar<br/>create-animal"]
    r1["route.ts"]
    h1["handler.ts"]
    space
    p1["Prisma"]
  end

  block:updateAnimal:1
    columns 1
    t2["editar<br/>update-animal"]
    r2["route.ts"]
    h2["handler.ts"]
    n2["rules.ts"]
    p2["Prisma"]
  end

  block:listAnimals:1
    columns 1
    t3["listar<br/>list-animals"]
    r3["route.ts"]
    h3["handler.ts"]
    n3["rules.ts"]
    p3["Prisma"]
  end

  block:batchDetails:1
    columns 1
    t4["ver painel<br/>get-batch-details"]
    r4["route.ts"]
    h4["handler.ts"]
    n4["rules.ts"]
    p4["Prisma"]
  end

  block:closeBatch:1
    columns 1
    t5["encerrar<br/>close-batch"]
    r5["route.ts"]
    h5["handler.ts"]
    space
    p5["Prisma"]
  end

  classDef domain fill:#cfe8ff,stroke:#2f6fb0,color:#123,font-weight:bold,font-size:11px
  classDef title fill:#8fe3a0,stroke:#2f8f4e,color:#123,font-weight:bold
  classDef layer fill:#eeeeee,stroke:#999,color:#222,font-weight:bold
  classDef api fill:#ddd6f3,stroke:#8a80b8,color:#222
  classDef app fill:#fde2c8,stroke:#c9935f,color:#222
  classDef dom fill:#fff27a,stroke:#b8a800,color:#222
  classDef db fill:#a8ecd0,stroke:#3f9d7a,color:#222
  classDef blank fill:none,stroke:none
  classDef slice fill:#f4fff6,stroke:#2f8f4e,stroke-width:2px

  class animal,lote domain
  class lh blank
  class lr,lhd,lru,lp layer
  class t1,t2,t3,t4,t5 title
  class r1,r2,r3,r4,r5 api
  class h1,h2,h3,h4,h5 app
  class n2,n3,n4 dom
  class p1,p2,p3,p4,p5 db
  class createAnimal,updateAnimal,listAnimals,batchDetails,closeBatch slice
```

- **Apresentação** — `route.ts`: sessão e permissão (`requireSession`), validação da entrada com o
  schema do `@ifarm/shared`, resposta JSON e conversão de erros (`errorResponse`).
- **Aplicação** — `handler.ts`: a operação inteira (Transaction Script): lê, decide e grava,
  numa transação quando grava.
- **Domínio** — `rules.ts`: decisões com lógica de verdade, em funções puras e testadas
  (`rules.test.ts`). Fica na fatia quando só ela usa; no domínio, quando mais de uma usa.
- **Infraestrutura** — o Prisma, usado direto pelo handler (sem repositório).

Nem toda fatia ocupa todas as camadas: uma fatia sem regra (como criar animal e encerrar lote)
não tem nada em `rules`.

## Sequência de uma requisição

Com regra, o handler fica no centro: lê os dados, entrega às regras e grava conforme a resposta.
As regras nunca acessam o banco.

```mermaid
sequenceDiagram
  participant R as route.ts
  participant H as handler.ts
  participant D as Prisma
  participant N as rules.ts

  R->>H: chama (sessão e entrada já conferidas)
  H->>D: lê a compra
  D-->>H: compra
  H->>N: paymentBlocker(compra)
  N-->>H: null (pode) ou o motivo
  alt bloqueado
    H-->>R: erro de negócio
  else permitido
    H->>D: grava o pagamento
    D-->>H: ok
    H-->>R: resposta
  end
```

Sem regra, o caminho é só `route.ts → handler.ts → Prisma`.

## Dependências

```mermaid
flowchart TD
  R[route.ts] --> H[handler.ts]
  H --> N["rules.ts<br/>(não depende de nada)"]
  H --> D[Prisma]
```

É o formato em cebola (Onion/Clean) aplicado de forma leve: o domínio não depende da
infraestrutura, e quem orquestra os dois é o handler ("functional core, imperative shell").

## Fronteiras

- **Dentro da pasta de uma fatia**: só daquela fatia.
- **No nível do domínio** (`shared.ts`, `rules.ts`, módulos com nome como `costs.ts`): comum às
  fatias do domínio.
- **`*.public.ts`**: o que outros domínios podem importar.

As regras de lint `ifarm/slice-boundary` e `ifarm/domain-boundary` (`apps/api/eslint.config.mjs`)
garantem essas fronteiras.
