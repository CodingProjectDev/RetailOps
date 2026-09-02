import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  PaymentMethod,
  SaleStatus,
  ShiftStatus
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { StoresService } from "../stores/stores.service";
import { TenantUser } from "../auth/tenant-user.type";
import { CloseShiftInput } from "./dto/close-shift.input";
import { ForceCloseShiftInput } from "./dto/force-close-shift.input";
import { StartShiftInput } from "./dto/start-shift.input";
import { ShiftModel } from "./shift.model";

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService
  ) {}

  private money(
    value: number
  ) {
    return Number(
      value.toFixed(
        2
      )
    );
  }

  private toModel(
    shift: any
  ): ShiftModel {
    const cutoff =
      shift.closedAt
        ? new Date(
            shift.closedAt
          ).getTime()
        : Number.POSITIVE_INFINITY;

    const activeSales =
      (
        shift.sales ??
        []
      ).filter(
        (sale: any) =>
          sale.status !==
          SaleStatus.VOIDED
      );

    const grossSales =
      this.money(
        activeSales.reduce(
          (
            sum: number,
            sale: any
          ) =>
            sum +
            Number(
              sale.total
            ),
          0
        )
      );

    const cashSales =
      this.money(
        activeSales
          .filter(
            (sale: any) =>
              sale.paymentMethod ===
              PaymentMethod.CASH
          )
          .reduce(
            (
              sum: number,
              sale: any
            ) =>
              sum +
              Number(
                sale.total
              ),
            0
          )
      );

    const cardSales =
      this.money(
        activeSales
          .filter(
            (sale: any) =>
              sale.paymentMethod ===
              PaymentMethod.CARD
          )
          .reduce(
            (
              sum: number,
              sale: any
            ) =>
              sum +
              Number(
                sale.total
              ),
            0
          )
      );

    const otherSales =
      this.money(
        activeSales
          .filter(
            (sale: any) =>
              sale.paymentMethod ===
              PaymentMethod.OTHER
          )
          .reduce(
            (
              sum: number,
              sale: any
            ) =>
              sum +
              Number(
                sale.total
              ),
            0
          )
      );

    let totalRefunds =
      0;

    let cashRefunds =
      0;

    for (
      const sale of
        activeSales
    ) {
      for (
        const refund of
          sale.refunds ??
          []
      ) {
        if (
          new Date(
            refund.createdAt
          ).getTime() >
          cutoff
        ) {
          continue;
        }

        const amount =
          Number(
            refund.amount
          );

        totalRefunds +=
          amount;

        if (
          sale.paymentMethod ===
          PaymentMethod.CASH
        ) {
          cashRefunds +=
            amount;
        }
      }
    }

    totalRefunds =
      this.money(
        totalRefunds
      );

    cashRefunds =
      this.money(
        cashRefunds
      );

    const netSales =
      this.money(
        grossSales -
        totalRefunds
      );

    const transactionCount =
      activeSales.length;

    const itemsSold =
      activeSales.reduce(
        (
          sum: number,
          sale: any
        ) =>
          sum +
          (
            sale.items ??
            []
          ).reduce(
            (
              itemSum: number,
              item: any
            ) =>
              itemSum +
              item.quantity,
            0
          ),
        0
      );

    const calculatedExpectedCash =
      this.money(
        Number(
          shift.openingCash
        ) +
        cashSales -
        cashRefunds
      );

    const expectedCash =
      shift.expectedCash !==
        null &&
      shift.expectedCash !==
        undefined
        ? Number(
            shift.expectedCash
          )
        : calculatedExpectedCash;

    return {
      id:
        shift.id,
      shiftNumber:
        shift.shiftNumber,
      cashierId:
        shift.cashierId,
      cashierName:
        shift.cashier
          ?.name ??
        "Cashier",
      status:
        shift.status,
      openingCash:
        Number(
          shift.openingCash
        ),
      expectedCash,
      closingCash:
        shift.closingCash !==
          null &&
        shift.closingCash !==
          undefined
          ? Number(
              shift.closingCash
            )
          : null,
      cashDifference:
        shift.cashDifference !==
          null &&
        shift.cashDifference !==
          undefined
          ? Number(
              shift.cashDifference
            )
          : null,
      grossSales,
      netSales,
      cashSales,
      cardSales,
      otherSales,
      cashRefunds,
      totalRefunds,
      transactionCount,
      itemsSold,
      openedAt:
        shift.openedAt,
      closedAt:
        shift.closedAt,
      notes:
        shift.notes,
      forceCloseReason:
        shift.forceCloseReason,
      forceClosedByName:
        shift.forceClosedBy
          ?.name ??
        null
    };
  }

  private includeSummary() {
    return {
      cashier: true,
      forceClosedBy: true,
      sales: {
        include: {
          items: true,
          refunds: true
        },
        orderBy: {
          createdAt:
            "asc" as const
        }
      }
    };
  }

  async currentShift(
    user: TenantUser,
    storeId: string
  ): Promise<
    ShiftModel | null
  > {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    const shift =
      await this.prisma.shift.findFirst({
        where: {
          businessId:
            user.businessId,
          storeId,
          cashierId:
            user.id,
          status:
            ShiftStatus.OPEN
        },
        include:
          this.includeSummary(),
        orderBy: {
          openedAt:
            "desc"
        }
      });

    return shift
      ? this.toModel(
          shift
        )
      : null;
  }

  async startShift(
    input: StartShiftInput,
    user: TenantUser
  ): Promise<ShiftModel> {
    await this.stores.assertStoreAccess(
      user,
      input.storeId
    );

    if (
      !Number.isFinite(
        input.openingCash
      ) ||
      input.openingCash <
        0
    ) {
      throw new BadRequestException(
        "Opening cash cannot be negative"
      );
    }

    const shiftId =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRawUnsafe(
            'SELECT "id" FROM "users" WHERE "id" = $1 AND "business_id" = $2 FOR UPDATE',
            user.id,
            user.businessId
          );

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

          const existing =
            await tx.shift.findFirst({
              where: {
                businessId:
                  user.businessId,
                cashierId:
                  user.id,
                status:
                  ShiftStatus.OPEN
              }
            });

          if (existing) {
            throw new BadRequestException(
              `You already have an open shift (${existing.shiftNumber}). Close it before opening another store.`
            );
          }

          const created =
            await tx.shift.create({
              data: {
                businessId:
                  user.businessId,
                storeId:
                  input.storeId,
                shiftNumber:
                  `SH-${Date.now()}`,
                cashierId:
                  user.id,
                openingCash:
                  this.money(
                    input.openingCash
                  ),
                status:
                  ShiftStatus.OPEN
              },
              select: {
                id: true
              }
            });

          return created.id;
        }
      );

    const created =
      await this.prisma.shift.findFirst({
        where: {
          id:
            shiftId,
          businessId:
            user.businessId,
          storeId:
            input.storeId
        },
        include:
          this.includeSummary()
      });

    if (!created) {
      throw new NotFoundException(
        "Shift could not be loaded"
      );
    }

    return this.toModel(
      created
    );
  }

  async closeShift(
    input: CloseShiftInput,
    user: TenantUser
  ): Promise<ShiftModel> {
    if (
      !Number.isFinite(
        input.actualCash
      ) ||
      input.actualCash <
        0
    ) {
      throw new BadRequestException(
        "Actual cash cannot be negative"
      );
    }

    const current =
      await this.prisma.shift.findFirst({
        where: {
          businessId:
            user.businessId,
          cashierId:
            user.id,
          status:
            ShiftStatus.OPEN
        },
        include:
          this.includeSummary(),
        orderBy: {
          openedAt:
            "desc"
        }
      });

    if (!current) {
      throw new BadRequestException(
        "You do not have an open shift"
      );
    }

    await this.stores.assertStoreAccess(
      user,
      current.storeId
    );

    const summary =
      this.toModel(
        current
      );

    const actualCash =
      this.money(
        input.actualCash
      );

    const difference =
      this.money(
        actualCash -
        summary.expectedCash
      );

    const closed =
      await this.prisma.shift.update({
        where: {
          id:
            current.id
        },
        data: {
          status:
            ShiftStatus.CLOSED,
          expectedCash:
            summary.expectedCash,
          closingCash:
            actualCash,
          cashDifference:
            difference,
          notes:
            input.notes
              ?.trim() ||
            null,
          closedAt:
            new Date()
        },
        include:
          this.includeSummary()
      });

    return this.toModel(
      closed
    );
  }

  async forceCloseShift(
    input: ForceCloseShiftInput,
    user: TenantUser
  ): Promise<ShiftModel> {
    if (
      !Number.isFinite(
        input.actualCash
      ) ||
      input.actualCash <
        0
    ) {
      throw new BadRequestException(
        "Actual cash cannot be negative"
      );
    }

    const reason =
      input.reason.trim();

    if (
      reason.length < 3
    ) {
      throw new BadRequestException(
        "Force-close reason must be at least 3 characters"
      );
    }

    const current =
      await this.prisma.shift.findFirst({
        where: {
          id:
            input.shiftId,
          businessId:
            user.businessId
        },
        include:
          this.includeSummary()
      });

    if (!current) {
      throw new NotFoundException(
        "Shift not found"
      );
    }

    await this.stores.assertStoreAccess(
      user,
      current.storeId
    );

    if (
      current.status !==
      ShiftStatus.OPEN
    ) {
      throw new BadRequestException(
        `Only an open shift can be force-closed. Current status: ${current.status}`
      );
    }

    const summary =
      this.toModel(
        current
      );

    const actualCash =
      this.money(
        input.actualCash
      );

    const difference =
      this.money(
        actualCash -
        summary.expectedCash
      );

    const closed =
      await this.prisma.shift.update({
        where: {
          id:
            current.id
        },
        data: {
          status:
            ShiftStatus.FORCE_CLOSED,
          expectedCash:
            summary.expectedCash,
          closingCash:
            actualCash,
          cashDifference:
            difference,
          forceCloseReason:
            reason,
          forceClosedById:
            user.id,
          closedAt:
            new Date()
        },
        include:
          this.includeSummary()
      });

    return this.toModel(
      closed
    );
  }

  async history(
    user: TenantUser,
    storeId: string
  ): Promise<ShiftModel[]> {
    await this.stores.assertStoreAccess(
      user,
      storeId
    );

    const shifts =
      await this.prisma.shift.findMany({
        where: {
          businessId:
            user.businessId,
          storeId
        },
        include:
          this.includeSummary(),
        orderBy: {
          openedAt:
            "desc"
        },
        take: 200
      });

    return shifts.map(
      (shift) =>
        this.toModel(
          shift
        )
    );
  }
}
