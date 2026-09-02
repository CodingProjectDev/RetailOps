"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentStore } from "@/components/store-context";

type Supplier = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  stock: number;
};

type PurchaseOrderItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantityOrdered: number;
  quantityReceived: number;
  remainingQuantity: number;
  unitCost: number;
  lineTotal: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalCost: number;
  notes?: string | null;
  createdByName: string;
  createdAt: string;
  orderedAt?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: PurchaseOrderItem[];
};

type DraftLine = {
  productId: string;
  quantity: string;
  unitCost: string;
};

const PURCHASING_DATA = gql`
  query PurchasingManagerData(
    $storeId: String!
  ) {
    purchaseOrders(
      storeId: $storeId
    ) {
      id
      poNumber
      supplierId
      supplierName
      status
      totalCost
      notes
      createdByName
      createdAt
      orderedAt
      receivedAt
      cancelledAt
      cancelReason
      items {
        id
        productId
        productName
        sku
        barcode
        quantityOrdered
        quantityReceived
        remainingQuantity
        unitCost
        lineTotal
      }
    }

    suppliers(active: true) {
      id
      name
    }

    products(
      storeId: $storeId
      active: true
    ) {
      id
      name
      sku
      barcode
      costPrice
      stock
    }
  }
`;

const CREATE_PO = gql`
  mutation CreatePurchaseOrder(
    $storeId: String!
    $input: CreatePurchaseOrderInput!
  ) {
    createPurchaseOrder(
      storeId: $storeId
      input: $input
    ) {
      id
      poNumber
      status
    }
  }
`;

const PLACE_PO = gql`
  mutation PlacePurchaseOrder($purchaseOrderId: String!) {
    placePurchaseOrder(purchaseOrderId: $purchaseOrderId) {
      id
      status
      orderedAt
    }
  }
`;

const RECEIVE_PO = gql`
  mutation ReceivePurchaseOrder($input: ReceivePurchaseOrderInput!) {
    receivePurchaseOrder(input: $input) {
      id
      status
      receivedAt
      items {
        id
        quantityReceived
        remainingQuantity
      }
    }
  }
`;

const CANCEL_PO = gql`
  mutation CancelPurchaseOrder($input: CancelPurchaseOrderInput!) {
    cancelPurchaseOrder(input: $input) {
      id
      status
      cancelledAt
      cancelReason
    }
  }
`;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function blankLine(): DraftLine {
  return {
    productId: "",
    quantity: "1",
    unitCost: "0.00"
  };
}

export function PurchaseOrdersManager() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const searchParams = useSearchParams();
  const prefillProductId = searchParams.get("productId");
  const prefillQty = searchParams.get("qty");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, loading, error, refetch } = useQuery<{
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
  }>(PURCHASING_DATA, {
    variables: {
      storeId: storeId ?? ""
    },
    skip: !storeId,
    fetchPolicy: "network-only"
  });

  const [createPo, createState] = useMutation(CREATE_PO);
  const [placePo, placeState] = useMutation(PLACE_PO);
  const [receivePo, receiveState] = useMutation(RECEIVE_PO);
  const [cancelPo, cancelState] = useMutation(CANCEL_PO);

  useEffect(() => {
    if (!prefillProductId || !data?.products?.length) return;

    const product = data.products.find(
      (row) => row.id === prefillProductId
    );

    if (!product) return;

    const qty = Number(prefillQty);

    setSupplierId("");
    setNotes(
      `Reorder generated from inventory alert for ${product.name}`
    );
    setLines([
      {
        productId: product.id,
        quantity:
          Number.isFinite(qty) && qty > 0
            ? String(Math.floor(qty))
            : "1",
        unitCost: product.costPrice.toFixed(2)
      }
    ]);
    setActionError("");
    setShowCreate(true);
  }, [prefillProductId, prefillQty, data?.products]);

  const rows = useMemo(() => {
    const value = search.trim().toLowerCase();

    return (data?.purchaseOrders ?? []).filter((po) => {
      const matchesSearch =
        !value ||
        po.poNumber.toLowerCase().includes(value) ||
        po.supplierName.toLowerCase().includes(value);

      const matchesStatus = status === "ALL" || po.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const estimatedTotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity);
    const cost = Number(line.unitCost);
    return sum + (Number.isFinite(qty) && Number.isFinite(cost) ? qty * cost : 0);
  }, 0);

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  function chooseProduct(index: number, productId: string) {
    const product = data?.products.find((row) => row.id === productId);
    updateLine(index, {
      productId,
      unitCost: product ? product.costPrice.toFixed(2) : "0.00"
    });
  }

  function resetCreate() {
    setSupplierId("");
    setNotes("");
    setLines([blankLine()]);
    setActionError("");
  }

  async function createPurchaseOrder() {
    if (!supplierId) {
      setActionError("Select a supplier.");
      return;
    }

    const payload = lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost)
      }));

    if (!payload.length) {
      setActionError("Add at least one product.");
      return;
    }

    try {
      setActionError("");
      if (!storeId) {
        setActionError("Select a store first.");
        return;
      }

      await createPo({
        variables: {
          storeId,
          input: {
            supplierId,
            items: payload,
            notes: notes.trim() || null
          }
        }
      });
      setShowCreate(false);
      resetCreate();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to create purchase order.");
    }
  }

  async function placePurchaseOrder(po: PurchaseOrder) {
    try {
      setActionError("");
      await placePo({ variables: { purchaseOrderId: po.id } });
      setSelected(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to place purchase order.");
    }
  }

  async function receivePurchaseOrder(po: PurchaseOrder) {
    const items = po.items.map((item) => ({
      purchaseOrderItemId: item.id,
      quantity: Number(receiveQty[item.id] || 0)
    }));

    if (!items.some((item) => item.quantity > 0)) {
      setActionError("Enter at least one received quantity.");
      return;
    }

    try {
      setActionError("");
      await receivePo({
        variables: {
          input: {
            purchaseOrderId: po.id,
            items
          }
        }
      });
      setSelected(null);
      setReceiveQty({});
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to receive purchase order.");
    }
  }

  async function cancelPurchaseOrder(po: PurchaseOrder) {
    if (cancelReason.trim().length < 3) {
      setActionError("Enter a clear cancellation reason.");
      return;
    }

    try {
      setActionError("");
      await cancelPo({
        variables: {
          input: {
            purchaseOrderId: po.id,
            reason: cancelReason.trim()
          }
        }
      });
      setSelected(null);
      setCancelReason("");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to cancel purchase order.");
    }
  }

  const busy =
    createState.loading ||
    placeState.loading ||
    receiveState.loading ||
    cancelState.loading;

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>PURCHASING LOCATION</span>
          <strong>{store?.name}</strong>
          <small>Purchase orders receive inventory only into this store.</small>
        </div>
      </section>
      <section className="panel">
        <div className="purchasing-toolbar">
          <input
            type="search"
            placeholder="Search PO number or supplier"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            className="button primary"
            type="button"
            onClick={() => {
              resetCreate();
              setShowCreate(true);
            }}
          >
            + New Purchase Order
          </button>
        </div>

        {loading && <div className="shift-message">Loading purchase orders…</div>}
        {error && <div className="shift-error">Failed to load purchase orders: {error.message}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Total Cost</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 36 }}>
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  rows.map((po) => {
                    const ordered = po.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
                    const received = po.items.reduce((sum, item) => sum + item.quantityReceived, 0);

                    return (
                      <tr key={po.id}>
                        <td><strong>{po.poNumber}</strong></td>
                        <td>{po.supplierName}</td>
                        <td>
                          <span className={`po-status po-${po.status.toLowerCase().replaceAll("_", "-")}`}>
                            {po.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>{received} / {ordered}</td>
                        <td>{money(po.totalCost)}</td>
                        <td>{new Date(po.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => {
                              setSelected(po);
                              setReceiveQty({});
                              setCancelReason("");
                              setActionError("");
                            }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate && (
        <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}>
          <div className="po-modal po-create-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">NEW PURCHASE ORDER</p>
                <h2>Create PO</h2>
              </div>
              <button className="button secondary" type="button" onClick={() => setShowCreate(false)}>
                Close
              </button>
            </div>

            <div className="purchasing-form">
              <label>
                Supplier *
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">Select supplier</option>
                  {(data?.suppliers ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="po-lines">
              <div className="po-line po-line-head">
                <span>Product</span>
                <span>Qty</span>
                <span>Unit Cost</span>
                <span />
              </div>

              {lines.map((line, index) => (
                <div className="po-line" key={index}>
                  <select
                    value={line.productId}
                    onChange={(event) => chooseProduct(index, event.target.value)}
                  >
                    <option value="">Select product</option>
                    {(data?.products ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.sku} · stock {product.stock}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) => updateLine(index, { quantity: event.target.value })}
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) => updateLine(index, { unitCost: event.target.value })}
                  />

                  <button
                    className="button secondary"
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="po-create-footer">
              <button className="button secondary" type="button" onClick={() => setLines((current) => [...current, blankLine()])}>
                + Add Line
              </button>
              <strong>Estimated total: {money(estimatedTotal)}</strong>
            </div>

            {actionError && <div className="form-error">{actionError}</div>}

            <div className="form-actions">
              <button className="button primary" disabled={busy} type="button" onClick={createPurchaseOrder}>
                {createState.loading ? "Creating…" : "Create Draft PO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="po-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">PURCHASE ORDER</p>
                <h2>{selected.poNumber}</h2>
                <span>{selected.supplierName} · {selected.status.replaceAll("_", " ")}</span>
              </div>
              <button className="button secondary" type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <div className="po-detail-meta">
              <span><small>Total</small><strong>{money(selected.totalCost)}</strong></span>
              <span><small>Created by</small><strong>{selected.createdByName}</strong></span>
              <span><small>Created</small><strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></span>
            </div>

            <div className="po-items-list">
              {selected.items.map((item) => (
                <div className="po-item-row" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.sku} · {item.barcode}</small>
                  </div>
                  <span>{item.quantityReceived} / {item.quantityOrdered} received</span>
                  <span>{money(item.unitCost)}</span>
                  <strong>{money(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            {(selected.status === "ORDERED" || selected.status === "PARTIALLY_RECEIVED") && (
              <div className="po-receive-box">
                <h3>Receive Inventory</h3>
                <p>Enter only the quantities physically delivered now.</p>

                {selected.items.filter((item) => item.remainingQuantity > 0).map((item) => (
                  <label className="receive-row" key={item.id}>
                    <span>
                      <strong>{item.productName}</strong>
                      <small>{item.remainingQuantity} remaining</small>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={item.remainingQuantity}
                      step="1"
                      value={receiveQty[item.id] ?? "0"}
                      onChange={(event) =>
                        setReceiveQty((current) => ({
                          ...current,
                          [item.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                ))}

                <button
                  className="button primary"
                  type="button"
                  disabled={busy}
                  onClick={() => receivePurchaseOrder(selected)}
                >
                  {receiveState.loading ? "Receiving…" : "Receive Items"}
                </button>
              </div>
            )}

            {selected.status === "CANCELLED" && (
              <div className="po-cancelled-box">
                <strong>Cancelled</strong>
                <span>{selected.cancelReason}</span>
              </div>
            )}

            {actionError && <div className="form-error">{actionError}</div>}

            <div className="po-actions">
              {selected.status === "DRAFT" && (
                <button
                  className="button primary"
                  type="button"
                  disabled={busy}
                  onClick={() => placePurchaseOrder(selected)}
                >
                  {placeState.loading ? "Placing…" : "Place Order"}
                </button>
              )}

              {(selected.status === "DRAFT" || selected.status === "ORDERED") &&
                selected.items.every((item) => item.quantityReceived === 0) && (
                  <div className="po-cancel-controls">
                    <input
                      placeholder="Cancellation reason"
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                    <button
                      className="button danger-button"
                      type="button"
                      disabled={busy}
                      onClick={() => cancelPurchaseOrder(selected)}
                    >
                      {cancelState.loading ? "Cancelling…" : "Cancel PO"}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
