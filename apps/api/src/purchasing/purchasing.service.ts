import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  InventoryMovementType,
  PurchaseOrderStatus
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { StoresService } from "../stores/stores.service";
import { TenantUser } from "../auth/tenant-user.type";
import { CancelPurchaseOrderInput } from "./dto/cancel-purchase-order.input";
import { CreatePurchaseOrderInput } from "./dto/create-purchase-order.input";
import { CreateSupplierInput } from "./dto/create-supplier.input";
import { ReceivePurchaseOrderInput } from "./dto/receive-purchase-order.input";
import { UpdateSupplierInput } from "./dto/update-supplier.input";
import {
  PurchaseOrderModel,
  SupplierModel
} from "./purchasing.model";

@Injectable()
export class PurchasingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService
  ) {}

  private money(
    value: number
  ) {
    return Number(
      value.toFixed(2)
    );
  }

  private supplierModel(
    supplier: any
  ): SupplierModel {
    return {
      id:
        supplier.id,
      name:
        supplier.name,
      contactName:
        supplier.contactName,
      phone:
        supplier.phone,
      email:
        supplier.email,
      address:
        supplier.address,
      active:
        supplier.active,
      createdAt:
        supplier.createdAt
    };
  }

  private purchaseOrderModel(
    po: any
  ): PurchaseOrderModel {
    return {
      id:
        po.id,
      poNumber:
        po.poNumber,
      supplierId:
        po.supplierId,
      supplierName:
        po.supplier.name,
      status:
        po.status,
      totalCost:
        Number(
          po.totalCost
        ),
      notes:
        po.notes,
      createdByName:
        po.createdBy.name,
      createdAt:
        po.createdAt,
      orderedAt:
        po.orderedAt,
      receivedAt:
        po.receivedAt,
      cancelledAt:
        po.cancelledAt,
      cancelReason:
        po.cancelReason,
      items:
        po.items.map(
          (item: any) => ({
            id:
              item.id,
            productId:
              item.productId,
            productName:
              item.product.name,
            sku:
              item.product.sku,
            barcode:
              item.product.barcode,
            quantityOrdered:
              item.quantityOrdered,
            quantityReceived:
              item.quantityReceived,
            remainingQuantity:
              Math.max(
                0,
                item.quantityOrdered -
                  item.quantityReceived
              ),
            unitCost:
              Number(
                item.unitCost
              ),
            lineTotal:
              Number(
                item.lineTotal
              )
          })
        )
    };
  }

  private includePurchaseOrder() {
    return {
      supplier: true,
      createdBy: true,
      orderedBy: true,
      cancelledBy: true,
      items: {
        include: {
          product: true
        },
        orderBy: {
          createdAt:
            "asc" as const
        }
      }
    };
  }

  async suppliers(
    businessId: string,
    search?: string,
    active?: boolean
  ): Promise<
    SupplierModel[]
  > {
    const clean =
      search?.trim();

    const rows =
      await this.prisma.supplier.findMany({
        where: {
          businessId,
          ...(typeof active ===
          "boolean"
            ? {
                active
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
                    contactName: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    phone: {
                      contains:
                        clean
                    }
                  },
                  {
                    email: {
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
        orderBy: {
          name: "asc"
        },
        take: 250
      });

    return rows.map(
      (row) =>
        this.supplierModel(
          row
        )
    );
  }

  async createSupplier(
    input: CreateSupplierInput,
    businessId: string
  ): Promise<SupplierModel> {
    const name =
      input.name.trim();

    if (!name) {
      throw new BadRequestException(
        "Supplier name is required"
      );
    }

    const duplicate =
      await this.prisma.supplier.findFirst({
        where: {
          businessId,
          name: {
            equals:
              name,
            mode:
              "insensitive"
          }
        }
      });

    if (duplicate) {
      throw new BadRequestException(
        "A supplier with this name already exists in this business"
      );
    }

    const supplier =
      await this.prisma.supplier.create({
        data: {
          businessId,
          name,
          contactName:
            input.contactName
              ?.trim() ||
            null,
          phone:
            input.phone
              ?.trim() ||
            null,
          email:
            input.email
              ?.trim() ||
            null,
          address:
            input.address
              ?.trim() ||
            null
        }
      });

    return this.supplierModel(
      supplier
    );
  }

  async updateSupplier(
    input: UpdateSupplierInput,
    businessId: string
  ): Promise<SupplierModel> {
    const current =
      await this.prisma.supplier.findFirst({
        where: {
          id:
            input.id,
          businessId
        }
      });

    if (!current) {
      throw new NotFoundException(
        "Supplier not found"
      );
    }

    const name =
      input.name !==
      undefined
        ? input.name.trim()
        : current.name;

    if (!name) {
      throw new BadRequestException(
        "Supplier name cannot be empty"
      );
    }

    if (
      name.toLowerCase() !==
      current.name.toLowerCase()
    ) {
      const duplicate =
        await this.prisma.supplier.findFirst({
          where: {
            businessId,
            name: {
              equals:
                name,
              mode:
                "insensitive"
            },
            NOT: {
              id:
                current.id
            }
          }
        });

      if (duplicate) {
        throw new BadRequestException(
          "A supplier with this name already exists in this business"
        );
      }
    }

    const supplier =
      await this.prisma.supplier.update({
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
          ...(input.contactName !==
          undefined
            ? {
                contactName:
                  input.contactName
                    .trim() ||
                  null
              }
            : {}),
          ...(input.phone !==
          undefined
            ? {
                phone:
                  input.phone
                    .trim() ||
                  null
              }
            : {}),
          ...(input.email !==
          undefined
            ? {
                email:
                  input.email
                    .trim() ||
                  null
              }
            : {}),
          ...(input.address !==
          undefined
            ? {
                address:
                  input.address
                    .trim() ||
                  null
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

    return this.supplierModel(
      supplier
    );
  }

  async purchaseOrders(
    user: TenantUser,
    storeId: string,
    search?: string,
    status?: PurchaseOrderStatus
  ): Promise<
    PurchaseOrderModel[]
  > {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    const clean =
      search?.trim();

    const rows =
      await this.prisma.purchaseOrder.findMany({
        where: {
          businessId:
            user.businessId,
          storeId,
          ...(status
            ? {
                status
              }
            : {}),
          ...(clean
            ? {
                OR: [
                  {
                    poNumber: {
                      contains:
                        clean,
                      mode:
                        "insensitive"
                    }
                  },
                  {
                    supplier: {
                      name: {
                        contains:
                          clean,
                        mode:
                          "insensitive"
                      }
                    }
                  }
                ]
              }
            : {})
        },
        include:
          this.includePurchaseOrder(),
        orderBy: {
          createdAt:
            "desc"
        },
        take: 250
      });

    return rows.map(
      (row) =>
        this.purchaseOrderModel(
          row
        )
    );
  }

  async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
    user: TenantUser,
    storeId: string
  ): Promise<PurchaseOrderModel> {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    if (
      !input.items?.length
    ) {
      throw new BadRequestException(
        "Add at least one product to the purchase order"
      );
    }

    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id:
            input.supplierId,
          businessId:
            user.businessId,
          active:
            true
        }
      });

    if (!supplier) {
      throw new BadRequestException(
        "Select an active supplier from this business"
      );
    }

    const seen =
      new Set<string>();

    for (
      const item of
        input.items
    ) {
      if (
        seen.has(
          item.productId
        )
      ) {
        throw new BadRequestException(
          "A product can appear only once on a purchase order"
        );
      }

      seen.add(
        item.productId
      );

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <=
          0
      ) {
        throw new BadRequestException(
          "Order quantities must be positive whole numbers"
        );
      }

      if (
        !Number.isFinite(
          item.unitCost
        ) ||
        item.unitCost <
          0
      ) {
        throw new BadRequestException(
          "Unit cost must be zero or greater"
        );
      }
    }

    const products =
      await this.prisma.product.findMany({
        where: {
          businessId:
            user.businessId,
          id: {
            in:
              input.items.map(
                (item) =>
                  item.productId
              )
          },
          active:
            true
        },
        select: {
          id: true
        }
      });

    if (
      products.length !==
      input.items.length
    ) {
      throw new BadRequestException(
        "One or more selected products are missing or inactive"
      );
    }

    const totalCost =
      this.money(
        input.items.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.quantity *
              item.unitCost,
          0
        )
      );

    const created =
      await this.prisma.purchaseOrder.create({
        data: {
          businessId:
            user.businessId,
          storeId,
          poNumber:
            `PO-${Date.now()}`,
          supplierId:
            supplier.id,
          status:
            PurchaseOrderStatus.DRAFT,
          totalCost,
          notes:
            input.notes
              ?.trim() ||
            null,
          createdById:
            user.id,
          items: {
            create:
              input.items.map(
                (item) => ({
                  productId:
                    item.productId,
                  quantityOrdered:
                    item.quantity,
                  quantityReceived:
                    0,
                  unitCost:
                    this.money(
                      item.unitCost
                    ),
                  lineTotal:
                    this.money(
                      item.quantity *
                        item.unitCost
                    )
                })
              )
          }
        },
        include:
          this.includePurchaseOrder()
      });

    return this.purchaseOrderModel(
      created
    );
  }

  private async loadPoForUser(
    purchaseOrderId: string,
    user: TenantUser
  ) {
    const po =
      await this.prisma.purchaseOrder.findFirst({
        where: {
          id:
            purchaseOrderId,
          businessId:
            user.businessId
        },
        select: {
          id: true,
          storeId: true
        }
      });

    if (!po) {
      throw new NotFoundException(
        "Purchase order not found"
      );
    }

    await this.stores.assertStoreAccess(
      user,
      po.storeId
    );

    return po;
  }

  async placePurchaseOrder(
    purchaseOrderId: string,
    user: TenantUser
  ): Promise<PurchaseOrderModel> {
    const access =
      await this.loadPoForUser(
        purchaseOrderId,
        user
      );

    const current =
      await this.prisma.purchaseOrder.findFirst({
        where: {
          id:
            purchaseOrderId,
          businessId:
            user.businessId,
          storeId:
            access.storeId
        }
      });

    if (!current) {
      throw new NotFoundException(
        "Purchase order not found"
      );
    }

    if (
      current.status !==
      PurchaseOrderStatus.DRAFT
    ) {
      throw new BadRequestException(
        "Only draft purchase orders can be placed"
      );
    }

    const updated =
      await this.prisma.purchaseOrder.update({
        where: {
          id:
            current.id
        },
        data: {
          status:
            PurchaseOrderStatus.ORDERED,
          orderedAt:
            new Date(),
          orderedById:
            user.id
        },
        include:
          this.includePurchaseOrder()
      });

    return this.purchaseOrderModel(
      updated
    );
  }

  async cancelPurchaseOrder(
    input: CancelPurchaseOrderInput,
    user: TenantUser
  ): Promise<PurchaseOrderModel> {
    const access =
      await this.loadPoForUser(
        input.purchaseOrderId,
        user
      );

    const reason =
      input.reason.trim();

    if (
      reason.length < 3
    ) {
      throw new BadRequestException(
        "Cancellation reason must be at least 3 characters"
      );
    }

    const current =
      await this.prisma.purchaseOrder.findFirst({
        where: {
          id:
            input.purchaseOrderId,
          businessId:
            user.businessId,
          storeId:
            access.storeId
        },
        include: {
          items: true
        }
      });

    if (!current) {
      throw new NotFoundException(
        "Purchase order not found"
      );
    }

    if (
      current.status !==
        PurchaseOrderStatus.DRAFT &&
      current.status !==
        PurchaseOrderStatus.ORDERED
    ) {
      throw new BadRequestException(
        `Purchase order cannot be cancelled from ${current.status}`
      );
    }

    if (
      current.items.some(
        (item) =>
          item.quantityReceived >
          0
      )
    ) {
      throw new BadRequestException(
        "A purchase order with received inventory cannot be cancelled"
      );
    }

    const updated =
      await this.prisma.purchaseOrder.update({
        where: {
          id:
            current.id
        },
        data: {
          status:
            PurchaseOrderStatus.CANCELLED,
          cancelledAt:
            new Date(),
          cancelReason:
            reason,
          cancelledById:
            user.id
        },
        include:
          this.includePurchaseOrder()
      });

    return this.purchaseOrderModel(
      updated
    );
  }

  async receivePurchaseOrder(
    input: ReceivePurchaseOrderInput,
    user: TenantUser
  ): Promise<PurchaseOrderModel> {
    const access =
      await this.loadPoForUser(
        input.purchaseOrderId,
        user
      );

    if (
      !input.items?.length
    ) {
      throw new BadRequestException(
        "Enter at least one received quantity"
      );
    }

    const duplicateIds =
      new Set<string>();

    for (
      const item of
        input.items
    ) {
      if (
        duplicateIds.has(
          item.purchaseOrderItemId
        )
      ) {
        throw new BadRequestException(
          "Duplicate purchase-order item in receipt"
        );
      }

      duplicateIds.add(
        item.purchaseOrderItemId
      );

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <
          0
      ) {
        throw new BadRequestException(
          "Received quantities must be whole numbers"
        );
      }
    }

    if (
      !input.items.some(
        (item) =>
          item.quantity >
          0
      )
    ) {
      throw new BadRequestException(
        "Receive at least one unit"
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe(
          'SELECT "id" FROM "purchase_orders" WHERE "id" = $1 AND "business_id" = $2 AND "store_id" = $3 FOR UPDATE',
          input.purchaseOrderId,
          user.businessId,
          access.storeId
        );

        const po =
          await tx.purchaseOrder.findFirst({
            where: {
              id:
                input.purchaseOrderId,
              businessId:
                user.businessId,
              storeId:
                access.storeId
            },
            include: {
              items: true
            }
          });

        if (!po) {
          throw new NotFoundException(
            "Purchase order not found"
          );
        }

        if (
          po.status !==
            PurchaseOrderStatus.ORDERED &&
          po.status !==
            PurchaseOrderStatus.PARTIALLY_RECEIVED
        ) {
          throw new BadRequestException(
            "Only ordered or partially received purchase orders can receive inventory"
          );
        }

        const byId =
          new Map(
            po.items.map(
              (item) => [
                item.id,
                item
              ]
            )
          );

        for (
          const receiptItem of
            input.items
        ) {
          if (
            receiptItem.quantity ===
            0
          ) {
            continue;
          }

          const poItem =
            byId.get(
              receiptItem.purchaseOrderItemId
            );

          if (!poItem) {
            throw new BadRequestException(
              "A received item does not belong to this purchase order"
            );
          }

          const product =
            await tx.product.findFirst({
              where: {
                id:
                  poItem.productId,
                businessId:
                  user.businessId
              },
              select: {
                id: true
              }
            });

          if (!product) {
            throw new BadRequestException(
              "Purchase-order product does not belong to this business"
            );
          }

          const remaining =
            poItem.quantityOrdered -
            poItem.quantityReceived;

          if (
            receiptItem.quantity >
            remaining
          ) {
            throw new BadRequestException(
              `Cannot receive ${receiptItem.quantity}; only ${remaining} remain for this item`
            );
          }

          const inventory =
            await tx.inventory.upsert({
              where: {
                storeId_productId: {
                  storeId:
                    po.storeId,
                  productId:
                    poItem.productId
                }
              },
              update: {
                quantity: {
                  increment:
                    receiptItem.quantity
                }
              },
              create: {
                businessId:
                  user.businessId,
                storeId:
                  po.storeId,
                productId:
                  poItem.productId,
                quantity:
                  receiptItem.quantity
              },
              select: {
                quantity: true
              }
            });

          const newQuantity =
            inventory.quantity;

          const previousQuantity =
            newQuantity -
            receiptItem.quantity;

          await tx.purchaseOrderItem.update({
            where: {
              id:
                poItem.id
            },
            data: {
              quantityReceived: {
                increment:
                  receiptItem.quantity
              }
            }
          });

          await tx.inventoryMovement.create({
            data: {
              businessId:
                user.businessId,
              storeId:
                po.storeId,
              productId:
                poItem.productId,
              type:
                InventoryMovementType.PURCHASE_RECEIVED,
              quantityChange:
                receiptItem.quantity,
              previousQuantity,
              newQuantity,
              purchaseOrderId:
                po.id,
              reason:
                `Received ${po.poNumber}`,
              createdById:
                user.id
            }
          });

          poItem.quantityReceived +=
            receiptItem.quantity;
        }

        const allReceived =
          po.items.every(
            (item) =>
              item.quantityReceived >=
              item.quantityOrdered
          );

        const anyReceived =
          po.items.some(
            (item) =>
              item.quantityReceived >
              0
          );

        await tx.purchaseOrder.update({
          where: {
            id:
              po.id
          },
          data: {
            status:
              allReceived
                ? PurchaseOrderStatus.RECEIVED
                : anyReceived
                  ? PurchaseOrderStatus.PARTIALLY_RECEIVED
                  : PurchaseOrderStatus.ORDERED,
            receivedAt:
              allReceived
                ? new Date()
                : null
          }
        });
      }
    );

    const updated =
      await this.prisma.purchaseOrder.findFirst({
        where: {
          id:
            input.purchaseOrderId,
          businessId:
            user.businessId,
          storeId:
            access.storeId
        },
        include:
          this.includePurchaseOrder()
      });

    if (!updated) {
      throw new NotFoundException(
        "Purchase order could not be reloaded"
      );
    }

    return this.purchaseOrderModel(
      updated
    );
  }
}
