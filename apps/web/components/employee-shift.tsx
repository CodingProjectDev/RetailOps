"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { FormEvent, useState } from "react";
import { useCurrentStore } from "@/components/store-context";

type Shift = {
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
  cashRefunds: number;
  totalRefunds: number;
  transactionCount: number;
  itemsSold: number;
  openedAt: string;
  closedAt?: string | null;
};

const CURRENT_SHIFT = gql`
  query EmployeeCurrentShift(
    $storeId: String!
  ) {
    currentShift(
      storeId: $storeId
    ) {
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
      cashRefunds
      totalRefunds
      transactionCount
      itemsSold
      openedAt
      closedAt
    }
  }
`;

const START_SHIFT = gql`
  mutation EmployeeStartShift($input: StartShiftInput!) {
    startShift(input: $input) {
      id
      shiftNumber
      status
      openingCash
      expectedCash
      openedAt
    }
  }
`;

const CLOSE_SHIFT = gql`
  mutation EmployeeCloseShift($input: CloseShiftInput!) {
    closeShift(input: $input) {
      id
      shiftNumber
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
      cashRefunds
      totalRefunds
      transactionCount
      itemsSold
      openedAt
      closedAt
    }
  }
`;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.replace("GraphQL error: ", "") : "Something went wrong";
}

export function EmployeeShift() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [openingCash, setOpeningCash] = useState("200.00");
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [lastClosed, setLastClosed] = useState<Shift | null>(null);

  const { data, loading, error, refetch } = useQuery<{ currentShift: Shift | null }>(
    CURRENT_SHIFT,
    {
      variables: {
        storeId: storeId ?? ""
      },
      skip: !storeId,
      fetchPolicy: "network-only"
    }
  );

  const [startShift, startState] = useMutation(START_SHIFT);
  const [closeShift, closeState] = useMutation<{ closeShift: Shift }>(CLOSE_SHIFT);

  const shift = data?.currentShift ?? null;

  async function start(event: FormEvent) {
    event.preventDefault();
    const value = Number(openingCash);

    if (!Number.isFinite(value) || value < 0) {
      setMessage("Enter a valid opening cash amount.");
      return;
    }

    try {
      setMessage("");
      if (!storeId) {
        setMessage("Select a store first.");
        return;
      }

      await startShift({
        variables: {
          input: {
            storeId,
            openingCash: value
          }
        }
      });
      setLastClosed(null);
      await refetch();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  async function close(event: FormEvent) {
    event.preventDefault();
    const value = Number(actualCash);

    if (!Number.isFinite(value) || value < 0) {
      setMessage("Enter the physical cash you counted in the drawer.");
      return;
    }

    try {
      setMessage("");
      const result = await closeShift({
        variables: {
          input: {
            actualCash: value,
            notes: notes.trim() || null
          }
        }
      });

      if (result.data?.closeShift) {
        setLastClosed(result.data.closeShift);
      }

      setActualCash("");
      setNotes("");
      await refetch();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  if (loading) return <section className="panel shift-message">Loading shift…</section>;

  if (error) {
    return <section className="panel shift-error">Failed to load shift: {error.message}</section>;
  }

  if (!shift) {
    return (
      <>
        <section className="store-page-banner">
          <div>
            <span>REGISTER LOCATION</span>
            <strong>{store?.name}</strong>
            <small>A shift can process transactions only for this store.</small>
          </div>
        </section>

        {lastClosed && (
          <section className="panel shift-close-result">
            <p className="eyebrow">SHIFT CLOSED</p>
            <h2>{lastClosed.shiftNumber}</h2>
            <div className="shift-reconcile-grid">
              <span><small>Expected cash</small><strong>{money(lastClosed.expectedCash)}</strong></span>
              <span><small>Actual cash</small><strong>{money(lastClosed.closingCash ?? 0)}</strong></span>
              <span>
                <small>Difference</small>
                <strong className={(lastClosed.cashDifference ?? 0) < 0 ? "cash-short" : (lastClosed.cashDifference ?? 0) > 0 ? "cash-over" : ""}>
                  {money(lastClosed.cashDifference ?? 0)}
                </strong>
              </span>
            </div>
          </section>
        )}

        <section className="panel shift-start-card">
          <p className="eyebrow">NO OPEN SHIFT</p>
          <h2>Start your shift</h2>
          <p>Open a cash drawer before processing any POS transactions.</p>

          <form onSubmit={start} className="shift-form">
            <label>
              Starting cash
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(event) => setOpeningCash(event.target.value)}
              />
            </label>

            {message && <div className="form-error">{message}</div>}

            <button className="button primary" disabled={startState.loading}>
              {startState.loading ? "Starting…" : "Start Shift"}
            </button>
          </form>
        </section>
      </>
    );
  }

  const differencePreview =
    actualCash.trim() === "" ? null : Number(actualCash) - shift.expectedCash;

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>REGISTER LOCATION</span>
          <strong>{store?.name}</strong>
          <small>This open shift belongs to the selected store.</small>
        </div>
      </section>

      <div className="shift-page-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">OPEN SHIFT</p>
            <h2>{shift.shiftNumber}</h2>
            <span>Opened {new Date(shift.openedAt).toLocaleString()}</span>
          </div>
          <span className="shift-open-badge">OPEN</span>
        </div>

        <div className="shift-stats-grid">
          <div><small>Opening cash</small><strong>{money(shift.openingCash)}</strong></div>
          <div><small>Expected cash</small><strong>{money(shift.expectedCash)}</strong></div>
          <div><small>Cash sales</small><strong>{money(shift.cashSales)}</strong></div>
          <div><small>Card sales</small><strong>{money(shift.cardSales)}</strong></div>
          <div><small>Other sales</small><strong>{money(shift.otherSales)}</strong></div>
          <div><small>Refunds</small><strong>{money(shift.totalRefunds)}</strong></div>
          <div><small>Transactions</small><strong>{shift.transactionCount}</strong></div>
          <div><small>Items sold</small><strong>{shift.itemsSold}</strong></div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">CLOSE SHIFT</p>
        <h2>Count the drawer</h2>
        <p>Expected physical cash: <strong>{money(shift.expectedCash)}</strong></p>

        <form onSubmit={close} className="shift-form">
          <label>
            Actual cash counted
            <input
              type="number"
              min="0"
              step="0.01"
              value={actualCash}
              onChange={(event) => setActualCash(event.target.value)}
              placeholder="0.00"
            />
          </label>

          {differencePreview !== null && Number.isFinite(differencePreview) && (
            <div className="shift-difference-preview">
              <span>Difference</span>
              <strong className={differencePreview < 0 ? "cash-short" : differencePreview > 0 ? "cash-over" : ""}>
                {money(differencePreview)}
              </strong>
            </div>
          )}

          <label>
            Notes (optional)
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything the manager should know"
            />
          </label>

          {message && <div className="form-error">{message}</div>}

          <button className="button primary" disabled={closeState.loading}>
            {closeState.loading ? "Closing…" : "Close Shift"}
          </button>
        </form>
      </section>
    </div>
    </>
  );
}
