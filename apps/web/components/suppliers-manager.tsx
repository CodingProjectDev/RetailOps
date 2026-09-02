"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { FormEvent, useMemo, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
};

const SUPPLIERS = gql`
  query SupplierManager {
    suppliers {
      id
      name
      contactName
      phone
      email
      address
      active
      createdAt
    }
  }
`;

const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      active
    }
  }
`;

const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($input: UpdateSupplierInput!) {
    updateSupplier(input: $input) {
      id
      name
      active
    }
  }
`;

const blankForm = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: ""
};

export function SuppliersManager() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(blankForm);
  const [message, setMessage] = useState("");

  const { data, loading, error, refetch } = useQuery<{ suppliers: Supplier[] }>(
    SUPPLIERS,
    { fetchPolicy: "network-only" }
  );

  const [createSupplier, createState] = useMutation(CREATE_SUPPLIER);
  const [updateSupplier, updateState] = useMutation(UPDATE_SUPPLIER);

  const rows = useMemo(() => {
    const value = search.trim().toLowerCase();

    return (data?.suppliers ?? []).filter((supplier) => {
      if (!showInactive && !supplier.active) return false;

      return (
        !value ||
        supplier.name.toLowerCase().includes(value) ||
        supplier.contactName?.toLowerCase().includes(value) ||
        supplier.phone?.toLowerCase().includes(value) ||
        supplier.email?.toLowerCase().includes(value)
      );
    });
  }, [data, search, showInactive]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setMessage("");
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? ""
    });
    setMessage("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Supplier name is required.");
      return;
    }

    try {
      setMessage("");

      if (editing) {
        await updateSupplier({
          variables: {
            input: {
              id: editing.id,
              name: form.name,
              contactName: form.contactName || null,
              phone: form.phone || null,
              email: form.email || null,
              address: form.address || null
            }
          }
        });
      } else {
        await createSupplier({
          variables: {
            input: {
              name: form.name,
              contactName: form.contactName || null,
              phone: form.phone || null,
              email: form.email || null,
              address: form.address || null
            }
          }
        });
      }

      setEditing(null);
      setForm(blankForm);
      await refetch();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save supplier.");
    }
  }

  async function toggleSupplier(supplier: Supplier) {
    try {
      await updateSupplier({
        variables: {
          input: {
            id: supplier.id,
            active: !supplier.active
          }
        }
      });
      await refetch();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update supplier.");
    }
  }

  const busy = createState.loading || updateState.loading;

  return (
    <div className="purchasing-layout">
      <section className="panel">
        <div className="purchasing-toolbar">
          <input
            type="search"
            placeholder="Search supplier, contact, phone or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <label className="inline-check">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            Show inactive
          </label>

          <button className="button primary" type="button" onClick={openCreate}>
            + Add Supplier
          </button>
        </div>

        {loading && <div className="shift-message">Loading suppliers…</div>}
        {error && <div className="shift-error">Failed to load suppliers: {error.message}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 36 }}>
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  rows.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>
                        <strong>{supplier.name}</strong>
                        {supplier.address && <div className="table-secondary">{supplier.address}</div>}
                      </td>
                      <td>{supplier.contactName || "—"}</td>
                      <td>{supplier.phone || "—"}</td>
                      <td>{supplier.email || "—"}</td>
                      <td>
                        <span className={supplier.active ? "supplier-active" : "supplier-inactive"}>
                          {supplier.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="button secondary" type="button" onClick={() => openEdit(supplier)}>
                            Edit
                          </button>
                          <button className="button secondary" type="button" onClick={() => toggleSupplier(supplier)}>
                            {supplier.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel purchasing-form-card">
        <p className="eyebrow">{editing ? "EDIT SUPPLIER" : "NEW SUPPLIER"}</p>
        <h2>{editing ? editing.name : "Supplier details"}</h2>

        <form className="purchasing-form" onSubmit={save}>
          <label>
            Supplier name *
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <label>
            Contact name
            <input
              value={form.contactName}
              onChange={(event) => setForm({ ...form, contactName: event.target.value })}
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label>
            Address
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>

          {message && <div className="form-error">{message}</div>}

          <div className="form-actions">
            {editing && (
              <button className="button secondary" type="button" onClick={openCreate}>
                Cancel Edit
              </button>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save Changes" : "Create Supplier"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
