# Penni Backend API

The backend API for Penni, a calm, finance-first application. It provides endpoints for managing accounts, budgets, categories, planned items, transactions, and users. 

Built with **Fastify**, **TypeScript**, and **Prisma**, prioritizing speed, type safety, and developer experience.

## Tech Stack

- **Framework**: [Fastify](https://fastify.dev/) for high-performance routing.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for static typing.
- **Database ORM**: [Prisma](https://www.prisma.io/) with PostgreSQL (`@prisma/adapter-pg`).
- **Validation**: [Zod](https://zod.dev/) combined with `fastify-type-provider-zod` for end-to-end schema validation.
- **Authentication**: [Clerk](https://clerk.dev/) (`@clerk/backend`) for secure, stateless authenticated requests via JWTs.
- **API Documentation**: Auto-generated OpenAPI/Swagger via `@fastify/swagger` and `@fastify/swagger-ui`.
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration testing.

---

## Getting Started

### 1. Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL running locally or remotely
- Docker & Docker Compose (optional, but convenient for local databases)

### 2. Environment Setup
Copy the example environment variables and fill in your actual connection strings and keys:

```bash
cp .env.example .env
```

Ensure you have your **Clerk Secret Key** and **PostgreSQL Database URL** properly configured in the `.env` file.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Migrations
Synchronize your local database schema using Prisma:
```bash
# Push schema explicitly or run dev migrations
npm run prisma:migrate
npm run prisma:generate
```

### 5. Start the Development Server
```bash
npm run dev
```
The server will start at `http://127.0.0.1:3000` (or `3001` depending on `.env` / `docker-compose.yml`).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the server in watch mode using `nodemon` and `tsx`. |
| `npm run build` | Compiles the TypeScript source code into the `dist` directory. |
| `npm run start` | Runs the compiled application (`dist/index.js`). |
| `npm run test` | Runs the test suite using Vitest. |
| `npm run test:watch` | Runs Vitest in interactive watch mode. |
| `npm run check` | Runs TypeScript type-checking without emitting files. |
| `npm run docker:up` | Starts a PostgreSQL database (and pgAdmin) via `docker-compose.yml`. |
| `npm run docker:down` | Tears down the Docker Compose environment. |

---

## Project Structure

```text
src/
├── config/           # General app and environment configurations
├── controllers/      # Route handlers and request processing
├── errors/           # Custom error definitions and formatters
├── helpers/          # Shared utility functions
├── lib/              # Core setup for Prisma, Clerk, etc.
├── plugins/          # Fastify plugins (e.g., auth decorators, Zod setup)
├── repository/       # Data access layer for abstracting Prisma calls
├── routes/           # API route declarations grouped by domain
├── schemas/          # Zod schemas for request/response validation
├── services/         # Business logic layer
├── types/            # Global type definitions
└── index.ts          # Main Fastify application entry point
```

## API Documentation

The API includes a built-in Swagger UI for exploring current endpoints and schemas.
1. Run the server locally.
2. Visit `http://localhost:3001/docs` (port depends on your setup) in your browser to test endpoints and explore the generated OpenAPI specification.
