import { BadRequestException, Injectable } from "@nestjs/common";
import { SaleStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { ReportFilterInput } from "./dto/report-filter.input";
import { SalesReportModel } from "./report.model";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private money(value: number) {
    return Number(value.toFixed(2));
  }

  /**
   * RetailOps reports should group sales by the store's business day,
   * not by UTC.
   *
   * Configure this in apps/api/.env:
   *
   * STORE_TIME_ZONE=America/Chicago
   *
   * America/Chicago is used as the safe default for the current project.
   */
  private get storeTimeZone() {
    return process.env.STORE_TIME_ZONE || "America/Chicago";
  }

  private businessDateKey(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: this.storeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const year =
      parts.find((part) => part.type === "year")?.value ?? "";
    const month =
      parts.find((part) => part.type === "month")?.value ?? "";
    const day =
      parts.find((part) => part.type === "day")?.value ?? "";

    return `${year}-${month}-${day}`;
  }

  async salesReport(
    filter: ReportFilterInput,
    businessId: string
  ): Promise<SalesReportModel> {
    const from = new Date(filter.from);
    const to = new Date(filter.to);

    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime())
    ) {
      throw new BadRequestException(
        "Invalid report date range"
      );
    }

    if (from > to) {
      throw new BadRequestException(
        "Report start date must be before end date"
      );
    }

    const maxDays = 366;
    const diffDays =
      (to.getTime() - from.getTime()) /
      86_400_000;

    if (diffDays > maxDays) {
      throw new BadRequestException(
        `Report range cannot exceed ${maxDays} days`
      );
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        storeId: filter.storeId,
        createdAt: {
          gte: from,
          lte: to
        },
        status: {
          in: [
            SaleStatus.COMPLETED,
            SaleStatus.PARTIALLY_REFUNDED,
            SaleStatus.REFUNDED
          ]
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        refunds: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    let grossSales = 0;
    let refunds = 0;
    let taxCollected = 0;
    let discounts = 0;
    let itemsSold = 0;

    const paymentMap = new Map<
      string,
      {
        amount: number;
        transactions: number;
      }
    >();

    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        sku: string;
        quantity: number;
        revenue: number;
      }
    >();

    const categoryMap = new Map<
      string,
      {
        category: string;
        quantity: number;
        revenue: number;
      }
    >();

    const dailyMap = new Map<
      string,
      {
        date: string;
        netSales: number;
        transactions: number;
        itemsSold: number;
      }
    >();

    for (const sale of sales) {
      const saleTotal = Number(sale.total);
      const saleTax = Number(sale.tax);
      const saleDiscount =
        Number(sale.discount);

      const saleRefunds =
        sale.refunds.reduce(
          (sum, refund) =>
            sum + Number(refund.amount),
          0
        );

      grossSales += saleTotal;
      refunds += saleRefunds;
      taxCollected += saleTax;
      discounts += saleDiscount;

      const payment =
        paymentMap.get(
          sale.paymentMethod
        ) ?? {
          amount: 0,
          transactions: 0
        };

      payment.amount +=
        saleTotal - saleRefunds;

      payment.transactions += 1;

      paymentMap.set(
        sale.paymentMethod,
        payment
      );

      /**
       * IMPORTANT:
       * Do not use:
       *
       * sale.createdAt.toISOString().slice(0, 10)
       *
       * That groups by UTC and can move an evening sale
       * into the next calendar day for a U.S. store.
       */
      const dateKey =
        this.businessDateKey(
          sale.createdAt
        );

      const daily =
        dailyMap.get(dateKey) ?? {
          date: dateKey,
          netSales: 0,
          transactions: 0,
          itemsSold: 0
        };

      daily.netSales +=
        saleTotal - saleRefunds;

      daily.transactions += 1;

      for (const item of sale.items) {
        itemsSold += item.quantity;
        daily.itemsSold += item.quantity;

        const lineRevenue =
          Number(item.lineTotal);

        const product =
          productMap.get(
            item.productId
          ) ?? {
            productId: item.productId,
            name:
              item.productName ??
              item.product.name,
            sku:
              item.productSku ??
              item.product.sku,
            quantity: 0,
            revenue: 0
          };

        product.quantity +=
          item.quantity;

        product.revenue +=
          lineRevenue;

        productMap.set(
          item.productId,
          product
        );

        const categoryName =
          item.product.category.name;

        const category =
          categoryMap.get(
            categoryName
          ) ?? {
            category: categoryName,
            quantity: 0,
            revenue: 0
          };

        category.quantity +=
          item.quantity;

        category.revenue +=
          lineRevenue;

        categoryMap.set(
          categoryName,
          category
        );
      }

      dailyMap.set(
        dateKey,
        daily
      );
    }

    const netSales =
      grossSales - refunds;

    const transactions =
      sales.length;

    return {
      grossSales:
        this.money(grossSales),

      refunds:
        this.money(refunds),

      netSales:
        this.money(netSales),

      taxCollected:
        this.money(taxCollected),

      discounts:
        this.money(discounts),

      transactions,

      itemsSold,

      averageTransaction:
        transactions > 0
          ? this.money(
              netSales /
                transactions
            )
          : 0,

      payments:
        Array.from(
          paymentMap.entries()
        )
          .map(
            ([
              paymentMethod,
              value
            ]) => ({
              paymentMethod,
              amount: this.money(
                value.amount
              ),
              transactions:
                value.transactions
            })
          )
          .sort(
            (a, b) =>
              b.amount - a.amount
          ),

      topProducts:
        Array.from(
          productMap.values()
        )
          .sort(
            (a, b) =>
              b.quantity -
              a.quantity
          )
          .slice(0, 20)
          .map((row) => ({
            ...row,
            revenue: this.money(
              row.revenue
            )
          })),

      categories:
        Array.from(
          categoryMap.values()
        )
          .sort(
            (a, b) =>
              b.revenue -
              a.revenue
          )
          .map((row) => ({
            ...row,
            revenue: this.money(
              row.revenue
            )
          })),

      dailySales:
        Array.from(
          dailyMap.values()
        )
          .sort((a, b) =>
            a.date.localeCompare(
              b.date
            )
          )
          .map((row) => ({
            ...row,
            netSales: this.money(
              row.netSales
            )
          }))
    };
  }
}
