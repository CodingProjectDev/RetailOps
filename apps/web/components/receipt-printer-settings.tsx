"use client";

import { useEffect, useState } from "react";

type PrinterSettings = {
  paperWidth: "58" | "80";
  autoPrint: boolean;
  showSku: boolean;
  showBarcode: boolean;
  storeName: string;
  storeSubtitle: string;
  footerMessage: string;
};

const STORAGE_KEY = "retailops-printer-settings";

const defaults: PrinterSettings = {
  paperWidth: "80",
  autoPrint: false,
  showSku: true,
  showBarcode: false,
  storeName: "RETAILOPS MART",
  storeSubtitle: "Convenience Store",
  footerMessage: "THANK YOU!"
};

function readSettings(): PrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaults;
    }

    return {
      ...defaults,
      ...JSON.parse(raw)
    };
  } catch {
    return defaults;
  }
}

export function ReceiptPrinterSettings() {
  const [settings, setSettings] =
    useState<PrinterSettings>(defaults);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  function update<K extends keyof PrinterSettings>(
    key: K,
    value: PrinterSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));

    setMessage("");
  }

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setMessage(
      "Printer settings saved on this register."
    );
  }

  function reset() {
    setSettings(defaults);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaults)
    );

    setMessage(
      "Printer settings reset to defaults."
    );
  }

  function testPrint() {
    save();

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  return (
    <div className="printer-settings-grid">
      <section className="panel printer-settings-panel">
        <div className="panel-head">
          <div>
            <h2>Receipt Printer</h2>

            <p className="table-secondary">
              These settings are saved on this register/browser.
            </p>
          </div>
        </div>

        <div className="printer-form">
          <label>
            Paper width
            <select
              value={settings.paperWidth}
              onChange={(event) =>
                update(
                  "paperWidth",
                  event.target.value as "58" | "80"
                )
              }
            >
              <option value="80">
                80 mm thermal receipt
              </option>

              <option value="58">
                58 mm thermal receipt
              </option>
            </select>
          </label>

          <label>
            Store name
            <input
              value={settings.storeName}
              onChange={(event) =>
                update(
                  "storeName",
                  event.target.value
                )
              }
              maxLength={60}
            />
          </label>

          <label>
            Receipt subtitle
            <input
              value={settings.storeSubtitle}
              onChange={(event) =>
                update(
                  "storeSubtitle",
                  event.target.value
                )
              }
              maxLength={80}
            />
          </label>

          <label>
            Footer message
            <input
              value={settings.footerMessage}
              onChange={(event) =>
                update(
                  "footerMessage",
                  event.target.value
                )
              }
              maxLength={80}
            />
          </label>

          <label className="printer-check">
            <input
              type="checkbox"
              checked={settings.autoPrint}
              onChange={(event) =>
                update(
                  "autoPrint",
                  event.target.checked
                )
              }
            />

            <span>
              Automatically open print dialog after a completed sale
            </span>
          </label>

          <label className="printer-check">
            <input
              type="checkbox"
              checked={settings.showSku}
              onChange={(event) =>
                update(
                  "showSku",
                  event.target.checked
                )
              }
            />

            <span>Show SKU on receipt</span>
          </label>

          <label className="printer-check">
            <input
              type="checkbox"
              checked={settings.showBarcode}
              onChange={(event) =>
                update(
                  "showBarcode",
                  event.target.checked
                )
              }
            />

            <span>Show barcode on receipt</span>
          </label>

          {message && (
            <div className="printer-success">
              {message}
            </div>
          )}

          <div className="printer-actions no-print">
            <button
              type="button"
              className="button secondary"
              onClick={reset}
            >
              Reset
            </button>

            <button
              type="button"
              className="button primary"
              onClick={save}
            >
              Save Settings
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={testPrint}
            >
              Test Print
            </button>
          </div>
        </div>
      </section>

      <section className="panel printer-preview-panel">
        <div className="panel-head no-print">
          <div>
            <h2>Receipt Preview</h2>

            <p className="table-secondary">
              Preview for this register.
            </p>
          </div>
        </div>

        <div
          id="receipt-print-area"
          className={`receipt-paper thermal-receipt receipt-${settings.paperWidth}`}
        >
          <h2>{settings.storeName}</h2>

          {settings.storeSubtitle && (
            <p>{settings.storeSubtitle}</p>
          )}

          <hr />

          <div className="receipt-line">
            <span>
              Coca-Cola 20oz
              <small>2 x $2.49</small>

              {settings.showSku && (
                <small>SKU: DRINK-001</small>
              )}

              {settings.showBarcode && (
                <small>
                  Barcode: 049000028911
                </small>
              )}
            </span>

            <strong>$4.98</strong>
          </div>

          <div className="receipt-line">
            <span>
              Chips
              <small>1 x $1.99</small>

              {settings.showSku && (
                <small>SKU: SNACK-001</small>
              )}

              {settings.showBarcode && (
                <small>
                  Barcode: 028400090896
                </small>
              )}
            </span>

            <strong>$1.99</strong>
          </div>

          <hr />

          <div className="receipt-line">
            <span>Subtotal</span>
            <strong>$6.97</strong>
          </div>

          <div className="receipt-line">
            <span>Tax</span>
            <strong>$0.58</strong>
          </div>

          <div className="receipt-line total">
            <span>TOTAL</span>
            <strong>$7.55</strong>
          </div>

          <hr />

          <p>Payment: CARD</p>
          <p>Receipt: TEST-0001</p>
          <p>{new Date().toLocaleString()}</p>

          {settings.footerMessage && (
            <p className="thank-you">
              {settings.footerMessage}
            </p>
          )}
        </div>
      </section>

      <section className="panel printer-browser-note no-print">
        <h3>Browser printing limitation</h3>

        <p>
          RetailOps can format 58 mm and 80 mm thermal receipts and
          automatically open the browser print dialog after checkout.
          A normal browser cannot silently print or directly send ESC/POS
          commands to a USB printer without a local print bridge, desktop
          application, or manufacturer driver integration.
        </p>

        <p>
          The sale is always saved before printing. Closing the print dialog,
          disconnecting the printer, or a paper jam will not undo the sale.
        </p>
      </section>
    </div>
  );
}
