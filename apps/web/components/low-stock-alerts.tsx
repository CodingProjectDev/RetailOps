"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  barcode: string;
  sku: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  stock: number;
  active: boolean;
};

type PurchaseOrderItem = {
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  remainingQuantity: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  supplierName: string;
  items: PurchaseOrderItem[];
};

const ALERTS_QUERY = gql`
  query LowStockAlerts(
    $storeId: String!
  ) {
    products(
      storeId: $storeId
      active: true
    ) {
      id
      name
      brand
      barcode
      sku
      categoryName
      costPrice
      sellingPrice
      minimumStock
      stock
      active
    }

    purchaseOrders(
      storeId: $storeId
    ) {
      id
      poNumber
      status
      supplierName
      items {
        productId
        quantityOrdered
        quantityReceived
        remainingQuantity
      }
    }
  }
`;

type AlertType = "ALL" | "OUT_OF_STOCK" | "CRITICAL" | "LOW_STOCK";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function statusFor(product: Product): Exclude<AlertType, "ALL"> | null {
  if (product.stock <= 0) return "OUT_OF_STOCK";

  const criticalThreshold = Math.max(1, Math.floor(product.minimumStock / 2));

  if (product.stock <= criticalThreshold) return "CRITICAL";
  if (product.stock <= product.minimumStock) return "LOW_STOCK";

  return null;
}

function suggestedQuantity(product: Product) {
  // Simple learning-version reorder target:
  // bring stock to 3× the configured minimum level.
  const target = Math.max(product.minimumStock * 3, product.minimumStock + 1);
  return Math.max(0, target - product.stock);
}

export function LowStockAlerts() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<AlertType>("ALL");
  const [category, setCategory] = useState("ALL");
  const [hideAlreadyOrdered, setHideAlreadyOrdered] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    products: Product[];
    purchaseOrders: PurchaseOrder[];
  }>(ALERTS_QUERY, {
    variables: {
      storeId: storeId ?? ""
    },
    skip: !storeId,
    fetchPolicy: "network-only"
  });

  const products = data?.products ?? [];
  const purchaseOrders = data?.purchaseOrders ?? [];

  const openOrderByProduct = useMemo(() => {
    const map = new Map<
      string,
      {
        totalRemaining: number;
        orders: Array<{
          poNumber: string;
          supplierName: string;
          remaining: number;
        }>;
      }
    >();

    for (const po of purchaseOrders) {
      if (
        !["ORDERED", "PARTIALLY_RECEIVED"].includes(po.status)
      ) {
        continue;
      }

      for (const item of po.items) {
        if (item.remainingQuantity <= 0) continue;

        const current = map.get(item.productId) ?? {
          totalRemaining: 0,
          orders: []
        };

        current.totalRemaining += item.remainingQuantity;
        current.orders.push({
          poNumber: po.poNumber,
          supplierName: po.supplierName,
          remaining: item.remainingQuantity
        });

        map.set(item.productId, current);
      }
    }

    return map;
  }, [purchaseOrders]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.categoryName)
            .filter(Boolean)
        )
      ).sort(),
    [products]
  );

  const alerts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products
      .map((product) => ({
        product,
        alertType: statusFor(product),
        suggestion: suggestedQuantity(product),
        openOrder: openOrderByProduct.get(product.id)
      }))
      .filter((row) => row.alertType !== null)
      .filter((row) => {
        const { product, alertType, openOrder } = row;

        const matchesSearch =
          !value ||
          product.name.toLowerCase().includes(value) ||
          product.barcode.toLowerCase().includes(value) ||
          product.sku.toLowerCase().includes(value) ||
          product.brand?.toLowerCase().includes(value);

        const matchesType =
          type === "ALL" || alertType === type;

        const matchesCategory =
          category === "ALL" ||
          product.categoryName === category;

        const matchesOrdered =
          !hideAlreadyOrdered || !openOrder;

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesOrdered
        );
      })
      .sort((a, b) => {
        const priority: Record<string, number> = {
          OUT_OF_STOCK: 0,
          CRITICAL: 1,
          LOW_STOCK: 2
        };

        const p =
          priority[a.alertType ?? "LOW_STOCK"] -
          priority[b.alertType ?? "LOW_STOCK"];

        if (p !== 0) return p;
        return a.product.stock - b.product.stock;
      });
  }, [
    products,
    search,
    type,
    category,
    hideAlreadyOrdered,
    openOrderByProduct
  ]);

  const stats = useMemo(() => {
    let out = 0;
    let critical = 0;
    let low = 0;
    let alreadyOrdered = 0;

    for (const product of products) {
      const status = statusFor(product);

      if (status === "OUT_OF_STOCK") out += 1;
      if (status === "CRITICAL") critical += 1;
      if (status === "LOW_STOCK") low += 1;
      if (status && openOrderByProduct.has(product.id)) {
        alreadyOrdered += 1;
      }
    }

    return {
      out,
      critical,
      low,
      alreadyOrdered,
      total: out + critical + low
    };
  }, [products, openOrderByProduct]);

  if (loading) {
    return <section className="panel shift-message">Loading inventory alerts…</section>;
  }

  if (error) {
    return (
      <section className="panel shift-error">
        Failed to load alerts: {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="alert-stat-grid">
        <article className="alert-stat-card">
          <span>Total Alerts</span>
          <strong>{stats.total}</strong>
        </article>

        <article className="alert-stat-card alert-stat-out">
          <span>Out of Stock</span>
          <strong>{stats.out}</strong>
        </article>

        <article className="alert-stat-card alert-stat-critical">
          <span>Critical</span>
          <strong>{stats.critical}</strong>
        </article>

        <article className="alert-stat-card alert-stat-low">
          <span>Low Stock</span>
          <strong>{stats.low}</strong>
        </article>

        <article className="alert-stat-card">
          <span>Already On Order</span>
          <strong>{stats.alreadyOrdered}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="alerts-toolbar">
          <input
            type="search"
            placeholder="Search product, barcode, SKU or brand"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as AlertType)
            }
          >
            <option value="ALL">All alerts</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="CRITICAL">Critical</option>
            <option value="LOW_STOCK">Low stock</option>
          </select>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="ALL">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="inline-check">
            <input
              type="checkbox"
              checked={hideAlreadyOrdered}
              onChange={(event) =>
                setHideAlreadyOrdered(event.target.checked)
              }
            />
            Hide items already ordered
          </label>

          <button
            className="button secondary"
            type="button"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Minimum</th>
                <th>Status</th>
                <th>Suggested Order</th>
                <th>Open PO</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 40
                    }}
                  >
                    No inventory alerts match these filters.
                  </td>
                </tr>
              ) : (
                alerts.map(
                  ({
                    product,
                    alertType,
                    suggestion,
                    openOrder
                  }) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <div className="table-secondary">
                          {product.sku} · {product.barcode}
                        </div>
                      </td>

                      <td>{product.categoryName}</td>

                      <td>
                        <strong>{product.stock}</strong>
                      </td>

                      <td>{product.minimumStock}</td>

                      <td>
                        <span
                          className={`inventory-alert-badge alert-${(
                            alertType ?? "LOW_STOCK"
                          ).toLowerCase().replaceAll("_", "-")}`}
                        >
                          {(alertType ?? "LOW_STOCK").replaceAll("_", " ")}
                        </span>
                      </td>

                      <td>
                        <strong>{suggestion}</strong>
                        <div className="table-secondary">
                          Est. {money(suggestion * product.costPrice)}
                        </div>
                      </td>

                      <td>
                        {openOrder ? (
                          <div className="open-po-note">
                            <strong>
                              {openOrder.totalRemaining} incoming
                            </strong>
                            {openOrder.orders
                              .slice(0, 2)
                              .map((order) => (
                                <small key={order.poNumber}>
                                  {order.poNumber} · {order.supplierName}
                                </small>
                              ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {openOrder ? (
                          <Link
                            href="/manager/purchase-orders"
                            className="button secondary"
                          >
                            View PO
                          </Link>
                        ) : (
                          <Link
                            href={`/manager/purchase-orders?productId=${encodeURIComponent(
                              product.id
                            )}&qty=${suggestion}`}
                            className="button primary"
                          >
                            Create PO
                          </Link>
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
  );
}
