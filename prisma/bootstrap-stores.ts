import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient
} from "../apps/api/src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      active: true
    },
    include: {
      users: true,
      stores: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!businesses.length) {
    throw new Error(
      "No active businesses found. Complete the earlier business phases first."
    );
  }

  console.log("");
  console.log("RetailOps Store bootstrap");
  console.log("=========================");
  console.log("");

  for (const business of businesses) {
    let mainStore = business.stores.find(
      (store) => store.code === "MAIN"
    );

    if (!mainStore) {
      mainStore = await prisma.store.create({
        data: {
          businessId: business.id,
          name: "Main Store",
          code: "MAIN",
          active: true
        }
      });

      console.log(
        `Created Main Store for ${business.name}`
      );
    } else {
      console.log(
        `Main Store already exists for ${business.name}`
      );
    }

    if (business.users.length) {
      await prisma.userStore.createMany({
        data: business.users.map((user) => ({
          userId: user.id,
          storeId: mainStore!.id
        })),
        skipDuplicates: true
      });
    }

    console.log(
      `Assigned ${business.users.length} user(s) to ${business.name} / Main Store`
    );
  }

  console.log("");
  console.log("Store bootstrap complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
