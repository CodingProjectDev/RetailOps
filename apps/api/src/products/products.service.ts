import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  InventoryMovementType
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { AdjustInventoryInput } from "./dto/adjust-inventory.input";
import { CreateProductInput } from "./dto/create-product.input";
import { UpdateProductInput } from "./dto/update-product.input";
import {
  CategoryModel,
  InventoryMovementModel,
  ProductModel
} from "./product.model";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  private toProduct(
    product: any
  ): ProductModel {
    const inventory =
      product.inventories?.[0];

    return {
      id:
        product.id,
      barcode:
        product.barcode,
      sku:
        product.sku,
      name:
        product.name,
      brand:
        product.brand,
      categoryId:
        product.categoryId,
      categoryName:
        product.category.name,
      costPrice:
        Number(
          product.costPrice
        ),
      sellingPrice:
        Number(
          product.sellingPrice
        ),
      minimumStock:
        product.minimumStock,
      taxable:
        product.taxable,
      active:
        product.active,
      stock:
        inventory?.quantity ??
        0
    };
  }

  private productInclude(
    storeId: string
  ) {
    return {
      category: true,
      inventories: {
        where: {
          storeId
        },
        take: 1
      }
    };
  }

  private async findProductRecord(
    id: string,
    businessId: string,
    storeId: string
  ) {
    return this.prisma.product.findFirst({
      where: {
        id,
        businessId
      },
      include:
        this.productInclude(
          storeId
        )
    });
  }

  async byBarcode(
    barcode: string,
    businessId: string,
    storeId: string
  ): Promise<ProductModel | null> {
    const product =
      await this.prisma.product.findFirst({
        where: {
          businessId,
          barcode,
          active: true
        },
        include:
          this.productInclude(
            storeId
          )
      });

    return product
      ? this.toProduct(product)
      : null;
  }

  async inventory(
    businessId: string,
    storeId: string,
    search?: string
  ): Promise<ProductModel[]> {
    const clean =
      search?.trim();

    const products =
      await this.prisma.product.findMany({
        where: {
          businessId,
          active: true,
          ...(clean
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    barcode: {
                      contains:
                        clean
                    }
                  },
                  {
                    sku: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  }
                ]
              }
            : {})
        },
        include:
          this.productInclude(
            storeId
          ),
        orderBy: {
          name: "asc"
        },
        take: 250
      });

    return products.map(
      (product) =>
        this.toProduct(
          product
        )
    );
  }

  async managerProducts(
    businessId: string,
    storeId: string,
    search?: string,
    categoryId?: string,
    active?: boolean
  ): Promise<ProductModel[]> {
    const clean =
      search?.trim();

    const products =
      await this.prisma.product.findMany({
        where: {
          businessId,
          ...(typeof active ===
          "boolean"
            ? {
                active
              }
            : {}),
          ...(categoryId
            ? {
                categoryId
              }
            : {}),
          ...(clean
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    brand: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    barcode: {
                      contains:
                        clean
                    }
                  },
                  {
                    sku: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  }
                ]
              }
            : {})
        },
        include:
          this.productInclude(
            storeId
          ),
        orderBy: {
          name: "asc"
        },
        take: 250
      });

    return products.map(
      (product) =>
        this.toProduct(
          product
        )
    );
  }

  async categories(
    businessId: string
  ): Promise<CategoryModel[]> {
    return this.prisma.category.findMany({
      where: {
        businessId
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  private validateMoney(
    value: number,
    label: string
  ) {
    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      throw new BadRequestException(
        `${label} must be zero or greater`
      );
    }
  }

  private async assertUnique(
    businessId: string,
    barcode: string,
    sku: string,
    excludeId?: string
  ) {
    const duplicate =
      await this.prisma.product.findFirst({
        where: {
          businessId,
          OR: [
            {
              barcode
            },
            {
              sku
            }
          ],
          ...(excludeId
            ? {
                NOT: {
                  id:
                    excludeId
                }
              }
            : {})
        },
        select: {
          id: true,
          barcode: true,
          sku: true
        }
      });

    if (!duplicate) {
      return;
    }

    if (
      duplicate.barcode ===
      barcode
    ) {
      throw new BadRequestException(
        "That barcode is already assigned to another product in this business"
      );
    }

    throw new BadRequestException(
      "That SKU is already assigned to another product in this business"
    );
  }

  async create(
    input: CreateProductInput,
    createdById: string,
    businessId: string,
    storeId: string
  ): Promise<ProductModel> {
    const name =
      input.name.trim();

    const barcode =
      input.barcode.trim();

    const sku =
      input.sku
        .trim()
        .toUpperCase();

    const brand =
      input.brand?.trim() ||
      null;

    if (
      !name ||
      !barcode ||
      !sku
    ) {
      throw new BadRequestException(
        "Name, barcode and SKU are required"
      );
    }

    this.validateMoney(
      input.costPrice,
      "Cost price"
    );

    this.validateMoney(
      input.sellingPrice,
      "Selling price"
    );

    if (
      !Number.isInteger(
        input.minimumStock
      ) ||
      input.minimumStock < 0
    ) {
      throw new BadRequestException(
        "Minimum stock must be zero or greater"
      );
    }

    if (
      !Number.isInteger(
        input.startingQuantity
      ) ||
      input.startingQuantity < 0
    ) {
      throw new BadRequestException(
        "Starting quantity must be zero or greater"
      );
    }

    const category =
      await this.prisma.category.findFirst({
        where: {
          id:
            input.categoryId,
          businessId
        }
      });

    if (!category) {
      throw new BadRequestException(
        "Selected category does not exist in this business"
      );
    }

    await this.assertUnique(
      businessId,
      barcode,
      sku
    );

    const productId =
      await this.prisma.$transaction(
        async (tx) => {
          const product =
            await tx.product.create({
              data: {
                businessId,
                name,
                barcode,
                sku,
                brand,
                categoryId:
                  input.categoryId,
                costPrice:
                  input.costPrice,
                sellingPrice:
                  input.sellingPrice,
                minimumStock:
                  input.minimumStock,
                taxable:
                  input.taxable,
                active:
                  input.active,
                inventories: {
                  create: {
                    businessId,
                    storeId,
                    quantity:
                      input.startingQuantity
                  }
                }
              }
            });

          if (
            input.startingQuantity >
            0
          ) {
            await tx.inventoryMovement.create({
              data: {
                businessId,
                storeId,
                productId:
                  product.id,
                type:
                  InventoryMovementType.MANUAL_ADJUSTMENT,
                quantityChange:
                  input.startingQuantity,
                previousQuantity:
                  0,
                newQuantity:
                  input.startingQuantity,
                reason:
                  "Initial stock",
                createdById
              }
            });
          }

          return product.id;
        }
      );

    const product =
      await this.findProductRecord(
        productId,
        businessId,
        storeId
      );

    if (!product) {
      throw new NotFoundException(
        "Product was created but could not be loaded"
      );
    }

    return this.toProduct(
      product
    );
  }

  async update(
    input: UpdateProductInput,
    businessId: string,
    storeId: string
  ): Promise<ProductModel> {
    const current =
      await this.findProductRecord(
        input.id,
        businessId,
        storeId
      );

    if (!current) {
      throw new NotFoundException(
        "Product not found"
      );
    }

    const barcode =
      input.barcode?.trim() ??
      current.barcode;

    const sku =
      input.sku
        ?.trim()
        .toUpperCase() ??
      current.sku;

    const name =
      input.name?.trim() ??
      current.name;

    if (
      !barcode ||
      !sku ||
      !name
    ) {
      throw new BadRequestException(
        "Name, barcode and SKU cannot be empty"
      );
    }

    if (
      input.costPrice !==
      undefined
    ) {
      this.validateMoney(
        input.costPrice,
        "Cost price"
      );
    }

    if (
      input.sellingPrice !==
      undefined
    ) {
      this.validateMoney(
        input.sellingPrice,
        "Selling price"
      );
    }

    if (
      input.minimumStock !==
        undefined &&
      (!Number.isInteger(
        input.minimumStock
      ) ||
        input.minimumStock <
          0)
    ) {
      throw new BadRequestException(
        "Minimum stock must be zero or greater"
      );
    }

    if (
      input.categoryId
    ) {
      const category =
        await this.prisma.category.findFirst({
          where: {
            id:
              input.categoryId,
            businessId
          }
        });

      if (!category) {
        throw new BadRequestException(
          "Selected category does not exist in this business"
        );
      }
    }

    await this.assertUnique(
      businessId,
      barcode,
      sku,
      input.id
    );

    await this.prisma.product.update({
      where: {
        id:
          current.id
      },
      data: {
        ...(input.name !==
        undefined
          ? {
              name
            }
          : {}),
        ...(input.barcode !==
        undefined
          ? {
              barcode
            }
          : {}),
        ...(input.sku !==
        undefined
          ? {
              sku
            }
          : {}),
        ...(input.brand !==
        undefined
          ? {
              brand:
                input.brand
                  .trim() ||
                null
            }
          : {}),
        ...(input.categoryId !==
        undefined
          ? {
              categoryId:
                input.categoryId
            }
          : {}),
        ...(input.costPrice !==
        undefined
          ? {
              costPrice:
                input.costPrice
            }
          : {}),
        ...(input.sellingPrice !==
        undefined
          ? {
              sellingPrice:
                input.sellingPrice
            }
          : {}),
        ...(input.minimumStock !==
        undefined
          ? {
              minimumStock:
                input.minimumStock
            }
          : {}),
        ...(input.taxable !==
        undefined
          ? {
              taxable:
                input.taxable
            }
          : {}),
        ...(input.active !==
        undefined
          ? {
              active:
                input.active
            }
          : {})
      }
    });

    const product =
      await this.findProductRecord(
        input.id,
        businessId,
        storeId
      );

    if (!product) {
      throw new NotFoundException(
        "Product not found"
      );
    }

    return this.toProduct(
      product
    );
  }

  async adjustInventory(
    input: AdjustInventoryInput,
    createdById: string,
    businessId: string,
    storeId: string
  ): Promise<InventoryMovementModel> {
    const reason =
      input.reason.trim();

    if (!reason) {
      throw new BadRequestException(
        "Adjustment reason is required"
      );
    }

    if (
      !Number.isInteger(
        input.quantityChange
      ) ||
      input.quantityChange ===
        0
    ) {
      throw new BadRequestException(
        "Quantity change must be a non-zero whole number"
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.findFirst({
            where: {
              id:
                input.productId,
              businessId
            },
            select: {
              id: true
            }
          });

        if (!product) {
          throw new NotFoundException(
            "Product not found"
          );
        }

        const inventory =
          await tx.inventory.findUnique({
            where: {
              storeId_productId: {
                storeId,
                productId:
                  product.id
              }
            }
          });

        const previousQuantity =
          inventory?.quantity ??
          0;

        const newQuantity =
          previousQuantity +
          input.quantityChange;

        if (
          newQuantity < 0
        ) {
          throw new BadRequestException(
            "Inventory cannot go below zero"
          );
        }

        await tx.inventory.upsert({
          where: {
            storeId_productId: {
              storeId,
              productId:
                product.id
            }
          },
          create: {
            businessId,
            storeId,
            productId:
              product.id,
            quantity:
              newQuantity
          },
          update: {
            quantity:
              newQuantity
          }
        });

        const movement =
          await tx.inventoryMovement.create({
            data: {
              businessId,
              storeId,
              productId:
                product.id,
              type:
                InventoryMovementType.MANUAL_ADJUSTMENT,
              quantityChange:
                input.quantityChange,
              previousQuantity,
              newQuantity,
              reason,
              createdById
            },
            include: {
              createdBy: true
            }
          });

        return {
          id:
            movement.id,
          productId:
            movement.productId,
          type:
            movement.type,
          quantityChange:
            movement.quantityChange,
          previousQuantity:
            movement.previousQuantity,
          newQuantity:
            movement.newQuantity,
          reason:
            movement.reason,
          createdByName:
            movement.createdBy
              .name,
          createdAt:
            movement.createdAt
        };
      }
    );
  }

  async inventoryMovements(
    productId: string,
    businessId: string,
    storeId: string
  ): Promise<
    InventoryMovementModel[]
  > {
    const product =
      await this.prisma.product.findFirst({
        where: {
          id:
            productId,
          businessId
        },
        select: {
          id: true
        }
      });

    if (!product) {
      throw new NotFoundException(
        "Product not found"
      );
    }

    const movements =
      await this.prisma.inventoryMovement.findMany({
        where: {
          businessId,
          storeId,
          productId
        },
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 30
      });

    return movements.map(
      (movement) => ({
        id:
          movement.id,
        productId:
          movement.productId,
        type:
          movement.type,
        quantityChange:
          movement.quantityChange,
        previousQuantity:
          movement.previousQuantity,
        newQuantity:
          movement.newQuantity,
        reason:
          movement.reason,
        createdByName:
          movement.createdBy
            .name,
        createdAt:
          movement.createdAt
      })
    );
  }
}
