"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type PaymentRow = {
  paymentMethod: string;
  grossSales: number;
  refunds: number;
  netSales: number;
  transactions: number;
};

type ShiftRow = {
  id: string;
  shiftNumber: string;
  cashierName: string;
  status: string;
  openingCash: number;
  expectedCash: number;
  closingCash?: number | null;
  cashDifference?: number | null;
  grossSales: number;
  netSales: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  totalRefunds: number;
  cashRefunds: number;
  transactions: number;
  itemsSold: number;
  openedAt: string;
  closedAt?: string | null;
  forceCloseReason?: string | null;
};

type ClosingReport = {
  businessDate: string;
  timeZone: string;
  readyToClose: boolean;
  grossSales: number;
  refunds: number;
  netSales: number;
  transactions: number;
  itemsSold: number;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  cashVariance: number;
  shortage: number;
  overage: number;
  shiftCount: number;
  openShiftCount: number;
  closedShiftCount: number;
  forceClosedShiftCount: number;
  payments: PaymentRow[];
  shifts: ShiftRow[];
};

const DAILY_CLOSING = gql`
  query DailyClosing($input: DailyClosingInput!) {
    dailyClosingReport(input: $input) {
      businessDate
      timeZone
      readyToClose

      grossSales
      refunds
      netSales
      transactions
      itemsSold

      openingCash
      expectedCash
      actualCash
      cashVariance
      shortage
      overage

      shiftCount
      openShiftCount
      closedShiftCount
      forceClosedShiftCount

      payments {
        paymentMethod
        grossSales
        refunds
        netSales
        transactions
      }

      shifts {
        id
        shiftNumber
        cashierName
        status
        openingCash
        expectedCash
        closingCash
        cashDifference
        grossSales
        netSales
        cashSales
        cardSales
        otherSales
        totalRefunds
        cashRefunds
        transactions
        itemsSold
        openedAt
        closedAt
        forceCloseReason
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

function todayInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function csvCell(
  value: string | number
) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll(
      '"',
      '""'
    )}"`;
  }

  return text;
}

function downloadCsv(
  filename: string,
  rows: Array<
    Array<string | number>
  >
) {
  const csv = rows
    .map((row) =>
      row
        .map(csvCell)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function formatDateTime(
  value?: string | null
) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  ).format(new Date(value));
}

function varianceLabel(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (value === 0) {
    return money(0);
  }

  return value > 0
    ? `+${money(value)}`
    : money(value);
}

export function DailyClosing() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [date, setDate] =
    useState(todayInput());

  const { data, loading, error, refetch } =
    useQuery<{
      dailyClosingReport: ClosingReport;
    }>(DAILY_CLOSING, {
      variables: {
        input: {
          storeId: storeId ?? "",
          date
        }
      },
      skip: !storeId,
      fetchPolicy: "network-only"
    });

  const report =
    data?.dailyClosingReport;

  const cashPayment =
    useMemo(
      () =>
        report?.payments.find(
          (row) =>
            row.paymentMethod ===
            "CASH"
        ),
      [report]
    );

  function exportClosing() {
    if (!report) return;

    downloadCsv(
      `retailops-${store?.code ?? "store"}-closing-${report.businessDate}.csv`,
      [
        [
          "RetailOps Daily Closing Report"
        ],
        [
          "Store",
          store?.name ?? ""
        ],
        [
          "Store Code",
          store?.code ?? ""
        ],
        [
          "Business Date",
          report.businessDate
        ],
        [
          "Store Time Zone",
          report.timeZone
        ],
        [
          "Ready To Close",
          report.readyToClose
            ? "YES"
            : "NO"
        ],
        [],
        ["Sales Summary"],
        [
          "Gross Sales",
          report.grossSales.toFixed(2)
        ],
        [
          "Refunds",
          report.refunds.toFixed(2)
        ],
        [
          "Net Sales",
          report.netSales.toFixed(2)
        ],
        [
          "Transactions",
          report.transactions
        ],
        [
          "Items Sold",
          report.itemsSold
        ],
        [],
        ["Cash Drawer"],
        [
          "Opening Cash",
          report.openingCash.toFixed(2)
        ],
        [
          "Expected Cash",
          report.expectedCash.toFixed(2)
        ],
        [
          "Actual Cash",
          report.actualCash.toFixed(2)
        ],
        [
          "Variance",
          report.cashVariance.toFixed(2)
        ],
        [
          "Shortage",
          report.shortage.toFixed(2)
        ],
        [
          "Overage",
          report.overage.toFixed(2)
        ],
        [],
        [
          "Payment Method",
          "Gross Sales",
          "Refunds",
          "Net Sales",
          "Transactions"
        ],
        ...report.payments.map(
          (row) => [
            row.paymentMethod,
            row.grossSales.toFixed(2),
            row.refunds.toFixed(2),
            row.netSales.toFixed(2),
            row.transactions
          ]
        ),
        [],
        ["Shift Reconciliation"],
        [
          "Shift",
          "Cashier",
          "Status",
          "Opening",
          "Expected",
          "Actual",
          "Variance",
          "Net Sales",
          "Transactions",
          "Items",
          "Opened",
          "Closed"
        ],
        ...report.shifts.map(
          (row) => [
            row.shiftNumber,
            row.cashierName,
            row.status,
            row.openingCash.toFixed(2),
            row.expectedCash.toFixed(2),
            row.closingCash?.toFixed(2) ??
              "",
            row.cashDifference?.toFixed(2) ??
              "",
            row.netSales.toFixed(2),
            row.transactions,
            row.itemsSold,
            formatDateTime(
              row.openedAt
            ),
            formatDateTime(
              row.closedAt
            )
          ]
        )
      ]
    );
  }

  return (
    <>
      <section className="store-page-banner no-print">
        <div>
          <span>DAILY CLOSING LOCATION</span>
          <strong>{store?.name}</strong>
          <small>Cash drawer and payment reconciliation are limited to this store.</small>
        </div>
      </section>

      <section className="panel closing-toolbar no-print">
        <div className="closing-date-control">
          <label>
            Business Date
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <div className="closing-toolbar-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              void refetch()
            }
            disabled={loading}
          >
            {loading
              ? "Refreshing…"
              : "Refresh"}
          </button>

          <button
            type="button"
            className="button secondary"
            onClick={exportClosing}
            disabled={!report}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="button primary"
            onClick={() =>
              window.print()
            }
            disabled={!report}
          >
            Print Closing Report
          </button>
        </div>
      </section>

      {error && (
        <section className="panel shift-error">
          Failed to load daily closing:{" "}
          {error.message}
        </section>
      )}

      {report && (
        <>
          <section
            className={`closing-status-banner ${
              report.readyToClose
                ? "closing-ready"
                : "closing-blocked"
            }`}
          >
            <div>
              <strong>
                {report.readyToClose
                  ? "All shifts are closed"
                  : `${report.openShiftCount} shift${
                      report.openShiftCount ===
                      1
                        ? ""
                        : "s"
                    } still open`}
              </strong>

              <span>
                Business date{" "}
                {report.businessDate} ·{" "}
                {report.timeZone}
              </span>
            </div>

            <span>
              {report.readyToClose
                ? "READY"
                : "ACTION REQUIRED"}
            </span>
          </section>

          <section className="closing-kpi-grid">
            <article className="closing-kpi-card">
              <span>Net Sales</span>
              <strong>
                {money(
                  report.netSales
                )}
              </strong>
              <small>
                Gross{" "}
                {money(
                  report.grossSales
                )}
              </small>
            </article>

            <article className="closing-kpi-card">
              <span>Transactions</span>
              <strong>
                {
                  report.transactions
                }
              </strong>
              <small>
                {
                  report.itemsSold
                }{" "}
                items sold
              </small>
            </article>

            <article className="closing-kpi-card">
              <span>Refunds</span>
              <strong>
                {money(
                  report.refunds
                )}
              </strong>
              <small>
                Processed this day
              </small>
            </article>

            <article className="closing-kpi-card">
              <span>Cash Net Sales</span>
              <strong>
                {money(
                  cashPayment?.netSales ??
                    0
                )}
              </strong>
              <small>
                After cash refunds
              </small>
            </article>

            <article className="closing-kpi-card">
              <span>Cash Variance</span>
              <strong>
                {varianceLabel(
                  report.cashVariance
                )}
              </strong>
              <small>
                Short{" "}
                {money(
                  report.shortage
                )}{" "}
                · Over{" "}
                {money(
                  report.overage
                )}
              </small>
            </article>
          </section>

          <section className="closing-two-column">
            <article className="panel">
              <div className="panel-head">
                <div>
                  <h2>
                    Payment Reconciliation
                  </h2>
                  <p className="table-secondary">
                    Sales and refunds
                    processed on this
                    business date
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Method
                      </th>
                      <th>
                        Gross
                      </th>
                      <th>
                        Refunds
                      </th>
                      <th>
                        Net
                      </th>
                      <th>
                        Txns
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.payments.map(
                      (row) => (
                        <tr
                          key={
                            row.paymentMethod
                          }
                        >
                          <td>
                            <strong>
                              {
                                row.paymentMethod
                              }
                            </strong>
                          </td>

                          <td>
                            {money(
                              row.grossSales
                            )}
                          </td>

                          <td>
                            {money(
                              row.refunds
                            )}
                          </td>

                          <td>
                            <strong>
                              {money(
                                row.netSales
                              )}
                            </strong>
                          </td>

                          <td>
                            {
                              row.transactions
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel-head">
                <div>
                  <h2>
                    Cash Drawer
                  </h2>
                  <p className="table-secondary">
                    Closed and open
                    cashier shifts
                  </p>
                </div>
              </div>

              <div className="closing-cash-list">
                <div>
                  <span>
                    Opening Cash
                  </span>
                  <strong>
                    {money(
                      report.openingCash
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Expected Cash
                  </span>
                  <strong>
                    {money(
                      report.expectedCash
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Actual Cash
                  </span>
                  <strong>
                    {money(
                      report.actualCash
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Shortage
                  </span>
                  <strong>
                    {money(
                      report.shortage
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Overage
                  </span>
                  <strong>
                    {money(
                      report.overage
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Net Variance
                  </span>
                  <strong>
                    {varianceLabel(
                      report.cashVariance
                    )}
                  </strong>
                </div>
              </div>
            </article>
          </section>

          <section className="panel closing-shifts-panel">
            <div className="panel-head">
              <div>
                <h2>
                  Shift Reconciliation
                </h2>
                <p className="table-secondary">
                  {report.shiftCount}{" "}
                  shifts ·{" "}
                  {
                    report.closedShiftCount
                  }{" "}
                  closed ·{" "}
                  {
                    report.forceClosedShiftCount
                  }{" "}
                  force closed ·{" "}
                  {
                    report.openShiftCount
                  }{" "}
                  open
                </p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th>Cashier</th>
                    <th>Status</th>
                    <th>Net Sales</th>
                    <th>Opening</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Variance</th>
                    <th>Txns</th>
                    <th>Opened</th>
                    <th>Closed</th>
                  </tr>
                </thead>

                <tbody>
                  {report.shifts.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          textAlign:
                            "center",
                          padding: 36
                        }}
                      >
                        No shifts opened
                        on this business
                        date.
                      </td>
                    </tr>
                  ) : (
                    report.shifts.map(
                      (shift) => (
                        <tr
                          key={
                            shift.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                shift.shiftNumber
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              shift.cashierName
                            }
                          </td>

                          <td>
                            <span
                              className={`closing-shift-status status-${shift.status.toLowerCase().replaceAll(
                                "_",
                                "-"
                              )}`}
                            >
                              {
                                shift.status
                              }
                            </span>
                          </td>

                          <td>
                            {money(
                              shift.netSales
                            )}
                          </td>

                          <td>
                            {money(
                              shift.openingCash
                            )}
                          </td>

                          <td>
                            {money(
                              shift.expectedCash
                            )}
                          </td>

                          <td>
                            {shift.closingCash ===
                            null ||
                            shift.closingCash ===
                              undefined
                              ? "—"
                              : money(
                                  shift.closingCash
                                )}
                          </td>

                          <td>
                            {varianceLabel(
                              shift.cashDifference
                            )}
                          </td>

                          <td>
                            {
                              shift.transactions
                            }
                          </td>

                          <td>
                            {formatDateTime(
                              shift.openedAt
                            )}
                          </td>

                          <td>
                            {formatDateTime(
                              shift.closedAt
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
