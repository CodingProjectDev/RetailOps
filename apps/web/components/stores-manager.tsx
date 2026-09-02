"use client";

import { gql } from "@apollo/client";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import {
  FormEvent,
  useMemo,
  useState
} from "react";

type Store = {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type Staff = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  stores: Store[];
};

const STORES_PAGE = gql`
  query StoresPage {
    me {
      id
      name
      email
      role
    }

    myStores {
      id
      name
      code
      address
      phone
      active
      createdAt
      updatedAt
    }

    storeStaff {
      id
      name
      email
      role
      active

      stores {
        id
        name
        code
        active
      }
    }
  }
`;

const CREATE_STORE = gql`
  mutation CreateStore(
    $input: CreateStoreInput!
  ) {
    createStore(input: $input) {
      id
      name
      code
      address
      phone
      active
    }
  }
`;

const UPDATE_STORE = gql`
  mutation UpdateStore(
    $input: UpdateStoreInput!
  ) {
    updateStore(input: $input) {
      id
      name
      code
      address
      phone
      active
    }
  }
`;

const CREATE_STAFF = gql`
  mutation CreateStoreStaff(
    $input: CreateStoreStaffInput!
  ) {
    createStoreStaff(input: $input) {
      id
      name
      email
      role
      active

      stores {
        id
        name
        code
      }
    }
  }
`;

const ASSIGN_STORES = gql`
  mutation AssignUserStores(
    $input: AssignUserStoresInput!
  ) {
    assignUserStores(input: $input) {
      id
      name
      email
      role

      stores {
        id
        name
        code
      }
    }
  }
`;

export function StoresManager() {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    me: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    myStores: Store[];
    storeStaff: Staff[];
  }>(STORES_PAGE, {
    fetchPolicy:
      "network-only"
  });

  const [
    createStore,
    createStoreState
  ] = useMutation(
    CREATE_STORE
  );

  const [
    updateStore,
    updateStoreState
  ] = useMutation(
    UPDATE_STORE
  );

  const [
    createStaff,
    createStaffState
  ] = useMutation(
    CREATE_STAFF
  );

  const [
    assignStores,
    assignStoresState
  ] = useMutation(
    ASSIGN_STORES
  );

  const [
    showStoreForm,
    setShowStoreForm
  ] = useState(false);

  const [
    editingStore,
    setEditingStore
  ] = useState<Store | null>(
    null
  );

  const [
    storeName,
    setStoreName
  ] = useState("");

  const [
    storeCode,
    setStoreCode
  ] = useState("");

  const [
    storeAddress,
    setStoreAddress
  ] = useState("");

  const [
    storePhone,
    setStorePhone
  ] = useState("");

  const [
    storeActive,
    setStoreActive
  ] = useState(true);

  const [
    showStaffForm,
    setShowStaffForm
  ] = useState(false);

  const [
    staffName,
    setStaffName
  ] = useState("");

  const [
    staffEmail,
    setStaffEmail
  ] = useState("");

  const [
    staffPassword,
    setStaffPassword
  ] = useState("");

  const [
    staffRole,
    setStaffRole
  ] = useState("MANAGER");

  const [
    staffStoreIds,
    setStaffStoreIds
  ] = useState<string[]>([]);

  const [
    assigningStaff,
    setAssigningStaff
  ] = useState<Staff | null>(
    null
  );

  const [
    assignmentIds,
    setAssignmentIds
  ] = useState<string[]>([]);

  const [
    actionError,
    setActionError
  ] = useState("");

  const stores =
    data?.myStores ?? [];

  const staff =
    data?.storeStaff ?? [];

  const isOwner =
    data?.me?.role ===
    "OWNER";

  const activeStores =
    useMemo(
      () =>
        stores.filter(
          (store) =>
            store.active
        ),
      [stores]
    );

  function resetStoreForm() {
    setEditingStore(null);
    setStoreName("");
    setStoreCode("");
    setStoreAddress("");
    setStorePhone("");
    setStoreActive(true);
    setShowStoreForm(false);
    setActionError("");
  }

  function openEditStore(
    store: Store
  ) {
    setEditingStore(store);
    setStoreName(store.name);
    setStoreCode(store.code);
    setStoreAddress(
      store.address ?? ""
    );
    setStorePhone(
      store.phone ?? ""
    );
    setStoreActive(
      store.active
    );
    setShowStoreForm(true);
    setActionError("");
  }

  function toggleId(
    current: string[],
    id: string,
    checked: boolean
  ) {
    return checked
      ? Array.from(
          new Set([
            ...current,
            id
          ])
        )
      : current.filter(
          (value) =>
            value !== id
        );
  }

  async function submitStore(
    event: FormEvent
  ) {
    event.preventDefault();
    setActionError("");

    try {
      if (editingStore) {
        await updateStore({
          variables: {
            input: {
              id:
                editingStore.id,
              name:
                storeName,
              code:
                storeCode,
              address:
                storeAddress,
              phone:
                storePhone,
              active:
                storeActive
            }
          }
        });
      } else {
        await createStore({
          variables: {
            input: {
              name:
                storeName,
              code:
                storeCode,
              address:
                storeAddress,
              phone:
                storePhone
            }
          }
        });
      }

      resetStoreForm();
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to save store."
      );
    }
  }

  function resetStaffForm() {
    setStaffName("");
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole(
      "MANAGER"
    );
    setStaffStoreIds([]);
    setShowStaffForm(false);
    setActionError("");
  }

  async function submitStaff(
    event: FormEvent
  ) {
    event.preventDefault();
    setActionError("");

    try {
      await createStaff({
        variables: {
          input: {
            name:
              staffName,
            email:
              staffEmail,
            password:
              staffPassword,
            role:
              staffRole,
            storeIds:
              staffStoreIds
          }
        }
      });

      resetStaffForm();
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to create staff account."
      );
    }
  }

  function openAssignment(
    row: Staff
  ) {
    setAssigningStaff(row);
    setAssignmentIds(
      row.stores.map(
        (store) =>
          store.id
      )
    );
    setActionError("");
  }

  async function saveAssignment() {
    if (!assigningStaff) {
      return;
    }

    setActionError("");

    try {
      await assignStores({
        variables: {
          input: {
            userId:
              assigningStaff.id,
            storeIds:
              assignmentIds
          }
        }
      });

      setAssigningStaff(null);
      setAssignmentIds([]);
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update store access."
      );
    }
  }

  if (loading) {
    return (
      <section className="panel stores-message">
        Loading stores…
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel shift-error">
        Failed to load stores:{" "}
        {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="stores-summary-grid">
        <article className="stores-summary-card">
          <span>
            Accessible Stores
          </span>

          <strong>
            {stores.length}
          </strong>
        </article>

        <article className="stores-summary-card">
          <span>
            Active Stores
          </span>

          <strong>
            {
              activeStores.length
            }
          </strong>
        </article>

        <article className="stores-summary-card">
          <span>
            Staff Accounts
          </span>

          <strong>
            {staff.length}
          </strong>
        </article>

        <article className="stores-summary-card">
          <span>
            Your Access
          </span>

          <strong>
            {isOwner
              ? "ALL"
              : stores.length}
          </strong>
        </article>
      </section>

      {isOwner && (
        <div className="stores-page-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              resetStoreForm();
              setShowStoreForm(
                true
              );
            }}
          >
            + Add Store
          </button>

          <button
            className="button primary"
            type="button"
            onClick={() => {
              resetStaffForm();

              if (
                activeStores.length ===
                1
              ) {
                setStaffStoreIds([
                  activeStores[0].id
                ]);
              }

              setShowStaffForm(
                true
              );
            }}
          >
            + Create Staff Account
          </button>
        </div>
      )}

      {actionError && (
        <section className="panel shift-error">
          {actionError}
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Stores</h2>

            <p className="table-secondary">
              {isOwner
                ? "Owners automatically have access to every store."
                : "Only stores assigned to your account are shown."}
            </p>
          </div>
        </div>

        <div className="stores-card-grid">
          {stores.length === 0 ? (
            <div className="stores-empty">
              No stores are assigned to this account.
            </div>
          ) : (
            stores.map(
              (store) => (
                <article
                  className="store-card"
                  key={store.id}
                >
                  <div className="store-card-head">
                    <div>
                      <span className="store-code">
                        {store.code}
                      </span>

                      <h3>
                        {store.name}
                      </h3>
                    </div>

                    <span
                      className={`store-status ${
                        store.active
                          ? "store-active"
                          : "store-inactive"
                      }`}
                    >
                      {store.active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </div>

                  <dl>
                    <div>
                      <dt>
                        Address
                      </dt>
                      <dd>
                        {store.address ||
                          "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Phone
                      </dt>
                      <dd>
                        {store.phone ||
                          "Not set"}
                      </dd>
                    </div>
                  </dl>

                  {isOwner && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() =>
                        openEditStore(
                          store
                        )
                      }
                    >
                      Edit Store
                    </button>
                  )}
                </article>
              )
            )
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>
              Store Staff
            </h2>

            <p className="table-secondary">
              Managers and employees can be assigned to one or more stores.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Employee
                </th>
                <th>
                  Role
                </th>
                <th>
                  Stores
                </th>
                <th>
                  Status
                </th>
                {isOwner && (
                  <th />
                )}
              </tr>
            </thead>

            <tbody>
              {staff.map(
                (row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>
                        {row.name}
                      </strong>

                      <div className="table-secondary">
                        {row.email}
                      </div>
                    </td>

                    <td>
                      {row.role.replaceAll(
                        "_",
                        " "
                      )}
                    </td>

                    <td>
                      {row.role ===
                      "OWNER" ? (
                        <span>
                          All stores
                        </span>
                      ) : row.stores
                          .length ? (
                        <div className="store-chip-list">
                          {row.stores.map(
                            (store) => (
                              <span
                                className="store-chip"
                                key={
                                  store.id
                                }
                              >
                                {
                                  store.name
                                }
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        "Unassigned"
                      )}
                    </td>

                    <td>
                      {row.active
                        ? "Active"
                        : "Inactive"}
                    </td>

                    {isOwner && (
                      <td>
                        {row.role !==
                          "OWNER" && (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                              openAssignment(
                                row
                              )
                            }
                          >
                            Assign Stores
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showStoreForm && (
        <div className="modal-backdrop">
          <form
            className="store-modal"
            onSubmit={
              submitStore
            }
          >
            <div className="modal-title-row">
              <div>
                <p className="eyebrow">
                  STORE
                </p>

                <h2>
                  {editingStore
                    ? "Edit Store"
                    : "Add Store"}
                </h2>
              </div>

              <button
                type="button"
                className="button secondary"
                onClick={
                  resetStoreForm
                }
              >
                Close
              </button>
            </div>

            <label>
              Store name
              <input
                value={
                  storeName
                }
                onChange={(
                  event
                ) =>
                  setStoreName(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Dallas Store"
                required
              />
            </label>

            <label>
              Store code
              <input
                value={
                  storeCode
                }
                onChange={(
                  event
                ) =>
                  setStoreCode(
                    event
                      .target
                      .value
                  )
                }
                placeholder="DAL-01"
                required
              />
            </label>

            <label>
              Address
              <input
                value={
                  storeAddress
                }
                onChange={(
                  event
                ) =>
                  setStoreAddress(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Dallas, TX"
              />
            </label>

            <label>
              Phone
              <input
                value={
                  storePhone
                }
                onChange={(
                  event
                ) =>
                  setStorePhone(
                    event
                      .target
                      .value
                  )
                }
                placeholder="214-555-0100"
              />
            </label>

            {editingStore && (
              <label className="store-check">
                <input
                  type="checkbox"
                  checked={
                    storeActive
                  }
                  onChange={(
                    event
                  ) =>
                    setStoreActive(
                      event
                        .target
                        .checked
                    )
                  }
                />
                Active store
              </label>
            )}

            <button
              type="submit"
              className="button primary"
              disabled={
                createStoreState.loading ||
                updateStoreState.loading
              }
            >
              {editingStore
                ? "Save Store"
                : "Create Store"}
            </button>
          </form>
        </div>
      )}

      {showStaffForm && (
        <div className="modal-backdrop">
          <form
            className="store-modal"
            onSubmit={
              submitStaff
            }
          >
            <div className="modal-title-row">
              <div>
                <p className="eyebrow">
                  STAFF ACCOUNT
                </p>

                <h2>
                  Create Staff
                </h2>
              </div>

              <button
                type="button"
                className="button secondary"
                onClick={
                  resetStaffForm
                }
              >
                Close
              </button>
            </div>

            <label>
              Name
              <input
                value={
                  staffName
                }
                onChange={(
                  event
                ) =>
                  setStaffName(
                    event
                      .target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={
                  staffEmail
                }
                onChange={(
                  event
                ) =>
                  setStaffEmail(
                    event
                      .target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Temporary password
              <input
                type="password"
                minLength={8}
                value={
                  staffPassword
                }
                onChange={(
                  event
                ) =>
                  setStaffPassword(
                    event
                      .target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Role
              <select
                value={
                  staffRole
                }
                onChange={(
                  event
                ) =>
                  setStaffRole(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="MANAGER">
                  Manager
                </option>
                <option value="CASHIER">
                  Cashier
                </option>
                <option value="INVENTORY_CLERK">
                  Inventory Clerk
                </option>
              </select>
            </label>

            <fieldset className="store-assignment-fieldset">
              <legend>
                Store access
              </legend>

              {activeStores.map(
                (store) => (
                  <label
                    className="store-check"
                    key={store.id}
                  >
                    <input
                      type="checkbox"
                      checked={staffStoreIds.includes(
                        store.id
                      )}
                      onChange={(
                        event
                      ) =>
                        setStaffStoreIds(
                          (
                            current
                          ) =>
                            toggleId(
                              current,
                              store.id,
                              event
                                .target
                                .checked
                            )
                        )
                      }
                    />

                    {
                      store.name
                    }
                  </label>
                )
              )}
            </fieldset>

            <button
              type="submit"
              className="button primary"
              disabled={
                createStaffState.loading
              }
            >
              {createStaffState.loading
                ? "Creating…"
                : "Create Staff"}
            </button>
          </form>
        </div>
      )}

      {assigningStaff && (
        <div className="modal-backdrop">
          <div className="store-modal">
            <div className="modal-title-row">
              <div>
                <p className="eyebrow">
                  STORE ACCESS
                </p>

                <h2>
                  {
                    assigningStaff.name
                  }
                </h2>
              </div>

              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setAssigningStaff(
                    null
                  );
                  setAssignmentIds(
                    []
                  );
                }}
              >
                Close
              </button>
            </div>

            <fieldset className="store-assignment-fieldset">
              <legend>
                Assigned stores
              </legend>

              {activeStores.map(
                (store) => (
                  <label
                    className="store-check"
                    key={store.id}
                  >
                    <input
                      type="checkbox"
                      checked={assignmentIds.includes(
                        store.id
                      )}
                      onChange={(
                        event
                      ) =>
                        setAssignmentIds(
                          (
                            current
                          ) =>
                            toggleId(
                              current,
                              store.id,
                              event
                                .target
                                .checked
                            )
                        )
                      }
                    />

                    {
                      store.name
                    }
                  </label>
                )
              )}
            </fieldset>

            <button
              type="button"
              className="button primary"
              disabled={
                assignStoresState.loading
              }
              onClick={() =>
                void saveAssignment()
              }
            >
              {assignStoresState.loading
                ? "Saving…"
                : "Save Store Access"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
