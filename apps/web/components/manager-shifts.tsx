"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
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
  notes?: string | null;
  forceCloseReason?: string | null;
  forceClosedByName?: string | null;
};

const SHIFTS = gql`
  query ManagerShifts(
    $storeId: String!
  ) {
    shifts(
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
      notes
      forceCloseReason
      forceClosedByName
    }
  }
`;

const FORCE_CLOSE = gql`
  mutation ManagerForceCloseShift($input: ForceCloseShiftInput!) {
    forceCloseShift(input: $input) {
      id
      status
      expectedCash
      closingCash
      cashDifference
      closedAt
      forceCloseReason
      forceClosedByName
    }
  }
`;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function ManagerShifts() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Shift | null>(null);
  const [actualCash, setActualCash] = useState("");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, loading, error, refetch } = useQuery<{ shifts: Shift[] }>(SHIFTS, {
    variables: {
      storeId: storeId ?? ""
    },
    skip: !storeId,
    fetchPolicy: "network-only"
  });

  const [forceClose, forceState] = useMutation(FORCE_CLOSE);

  const rows = useMemo(() => {
    const value = search.trim().toLowerCase();

    return (data?.shifts ?? []).filter((shift) => {
      const matchesSearch =
        !value ||
        shift.shiftNumber.toLowerCase().includes(value) ||
        shift.cashierName.toLowerCase().includes(value);

      const matchesStatus = status === "ALL" || shift.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  async function confirmForceClose() {
    if (!selected) return;

    const counted = Number(actualCash);
    if (!Number.isFinite(counted) || counted < 0) {
      setActionError("Enter the cash physically counted in the drawer.");
      return;
    }

    if (reason.trim().length < 3) {
      setActionError("Enter a clear reason for force-closing this shift.");
      return;
    }

    try {
      setActionError("");
      await forceClose({
        variables: {
          input: {
            shiftId: selected.id,
            actualCash: counted,
            reason: reason.trim()
          }
        }
      });
      setSelected(null);
      setActualCash("");
      setReason("");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to close shift.");
    }
  }

  return (
    <section className="panel">
      <div className="shift-manager-toolbar">
        <input
          type="search"
          placeholder="Search cashier or shift number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All shifts</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="FORCE_CLOSED">Force closed</option>
        </select>

        <button className="button secondary" type="button" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      {loading && <div className="shift-message">Loading shifts…</div>}
      {error && <div className="shift-error">Failed to load shifts: {error.message}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shift</th>
                <th>Cashier</th>
                <th>Status</th>
                <th>Opened</th>
                <th>Sales</th>
                <th>Transactions</th>
                <th>Expected Cash</th>
                <th>Difference</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 36 }}>No shifts found.</td></tr>
              ) : rows.map((shift) => (
                <tr key={shift.id}>
                  <td><strong>{shift.shiftNumber}</strong></td>
                  <td>{shift.cashierName}</td>
                  <td><span className={`shift-status shift-${shift.status.toLowerCase().replace("_", "-")}`}>{shift.status.replace("_", " ")}</span></td>
                  <td>{new Date(shift.openedAt).toLocaleString()}</td>
                  <td>{money(shift.netSales)}</td>
                  <td>{shift.transactionCount}</td>
                  <td>{money(shift.expectedCash)}</td>
                  <td>
                    {shift.cashDifference === null || shift.cashDifference === undefined
                      ? "—"
                      : <strong className={shift.cashDifference < 0 ? "cash-short" : shift.cashDifference > 0 ? "cash-over" : ""}>{money(shift.cashDifference)}</strong>}
                  </td>
                  <td>
                    {shift.status === "OPEN" ? (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setSelected(shift);
                          setActualCash("");
                          setReason("");
                          setActionError("");
                        }}
                      >
                        Force Close
                      </button>
                    ) : (
                      <span className="table-secondary">
                        {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="shift-force-modal" onMouseDown={(event) => event.stopPropagation()}>
            <p className="eyebrow">MANAGER ACTION</p>
            <h2>Force close {selected.shiftNumber}</h2>
            <p>
              Cashier: <strong>{selected.cashierName}</strong><br />
              Expected cash: <strong>{money(selected.expectedCash)}</strong>
            </p>

            <label>
              Actual cash counted
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualCash}
                onChange={(event) => setActualCash(event.target.value)}
              />
            </label>

            <label>
              Reason *
              <textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: Cashier left without closing register"
              />
            </label>

            {actionError && <div className="form-error">{actionError}</div>}

            <div className="void-sale-actions">
              <button className="button secondary" type="button" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button className="button danger-button" type="button" disabled={forceState.loading} onClick={confirmForceClose}>
                {forceState.loading ? "Closing…" : "Confirm Force Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
