"use client";

import { gql } from "@apollo/client";
import {
  useApolloClient,
  useMutation,
  useQuery
} from "@apollo/client/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CurrentStoreProvider,
  useCurrentStore
} from "@/components/store-context";

const ME = gql`
  query MeForShell {
    me {
      id
      name
      email
      role
      businessId
    }

    myBusiness {
      id
      name
      slug
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

const managerLinks = [
  [
    "Dashboard",
    "/manager/dashboard"
  ],
  [
    "Business",
    "/manager/business"
  ],
  [
    "Stores",
    "/manager/stores"
  ],
  [
    "Products",
    "/manager/products"
  ],
  [
    "Inventory",
    "/manager/inventory"
  ],
  [
    "Alerts",
    "/manager/alerts"
  ],
  [
    "Sales",
    "/manager/sales"
  ],
  [
    "Suppliers",
    "/manager/suppliers"
  ],
  [
    "Purchase Orders",
    "/manager/purchase-orders"
  ],
  [
    "Reports",
    "/manager/reports"
  ],
  [
    "Daily Closing",
    "/manager/closing"
  ],
  [
    "Shifts",
    "/manager/shifts"
  ],
  [
    "Employees",
    "/manager/employees"
  ]
];

const employeeLinks = [
  [
    "POS Terminal",
    "/employee/pos"
  ],
  [
    "My Shift",
    "/employee/shift"
  ],
  [
    "Printer Setup",
    "/employee/printer"
  ]
];

export function PortalShell(
  props: {
    role:
      | "manager"
      | "employee";
    title: string;
    subtitle: string;
    children:
      React.ReactNode;
  }
) {
  return (
    <CurrentStoreProvider>
      <PortalShellContent
        {...props}
      />
    </CurrentStoreProvider>
  );
}

function PortalShellContent({
  role,
  title,
  subtitle,
  children
}: {
  role:
    | "manager"
    | "employee";
  title: string;
  subtitle: string;
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const client =
    useApolloClient();

  const {
    storeId,
    store,
    stores,
    loading:
      storesLoading,
    errorMessage:
      storesError,
    setStoreId
  } = useCurrentStore();

  const {
    data
  } = useQuery<{
    me: {
      id: string;
      name: string;
      email: string;
      role: string;
      businessId?:
        string | null;
    };
    myBusiness: {
      id: string;
      name: string;
      slug: string;
    };
  }>(ME);

  const [
    logout,
    {
      loading
    }
  ] = useMutation<{
    logout: boolean;
  }>(LOGOUT);

  const links =
    role ===
    "manager"
      ? managerLinks
      : employeeLinks;

  async function signOut() {
    await logout();

    await client.clearStore();

    router.replace(
      "/login"
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          href={
            role ===
            "manager"
              ? "/manager/dashboard"
              : "/employee/pos"
          }
          className="sidebar-brand"
        >
          <span className="brand-mark small">
            RO
          </span>

          <span>
            <strong>
              RetailOps
            </strong>

            <small>
              {data?.myBusiness
                ?.name ??
                (role ===
                "manager"
                  ? "Manager"
                  : "Employee")}
            </small>
          </span>
        </Link>

        <nav>
          {links.map(
            (
              [
                label,
                href
              ]
            ) => (
              <Link
                key={
                  href
                }
                href={
                  href
                }
              >
                {label}
              </Link>
            )
          )}
        </nav>

        <button
          className="switch-portal logout-button"
          onClick={
            signOut
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Signing out…"
            : "Sign out"}
        </button>
      </aside>

      <main className="workspace">
        <header className="workspace-head">
          <div>
            <p className="eyebrow">
              RETAILOPS
            </p>

            <h1>
              {title}
            </h1>

            <p>
              {subtitle}
            </p>
          </div>

          <div className="workspace-head-actions">
            <label className="current-store-control">
              <span>
                Current store
              </span>

              {storesLoading ? (
                <strong>
                  Loading…
                </strong>
              ) : stores.length >
                0 ? (
                <select
                  value={
                    storeId ??
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setStoreId(
                      event
                        .target
                        .value
                    )
                  }
                >
                  {stores.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.id
                        }
                        value={
                          option.id
                        }
                      >
                        {
                          option.name
                        }{" "}
                        ·{" "}
                        {
                          option.code
                        }
                      </option>
                    )
                  )}
                </select>
              ) : (
                <strong>
                  No store
                </strong>
              )}
            </label>

            <div className="user-chip">
              {data?.me
                ?.name ??
                "RetailOps user"}
            </div>
          </div>
        </header>

        {storesError && (
          <section className="panel shift-error">
            Unable to load
            store access:{" "}
            {storesError}
          </section>
        )}

        {!storesLoading &&
        !store ? (
          <section className="panel store-required-message">
            No active store is
            assigned to this
            account. Ask the
            business owner to
            assign a store.
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
