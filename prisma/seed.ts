import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole
} from "../apps/api/src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL!
});

const prisma =
  new PrismaClient({
    adapter
  });

async function main() {
  const business =
    await prisma.business.upsert({
      where: {
        slug:
          "retailops-demo"
      },
      update: {
        active:
          true
      },
      create: {
        name:
          "RetailOps Demo Business",
        slug:
          "retailops-demo",
        active:
          true
      }
    });

  const mainStore =
    await prisma.store.upsert({
      where: {
        businessId_code: {
          businessId:
            business.id,
          code:
            "MAIN"
        }
      },
      update: {
        active:
          true
      },
      create: {
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

  const ownerPassword =
    await hash(
      "Owner123!",
      12
    );

  const managerPassword =
    await hash(
      "Manager123!",
      12
    );

  const cashierPassword =
    await hash(
      "Cashier123!",
      12
    );

  const users = [
    {
      name:
        "Demo Owner",
      email:
        "owner@retailops.local",
      passwordHash:
        ownerPassword,
      role:
        UserRole.OWNER
    },
    {
      name:
        "Demo Manager",
      email:
        "manager@retailops.local",
      passwordHash:
        managerPassword,
      role:
        UserRole.MANAGER
    },
    {
      name:
        "Demo Cashier",
      email:
        "cashier@retailops.local",
      passwordHash:
        cashierPassword,
      role:
        UserRole.CASHIER
    }
  ];

  for (
    const item of
      users
  ) {
    const user =
      await prisma.user.upsert({
        where: {
          email:
            item.email
        },
        update: {
          name:
            item.name,
          passwordHash:
            item.passwordHash,
          role:
            item.role,
          active:
            true,
          businessId:
            business.id
        },
        create: {
          name:
            item.name,
          email:
            item.email,
          passwordHash:
            item.passwordHash,
          role:
            item.role,
          active:
            true,
          businessId:
            business.id
        }
      });

    await prisma.userStore.upsert({
      where: {
        userId_storeId: {
          userId:
            user.id,
          storeId:
            mainStore.id
        }
      },
      update: {},
      create: {
        userId:
          user.id,
        storeId:
          mainStore.id
      }
    });
  }

  const drinks =
    await prisma.category.upsert({
      where: {
        businessId_name: {
          businessId:
            business.id,
          name:
            "Drinks"
        }
      },
      update: {},
      create: {
        businessId:
          business.id,
        name:
          "Drinks"
      }
    });

  const snacks =
    await prisma.category.upsert({
      where: {
        businessId_name: {
          businessId:
            business.id,
          name:
            "Snacks"
        }
      },
      update: {},
      create: {
        businessId:
          business.id,
        name:
          "Snacks"
      }
    });

  const products = [
    {
      barcode:
        "049000028911",
      sku:
        "DRINK-001",
      name:
        "Coca-Cola 20oz",
      brand:
        "Coca-Cola",
      categoryId:
        drinks.id,
      costPrice:
        1.10,
      sellingPrice:
        2.49,
      minimumStock:
        10,
      stock:
        25
    },
    {
      barcode:
        "012000001741",
      sku:
        "DRINK-002",
      name:
        "Pepsi 20oz",
      brand:
        "Pepsi",
      categoryId:
        drinks.id,
      costPrice:
        1.05,
      sellingPrice:
        2.39,
      minimumStock:
        10,
      stock:
        18
    },
    {
      barcode:
        "611269818306",
      sku:
        "DRINK-003",
      name:
        "Red Bull 12oz",
      brand:
        "Red Bull",
      categoryId:
        drinks.id,
      costPrice:
        2.15,
      sellingPrice:
        3.99,
      minimumStock:
        8,
      stock:
        12
    },
    {
      barcode:
        "028400090896",
      sku:
        "SNACK-001",
      name:
        "Doritos Nacho",
      brand:
        "Doritos",
      categoryId:
        snacks.id,
      costPrice:
        1.35,
      sellingPrice:
        2.79,
      minimumStock:
        8,
      stock:
        20
    }
  ];

  for (
    const item of
      products
  ) {
    const product =
      await prisma.product.upsert({
        where: {
          businessId_barcode: {
            businessId:
              business.id,
            barcode:
              item.barcode
          }
        },
        update: {
          name:
            item.name,
          sellingPrice:
            item.sellingPrice,
          costPrice:
            item.costPrice
        },
        create: {
          businessId:
            business.id,
          barcode:
            item.barcode,
          sku:
            item.sku,
          name:
            item.name,
          brand:
            item.brand,
          categoryId:
            item.categoryId,
          costPrice:
            item.costPrice,
          sellingPrice:
            item.sellingPrice,
          minimumStock:
            item.minimumStock
        }
      });

    await prisma.inventory.upsert({
      where: {
        storeId_productId: {
          storeId:
            mainStore.id,
          productId:
            product.id
        }
      },
      update: {
        businessId:
          business.id
      },
      create: {
        businessId:
          business.id,
        storeId:
          mainStore.id,
        productId:
          product.id,
        quantity:
          item.stock
      }
    });
  }

  console.log(
    "RetailOps store-aware demo seed ready."
  );
  console.log(
    `Business: ${business.name}`
  );
  console.log(
    `Store: ${mainStore.name}`
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
