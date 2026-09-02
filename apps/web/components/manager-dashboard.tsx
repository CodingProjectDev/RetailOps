"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useMemo } from "react";
import { useCurrentStore } from "@/components/store-context";

type PaymentRow = {
  paymentMethod: string;
  amount: number;
  transactions: number;
};

type ProductReportRow = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
};

type DailyRow = {
  date: string;
  netSales: number;
  transactions: number;
  itemsSold: number;
};

type SalesReport = {
  grossSales: number;
  refunds: number;
  netSales: number;
  transactions: number;
  itemsSold: number;
  averageTransaction: number;
  payments: PaymentRow[];
  topProducts: ProductReportRow[];
  dailySales: DailyRow[];
};

type Product = {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryName: string;
  stock: number;
  minimumStock: number;
  active: boolean;
};

const DASHBOARD_QUERY = gql`
  query ManagerDashboard(
    $today: ReportFilterInput!
    $trend: ReportFilterInput!
    $storeId: String!
  ) {
    today: salesReport(
      filter: $today
    ) {
      grossSales
      refunds
      netSales
      transactions
      itemsSold
      averageTransaction

      payments {
        paymentMethod
        amount
        transactions
      }

      topProducts {
        productId
        name
        sku
        quantity
        revenue
      }
    }

    trend: salesReport(
      filter: $trend
    ) {
      dailySales {
        date
        netSales
        transactions
        itemsSold
      }
    }

    products(
      storeId: $storeId
      active: true
    ) {
      id
      name
      barcode
      sku
      categoryName
      stock
      minimumStock
      active
    }
  }
`;

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",
      currency:
        "USD"
    }
  ).format(value);
}

function startOfDay(
  date: Date
) {
  const value =
    new Date(date);

  value.setHours(
    0,
    0,
    0,
    0
  );

  return value;
}

function endOfDay(
  date: Date
) {
  const value =
    new Date(date);

  value.setHours(
    23,
    59,
    59,
    999
  );

  return value;
}

function dateKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function shortDate(
  value: string
) {
  const [
    year,
    month,
    day
  ] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",
      day:
        "numeric"
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );
}

function alertStatus(
  product: Product
) {
  if (
    product.stock <= 0
  ) {
    return "OUT OF STOCK";
  }

  const critical =
    Math.max(
      1,
      Math.floor(
        product.minimumStock /
          2
      )
    );

  if (
    product.stock <=
    critical
  ) {
    return "CRITICAL";
  }

  if (
    product.stock <=
    product.minimumStock
  ) {
    return "LOW STOCK";
  }

  return null;
}

function dashboardRanges() {
  const now =
    new Date();

  const todayFrom =
    startOfDay(now);

  const todayTo =
    endOfDay(now);

  const trendFrom =
    startOfDay(now);

  trendFrom.setDate(
    trendFrom.getDate() -
      6
  );

  return {
    todayFrom,
    todayTo,
    trendFrom
  };
}

export function ManagerDashboard() {
  const {
    storeId,
    store,
    loading:
      storeLoading
  } = useCurrentStore();

  const ranges =
    useMemo(
      () =>
        dashboardRanges(),
      []
    );

  const variables =
    useMemo(
      () => ({
        storeId:
          storeId ??
          "",
        today: {
          storeId:
            storeId ??
            "",
          from:
            ranges.todayFrom.toISOString(),
          to:
            ranges.todayTo.toISOString()
        },
        trend: {
          storeId:
            storeId ??
            "",
          from:
            ranges.trendFrom.toISOString(),
          to:
            ranges.todayTo.toISOString()
        }
      }),
      [
        storeId,
        ranges
      ]
    );

  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    today:
      SalesReport;
    trend: {
      dailySales:
        DailyRow[];
    };
    products:
      Product[];
  }>(
    DASHBOARD_QUERY,
    {
      variables,
      skip:
        !storeId,
      fetchPolicy:
        "network-only"
    }
  );

  const today =
    data?.today;

  const products =
    data?.products ??
    [];

  const inventory =
    useMemo(() => {
      const alerts =
        products
          .map(
            (
              product
            ) => ({
              product,
              status:
                alertStatus(
                  product
                )
            })
          )
          .filter(
            (
              row
            ): row is {
              product:
                Product;
              status:
                string;
            } =>
              Boolean(
                row.status
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              a.product
                .stock -
                b.product
                  .stock
          );

      return {
        alerts,
        critical:
          alerts.filter(
            (row) =>
              row.status ===
              "CRITICAL"
          ).length,
        outOfStock:
          alerts.filter(
            (row) =>
              row.status ===
              "OUT OF STOCK"
          ).length
      };
    }, [
      products
    ]);

  const sevenDays =
    useMemo(() => {
      const rows =
        data?.trend
          ?.dailySales ??
        [];

      const byDate =
        new Map(
          rows.map(
            (row) => [
              row.date,
              row
            ]
          )
        );

      const result:
        DailyRow[] =
        [];

      const now =
        new Date();

      for (
        let offset =
          6;
        offset >= 0;
        offset -= 1
      ) {
        const day =
          new Date(
            now
          );

        day.setDate(
          now.getDate() -
            offset
        );

        const key =
          dateKey(day);

        result.push(
          byDate.get(
            key
          ) ?? {
            date:
              key,
            netSales:
              0,
            transactions:
              0,
            itemsSold:
              0
          }
        );
      }

      return result;
    }, [
      data?.trend
        ?.dailySales
    ]);

  const maxDailySales =
    Math.max(
      1,
      ...sevenDays.map(
        (row) =>
          row.netSales
      )
    );

  if (
    storeLoading ||
    (loading &&
      !data)
  ) {
    return (
      <section className="panel dashboard-message">
        Loading{" "}
        {store?.name ??
          "store"}{" "}
        dashboard…
      </section>
    );
  }

  if (
    error &&
    !data
  ) {
    return (
      <section className="panel shift-error">
        Failed to load
        dashboard:{" "}
        {error.message}
      </section>
    );
  }

  return (
    <>
      <div className="dashboard-actions">
        <span>
          Live data ·{" "}
          <strong>
            {store?.name}
          </strong>
        </span>

        <button
          className="button secondary"
          type="button"
          onClick={() =>
            void refetch()
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Refreshing…"
            : "Refresh"}
        </button>
      </div>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <span>
            Today&apos;s Net
            Sales
          </span>

          <strong>
            {money(
              today?.netSales ??
                0
            )}
          </strong>

          <small>
            Gross{" "}
            {money(
              today?.grossSales ??
                0
            )}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <span>
            Transactions
          </span>

          <strong>
            {today?.transactions ??
              0}
          </strong>

          <small>
            Avg{" "}
            {money(
              today?.averageTransaction ??
                0
            )}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <span>
            Items Sold
          </span>

          <strong>
            {today?.itemsSold ??
              0}
          </strong>

          <small>
            This store today
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <span>
            Refunds
          </span>

          <strong>
            {money(
              today?.refunds ??
                0
            )}
          </strong>

          <small>
            This store
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <span>
            Inventory Alerts
          </span>

          <strong>
            {
              inventory
                .alerts
                .length
            }
          </strong>

          <small>
            {
              inventory.outOfStock
            }{" "}
            out ·{" "}
            {
              inventory.critical
            }{" "}
            critical
          </small>
        </article>
      </section>

      <section className="dashboard-two-column">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>
                Last 7 Days
              </h2>

              <p className="table-secondary">
                {store?.name} net
                sales
              </p>
            </div>

            <Link
              href="/manager/reports"
              className="button secondary"
            >
              Full Reports
            </Link>
          </div>

          <div className="dashboard-sales-chart">
            {sevenDays.map(
              (row) => {
                const height =
                  row.netSales <=
                  0
                    ? 4
                    : Math.max(
                        8,
                        (row.netSales /
                          maxDailySales) *
                          100
                      );

                return (
                  <div
                    className="dashboard-chart-column"
                    key={
                      row.date
                    }
                  >
                    <span className="dashboard-chart-value">
                      {money(
                        row.netSales
                      )}
                    </span>

                    <div className="dashboard-chart-track">
                      <div
                        className="dashboard-chart-bar"
                        style={{
                          height:
                            `${height}%`
                        }}
                      />
                    </div>

                    <strong>
                      {shortDate(
                        row.date
                      )}
                    </strong>
                  </div>
                );
              }
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>
                Payment
                Breakdown
              </h2>

              <p className="table-secondary">
                Today ·{" "}
                {store?.name}
              </p>
            </div>
          </div>

          <div className="dashboard-list">
            {(today?.payments ??
              []).length ===
            0 ? (
              <div className="dashboard-empty">
                No payments
                recorded today.
              </div>
            ) : (
              today!.payments.map(
                (row) => (
                  <div
                    className="dashboard-list-row"
                    key={
                      row.paymentMethod
                    }
                  >
                    <div>
                      <strong>
                        {
                          row.paymentMethod
                        }
                      </strong>

                      <span>
                        {
                          row.transactions
                        }{" "}
                        transactions
                      </span>
                    </div>

                    <strong>
                      {money(
                        row.amount
                      )}
                    </strong>
                  </div>
                )
              )
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-two-column">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>
                Top Products
                Today
              </h2>

              <p className="table-secondary">
                {store?.name}
              </p>
            </div>

            <Link
              href="/manager/sales"
              className="button secondary"
            >
              Sales History
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    Product
                  </th>
                  <th>
                    SKU
                  </th>
                  <th>
                    Units
                  </th>
                  <th>
                    Revenue
                  </th>
                </tr>
              </thead>

              <tbody>
                {(today?.topProducts ??
                  [])
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (row) => (
                      <tr
                        key={
                          row.productId
                        }
                      >
                        <td>
                          <strong>
                            {
                              row.name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            row.sku
                          }
                        </td>

                        <td>
                          {
                            row.quantity
                          }
                        </td>

                        <td>
                          {money(
                            row.revenue
                          )}
                        </td>
                      </tr>
                    )
                  )}

                {(today?.topProducts ??
                  [])
                  .length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        4
                      }
                      style={{
                        textAlign:
                          "center",
                        padding:
                          34
                      }}
                    >
                      No product
                      sales today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>
                Inventory
                Alerts
              </h2>

              <p className="table-secondary">
                {store?.name}
              </p>
            </div>

            <Link
              href="/manager/alerts"
              className="button secondary"
            >
              View All
            </Link>
          </div>

          <div className="dashboard-list">
            {inventory
              .alerts
              .length ===
            0 ? (
              <div className="dashboard-empty">
                Inventory levels
                look good.
              </div>
            ) : (
              inventory.alerts
                .slice(
                  0,
                  8
                )
                .map(
                  ({
                    product,
                    status
                  }) => (
                    <div
                      className="dashboard-list-row"
                      key={
                        product.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            product.name
                          }
                        </strong>

                        <span>
                          {
                            product.sku
                          }{" "}
                          · Minimum{" "}
                          {
                            product.minimumStock
                          }
                        </span>
                      </div>

                      <div className="dashboard-stock-side">
                        <span
                          className={`inventory-alert-badge alert-${status
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >
                          {
                            status
                          }
                        </span>

                        <strong>
                          {
                            product.stock
                          }
                        </strong>
                      </div>
                    </div>
                  )
                )
            )}
          </div>
        </article>
      </section>
    </>
  );
}
