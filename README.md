# RetailOps Starter

RetailOps is a learning project for a real-world convenience-store POS, inventory, sales, and operations system.

## Included in this starter

- Next.js web app with manager and employee/cashier areas
- POS prototype with barcode input, cart, payment selection, receipt preview, and browser printing
- NestJS GraphQL API skeleton
- PostgreSQL + Prisma 7 data model
- Inventory movement history model (sale, void, refund, adjustments, etc.)
- Transaction-safe `completeSale` service that decreases inventory only after checkout
- Seed data for Coke, Pepsi, Red Bull, and Doritos
- Docker Compose PostgreSQL setup
- Apollo Client and Redux Toolkit provider setup in the web app

> Authentication and real role-based authorization are intentionally not implemented yet. The login page is a portal selector for the starter phase. Do not treat it as production security.

## Requirements

- Node.js 22+ recommended
- npm
- Docker Desktop (easiest PostgreSQL setup) OR your own PostgreSQL installation

## 1. Create your environment file

From the project root:

```bash
cp .env.example .env
```

Also create the web environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## 2. Start PostgreSQL

```bash
docker compose up -d
```

## 3. Install packages

```bash
npm install
```

## 4. Generate Prisma Client

```bash
npm run db:generate
```

## 5. Create database tables

```bash
npm run db:migrate -- --name init
```

## 6. Seed sample products

```bash
npm run db:seed
```

## 7. Start web + API

```bash
npm run dev
```

Open:

- Web: http://localhost:3000
- GraphQL: http://localhost:4000/graphql

## Sample barcodes

Use these in the POS input (you can type them or use a USB scanner):

| Product | Barcode |
|---|---|
| Coca-Cola 20oz | `049000028911` |
| Pepsi 20oz | `012000001741` |
| Red Bull 12oz | `611269818306` |
| Doritos Nacho | `028400090896` |

The starter POS UI runs against local sample data so you can learn the scan/cart/receipt interaction immediately. The NestJS API includes the real database-backed product lookup and sale-completion logic. The next development step is connecting the POS component to those GraphQL operations.

## Core business rule already represented

Scanning does **not** change inventory.

```text
scan -> cart -> payment -> complete sale -> database transaction -> inventory decreases -> movement recorded
```

If a cashier cancels an open cart, inventory remains unchanged.

## Important production rules for later

1. Add real authentication (hashed passwords + sessions/JWT).
2. Enforce RBAC on the API, not only by hiding frontend buttons.
3. Implement completed-sale void as a reversal movement instead of deleting history.
4. Implement refunds with dedicated refund/refund-item records.
5. Use decimal-safe tax/price calculations and configurable tax rules.
6. Add row-level/optimistic concurrency strategy before using multiple registers in one store.
7. Receipt printing failure must never roll back a completed sale.

## Repo structure

```text
RetailOps/
├── apps/
│   ├── web/        Next.js manager + cashier UI
│   └── api/        NestJS GraphQL API
├── prisma/         schema + seed
├── docker-compose.yml
├── prisma.config.ts
└── .env.example
```

## First milestone

Get this workflow working end-to-end:

**Cashier scans barcode -> product is found -> add to cart -> complete sale -> inventory decreases -> manager can see sale and inventory movement.**
