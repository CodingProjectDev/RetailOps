import {
  BadRequestException,
  Injectable
} from "@nestjs/common";
import {
  PaymentMethod,
  SaleStatus,
  ShiftStatus
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { DailyClosingInput } from "./dto/daily-closing.input";
import {
  DailyClosingPaymentModel,
  DailyClosingReportModel,
  DailyClosingShiftModel
} from "./daily-closing.model";

@Injectable()
export class DailyClosingService {
  constructor(private readonly prisma: PrismaService) {}

  private money(value: number) {
    return Number(value.toFixed(2));
  }

  private get storeTimeZone() {
    return process.env.STORE_TIME_ZONE || "America/Chicago";
  }

  private parseBusinessDate(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException(
        "Business date must use YYYY-MM-DD"
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const test = new Date(Date.UTC(year, month - 1, day));

    if (
      test.getUTCFullYear() !== year ||
      test.getUTCMonth() !== month - 1 ||
      test.getUTCDate() !== day
    ) {
      throw new BadRequestException("Invalid business date");
    }

    return { year, month, day };
  }

  private addDays(
    value: { year: number; month: number; day: number },
    amount: number
  ) {
    const date = new Date(
      Date.UTC(value.year, value.month - 1, value.day + amount)
    );

    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate()
    };
  }

  private partsInZone(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: this.storeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);

    const value = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);

    return {
      year: value("year"),
      month: value("month"),
      day: value("day"),
      hour: value("hour"),
      minute: value("minute"),
      second: value("second")
    };
  }

  /**
   * Convert a wall-clock date/time in STORE_TIME_ZONE to a UTC Date.
   * This keeps daily closing boundaries independent from the browser's
   * timezone and avoids UTC date rollover bugs.
   */
  private zonedTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0
  ) {
    const targetAsUtc = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    );

    let candidate = new Date(targetAsUtc);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const actual = this.partsInZone(candidate);

      const actualAsUtc = Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
        actual.second
      );

      const difference = actualAsUtc - targetAsUtc;

      if (difference === 0) break;

      candidate = new Date(candidate.getTime() - difference);
    }

    return candidate;
  }

  private businessDayRange(dateValue: string) {
    const date = this.parseBusinessDate(dateValue);
    const next = this.addDays(date, 1);

    return {
      from: this.zonedTimeToUtc(
        date.year,
        date.month,
        date.day
      ),
      toExclusive: this.zonedTimeToUtc(
        next.year,
        next.month,
        next.day
      )
    };
  }

  private shiftSummary(shift: any): DailyClosingShiftModel {
    const cutoff =
      shift.closedAt
        ? new Date(shift.closedAt).getTime()
        : Number.POSITIVE_INFINITY;

    const activeSales = (shift.sales ?? []).filter(
      (sale: any) => sale.status !== SaleStatus.VOIDED
    );

    const grossSales = this.money(
      activeSales.reduce(
        (sum: number, sale: any) =>
          sum + Number(sale.total),
        0
      )
    );

    const cashSales = this.money(
      activeSales
        .filter(
          (sale: any) =>
            sale.paymentMethod === PaymentMethod.CASH
        )
        .reduce(
          (sum: number, sale: any) =>
            sum + Number(sale.total),
          0
        )
    );

    const cardSales = this.money(
      activeSales
        .filter(
          (sale: any) =>
            sale.paymentMethod === PaymentMethod.CARD
        )
        .reduce(
          (sum: number, sale: any) =>
            sum + Number(sale.total),
          0
        )
    );

    const otherSales = this.money(
      activeSales
        .filter(
          (sale: any) =>
            sale.paymentMethod === PaymentMethod.OTHER
        )
        .reduce(
          (sum: number, sale: any) =>
            sum + Number(sale.total),
          0
        )
    );

    let totalRefunds = 0;
    let cashRefunds = 0;

    for (const sale of activeSales) {
      for (const refund of sale.refunds ?? []) {
        if (
          new Date(refund.createdAt).getTime() >
          cutoff
        ) {
          continue;
        }

        const amount = Number(refund.amount);

        totalRefunds += amount;

        if (
          sale.paymentMethod === PaymentMethod.CASH
        ) {
          cashRefunds += amount;
        }
      }
    }

    totalRefunds = this.money(totalRefunds);
    cashRefunds = this.money(cashRefunds);

    const expectedCalculated = this.money(
      Number(shift.openingCash) +
        cashSales -
        cashRefunds
    );

    const expectedCash =
      shift.expectedCash !== null &&
      shift.expectedCash !== undefined
        ? Number(shift.expectedCash)
        : expectedCalculated;

    const transactions = activeSales.length;

    const itemsSold = activeSales.reduce(
      (sum: number, sale: any) =>
        sum +
        (sale.items ?? []).reduce(
          (itemSum: number, item: any) =>
            itemSum + item.quantity,
          0
        ),
      0
    );

    return {
      id: shift.id,
      shiftNumber: shift.shiftNumber,
      cashierName:
        shift.cashier?.name ?? "Cashier",
      status: shift.status,
      openingCash: Number(shift.openingCash),
      expectedCash:
        this.money(expectedCash),
      closingCash:
        shift.closingCash !== null &&
        shift.closingCash !== undefined
          ? Number(shift.closingCash)
          : null,
      cashDifference:
        shift.cashDifference !== null &&
        shift.cashDifference !== undefined
          ? Number(shift.cashDifference)
          : null,
      grossSales,
      netSales:
        this.money(
          grossSales - totalRefunds
        ),
      cashSales,
      cardSales,
      otherSales,
      totalRefunds,
      cashRefunds,
      transactions,
      itemsSold,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      forceCloseReason:
        shift.forceCloseReason ?? null
    };
  }

  async dailyClosing(
    input: DailyClosingInput,
    businessId: string
  ): Promise<DailyClosingReportModel> {
    const { from, toExclusive } =
      this.businessDayRange(input.date);

    const activeStatuses = [
      SaleStatus.COMPLETED,
      SaleStatus.PARTIALLY_REFUNDED,
      SaleStatus.REFUNDED
    ];

    const [
      sales,
      refunds,
      shifts
    ] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          businessId,
          storeId: input.storeId,
          createdAt: {
            gte: from,
            lt: toExclusive
          },
          status: {
            in: activeStatuses
          }
        },
        include: {
          items: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }),

      /**
       * Refund activity is selected by refund processing date,
       * not original sale date. This is important for an end-of-day
       * reconciliation because today's refund can belong to an older sale.
       */
      this.prisma.refund.findMany({
        where: {
          businessId,
          storeId: input.storeId,
          createdAt: {
            gte: from,
            lt: toExclusive
          }
        },
        include: {
          sale: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }),

      /**
       * Daily closing lists shifts opened on this business day.
       * A shift left OPEN will prevent the report from being "ready".
       */
      this.prisma.shift.findMany({
        where: {
          businessId,
          storeId: input.storeId,
          openedAt: {
            gte: from,
            lt: toExclusive
          }
        },
        include: {
          cashier: true,
          sales: {
            include: {
              items: true,
              refunds: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        orderBy: {
          openedAt: "asc"
        }
      })
    ]);

    const grossSales = this.money(
      sales.reduce(
        (sum, sale) =>
          sum + Number(sale.total),
        0
      )
    );

    const refundTotal = this.money(
      refunds.reduce(
        (sum, refund) =>
          sum + Number(refund.amount),
        0
      )
    );

    const itemsSold = sales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) =>
            itemSum + item.quantity,
          0
        ),
      0
    );

    const methods = [
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.OTHER
    ];

    const payments: DailyClosingPaymentModel[] =
      methods.map((paymentMethod) => {
        const methodSales = sales.filter(
          (sale) =>
            sale.paymentMethod === paymentMethod
        );

        const methodRefunds = refunds.filter(
          (refund) =>
            refund.sale.paymentMethod === paymentMethod
        );

        const methodGross = this.money(
          methodSales.reduce(
            (sum, sale) =>
              sum + Number(sale.total),
            0
          )
        );

        const methodRefundAmount =
          this.money(
            methodRefunds.reduce(
              (sum, refund) =>
                sum + Number(refund.amount),
              0
            )
          );

        return {
          paymentMethod,
          grossSales: methodGross,
          refunds: methodRefundAmount,
          netSales: this.money(
            methodGross -
              methodRefundAmount
          ),
          transactions:
            methodSales.length
        };
      });

    const shiftRows =
      shifts.map((shift) =>
        this.shiftSummary(shift)
      );

    const openShiftCount =
      shiftRows.filter(
        (shift) =>
          shift.status === ShiftStatus.OPEN
      ).length;

    const closedShiftCount =
      shiftRows.filter(
        (shift) =>
          shift.status === ShiftStatus.CLOSED
      ).length;

    const forceClosedShiftCount =
      shiftRows.filter(
        (shift) =>
          shift.status === ShiftStatus.FORCE_CLOSED
      ).length;

    const openingCash = this.money(
      shiftRows.reduce(
        (sum, shift) =>
          sum + shift.openingCash,
        0
      )
    );

    const expectedCash = this.money(
      shiftRows.reduce(
        (sum, shift) =>
          sum + shift.expectedCash,
        0
      )
    );

    const actualCash = this.money(
      shiftRows.reduce(
        (sum, shift) =>
          sum +
          (shift.closingCash ?? 0),
        0
      )
    );

    const cashVariance = this.money(
      shiftRows.reduce(
        (sum, shift) =>
          sum +
          (shift.cashDifference ?? 0),
        0
      )
    );

    const shortage = this.money(
      shiftRows.reduce(
        (sum, shift) => {
          const difference =
            shift.cashDifference ?? 0;

          return difference < 0
            ? sum + Math.abs(difference)
            : sum;
        },
        0
      )
    );

    const overage = this.money(
      shiftRows.reduce(
        (sum, shift) => {
          const difference =
            shift.cashDifference ?? 0;

          return difference > 0
            ? sum + difference
            : sum;
        },
        0
      )
    );

    return {
      businessDate: input.date,
      timeZone: this.storeTimeZone,
      readyToClose:
        openShiftCount === 0,
      grossSales,
      refunds: refundTotal,
      netSales: this.money(
        grossSales - refundTotal
      ),
      transactions: sales.length,
      itemsSold,
      openingCash,
      expectedCash,
      actualCash,
      cashVariance,
      shortage,
      overage,
      shiftCount: shiftRows.length,
      openShiftCount,
      closedShiftCount,
      forceClosedShiftCount,
      payments,
      shifts: shiftRows
    };
  }
}
