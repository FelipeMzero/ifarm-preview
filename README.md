# iFarm - Next.js Project

Este é um projeto desenvolvido com Next.js, utilizando Prisma ORM para persistência de dados e Docker para orquestração do banco de dados PostgreSQL.

## 🚀 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (recomendado v22+)
* [pnpm](https://pnpm.io/) (gerenciador de pacotes)
* [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

---

## 🛠️ Configuração e Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento local:

### 1. Configurar Variáveis de Ambiente
O projeto utiliza um arquivo `.env` para gerenciar credenciais e configurações de conexão. Copie o modelo de exemplo e preencha com seus dados locais:

```bash
cp .env.example .env
```


### 2. Iniciar o Banco de Dados
Suba o container do PostgreSQL utilizando o Docker:

```bash
docker compose up -d
```

### 3. Instalar Dependências
Instale os pacotes necessários do Node.js utilizando o pnpm:

```bash
pnpm install
```

### 4. Sincronizar o Prisma ORM
Gere o cliente do Prisma e aplique as migrações para estruturar o banco de dados:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```
---

## 💻 Executando o Projeto

Após concluir a configuração, você pode iniciar o servidor de desenvolvimento:

```bash
pnpm dev
```

O projeto estará disponível em: http://localhost:3000

---

## 🔍 Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| pnpm prisma studio | Abre uma interface gráfica para visualizar e editar os dados do banco. |
| docker-compose logs -f | Visualiza os logs do banco de dados em tempo real. |
| docker-compose down | Para e remove os containers do projeto. |

---

## 📂 Estrutura do Banco de Dados
O projeto utiliza o PostgreSQL. O esquema de dados é definido no arquivo prisma/schema.prisma. Sempre que realizar alterações neste arquivo, lembre-se de rodar o comando abaixo para sincronizar o banco.

```bash
pnpm prisma migrate dev 
```
