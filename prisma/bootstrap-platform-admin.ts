
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient
} from "../apps/api/src/generated/prisma/client";

const email =
  process.env.PLATFORM_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

const password =
  process.env.PLATFORM_ADMIN_PASSWORD;

const name =
  process.env.PLATFORM_ADMIN_NAME
    ?.trim() ||
  "RetailOps Platform Admin";

if (!email) {
  throw new Error(
    "PLATFORM_ADMIN_EMAIL is required"
  );
}

if (
  !/^\S+@\S+\.\S+$/.test(
    email
  )
) {
  throw new Error(
    "PLATFORM_ADMIN_EMAIL must be a valid email"
  );
}

if (
  !password ||
  password.length < 12
) {
  throw new Error(
    "PLATFORM_ADMIN_PASSWORD must be at least 12 characters"
  );
}

const adapter =
  new PrismaPg({
    connectionString:
      process.env.DATABASE_URL!
  });

const prisma =
  new PrismaClient({
    adapter
  });

async function main() {
  const passwordHash =
    await hash(
      password!,
      12
    );

  const admin =
    await prisma.platformAdmin.upsert({
      where: {
        email:
          email!
      },
      update: {
        name,
        passwordHash,
        active: true
      },
      create: {
        name,
        email:
          email!,
        passwordHash,
        active: true
      }
    });

  console.log("");
  console.log(
    "RetailOps Platform Admin ready."
  );
  console.log(
    `Name: ${admin.name}`
  );
  console.log(
    `Email: ${admin.email}`
  );
  console.log("");
  console.log(
    "The password is stored only as a bcrypt hash."
  );
}

main()
  .then(
    () =>
      prisma.$disconnect()
  )
  .catch(
    async (
      error
    ) => {
      console.error(
        error
      );

      await prisma.$disconnect();

      process.exit(
        1
      );
    }
  );
