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
  const businesses =
    await prisma.business.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

  if (!businesses.length) {
    throw new Error(
      "No Business records exist. Complete Phases 1–4 first."
    );
  }

  console.log("");
  console.log("RetailOps Phase 5 Store Backfill");
  console.log("================================");
  console.log("");

  for (const business of businesses) {
    let mainStore =
      await prisma.store.findFirst({
        where: {
          businessId:
            business.id,
          code:
            "MAIN"
        }
      });

    if (!mainStore) {
      mainStore =
        await prisma.store.create({
          data: {
            businessId:
              business.id,
            name:
              "Main Store",
            code:
              "MAIN",
            active:
              true
          }
        });

      console.log(
        `Created missing Main Store for ${business.name}`
      );
    }

    const results = {
      inventory:
        await prisma.inventory.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        }),

      shifts:
        await prisma.shift.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        }),

      sales:
        await prisma.sale.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        }),

      refunds:
        await prisma.refund.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        }),

      purchaseOrders:
        await prisma.purchaseOrder.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        }),

      movements:
        await prisma.inventoryMovement.updateMany({
          where: {
            businessId:
              business.id,
            storeId:
              null
          },
          data: {
            storeId:
              mainStore.id
          }
        })
    };

    console.log(`${business.name} → ${mainStore.name}`);
    for (const [name, result] of Object.entries(results)) {
      console.log(
        `  ${name.padEnd(18)} ${result.count}`
      );
    }
  }

  const remaining = {
    inventory:
      await prisma.inventory.count({
        where: {
          storeId:
            null
        }
      }),
    sales:
      await prisma.sale.count({
        where: {
          storeId:
            null
        }
      }),
    refunds:
      await prisma.refund.count({
        where: {
          storeId:
            null
        }
      }),
    shifts:
      await prisma.shift.count({
        where: {
          storeId:
            null
        }
      }),
    purchaseOrders:
      await prisma.purchaseOrder.count({
        where: {
          storeId:
            null
        }
      }),
    movements:
      await prisma.inventoryMovement.count({
        where: {
          storeId:
            null
        }
      })
  };

  const totalRemaining =
    Object.values(remaining).reduce(
      (sum, value) =>
        sum + value,
      0
    );

  console.log("");
  console.log(
    `Remaining unassigned store rows: ${totalRemaining}`
  );

  if (totalRemaining !== 0) {
    console.table(remaining);

    throw new Error(
      "Store backfill is incomplete. Do not run the Phase 5 hardening migration."
    );
  }

  console.log(
    "Store backfill complete. It is safe to continue."
  );
}

main()
  .then(
    () =>
      prisma.$disconnect()
  )
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
