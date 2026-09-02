"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { FormEvent, useMemo, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type SaleItem = {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  sku: string;
  quantity: number;
  refundedQuantity: number;
  remainingRefundableQuantity: number;
  unitPrice: number;
  tax: number;
  discount: number;
  lineTotal: number;
};

type RefundItemHistory = {
  id: string;
  saleItemId: string;
  productName: string;
  quantity: number;
  amount: number;
  restock: boolean;
};

type RefundHistory = {
  id: string;
  refundNumber: string;
  amount: number;
  reason: string;
  createdByName: string;
  createdAt: string;
  items: RefundItemHistory[];
};

type Sale = {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  voidedByName?: string | null;
  refundedAmount: number;
  refunds: RefundHistory[];
  items: SaleItem[];
};

type Cashier = { id: string; name: string };

type FilterForm = {
  search: string;
  from: string;
  to: string;
  cashierId: string;
  paymentMethod: string;
  status: string;
  minTotal: string;
  maxTotal: string;
};

type RefundSelection = Record<
  string,
  {
    quantity: number;
    restock: boolean;
  }
>;

const SALES = gql`
  query ManagerSales(
    $storeId: String!
    $filter: SalesFilterInput
  ) {
    sales(
      storeId: $storeId
      filter: $filter
    ) {
      id
      receiptNumber
      cashierId
      cashierName
      status
      subtotal
      tax
      discount
      total
      paymentMethod
      createdAt
      completedAt
      voidedAt
      voidReason
      voidedByName
      refundedAmount
      refunds {
        id
        refundNumber
        amount
        reason
        createdByName
        createdAt
        items {
          id
          saleItemId
          productName
          quantity
          amount
          restock
        }
      }
      items {
        id
        productId
        productName
        barcode
        sku
        quantity
        refundedQuantity
        remainingRefundableQuantity
        unitPrice
        tax
        discount
        lineTotal
      }
    }
    salesCashiers(
      storeId: $storeId
    ) {
      id
      name
    }
  }
`;

const VOID_SALE = gql`
  mutation VoidSale($input: VoidSaleInput!) {
    voidSale(input: $input) {
      id
      receiptNumber
      status
      voidedAt
      voidReason
      voidedByName
    }
  }
`;

const REFUND_SALE = gql`
  mutation RefundSale($input: RefundSaleInput!) {
    refundSale(input: $input) {
      id
      receiptNumber
      status
      refundedAmount
    }
  }
`;

const emptyFilters: FilterForm = {
  search: "",
  from: "",
  to: "",
  cashierId: "",
  paymentMethod: "",
  status: "",
  minTotal: "",
  maxTotal: ""
};

function makeVariables(filters: FilterForm) {
  const filter: Record<string, string | number> = {};
  if (filters.search.trim()) filter.search = filters.search.trim();
  if (filters.cashierId) filter.cashierId = filters.cashierId;
  if (filters.paymentMethod) filter.paymentMethod = filters.paymentMethod;
  if (filters.status) filter.status = filters.status;
  if (filters.from) filter.from = new Date(`${filters.from}T00:00:00`).toISOString();
  if (filters.to) filter.to = new Date(`${filters.to}T23:59:59.999`).toISOString();
  if (filters.minTotal !== "") filter.minTotal = Number(filters.minTotal);
  if (filters.maxTotal !== "") filter.maxTotal = Number(filters.maxTotal);
  return { filter };
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "pill success";
  if (status === "VOIDED" || status === "REFUNDED") return "pill danger";
  if (status === "PARTIALLY_REFUNDED") return "pill warning";
  return "pill";
}

export function SalesHistory() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [draft, setDraft] = useState<FilterForm>(emptyFilters);
  const [applied, setApplied] = useState<FilterForm>(emptyFilters);
  const [selected, setSelected] = useState<Sale | null>(null);

  const variables = useMemo(
    () => ({
      storeId: storeId ?? "",
      ...makeVariables(applied)
    }),
    [storeId, applied]
  );
  const { data, loading, error, refetch } = useQuery<{
    sales: Sale[];
    salesCashiers: Cashier[];
  }>(SALES, {
    variables,
    fetchPolicy: "network-only"
  });

  const sales = data?.sales ?? [];
  const cashiers = data?.salesCashiers ?? [];

  const totalItems = sales.reduce(
    (sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const netSales = sales.reduce((sum, sale) => {
    if (sale.status === "VOIDED") return sum;
    return sum + Math.max(0, sale.total - sale.refundedAmount);
  }, 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    setApplied({ ...draft });
  }

  function clear() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
  }

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>SALES LOCATION</span>
          <strong>{store?.name}</strong>
          <small>Sales, refunds and voids below are limited to this store.</small>
        </div>
      </section>

      <section className="sales-summary-grid">
        <div className="panel sales-summary-card">
          <span>Matching sales</span>
          <strong>{sales.length}</strong>
        </div>
        <div className="panel sales-summary-card">
          <span>Original units</span>
          <strong>{totalItems}</strong>
        </div>
        <div className="panel sales-summary-card">
          <span>Net sales after refunds</span>
          <strong>{money(netSales)}</strong>
        </div>
      </section>

      <section className="panel sales-panel">
        <form className="sales-filter-grid" onSubmit={submit}>
          <label className="sales-search-field">
            Search
            <input
              value={draft.search}
              onChange={(event) =>
                setDraft({ ...draft, search: event.target.value })
              }
              placeholder="Receipt, product, barcode, SKU or cashier"
            />
          </label>

          <label>
            From
            <input
              type="date"
              value={draft.from}
              onChange={(event) =>
                setDraft({ ...draft, from: event.target.value })
              }
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={draft.to}
              onChange={(event) =>
                setDraft({ ...draft, to: event.target.value })
              }
            />
          </label>

          <label>
            Cashier
            <select
              value={draft.cashierId}
              onChange={(event) =>
                setDraft({ ...draft, cashierId: event.target.value })
              }
            >
              <option value="">All cashiers</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Payment
            <select
              value={draft.paymentMethod}
              onChange={(event) =>
                setDraft({ ...draft, paymentMethod: event.target.value })
              }
            >
              <option value="">All payments</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value })
              }
            >
              <option value="">All statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOIDED">Voided</option>
              <option value="PARTIALLY_REFUNDED">Partially refunded</option>
              <option value="REFUNDED">Refunded</option>
              <option value="OPEN">Open</option>
            </select>
          </label>

          <label>
            Min total
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.minTotal}
              onChange={(event) =>
                setDraft({ ...draft, minTotal: event.target.value })
              }
              placeholder="$0.00"
            />
          </label>

          <label>
            Max total
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.maxTotal}
              onChange={(event) =>
                setDraft({ ...draft, maxTotal: event.target.value })
              }
              placeholder="$500.00"
            />
          </label>

          <div className="sales-filter-actions">
            <button
              className="button secondary"
              type="button"
              onClick={clear}
            >
              Clear
            </button>
            <button className="button primary" type="submit">
              Search sales
            </button>
          </div>
        </form>

        {error && <div className="form-error">{error.message}</div>}

        <div className="sales-table-head">
          <div>
            <h2>Transactions</h2>
            <p>Up to the latest 250 matching sales.</p>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>

        <div className="table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date / time</th>
                <th>Cashier</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Refunded</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading sales…</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8}>No sales match these filters.</td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const itemCount = sale.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );

                  return (
                    <tr
                      key={sale.id}
                      className="sales-clickable-row"
                      onClick={() => setSelected(sale)}
                    >
                      <td>
                        <button className="receipt-link" type="button">
                          {sale.receiptNumber}
                        </button>
                      </td>
                      <td>{new Date(sale.createdAt).toLocaleString()}</td>
                      <td>{sale.cashierName}</td>
                      <td>{itemCount}</td>
                      <td>{sale.paymentMethod}</td>
                      <td>
                        <span className={statusClass(sale.status)}>
                          {sale.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        {sale.refundedAmount > 0
                          ? money(sale.refundedAmount)
                          : "—"}
                      </td>
                      <td>
                        <strong>{money(sale.total)}</strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <SaleDetail
          sale={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            setSelected(null);
            await refetch();
          }}
        />
      )}
    </>
  );
}

function SaleDetail({
  sale,
  onClose,
  onChanged
}: {
  sale: Sale;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [showVoid, setShowVoid] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");

  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState("");
  const [refundSelection, setRefundSelection] =
    useState<RefundSelection>({});

  const [voidSale, { loading: voiding }] = useMutation(VOID_SALE);
  const [refundSale, { loading: refunding }] = useMutation(REFUND_SALE);

  const canRefund =
    (sale.status === "COMPLETED" ||
      sale.status === "PARTIALLY_REFUNDED") &&
    sale.items.some((item) => item.remainingRefundableQuantity > 0);

  function openRefundPanel() {
    const initial: RefundSelection = {};

    for (const item of sale.items) {
      initial[item.id] = {
        quantity: 0,
        restock: true
      };
    }

    setRefundSelection(initial);
    setRefundReason("");
    setRefundError("");
    setShowVoid(false);
    setShowRefund(true);
  }

  function itemRefundedAmount(itemId: string) {
    return sale.refunds.reduce(
      (sum, refund) =>
        sum +
        refund.items
          .filter((item) => item.saleItemId === itemId)
          .reduce((itemSum, item) => itemSum + item.amount, 0),
      0
    );
  }

  const estimatedRefund = sale.items.reduce((sum, item) => {
    const selection = refundSelection[item.id];
    const quantity = selection?.quantity ?? 0;

    if (quantity <= 0) return sum;

    const alreadyRefundedAmount = itemRefundedAmount(item.id);
    const remainingAmount = Math.max(
      0,
      Number((item.lineTotal - alreadyRefundedAmount).toFixed(2))
    );

    const proportional = Number(
      ((item.lineTotal / item.quantity) * quantity).toFixed(2)
    );

    const amount =
      quantity === item.remainingRefundableQuantity
        ? remainingAmount
        : Math.min(proportional, remainingAmount);

    return sum + amount;
  }, 0);

  async function confirmVoid() {
    const cleanReason = voidReason.trim();

    if (cleanReason.length < 3) {
      setVoidError("Enter a clear reason for voiding this sale.");
      return;
    }

    setVoidError("");

    try {
      await voidSale({
        variables: {
          input: {
            saleId: sale.id,
            reason: cleanReason
          }
        }
      });

      await onChanged();
    } catch (error) {
      setVoidError(
        error instanceof Error
          ? error.message
          : "Unable to void this sale."
      );
    }
  }

  async function confirmRefund() {
    const cleanReason = refundReason.trim();

    if (cleanReason.length < 3) {
      setRefundError("Enter a clear reason for the refund.");
      return;
    }

    const items = sale.items
      .map((item) => {
        const selected = refundSelection[item.id];

        return {
          saleItemId: item.id,
          quantity: selected?.quantity ?? 0,
          restock: selected?.restock ?? true
        };
      })
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setRefundError("Select at least one item and quantity to refund.");
      return;
    }

    setRefundError("");

    try {
      await refundSale({
        variables: {
          input: {
            saleId: sale.id,
            reason: cleanReason,
            items
          }
        }
      });

      await onChanged();
    } catch (error) {
      setRefundError(
        error instanceof Error
          ? error.message
          : "Unable to process the refund."
      );
    }
  }

  return (
    <div
      className="modal-backdrop sales-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="sales-detail-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sales-detail-head">
          <div>
            <p className="eyebrow">TRANSACTION</p>
            <h2>{sale.receiptNumber}</h2>
            <p>
              {new Date(sale.createdAt).toLocaleString()} ·{" "}
              {sale.cashierName}
            </p>
          </div>

          <button
            className="button secondary"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="sales-detail-meta">
          <span>
            <small>Status</small>
            <strong>{sale.status.replaceAll("_", " ")}</strong>
          </span>
          <span>
            <small>Payment</small>
            <strong>{sale.paymentMethod}</strong>
          </span>
          <span>
            <small>Items</small>
            <strong>
              {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
            </strong>
          </span>
          <span>
            <small>Refunded</small>
            <strong>
              {sale.refundedAmount > 0
                ? money(sale.refundedAmount)
                : money(0)}
            </strong>
          </span>
        </div>

        {sale.status === "VOIDED" && (
          <div className="voided-sale-info">
            <strong>Sale voided</strong>
            <span>{sale.voidReason || "No reason recorded"}</span>
            {sale.voidedByName && (
              <small>Voided by {sale.voidedByName}</small>
            )}
            {sale.voidedAt && (
              <small>{new Date(sale.voidedAt).toLocaleString()}</small>
            )}
          </div>
        )}

        <div className="sales-detail-items">
          {sale.items.map((item) => (
            <div className="sales-detail-item" key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <small>
                  {item.barcode} · {item.sku}
                </small>
                <small>
                  {item.quantity} × {money(item.unitPrice)}
                </small>

                {item.refundedQuantity > 0 && (
                  <small className="refund-item-note">
                    Refunded: {item.refundedQuantity} · Remaining:{" "}
                    {item.remainingRefundableQuantity}
                  </small>
                )}
              </div>

              <strong>{money(item.lineTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="sales-detail-totals">
          <div>
            <span>Subtotal</span>
            <strong>{money(sale.subtotal)}</strong>
          </div>
          <div>
            <span>Tax</span>
            <strong>{money(sale.tax)}</strong>
          </div>

          {sale.discount > 0 && (
            <div>
              <span>Discount</span>
              <strong>−{money(sale.discount)}</strong>
            </div>
          )}

          <div className="sales-detail-grand">
            <span>Original total</span>
            <strong>{money(sale.total)}</strong>
          </div>

          {sale.refundedAmount > 0 && (
            <>
              <div className="sales-refund-total">
                <span>Refunded</span>
                <strong>−{money(sale.refundedAmount)}</strong>
              </div>
              <div className="sales-detail-grand">
                <span>Net retained</span>
                <strong>
                  {money(Math.max(0, sale.total - sale.refundedAmount))}
                </strong>
              </div>
            </>
          )}
        </div>

        {sale.refunds.length > 0 && (
          <section className="refund-history">
            <div className="refund-history-head">
              <h3>Refund history</h3>
              <span>{sale.refunds.length}</span>
            </div>

            {sale.refunds.map((refund) => (
              <article className="refund-history-card" key={refund.id}>
                <div className="refund-history-card-head">
                  <div>
                    <strong>{refund.refundNumber}</strong>
                    <small>
                      {new Date(refund.createdAt).toLocaleString()} ·{" "}
                      {refund.createdByName}
                    </small>
                  </div>
                  <strong>{money(refund.amount)}</strong>
                </div>

                <p>{refund.reason}</p>

                <div className="refund-history-items">
                  {refund.items.map((item) => (
                    <div key={item.id}>
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span>
                        {item.restock ? "Restocked" : "Not restocked"} ·{" "}
                        {money(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {!showVoid && !showRefund && (
          <div className="sale-action-row">
            {canRefund && (
              <button
                className="button refund-button"
                type="button"
                onClick={openRefundPanel}
              >
                Refund Items
              </button>
            )}

            {sale.status === "COMPLETED" && (
              <button
                className="button danger-button"
                type="button"
                onClick={() => {
                  setShowRefund(false);
                  setShowVoid(true);
                }}
              >
                Void Sale
              </button>
            )}
          </div>
        )}

        {sale.status === "COMPLETED" && showVoid && (
          <div className="void-sale-box">
            <div>
              <h3>Void {sale.receiptNumber}?</h3>
              <p>
                This restores every sold quantity to inventory and marks the
                entire transaction VOIDED. Use Refund Items instead for a
                legitimate customer return.
              </p>
            </div>

            <label>
              Void reason *
              <textarea
                value={voidReason}
                onChange={(event) => setVoidReason(event.target.value)}
                placeholder="Example: Customer was charged twice"
                rows={3}
                autoFocus
              />
            </label>

            {voidError && <div className="form-error">{voidError}</div>}

            <div className="void-sale-actions">
              <button
                className="button secondary"
                type="button"
                disabled={voiding}
                onClick={() => {
                  setShowVoid(false);
                  setVoidReason("");
                  setVoidError("");
                }}
              >
                Cancel
              </button>

              <button
                className="button danger-button"
                type="button"
                disabled={voiding}
                onClick={confirmVoid}
              >
                {voiding ? "Voiding…" : "Confirm Void"}
              </button>
            </div>
          </div>
        )}

        {showRefund && canRefund && (
          <div className="refund-sale-box">
            <div className="refund-sale-head">
              <div>
                <h3>Refund items</h3>
                <p>
                  Choose only the quantities the customer is returning.
                  Restocking is optional for each item.
                </p>
              </div>

              <strong>{money(estimatedRefund)}</strong>
            </div>

            <div className="refund-selection-list">
              {sale.items.map((item) => {
                const selection = refundSelection[item.id] ?? {
                  quantity: 0,
                  restock: true
                };

                const unavailable = item.remainingRefundableQuantity <= 0;

                return (
                  <div
                    className={`refund-selection-row ${
                      unavailable ? "refund-selection-disabled" : ""
                    }`}
                    key={item.id}
                  >
                    <div className="refund-selection-product">
                      <strong>{item.productName}</strong>
                      <small>
                        Bought {item.quantity} · Already refunded{" "}
                        {item.refundedQuantity} · Available{" "}
                        {item.remainingRefundableQuantity}
                      </small>
                    </div>

                    <label>
                      Qty
                      <input
                        type="number"
                        min={0}
                        max={item.remainingRefundableQuantity}
                        step={1}
                        disabled={unavailable}
                        value={selection.quantity}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          const quantity = Math.max(
                            0,
                            Math.min(
                              item.remainingRefundableQuantity,
                              Number.isFinite(raw) ? Math.floor(raw) : 0
                            )
                          );

                          setRefundSelection((current) => ({
                            ...current,
                            [item.id]: {
                              ...(current[item.id] ?? {
                                quantity: 0,
                                restock: true
                              }),
                              quantity
                            }
                          }));
                        }}
                      />
                    </label>

                    <label className="refund-restock-check">
                      <input
                        type="checkbox"
                        disabled={unavailable || selection.quantity <= 0}
                        checked={selection.restock}
                        onChange={(event) =>
                          setRefundSelection((current) => ({
                            ...current,
                            [item.id]: {
                              ...(current[item.id] ?? {
                                quantity: 0,
                                restock: true
                              }),
                              restock: event.target.checked
                            }
                          }))
                        }
                      />
                      Restock
                    </label>
                  </div>
                );
              })}
            </div>

            <label className="refund-reason-label">
              Refund reason *
              <textarea
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                placeholder="Example: Customer returned unopened item"
                rows={3}
              />
            </label>

            <div className="refund-help">
              <strong>Restock checked:</strong> inventory increases.{" "}
              <strong>Restock unchecked:</strong> the customer is refunded but
              inventory does not increase.
            </div>

            {refundError && <div className="form-error">{refundError}</div>}

            <div className="refund-sale-actions">
              <button
                className="button secondary"
                type="button"
                disabled={refunding}
                onClick={() => {
                  setShowRefund(false);
                  setRefundReason("");
                  setRefundError("");
                  setRefundSelection({});
                }}
              >
                Cancel
              </button>

              <button
                className="button refund-button"
                type="button"
                disabled={refunding || estimatedRefund <= 0}
                onClick={confirmRefund}
              >
                {refunding
                  ? "Processing…"
                  : `Refund ${money(estimatedRefund)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
