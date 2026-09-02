import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  InventoryMovementType,
  PaymentMethod,
  SaleStatus,
  UserRole
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { StoresService } from "../stores/stores.service";
import { TenantUser } from "../auth/tenant-user.type";
import { CompleteSaleInput } from "./dto/complete-sale.input";
import { SalesFilterInput } from "./dto/sales-filter.input";
import { VoidSaleInput } from "./dto/void-sale.input";
import { RefundSaleInput } from "./dto/refund-sale.input";
import {
  SaleHistoryModel,
  SaleModel,
  SalesCashierModel
} from "./sale.model";

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService
  ) {}

  private toHistoryModel(
    sale: any
  ): SaleHistoryModel {
    const refunds =
      sale.refunds ?? [];

    return {
      id:
        sale.id,
      receiptNumber:
        sale.receiptNumber,
      cashierId:
        sale.cashierId,
      cashierName:
        sale.cashierName ??
        sale.cashier.name,
      status:
        sale.status,
      subtotal:
        Number(
          sale.subtotal
        ),
      tax:
        Number(
          sale.tax
        ),
      discount:
        Number(
          sale.discount
        ),
      total:
        Number(
          sale.total
        ),
      paymentMethod:
        sale.paymentMethod,
      createdAt:
        sale.createdAt,
      completedAt:
        sale.completedAt,
      voidedAt:
        sale.voidedAt,
      voidReason:
        sale.voidReason,
      voidedByName:
        sale.voidedBy
          ?.name ??
        null,
      refundedAmount:
        Number(
          refunds
            .reduce(
              (
                sum: number,
                refund: any
              ) =>
                sum +
                Number(
                  refund.amount
                ),
              0
            )
            .toFixed(2)
        ),
      refunds:
        refunds.map(
          (refund: any) => ({
            id:
              refund.id,
            refundNumber:
              refund.refundNumber,
            amount:
              Number(
                refund.amount
              ),
            reason:
              refund.reason,
            createdByName:
              refund.createdBy
                ?.name ??
              "Unknown manager",
            createdAt:
              refund.createdAt,
            items:
              refund.items.map(
                (
                  refundItem: any
                ) => ({
                  id:
                    refundItem.id,
                  saleItemId:
                    refundItem.saleItemId,
                  productName:
                    refundItem
                      .saleItem
                      ?.productName ??
                    refundItem
                      .saleItem
                      ?.product
                      ?.name ??
                    "Product",
                  quantity:
                    refundItem.quantity,
                  amount:
                    Number(
                      refundItem.amount
                    ),
                  restock:
                    refundItem.restock
                })
              )
          })
        ),
      items:
        sale.items.map(
          (item: any) => {
            const refundedQuantity =
              (
                item.refundItems ??
                []
              ).reduce(
                (
                  sum: number,
                  refundItem: any
                ) =>
                  sum +
                  refundItem.quantity,
                0
              );

            return {
              id:
                item.id,
              productId:
                item.productId,
              productName:
                item.productName ??
                item.product
                  .name,
              barcode:
                item.productBarcode ??
                item.product
                  .barcode,
              sku:
                item.productSku ??
                item.product
                  .sku,
              quantity:
                item.quantity,
              refundedQuantity,
              remainingRefundableQuantity:
                Math.max(
                  0,
                  item.quantity -
                    refundedQuantity
                ),
              unitPrice:
                Number(
                  item.unitPrice
                ),
              tax:
                Number(
                  item.tax
                ),
              discount:
                Number(
                  item.discount
                ),
              lineTotal:
                Number(
                  item.lineTotal
                )
            };
          }
        )
    };
  }

  private historyInclude() {
    return {
      cashier: true,
      voidedBy: true,
      refunds: {
        include: {
          createdBy: true,
          items: {
            include: {
              saleItem: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt:
            "asc" as const
        }
      },
      items: {
        include: {
          product: true,
          refundItems: true
        },
        orderBy: {
          id:
            "asc" as const
        }
      }
    };
  }

  async completeSale(
    input: CompleteSaleInput,
    user: TenantUser
  ): Promise<SaleModel> {
    await this.stores.assertStoreAccess(
      user,
      input.storeId
    );

    if (!input.items.length) {
      throw new BadRequestException(
        "Cart is empty"
      );
    }

    const quantityByProduct =
      new Map<
        string,
        number
      >();

    for (
      const item of
        input.items
    ) {
      if (
        item.quantity <= 0
      ) {
        throw new BadRequestException(
          "Quantity must be greater than zero"
        );
      }

      quantityByProduct.set(
        item.productId,
        (
          quantityByProduct.get(
            item.productId
          ) ?? 0
        ) + item.quantity
      );
    }

    const productIds =
      [
        ...quantityByProduct.keys()
      ];

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const cashier =
            await tx.user.findFirst({
              where: {
                id:
                  user.id,
                businessId:
                  user.businessId
              }
            });

          if (
            !cashier ||
            !cashier.active
          ) {
            throw new NotFoundException(
              "Cashier not found"
            );
          }

          const openShift =
            await tx.shift.findFirst({
              where: {
                businessId:
                  user.businessId,
                storeId:
                  input.storeId,
                cashierId:
                  cashier.id,
                status:
                  "OPEN"
              },
              orderBy: {
                openedAt:
                  "desc"
              }
            });

          if (!openShift) {
            throw new BadRequestException(
              "Start an open shift for this store before processing a sale"
            );
          }

          const products =
            await tx.product.findMany({
              where: {
                businessId:
                  user.businessId,
                id: {
                  in:
                    productIds
                },
                active:
                  true
              },
              include: {
                inventories: {
                  where: {
                    storeId:
                      input.storeId
                  },
                  take: 1
                }
              }
            });

          if (
            products.length !==
            productIds.length
          ) {
            throw new NotFoundException(
              "One or more products were not found"
            );
          }

          let subtotal =
            0;
          let tax =
            0;

          const TAX_RATE =
            0.0825;

          for (
            const product of
              products
          ) {
            const quantity =
              quantityByProduct.get(
                product.id
              )!;

            const stock =
              product
                .inventories[0]
                ?.quantity ??
              0;

            if (
              stock <
              quantity
            ) {
              throw new BadRequestException(
                `${product.name} only has ${stock} in stock at this store`
              );
            }

            const line =
              Number(
                product.sellingPrice
              ) *
              quantity;

            subtotal +=
              line;

            if (
              product.taxable
            ) {
              tax +=
                line *
                TAX_RATE;
            }
          }

          subtotal =
            Number(
              subtotal.toFixed(
                2
              )
            );

          tax =
            Number(
              tax.toFixed(
                2
              )
            );

          const total =
            Number(
              (
                subtotal +
                tax
              ).toFixed(
                2
              )
            );

          const receiptNumber =
            `RO-${Date.now()}`;

          const sale =
            await tx.sale.create({
              data: {
                businessId:
                  user.businessId,
                storeId:
                  input.storeId,
                receiptNumber,
                cashierId:
                  cashier.id,
                cashierName:
                  cashier.name,
                status:
                  SaleStatus.COMPLETED,
                subtotal,
                tax,
                discount:
                  0,
                total,
                paymentMethod:
                  input.paymentMethod,
                shiftId:
                  openShift.id,
                completedAt:
                  new Date()
              }
            });

          for (
            const product of
              products
          ) {
            const quantity =
              quantityByProduct.get(
                product.id
              )!;

            const previousQuantity =
              product
                .inventories[0]
                ?.quantity ??
              0;

            const newQuantity =
              previousQuantity -
              quantity;

            const lineSubtotal =
              Number(
                product.sellingPrice
              ) *
              quantity;

            const lineTax =
              product.taxable
                ? Number(
                    (
                      lineSubtotal *
                      TAX_RATE
                    ).toFixed(
                      2
                    )
                  )
                : 0;

            await tx.saleItem.create({
              data: {
                saleId:
                  sale.id,
                productId:
                  product.id,
                productName:
                  product.name,
                productBarcode:
                  product.barcode,
                productSku:
                  product.sku,
                quantity,
                unitPrice:
                  product.sellingPrice,
                unitCost:
                  product.costPrice,
                tax:
                  lineTax,
                discount:
                  0,
                lineTotal:
                  Number(
                    (
                      lineSubtotal +
                      lineTax
                    ).toFixed(
                      2
                    )
                  )
              }
            });

            await tx.inventory.update({
              where: {
                storeId_productId: {
                  storeId:
                    input.storeId,
                  productId:
                    product.id
                }
              },
              data: {
                quantity:
                  newQuantity
              }
            });

            await tx.inventoryMovement.create({
              data: {
                businessId:
                  user.businessId,
                storeId:
                  input.storeId,
                productId:
                  product.id,
                type:
                  InventoryMovementType.SALE,
                quantityChange:
                  -quantity,
                previousQuantity,
                newQuantity,
                saleId:
                  sale.id,
                reason:
                  `Sale ${sale.receiptNumber}`,
                createdById:
                  cashier.id
              }
            });
          }

          return sale;
        }
      );

    return {
      id:
        result.id,
      receiptNumber:
        result.receiptNumber,
      status:
        result.status,
      subtotal:
        Number(
          result.subtotal
        ),
      tax:
        Number(
          result.tax
        ),
      total:
        Number(
          result.total
        ),
      completedAt:
        result.completedAt!
    };
  }

  async voidSale(
    input: VoidSaleInput,
    user: TenantUser
  ): Promise<SaleHistoryModel> {
    const reason =
      input.reason.trim();

    if (
      reason.length < 3
    ) {
      throw new BadRequestException(
        "Void reason must be at least 3 characters"
      );
    }

    const saleForAccess =
      await this.prisma.sale.findFirst({
        where: {
          id:
            input.saleId,
          businessId:
            user.businessId
        },
        select: {
          id: true,
          storeId: true
        }
      });

    if (!saleForAccess) {
      throw new NotFoundException(
        "Sale not found"
      );
    }

    await this.stores.assertStoreAccess(
      user,
      saleForAccess.storeId
    );

    await this.prisma.$transaction(
      async (tx) => {
        const sale =
          await tx.sale.findFirst({
            where: {
              id:
                input.saleId,
              businessId:
                user.businessId,
              storeId:
                saleForAccess.storeId
            },
            include: {
              items: true
            }
          });

        if (!sale) {
          throw new NotFoundException(
            "Sale not found"
          );
        }

        if (
          sale.status !==
          SaleStatus.COMPLETED
        ) {
          throw new BadRequestException(
            `Only completed sales can be voided. Current status: ${sale.status}`
          );
        }

        const claimed =
          await tx.sale.updateMany({
            where: {
              id:
                sale.id,
              businessId:
                user.businessId,
              storeId:
                sale.storeId,
              status:
                SaleStatus.COMPLETED
            },
            data: {
              status:
                SaleStatus.VOIDED,
              voidedAt:
                new Date(),
              voidReason:
                reason,
              voidedById:
                user.id
            }
          });

        if (
          claimed.count !==
          1
        ) {
          throw new BadRequestException(
            "This sale has already been changed and cannot be voided"
          );
        }

        for (
          const item of
            sale.items
        ) {
          const updatedInventory =
            await tx.inventory.upsert({
              where: {
                storeId_productId: {
                  storeId:
                    sale.storeId,
                  productId:
                    item.productId
                }
              },
              create: {
                businessId:
                  user.businessId,
                storeId:
                  sale.storeId,
                productId:
                  item.productId,
                quantity:
                  item.quantity
              },
              update: {
                quantity: {
                  increment:
                    item.quantity
                }
              },
              select: {
                quantity: true
              }
            });

          const newQuantity =
            updatedInventory.quantity;

          const previousQuantity =
            newQuantity -
            item.quantity;

          await tx.inventoryMovement.create({
            data: {
              businessId:
                user.businessId,
              storeId:
                sale.storeId,
              productId:
                item.productId,
              type:
                InventoryMovementType.SALE_VOID,
              quantityChange:
                item.quantity,
              previousQuantity,
              newQuantity,
              saleId:
                sale.id,
              reason:
                `Void ${sale.receiptNumber}: ${reason}`,
              createdById:
                user.id
            }
          });
        }
      }
    );

    const updated =
      await this.prisma.sale.findFirst({
        where: {
          id:
            input.saleId,
          businessId:
            user.businessId,
          storeId:
            saleForAccess.storeId
        },
        include:
          this.historyInclude()
      });

    if (!updated) {
      throw new NotFoundException(
        "Voided sale could not be reloaded"
      );
    }

    return this.toHistoryModel(
      updated
    );
  }

  async refundSale(
    input: RefundSaleInput,
    user: TenantUser
  ): Promise<SaleHistoryModel> {
    const reason =
      input.reason.trim();

    if (
      reason.length < 3
    ) {
      throw new BadRequestException(
        "Refund reason must be at least 3 characters"
      );
    }

    if (
      !input.items?.length
    ) {
      throw new BadRequestException(
        "Select at least one item to refund"
      );
    }

    const saleForAccess =
      await this.prisma.sale.findFirst({
        where: {
          id:
            input.saleId,
          businessId:
            user.businessId
        },
        select: {
          id: true,
          storeId: true
        }
      });

    if (!saleForAccess) {
      throw new NotFoundException(
        "Sale not found"
      );
    }

    await this.stores.assertStoreAccess(
      user,
      saleForAccess.storeId
    );

    const selectedIds =
      new Set<string>();

    for (
      const item of
        input.items
    ) {
      if (
        selectedIds.has(
          item.saleItemId
        )
      ) {
        throw new BadRequestException(
          "The same sale item cannot be selected twice"
        );
      }

      selectedIds.add(
        item.saleItemId
      );

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <=
          0
      ) {
        throw new BadRequestException(
          "Refund quantity must be a positive whole number"
        );
      }
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe(
          'SELECT "id" FROM "sales" WHERE "id" = $1 AND "business_id" = $2 AND "store_id" = $3 FOR UPDATE',
          input.saleId,
          user.businessId,
          saleForAccess.storeId
        );

        const manager =
          await tx.user.findFirst({
            where: {
              id:
                user.id,
              businessId:
                user.businessId
            }
          });

        if (
          !manager ||
          !manager.active
        ) {
          throw new NotFoundException(
            "Manager not found"
          );
        }

        const sale =
          await tx.sale.findFirst({
            where: {
              id:
                input.saleId,
              businessId:
                user.businessId,
              storeId:
                saleForAccess.storeId
            },
            include: {
              items: {
                include: {
                  refundItems:
                    true
                }
              }
            }
          });

        if (!sale) {
          throw new NotFoundException(
            "Sale not found"
          );
        }

        if (
          sale.status !==
            SaleStatus.COMPLETED &&
          sale.status !==
            SaleStatus.PARTIALLY_REFUNDED
        ) {
          throw new BadRequestException(
            `This sale cannot be refunded. Current status: ${sale.status}`
          );
        }

        const saleItemsById =
          new Map(
            sale.items.map(
              (item) => [
                item.id,
                item
              ]
            )
          );

        const prepared: Array<{
          saleItemId: string;
          productId: string;
          quantity: number;
          amount: number;
          restock: boolean;
        }> = [];

        for (
          const requested of
            input.items
        ) {
          const saleItem =
            saleItemsById.get(
              requested.saleItemId
            );

          if (!saleItem) {
            throw new BadRequestException(
              "One or more selected items do not belong to this sale"
            );
          }

          const alreadyRefundedQuantity =
            saleItem.refundItems.reduce(
              (
                sum,
                refundItem
              ) =>
                sum +
                refundItem.quantity,
              0
            );

          const remainingQuantity =
            saleItem.quantity -
            alreadyRefundedQuantity;

          if (
            requested.quantity >
            remainingQuantity
          ) {
            throw new BadRequestException(
              `Only ${remainingQuantity} unit(s) of ${saleItem.productName ?? "this product"} can still be refunded`
            );
          }

          const alreadyRefundedAmount =
            saleItem.refundItems.reduce(
              (
                sum,
                refundItem
              ) =>
                sum +
                Number(
                  refundItem.amount
                ),
              0
            );

          const remainingAmount =
            Number(
              (
                Number(
                  saleItem.lineTotal
                ) -
                alreadyRefundedAmount
              ).toFixed(
                2
              )
            );

          const proportionalAmount =
            Number(
              (
                (
                  Number(
                    saleItem.lineTotal
                  ) /
                  saleItem.quantity
                ) *
                requested.quantity
              ).toFixed(
                2
              )
            );

          const amount =
            requested.quantity ===
            remainingQuantity
              ? remainingAmount
              : Math.min(
                  proportionalAmount,
                  remainingAmount
                );

          prepared.push({
            saleItemId:
              saleItem.id,
            productId:
              saleItem.productId,
            quantity:
              requested.quantity,
            amount,
            restock:
              requested.restock
          });
        }

        const refundAmount =
          Number(
            prepared
              .reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  item.amount,
                0
              )
              .toFixed(
                2
              )
          );

        if (
          refundAmount <= 0
        ) {
          throw new BadRequestException(
            "Refund amount must be greater than zero"
          );
        }

        const refund =
          await tx.refund.create({
            data: {
              businessId:
                user.businessId,
              storeId:
                sale.storeId,
              refundNumber:
                `RF-${Date.now()}`,
              saleId:
                sale.id,
              amount:
                refundAmount,
              reason,
              createdById:
                user.id
            }
          });

        for (
          const item of
            prepared
        ) {
          await tx.refundItem.create({
            data: {
              refundId:
                refund.id,
              saleItemId:
                item.saleItemId,
              quantity:
                item.quantity,
              amount:
                item.amount,
              restock:
                item.restock
            }
          });

          if (
            item.restock
          ) {
            const currentInventory =
              await tx.inventory.findUnique({
                where: {
                  storeId_productId: {
                    storeId:
                      sale.storeId,
                    productId:
                      item.productId
                  }
                },
                select: {
                  quantity: true
                }
              });

            const previousQuantity =
              currentInventory
                ?.quantity ??
              0;

            const newQuantity =
              previousQuantity +
              item.quantity;

            await tx.inventory.upsert({
              where: {
                storeId_productId: {
                  storeId:
                    sale.storeId,
                  productId:
                    item.productId
                }
              },
              create: {
                businessId:
                  user.businessId,
                storeId:
                  sale.storeId,
                productId:
                  item.productId,
                quantity:
                  newQuantity
              },
              update: {
                quantity:
                  newQuantity
              }
            });

            await tx.inventoryMovement.create({
              data: {
                businessId:
                  user.businessId,
                storeId:
                  sale.storeId,
                productId:
                  item.productId,
                type:
                  InventoryMovementType.REFUND,
                quantityChange:
                  item.quantity,
                previousQuantity,
                newQuantity,
                saleId:
                  sale.id,
                refundId:
                  refund.id,
                reason:
                  `Refund ${refund.refundNumber} / ${sale.receiptNumber}: ${reason}`,
                createdById:
                  user.id
              }
            });
          }
        }

        const selectedBySaleItemId =
          new Map(
            prepared.map(
              (item) => [
                item.saleItemId,
                item.quantity
              ]
            )
          );

        const fullyRefunded =
          sale.items.every(
            (saleItem) => {
              const alreadyRefunded =
                saleItem.refundItems.reduce(
                  (
                    sum,
                    refundItem
                  ) =>
                    sum +
                    refundItem.quantity,
                  0
                );

              const newlyRefunded =
                selectedBySaleItemId.get(
                  saleItem.id
                ) ??
                0;

              return (
                alreadyRefunded +
                  newlyRefunded >=
                saleItem.quantity
              );
            }
          );

        await tx.sale.update({
          where: {
            id:
              sale.id
          },
          data: {
            status:
              fullyRefunded
                ? SaleStatus.REFUNDED
                : SaleStatus.PARTIALLY_REFUNDED
          }
        });
      }
    );

    const updated =
      await this.prisma.sale.findFirst({
        where: {
          id:
            input.saleId,
          businessId:
            user.businessId,
          storeId:
            saleForAccess.storeId
        },
        include:
          this.historyInclude()
      });

    if (!updated) {
      throw new NotFoundException(
        "Refunded sale could not be reloaded"
      );
    }

    return this.toHistoryModel(
      updated
    );
  }

  async history(
    filter: SalesFilterInput | undefined,
    businessId: string,
    storeId: string
  ): Promise<
    SaleHistoryModel[]
  > {
    const cleanSearch =
      filter?.search?.trim();

    const where:
      Record<
        string,
        any
      > = {
      businessId,
      storeId
    };

    if (cleanSearch) {
      where.OR = [
        {
          receiptNumber: {
            contains:
              cleanSearch,
            mode:
              "insensitive"
          }
        },
        {
          cashierName: {
            contains:
              cleanSearch,
            mode:
              "insensitive"
          }
        },
        {
          cashier: {
            name: {
              contains:
                cleanSearch,
              mode:
                "insensitive"
            }
          }
        },
        {
          items: {
            some: {
              OR: [
                {
                  productName: {
                    contains:
                      cleanSearch,
                    mode:
                      "insensitive"
                  }
                },
                {
                  productBarcode: {
                    contains:
                      cleanSearch
                  }
                },
                {
                  productSku: {
                    contains:
                      cleanSearch,
                    mode:
                      "insensitive"
                  }
                },
                {
                  product: {
                    name: {
                      contains:
                        cleanSearch,
                      mode:
                        "insensitive"
                    }
                  }
                },
                {
                  product: {
                    barcode: {
                      contains:
                        cleanSearch
                    }
                  }
                },
                {
                  product: {
                    sku: {
                      contains:
                        cleanSearch,
                      mode:
                        "insensitive"
                    }
                  }
                }
              ]
            }
          }
        }
      ];
    }

    if (
      filter?.cashierId
    ) {
      where.cashierId =
        filter.cashierId;
    }

    if (
      filter?.paymentMethod
    ) {
      if (
        !Object.values(
          PaymentMethod
        ).includes(
          filter.paymentMethod as
            PaymentMethod
        )
      ) {
        throw new BadRequestException(
          "Invalid payment method"
        );
      }

      where.paymentMethod =
        filter.paymentMethod;
    }

    if (
      filter?.status
    ) {
      if (
        !Object.values(
          SaleStatus
        ).includes(
          filter.status as
            SaleStatus
        )
      ) {
        throw new BadRequestException(
          "Invalid sale status"
        );
      }

      where.status =
        filter.status;
    }

    if (
      filter?.from ||
      filter?.to
    ) {
      if (
        filter.from &&
        filter.to &&
        filter.from >
          filter.to
      ) {
        throw new BadRequestException(
          "From date cannot be after To date"
        );
      }

      where.createdAt = {
        ...(filter.from
          ? {
              gte:
                filter.from
            }
          : {}),
        ...(filter.to
          ? {
              lte:
                filter.to
            }
          : {})
      };
    }

    if (
      filter?.minTotal !==
        undefined ||
      filter?.maxTotal !==
        undefined
    ) {
      if (
        filter.minTotal !==
          undefined &&
        filter.minTotal < 0
      ) {
        throw new BadRequestException(
          "Minimum total cannot be negative"
        );
      }

      if (
        filter.maxTotal !==
          undefined &&
        filter.maxTotal < 0
      ) {
        throw new BadRequestException(
          "Maximum total cannot be negative"
        );
      }

      if (
        filter.minTotal !==
          undefined &&
        filter.maxTotal !==
          undefined &&
        filter.minTotal >
          filter.maxTotal
      ) {
        throw new BadRequestException(
          "Minimum total cannot be greater than maximum total"
        );
      }

      where.total = {
        ...(filter.minTotal !==
        undefined
          ? {
              gte:
                filter.minTotal
            }
          : {}),
        ...(filter.maxTotal !==
        undefined
          ? {
              lte:
                filter.maxTotal
            }
          : {})
      };
    }

    const sales =
      await this.prisma.sale.findMany({
        where,
        include:
          this.historyInclude(),
        orderBy: {
          createdAt:
            "desc"
        },
        take: 250
      });

    return sales.map(
      (sale) =>
        this.toHistoryModel(
          sale
        )
    );
  }

  async cashiers(
    businessId: string,
    storeId: string
  ): Promise<
    SalesCashierModel[]
  > {
    return this.prisma.user.findMany({
      where: {
        businessId,
        active: true,
        role: {
          in: [
            UserRole.OWNER,
            UserRole.MANAGER,
            UserRole.CASHIER
          ]
        },
        OR: [
          {
            role:
              UserRole.OWNER
          },
          {
            storeAssignments: {
              some: {
                storeId
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    });
  }
}
