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
      "No Business tenant exists. Run Phase 1 bootstrap first."
    );
  }

  let business =
    businesses.find(
      (row) =>
        row.slug === "retailops-demo"
    );

  if (!business) {
    if (businesses.length !== 1) {
      throw new Error(
        "More than one Business exists and no retailops-demo tenant was found. " +
        "Tenant backfill was stopped because RetailOps cannot safely guess ownership."
      );
    }

    business = businesses[0];
  }

  console.log("");
  console.log(
    `Backfilling operational data into: ${business.name} (${business.id})`
  );
  console.log("");

  const results = {
    users:
      await prisma.user.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    categories:
      await prisma.category.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    products:
      await prisma.product.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    inventory:
      await prisma.inventory.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    sales:
      await prisma.sale.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    refunds:
      await prisma.refund.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    shifts:
      await prisma.shift.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    suppliers:
      await prisma.supplier.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    purchaseOrders:
      await prisma.purchaseOrder.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      }),

    inventoryMovements:
      await prisma.inventoryMovement.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: business.id
        }
      })
  };

  for (const [name, result] of Object.entries(results)) {
    console.log(
      `${name.padEnd(22)} ${result.count}`
    );
  }

  const remaining = {
    users:
      await prisma.user.count({
        where: {
          businessId: null
        }
      }),
    categories:
      await prisma.category.count({
        where: {
          businessId: null
        }
      }),
    products:
      await prisma.product.count({
        where: {
          businessId: null
        }
      }),
    inventory:
      await prisma.inventory.count({
        where: {
          businessId: null
        }
      }),
    sales:
      await prisma.sale.count({
        where: {
          businessId: null
        }
      }),
    refunds:
      await prisma.refund.count({
        where: {
          businessId: null
        }
      }),
    shifts:
      await prisma.shift.count({
        where: {
          businessId: null
        }
      }),
    suppliers:
      await prisma.supplier.count({
        where: {
          businessId: null
        }
      }),
    purchaseOrders:
      await prisma.purchaseOrder.count({
        where: {
          businessId: null
        }
      }),
    inventoryMovements:
      await prisma.inventoryMovement.count({
        where: {
          businessId: null
        }
      })
  };

  const nullRows =
    Object.values(remaining).reduce(
      (sum, value) => sum + value,
      0
    );

  console.log("");
  console.log(
    `Remaining unassigned tenant rows: ${nullRows}`
  );

  if (nullRows !== 0) {
    console.table(remaining);

    throw new Error(
      "Tenant backfill is incomplete. Do not run the hardening migration."
    );
  }

  console.log("");
  console.log(
    "Tenant backfill complete. It is safe to run the hardening migration."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
