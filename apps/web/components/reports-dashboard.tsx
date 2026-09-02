"use client";

import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type PaymentRow = {
  paymentMethod: string;
  amount: number;
  transactions: number;
};

type ProductRow = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
};

type CategoryRow = {
  category: string;
  quantity: number;
  revenue: number;
};

type DailyRow = {
  date: string;
  netSales: number;
  transactions: number;
  itemsSold: number;
};

type Report = {
  grossSales: number;
  refunds: number;
  netSales: number;
  taxCollected: number;
  discounts: number;
  transactions: number;
  itemsSold: number;
  averageTransaction: number;
  payments: PaymentRow[];
  topProducts: ProductRow[];
  categories: CategoryRow[];
  dailySales: DailyRow[];
};

const SALES_REPORT = gql`
  query SalesReport($filter: ReportFilterInput!) {
    salesReport(filter: $filter) {
      grossSales
      refunds
      netSales
      taxCollected
      discounts
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

      categories {
        category
        quantity
        revenue
      }

      dailySales {
        date
        netSales
        transactions
        itemsSold
      }
    }
  }
`;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function inputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeForPreset(preset: string) {
  const now = new Date();
  const from = new Date(now);

  if (preset === "TODAY") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "7_DAYS") {
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (preset === "30_DAYS") {
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  } else if (preset === "THIS_MONTH") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }

  return {
    from: inputDate(from),
    to: inputDate(now)
  };
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ReportsDashboard() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const initial = rangeForPreset("30_DAYS");

  const [preset, setPreset] = useState("30_DAYS");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const [runReport, { data, loading, error }] = useLazyQuery<{
    salesReport: Report;
  }>(SALES_REPORT, {
    fetchPolicy: "network-only"
  });

  const report = data?.salesReport;

  function variables(
    fromValue = from,
    toValue = to
  ) {
    return {
      filter: {
        storeId: storeId ?? "",
        from: new Date(`${fromValue}T00:00:00`).toISOString(),
        to: new Date(`${toValue}T23:59:59.999`).toISOString()
      }
    };
  }

  function isAbortError(error: unknown) {
    return (
      error instanceof Error &&
      (
        error.name === "AbortError" ||
        error.message.toLowerCase().includes("aborted")
      )
    );
  }

  async function executeReport(
    fromValue = from,
    toValue = to
  ) {
    if (!storeId) return;

    try {
      await runReport({
        variables: variables(
          fromValue,
          toValue
        )
      });
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("RetailOps report request failed:", error);
    }
  }

  async function refresh() {
    await executeReport();
  }

  useEffect(() => {
    if (!storeId) return;

    void executeReport(
      from,
      to
    );

    // Rerun when the current store changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function applyPreset(value: string) {
    setPreset(value);

    if (value !== "CUSTOM") {
      const range = rangeForPreset(value);
      setFrom(range.from);
      setTo(range.to);

      void executeReport(
        range.from,
        range.to
      );
    }
  }

  const bestProduct = useMemo(
    () => report?.topProducts?.[0] ?? null,
    [report]
  );

  function exportSummary() {
    if (!report) return;

    downloadCsv(
      `retailops-${store?.code ?? "store"}-report-${from}-to-${to}.csv`,
      [
        ["RetailOps Sales Report"],
        ["Store", store?.name ?? ""],
        ["Store Code", store?.code ?? ""],
        ["From", from],
        ["To", to],
        [],
        ["Metric", "Value"],
        ["Gross Sales", report.grossSales.toFixed(2)],
        ["Refunds", report.refunds.toFixed(2)],
        ["Net Sales", report.netSales.toFixed(2)],
        ["Tax Collected", report.taxCollected.toFixed(2)],
        ["Discounts", report.discounts.toFixed(2)],
        ["Transactions", report.transactions],
        ["Items Sold", report.itemsSold],
        ["Average Transaction", report.averageTransaction.toFixed(2)],
        [],
        ["Payment Method", "Net Amount", "Transactions"],
        ...report.payments.map((row) => [
          row.paymentMethod,
          row.amount.toFixed(2),
          row.transactions
        ]),
        [],
        ["Top Products"],
        ["Product", "SKU", "Quantity", "Revenue"],
        ...report.topProducts.map((row) => [
          row.name,
          row.sku,
          row.quantity,
          row.revenue.toFixed(2)
        ]),
        [],
        ["Category", "Quantity", "Revenue"],
        ...report.categories.map((row) => [
          row.category,
          row.quantity,
          row.revenue.toFixed(2)
        ]),
        [],
        ["Daily Sales"],
        ["Date", "Net Sales", "Transactions", "Items Sold"],
        ...report.dailySales.map((row) => [
          row.date,
          row.netSales.toFixed(2),
          row.transactions,
          row.itemsSold
        ])
      ]
    );
  }

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>REPORT LOCATION</span>
          <strong>{store?.name}</strong>
          <small>Every metric and CSV export below is store-specific.</small>
        </div>
      </section>

      <section className="panel reports-filter-panel">
        <div className="reports-filters">
          <select value={preset} onChange={(event) => applyPreset(event.target.value)}>
            <option value="TODAY">Today</option>
            <option value="7_DAYS">Last 7 days</option>
            <option value="30_DAYS">Last 30 days</option>
            <option value="THIS_MONTH">This month</option>
            <option value="CUSTOM">Custom</option>
          </select>

          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setPreset("CUSTOM");
                setFrom(event.target.value);
              }}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={to}
              onChange={(event) => {
                setPreset("CUSTOM");
                setTo(event.target.value);
              }}
            />
          </label>

          <button className="button primary" type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Loading…" : "Run Report"}
          </button>

          <button className="button secondary" type="button" onClick={exportSummary} disabled={!report}>
            Export CSV
          </button>
        </div>
      </section>

      {error && !isAbortError(error) && (
        <section className="panel shift-error">
          Failed to load report: {error.message}
        </section>
      )}

      {report && (
        <>
          <section className="reports-stat-grid">
            <article className="reports-stat-card">
              <span>Net Sales</span>
              <strong>{money(report.netSales)}</strong>
              <small>Gross {money(report.grossSales)}</small>
            </article>

            <article className="reports-stat-card">
              <span>Transactions</span>
              <strong>{report.transactions}</strong>
              <small>Avg {money(report.averageTransaction)}</small>
            </article>

            <article className="reports-stat-card">
              <span>Items Sold</span>
              <strong>{report.itemsSold}</strong>
              <small>{bestProduct ? `Top: ${bestProduct.name}` : "No sales"}</small>
            </article>

            <article className="reports-stat-card">
              <span>Refunds</span>
              <strong>{money(report.refunds)}</strong>
              <small>Recorded refunds</small>
            </article>

            <article className="reports-stat-card">
              <span>Tax Collected</span>
              <strong>{money(report.taxCollected)}</strong>
              <small>Discounts {money(report.discounts)}</small>
            </article>
          </section>

          <section className="reports-two-column">
            <article className="panel">
              <div className="panel-head">
                <h2>Payment Breakdown</h2>
                <span>Net</span>
              </div>

              <div className="report-list">
                {report.payments.length === 0 ? (
                  <div className="report-row">No payment activity.</div>
                ) : (
                  report.payments.map((row) => (
                    <div className="report-row" key={row.paymentMethod}>
                      <strong>{row.paymentMethod}</strong>
                      <span>{row.transactions} txns</span>
                      <strong>{money(row.amount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-head">
                <h2>Sales by Category</h2>
                <span>Revenue</span>
              </div>

              <div className="report-list">
                {report.categories.length === 0 ? (
                  <div className="report-row">No category sales.</div>
                ) : (
                  report.categories.map((row) => (
                    <div className="report-row" key={row.category}>
                      <strong>{row.category}</strong>
                      <span>{row.quantity} units</span>
                      <strong>{money(row.revenue)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="reports-two-column">
            <article className="panel">
              <div className="panel-head">
                <h2>Top Products</h2>
                <span>Units</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Units</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: 30 }}>
                          No product sales.
                        </td>
                      </tr>
                    ) : (
                      report.topProducts.map((row) => (
                        <tr key={row.productId}>
                          <td><strong>{row.name}</strong></td>
                          <td>{row.sku}</td>
                          <td>{row.quantity}</td>
                          <td>{money(row.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel-head">
                <h2>Daily Sales</h2>
                <span>Net</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sales</th>
                      <th>Txns</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailySales.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: 30 }}>
                          No sales in this range.
                        </td>
                      </tr>
                    ) : (
                      report.dailySales.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{money(row.netSales)}</td>
                          <td>{row.transactions}</td>
                          <td>{row.itemsSold}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}
