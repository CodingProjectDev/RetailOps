"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { FormEvent, useMemo, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  brand?: string | null;
  categoryId: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  taxable: boolean;
  active: boolean;
  stock: number;
};
type Movement = {
  id: string;
  type: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string | null;
  createdByName: string;
  createdAt: string;
};

const PRODUCTS = gql`
  query ManagerProducts(
    $storeId: String!
    $search: String
    $categoryId: String
    $active: Boolean
  ) {
    products(
      storeId: $storeId
      search: $search
      categoryId: $categoryId
      active: $active
    ) {
      id name barcode sku brand categoryId categoryName costPrice sellingPrice
      minimumStock taxable active stock
    }
    categories { id name }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $storeId: String!
    $input: CreateProductInput!
  ) {
    createProduct(
      storeId: $storeId
      input: $input
    ) { id }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $storeId: String!
    $input: UpdateProductInput!
  ) {
    updateProduct(
      storeId: $storeId
      input: $input
    ) { id }
  }
`;

const ADJUST_INVENTORY = gql`
  mutation AdjustInventory(
    $storeId: String!
    $input: AdjustInventoryInput!
  ) {
    adjustInventory(
      storeId: $storeId
      input: $input
    ) {
      id quantityChange previousQuantity newQuantity reason createdByName createdAt
    }
  }
`;

const MOVEMENTS = gql`
  query ProductMovements(
    $storeId: String!
    $productId: String!
  ) {
    inventoryMovements(
      storeId: $storeId
      productId: $productId
    ) {
      id type quantityChange previousQuantity newQuantity reason createdByName createdAt
    }
  }
`;

const emptyForm = {
  name: "",
  barcode: "",
  sku: "",
  brand: "",
  categoryId: "",
  costPrice: "",
  sellingPrice: "",
  minimumStock: "5",
  startingQuantity: "0",
  taxable: true,
  active: true
};

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message.replace("GraphQL error: ", "");
  return "Something went wrong";
}

export function ProductManager() {
  const {
    storeId,
    store,
    loading: storeLoading
  } = useCurrentStore();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("active");
  const [modal, setModal] = useState<"add" | "edit" | "adjust" | "history" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [adjustment, setAdjustment] = useState({ quantityChange: "", reason: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeFilter = status === "all" ? undefined : status === "active";
  const variables = useMemo(
    () => ({
      storeId: storeId ?? "",
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      active: activeFilter
    }),
    [storeId, search, categoryId, activeFilter]
  );

  const { data, loading, refetch } = useQuery<{ products: Product[]; categories: Category[] }>(PRODUCTS, {
    variables,
    skip: !storeId,
    fetchPolicy: "network-only"
  });

  const movementQuery = useQuery<{ inventoryMovements: Movement[] }>(MOVEMENTS, {
    variables: {
      storeId: storeId ?? "",
      productId: selected?.id ?? ""
    },
    skip: !storeId || !selected || modal !== "history",
    fetchPolicy: "network-only"
  });

  const [createProduct, createState] = useMutation(CREATE_PRODUCT);
  const [updateProduct, updateState] = useMutation(UPDATE_PRODUCT);
  const [adjustInventory, adjustState] = useMutation(ADJUST_INVENTORY);

  const categories = data?.categories ?? [];
  const products = data?.products ?? [];

  function clearMessages() {
    setNotice("");
    setError("");
  }

  function openAdd() {
    clearMessages();
    setSelected(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setModal("add");
  }

  function openEdit(product: Product) {
    clearMessages();
    setSelected(product);
    setForm({
      name: product.name,
      barcode: product.barcode,
      sku: product.sku,
      brand: product.brand ?? "",
      categoryId: product.categoryId,
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      minimumStock: String(product.minimumStock),
      startingQuantity: String(product.stock),
      taxable: product.taxable,
      active: product.active
    });
    setModal("edit");
  }

  function openAdjust(product: Product) {
    clearMessages();
    setSelected(product);
    setAdjustment({ quantityChange: "", reason: "" });
    setModal("adjust");
  }

  function openHistory(product: Product) {
    clearMessages();
    setSelected(product);
    setModal("history");
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!storeId) {
      setError("Select a store first.");
      return;
    }

    try {
      if (modal === "add") {
        await createProduct({
          variables: {
            storeId,
            input: {
              name: form.name,
              barcode: form.barcode,
              sku: form.sku,
              brand: form.brand || undefined,
              categoryId: form.categoryId,
              costPrice: Number(form.costPrice),
              sellingPrice: Number(form.sellingPrice),
              minimumStock: Number(form.minimumStock),
              startingQuantity: Number(form.startingQuantity),
              taxable: form.taxable,
              active: form.active
            }
          }
        });
        setNotice("Product created successfully.");
      } else if (modal === "edit" && selected) {
        await updateProduct({
          variables: {
            storeId,
            input: {
              id: selected.id,
              name: form.name,
              barcode: form.barcode,
              sku: form.sku,
              brand: form.brand,
              categoryId: form.categoryId,
              costPrice: Number(form.costPrice),
              sellingPrice: Number(form.sellingPrice),
              minimumStock: Number(form.minimumStock),
              taxable: form.taxable,
              active: form.active
            }
          }
        });
        setNotice("Product updated successfully.");
      }

      setModal(null);
      await refetch();
    } catch (err) {
      setError(messageFromError(err));
    }
  }

  async function submitAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    clearMessages();

    if (!storeId) {
      setError("Select a store first.");
      return;
    }

    try {
      await adjustInventory({
        variables: {
          storeId,
          input: {
            productId: selected.id,
            quantityChange: Number(adjustment.quantityChange),
            reason: adjustment.reason
          }
        }
      });
      setNotice(`Inventory adjusted for ${selected.name}.`);
      setModal(null);
      await refetch();
    } catch (err) {
      setError(messageFromError(err));
    }
  }

  return (
    <>
      {notice && <div className="notice success-notice">{notice}</div>}
      {error && <div className="notice error-notice">{error}</div>}

      <section className="store-page-banner">
        <div>
          <span>PRODUCT STOCK LOCATION</span>
          <strong>{store?.name}</strong>
          <small>
            Product details are shared across the business; stock and movement history below are for this store.
          </small>
        </div>
      </section>

      <section className="panel product-panel">
        <div className="product-toolbar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, barcode, SKU or brand" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All status</option>
          </select>
          <button className="button primary" onClick={openAdd}>+ Add Product</button>
        </div>

        <div className="table-wrap">
          <table className="product-table">
            <thead>
              <tr><th>Product</th><th>Barcode / SKU</th><th>Category</th><th>Stock</th><th>Cost</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(loading || storeLoading) && <tr><td colSpan={8}>Loading products…</td></tr>}
              {!loading && !storeLoading && products.length === 0 && <tr><td colSpan={8}>No products found.</td></tr>}
              {products.map((product) => {
                const low = product.stock <= product.minimumStock;
                return (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong>{product.brand && <small className="cell-subtitle">{product.brand}</small>}</td>
                    <td>{product.barcode}<small className="cell-subtitle">{product.sku}</small></td>
                    <td>{product.categoryName}</td>
                    <td><strong>{product.stock}</strong>{low && <span className="stock-warning">Low stock</span>}</td>
                    <td>${product.costPrice.toFixed(2)}</td>
                    <td><strong>${product.sellingPrice.toFixed(2)}</strong></td>
                    <td><span className={`pill ${product.active ? "success" : "neutral"}`}>{product.active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => openEdit(product)}>Edit</button>
                        <button onClick={() => openAdjust(product)}>Adjust</button>
                        <button onClick={() => openHistory(product)}>History</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {(modal === "add" || modal === "edit") && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div className="manager-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <div><p className="eyebrow">PRODUCT</p><h2>{modal === "add" ? "Add product" : "Edit product"}</h2></div>
              <button className="icon-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={submitProduct} className="manager-form">
              <label>Product name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Brand<input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
              <label>Barcode<input required value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></label>
              <label>SKU<input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
              <label>Category<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label>Cost price<input required min="0" step="0.01" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></label>
              <label>Selling price<input required min="0" step="0.01" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></label>
              <label>Minimum stock<input required min="0" step="1" type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} /></label>
              {modal === "add" && <label>Starting quantity — {store?.name}<input required min="0" step="1" type="number" value={form.startingQuantity} onChange={(e) => setForm({ ...form, startingQuantity: e.target.value })} /></label>}
              {modal === "edit" && <div className="read-only-stock"><span>Current inventory</span><strong>{selected?.stock ?? 0}</strong><small>Use Adjust Inventory to change stock.</small></div>}
              <label className="check-row"><input type="checkbox" checked={form.taxable} onChange={(e) => setForm({ ...form, taxable: e.target.checked })} /> Taxable</label>
              <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
              {error && <div className="form-error">{error}</div>}
              <div className="manager-form-actions">
                <button type="button" className="button secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="button primary" disabled={createState.loading || updateState.loading}>{createState.loading || updateState.loading ? "Saving…" : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "adjust" && selected && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div className="manager-modal compact-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="manager-modal-head"><div><p className="eyebrow">INVENTORY</p><h2>Adjust {selected.name}</h2></div><button className="icon-close" onClick={() => setModal(null)}>×</button></div>
            <div className="inventory-summary"><span>Current stock</span><strong>{selected.stock}</strong></div>
            <form onSubmit={submitAdjustment} className="manager-form single-column">
              <label>Quantity change<input required step="1" type="number" placeholder="Example: 12 or -3" value={adjustment.quantityChange} onChange={(e) => setAdjustment({ ...adjustment, quantityChange: e.target.value })} /><small>Use a positive number to add stock and a negative number to remove it.</small></label>
              <label>Reason<textarea required rows={3} placeholder="Example: Physical inventory count correction" value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} /></label>
              {adjustment.quantityChange && Number.isFinite(Number(adjustment.quantityChange)) && <div className="adjustment-preview"><span>New stock</span><strong>{selected.stock + Number(adjustment.quantityChange)}</strong></div>}
              {error && <div className="form-error">{error}</div>}
              <div className="manager-form-actions"><button type="button" className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" disabled={adjustState.loading}>{adjustState.loading ? "Saving…" : "Save Adjustment"}</button></div>
            </form>
          </div>
        </div>
      )}

      {modal === "history" && selected && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div className="manager-modal history-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="manager-modal-head"><div><p className="eyebrow">AUDIT TRAIL</p><h2>{selected.name}</h2><p className="muted">Latest 30 inventory movements</p></div><button className="icon-close" onClick={() => setModal(null)}>×</button></div>
            <div className="movement-list">
              {movementQuery.loading && <p className="muted">Loading history…</p>}
              {!movementQuery.loading && (movementQuery.data?.inventoryMovements.length ?? 0) === 0 && <p className="muted">No inventory movements yet.</p>}
              {movementQuery.data?.inventoryMovements.map((movement) => (
                <div className="movement-row" key={movement.id}>
                  <div><strong>{movement.type.replaceAll("_", " ")}</strong><small>{new Date(movement.createdAt).toLocaleString()} · {movement.createdByName}</small><small>{movement.reason || "No reason"}</small></div>
                  <div className={movement.quantityChange > 0 ? "qty-positive" : "qty-negative"}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</div>
                  <div className="movement-balance">{movement.previousQuantity} → <strong>{movement.newQuantity}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
