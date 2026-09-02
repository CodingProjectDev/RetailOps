"use client";

import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type Payment = "CASH" | "CARD" | "OTHER";
type Product = {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  sellingPrice: number;
  stock: number;
};
type CartLine = Product & { quantity: number };
type Receipt = {
  number: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  payment: Payment;
  date: Date;
};

type PrinterSettings = {
  paperWidth: "58" | "80";
  autoPrint: boolean;
  showSku: boolean;
  showBarcode: boolean;
  storeName: string;
  storeSubtitle: string;
  footerMessage: string;
};

const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperWidth: "80",
  autoPrint: false,
  showSku: true,
  showBarcode: false,
  storeName: "RETAILOPS MART",
  storeSubtitle: "Convenience Store",
  footerMessage: "THANK YOU!"
};

const PRINTER_SETTINGS_KEY = "retailops-printer-settings";

function loadPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PRINTER_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(PRINTER_SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_PRINTER_SETTINGS;
    }

    return {
      ...DEFAULT_PRINTER_SETTINGS,
      ...JSON.parse(raw)
    };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

const PRODUCT_BY_BARCODE = gql`
  query PosProductByBarcode(
    $storeId: String!
    $barcode: String!
  ) {
    productByBarcode(
      storeId: $storeId
      barcode: $barcode
    ) {
      id
      name
      barcode
      sku
      sellingPrice
      stock
    }
  }
`;


const POS_CURRENT_SHIFT = gql`
  query PosCurrentShift(
    $storeId: String!
  ) {
    currentShift(
      storeId: $storeId
    ) {
      id
      shiftNumber
      status
      openingCash
      expectedCash
      transactionCount
      openedAt
    }
  }
`;

const COMPLETE_SALE = gql`
  mutation PosCompleteSale($input: CompleteSaleInput!) {
    completeSale(input: $input) {
      id
      receiptNumber
      status
      subtotal
      tax
      total
      completedAt
    }
  }
`;

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message.replace("GraphQL error: ", "");
  return "Something went wrong";
}

export function PosTerminal() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("Ready to scan");
  const [payment, setPayment] = useState<Payment>("CARD");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [printerSettings, setPrinterSettings] =
    useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: shiftData,
    loading: shiftLoading,
    error: shiftError,
    refetch: refetchShift
  } = useQuery<{
    currentShift: {
      id: string;
      shiftNumber: string;
      status: string;
      openingCash: number;
      expectedCash: number;
      transactionCount: number;
      openedAt: string;
    } | null;
  }>(POS_CURRENT_SHIFT, {
    variables: {
      storeId: storeId ?? ""
    },
    skip: !storeId,
    fetchPolicy: "network-only"
  });

  const activeShift = shiftData?.currentShift ?? null;

  const [lookupProduct, lookupState] = useLazyQuery<{ productByBarcode: Product | null }>(PRODUCT_BY_BARCODE, {
    fetchPolicy: "network-only"
  });
  const [completeSaleMutation, completeState] = useMutation<{
    completeSale: {
      receiptNumber: string;
      subtotal: number;
      tax: number;
      total: number;
      completedAt: string;
    };
  }>(COMPLETE_SALE);

  useEffect(() => {
    setPrinterSettings(loadPrinterSettings());
    inputRef.current?.focus();

    function syncPrinterSettings() {
      setPrinterSettings(loadPrinterSettings());
    }

    window.addEventListener("storage", syncPrinterSettings);

    return () => {
      window.removeEventListener("storage", syncPrinterSettings);
    };
  }, []);

  useEffect(() => {
    setCart([]);
    setReceipt(null);
    setBarcode("");
    setMessage(
      store
        ? `Ready to scan at ${store.name}`
        : "Select a store"
    );
    inputRef.current?.focus();
  }, [storeId, store?.name]);

  useEffect(() => {
    if (!receipt || !printerSettings.autoPrint) {
      return;
    }

    // Wait until React renders the receipt before opening the print dialog.
    const timer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [receipt, printerSettings.autoPrint]);

  const estimatedSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.sellingPrice * line.quantity, 0),
    [cart]
  );
  const estimatedTax = Number((estimatedSubtotal * 0.0825).toFixed(2));
  const estimatedTotal = Number((estimatedSubtotal + estimatedTax).toFixed(2));

  async function scan(code: string) {
    const clean = code.trim();
    if (!clean) return;

    try {
      setMessage(`Looking up ${clean}…`);
      if (!storeId) {
        setMessage("Select a store first.");
        return;
      }

      const result = await lookupProduct({
        variables: {
          storeId,
          barcode: clean
        }
      });
      const product = result.data?.productByBarcode;

      if (!product) {
        setMessage(`Product not found: ${clean}`);
        return;
      }
      if (product.stock < 1) {
        setMessage(`${product.name} is out of stock`);
        return;
      }

      setCart((current) => {
        const existing = current.find((line) => line.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            setMessage(`Only ${product.stock} ${product.name} available`);
            return current;
          }
          return current.map((line) =>
            line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
          );
        }
        return [...current, { ...product, quantity: 1 }];
      });
      setMessage(`${product.name} added`);
    } catch (error) {
      setMessage(messageFromError(error));
    }
  }

  async function submitScan(event: FormEvent) {
    event.preventDefault();
    await scan(barcode);
    setBarcode("");
    inputRef.current?.focus();
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.id !== id) return [line];
        const next = line.quantity + delta;
        if (next <= 0) return [];
        if (next > line.stock) {
          setMessage(`Only ${line.stock} ${line.name} available`);
          return [line];
        }
        return [{ ...line, quantity: next }];
      })
    );
  }

  function voidCart() {
    setCart([]);
    setMessage("Open transaction voided. Inventory was not changed.");
    inputRef.current?.focus();
  }

  async function completeSale() {
    if (!cart.length) {
      setMessage("Cart is empty");
      return;
    }

    if (!storeId) {
      setMessage("Select a store first.");
      return;
    }

    const receiptLines = cart.map((line) => ({ ...line }));

    try {
      setMessage("Completing sale…");
      const result = await completeSaleMutation({
        variables: {
          input: {
            storeId,
            paymentMethod: payment,
            items: cart.map((line) => ({ productId: line.id, quantity: line.quantity }))
          }
        }
      });

      const sale = result.data?.completeSale;
      if (!sale) throw new Error("Sale was not returned by the API");

      setReceipt({
        number: sale.receiptNumber,
        lines: receiptLines,
        subtotal: sale.subtotal,
        tax: sale.tax,
        total: sale.total,
        payment,
        date: new Date(sale.completedAt)
      });
      setCart([]);
      setMessage("Sale completed. Inventory and shift totals were updated.");
      await refetchShift();
    } catch (error) {
      setMessage(messageFromError(error));
    }
  }

  if (shiftLoading) {
    return <section className="panel shift-message">Checking register shift…</section>;
  }

  if (shiftError) {
    return <section className="panel shift-error">Unable to verify shift: {shiftError.message}</section>;
  }

  if (!activeShift) {
    return (
      <>
        <section className="store-page-banner">
          <div>
            <span>POS REGISTER</span>
            <strong>{store?.name}</strong>
            <small>Open a shift at this store before checkout.</small>
          </div>
        </section>

        <section className="panel pos-shift-required">
        <p className="eyebrow">SHIFT REQUIRED</p>
        <h2>Open your register before checkout</h2>
        <p>
          RetailOps will not process a sale until you start a shift. This keeps
          every transaction attached to the correct cashier and cash drawer.
        </p>
        <Link href="/employee/shift" className="button primary">
          Start My Shift
        </Link>
      </section>
      </>
    );
  }

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>POS REGISTER</span>
          <strong>{store?.name}</strong>
          <small>Scans, stock checks and checkout are isolated to this store.</small>
        </div>
      </section>

      <section className="pos-active-shift-bar">
        <div>
          <span>Active shift</span>
          <strong>{activeShift.shiftNumber}</strong>
        </div>
        <div>
          <span>Expected cash</span>
          <strong>${activeShift.expectedCash.toFixed(2)}</strong>
        </div>
        <div>
          <span>Transactions</span>
          <strong>{activeShift.transactionCount}</strong>
        </div>
        <div className="pos-shift-actions">
          <Link href="/employee/shift" className="button secondary">View Shift</Link>
          <Link href="/employee/printer" className="button secondary">Printer Setup</Link>
        </div>
      </section>

      <div className="pos-layout">
      <section className="pos-main panel">
        <form onSubmit={submitScan} className="scan-box">
          <label htmlFor="barcode">Scan barcode</label>
          <div className="scan-row">
            <input
              ref={inputRef}
              id="barcode"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Scan or type barcode + Enter"
              autoComplete="off"
              disabled={lookupState.loading || completeState.loading}
            />
            <button className="button primary" type="submit" disabled={lookupState.loading || completeState.loading}>
              {lookupState.loading ? "Looking up…" : "Add"}
            </button>
          </div>
          <small>{message}</small>
        </form>

        <div className="cart-list">
          <div className="cart-head"><span>Item</span><span>Qty</span><span>Total</span></div>
          {cart.length === 0 ? (
            <div className="empty-cart">Scan a product barcode to start a real transaction.</div>
          ) : (
            cart.map((line) => (
              <div className="cart-line" key={line.id}>
                <div>
                  <strong>{line.name}</strong>
                  <small>{line.barcode} · ${line.sellingPrice.toFixed(2)} each · Stock {line.stock}</small>
                </div>
                <div className="qty-control">
                  <button type="button" onClick={() => changeQuantity(line.id, -1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(line.id, 1)}>+</button>
                </div>
                <strong>${(line.sellingPrice * line.quantity).toFixed(2)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="checkout panel">
        <div><p className="eyebrow">CURRENT SALE</p><h2>Checkout</h2></div>
        <div className="totals">
          <div><span>Estimated subtotal</span><strong>${estimatedSubtotal.toFixed(2)}</strong></div>
          <div><span>Estimated tax 8.25%</span><strong>${estimatedTax.toFixed(2)}</strong></div>
          <div className="grand-total"><span>Estimated total</span><strong>${estimatedTotal.toFixed(2)}</strong></div>
        </div>
        <div className="payment-options">
          {(["CASH", "CARD", "OTHER"] as Payment[]).map((method) => (
            <button type="button" className={payment === method ? "active" : ""} onClick={() => setPayment(method)} key={method}>
              {method}
            </button>
          ))}
        </div>
        <button className="complete-button" onClick={completeSale} disabled={!cart.length || completeState.loading}>
          {completeState.loading ? "Completing…" : "Complete sale"}
        </button>
        <button className="void-button" onClick={voidCart} disabled={!cart.length || completeState.loading}>Void open cart</button>
        <p className="checkout-note">Inventory changes only after the backend successfully completes the sale.</p>
      </aside>

      {receipt && (
        <ReceiptModal
          receipt={receipt}
          printerSettings={printerSettings}
          onClose={() => {
            setReceipt(null);
            inputRef.current?.focus();
          }}
        />
      )}
      </div>
    </>
  );
}

function ReceiptModal({
  receipt,
  printerSettings,
  onClose
}: {
  receipt: Receipt;
  printerSettings: PrinterSettings;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="receipt-modal">
        <div
          className={`receipt-paper thermal-receipt receipt-${printerSettings.paperWidth}`}
          id="receipt-print-area"
        >
          <h2>{printerSettings.storeName}</h2>

          {printerSettings.storeSubtitle && (
            <p>{printerSettings.storeSubtitle}</p>
          )}

          <hr />

          {receipt.lines.map((line) => (
            <div className="receipt-line" key={line.id}>
              <span>
                {line.name}

                <small>
                  {line.quantity} x ${line.sellingPrice.toFixed(2)}
                </small>

                {printerSettings.showSku && (
                  <small>SKU: {line.sku}</small>
                )}

                {printerSettings.showBarcode && (
                  <small>Barcode: {line.barcode}</small>
                )}
              </span>

              <strong>
                ${(line.quantity * line.sellingPrice).toFixed(2)}
              </strong>
            </div>
          ))}

          <hr />

          <div className="receipt-line">
            <span>Subtotal</span>
            <strong>${receipt.subtotal.toFixed(2)}</strong>
          </div>

          <div className="receipt-line">
            <span>Tax</span>
            <strong>${receipt.tax.toFixed(2)}</strong>
          </div>

          <div className="receipt-line total">
            <span>TOTAL</span>
            <strong>${receipt.total.toFixed(2)}</strong>
          </div>

          <hr />

          <p>Payment: {receipt.payment}</p>
          <p>Receipt: {receipt.number}</p>
          <p>{receipt.date.toLocaleString()}</p>

          {printerSettings.footerMessage && (
            <p className="thank-you">
              {printerSettings.footerMessage}
            </p>
          )}
        </div>

        <div className="modal-actions no-print">
          <button
            className="button secondary"
            onClick={onClose}
          >
            Close
          </button>

          <Link
            href="/employee/printer"
            className="button secondary"
          >
            Printer Setup
          </Link>

          <button
            className="button primary"
            onClick={() => window.print()}
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
