import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole
} from "../apps/api/src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const business = await prisma.business.upsert({
    where: {
      slug: "retailops-demo"
    },
    update: {
      active: true
    },
    create: {
      name: "RetailOps Demo Business",
      slug: "retailops-demo",
      active: true
    }
  });

  const backfill = await prisma.user.updateMany({
    where: {
      businessId: null
    },
    data: {
      businessId: business.id
    }
  });

  const ownerPassword = await hash(
    "Owner123!",
    12
  );

  const owner = await prisma.user.upsert({
    where: {
      email: "owner@retailops.local"
    },
    update: {
      name: "Demo Owner",
      passwordHash: ownerPassword,
      role: UserRole.OWNER,
      active: true,
      businessId: business.id
    },
    create: {
      name: "Demo Owner",
      email: "owner@retailops.local",
      passwordHash: ownerPassword,
      role: UserRole.OWNER,
      active: true,
      businessId: business.id
    }
  });

  console.log("");
  console.log("RetailOps business foundation ready.");
  console.log(`Business: ${business.name}`);
  console.log(`Business ID: ${business.id}`);
  console.log(`Existing users assigned: ${backfill.count}`);
  console.log("");
  console.log("Owner login:");
  console.log("owner@retailops.local / Owner123!");
  console.log("");
  console.log(`Owner created/updated: ${owner.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
