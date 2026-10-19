# Arquitetura

A arquitetura da plataforma segue o modelo de Arquitetura em Camadas (Layered Architecture), priorizando desacoplamento entre interfaces, escalabilidade, manutenibilidade e centralização das regras de negócio.

O sistema adota uma abordagem baseada em uma API centralizada, responsável por autenticação, autorização, processamento das regras de negócio e acesso aos dados.

A estrutura é dividida em três camadas principais, como mostrado a seguir.

## 1 - Camada de Apresentação (Interfaces com o Usuário):

Responsável pela interação direta com os usuários e dispositivos externos. É composta por aplicações independentes que consomem os serviços disponibilizados pela API central.

- (i) Plataforma Web: Aplicação utilizada para operações administrativas, monitoramento estratégico, visualização de indicadores, relatórios e gerenciamento geral do sistema.

- (ii) Aplicativos Móveis (Android/iOS): Aplicações destinadas às operações em campo, projetadas com suporte à estratégia offline-first, permitindo registros locais e sincronização posterior dos dados com a API quando houver conectividade.

## 2 - Camada de Negócios (API Centralizada e Segurança)

Responsável pela centralização das regras de negócio, autenticação, autorização e processamento das operações do sistema.

A API aplica mecanismos de autenticação e controle de acesso, sendo responsável pelo gerenciamento de sessões e aplicação das regras de controle de acesso baseado em funções (RBAC), garantindo que cada perfil possua acesso apenas aos recursos autorizados.

## 3 - Camada de Persistência e Acesso a dados

Banco de dados relacional robusto encarregado do armazenamento seguro e persistente de todas as entidades do sistema.

O Prisma ORM atua como camada intermediária entre a API e o BD, abstraindo operações SQL através de uma interface tipada e segura, facilitando manutenção, produtividade e integridade das operações.

```mermaid
graph LR

Web["🌐 Web"]
Android["🤖 Android"]
iOS["🍎 iOS"]

API["⚙️ API + Auth"]
Prisma["🛆 Prisma ORM"]
DB["🛢️ PostgreSQL"]

Web --> API
Android --> API
iOS --> API

API --> Prisma
Prisma --> DB
```

## 4 - Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Preenche email e senha
    Frontend->>Backend: POST /login

    Backend->>Database: Buscar usuário por email
    Database-->>Backend: Dados do usuário

    Backend->>Backend: Validar senha

    alt Credenciais inválidas
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Exibir erro de login
    else Credenciais válidas
        Backend->>Database: Criar sessão/token
        Database-->>Backend: Sessão criada

        Backend-->>Frontend: Set-Cookie / JWT
        Frontend-->>User: Login realizado
    end

    User->>Frontend: Acessa rota protegida
    Frontend->>Backend: GET /profile + token

    Backend->>Database: Validar sessão/token
    Database-->>Backend: Sessão válida

    Backend-->>Frontend: Dados protegidos
    Frontend-->>User: Exibir perfil
```

```mermaid
flowchart TB
  subgraph Apresentacao["Apresentação"]
    direction LR
    Pages["app/(protected)/pessoas<br/>páginas"]
    Features["features/person<br/>PersonForm, PersonList, PersonDetails"]
    WebClients["lib/clients.ts<br/>web: fetch do navegador"]
    Mobile["apps/mobile<br/>(futuro)"]
    MobileClients["lib/clients.ts<br/>mobile: URL da API + cookie"]
  end

  subgraph Shared["packages/shared · contrato entre os lados"]
    direction LR
    Schema["person/schema.ts<br/>personSchema"]
    Client["person/client.ts<br/>createPersonClient, PersonRow"]
    ClientBase["client.ts<br/>ApiError, readJson, toQueryString"]
    Utils["date · enums · tax-id · field-limits"]
  end

  subgraph Http["Interface HTTP"]
    Routes["app/api/person/*<br/>sessão → valida → chama server → responde"]
    HttpErr["app/api/http.ts<br/>erro → status HTTP"]
  end

  subgraph Server["Negócio e dados · server-only"]
    Queries["server/person/queries.ts"]
    Mutations["server/person/mutations.ts"]
    Rules["server/person/rules.ts<br/>regras puras"]
    Infra["server/errors · db-errors · address"]
  end

  Prisma["Prisma ORM"]
  DB[("PostgreSQL")]

  Pages --> Features
  Features --> WebClients
  Features --> Schema
  Mobile -.-> MobileClients
  WebClients --> Client
  MobileClients -.-> Client
  Client --> ClientBase
  Client -- "HTTP /api/person" --> Routes
  Routes --> Schema
  Routes --> Queries
  Routes --> Mutations
  Routes --> HttpErr
  Mutations --> Rules
  Mutations --> Infra
  Queries --> Utils
  Mutations --> Utils
  Queries --> Prisma
  Mutations --> Prisma
  Schema --> Utils
  Prisma --> DB
```
