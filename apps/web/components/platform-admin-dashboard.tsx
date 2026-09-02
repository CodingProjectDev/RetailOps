
"use client";

import {
  gql
} from "@apollo/client";
import {
  useQuery
} from "@apollo/client/react";
import Link from "next/link";

type Business = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  ownerName?:
    string | null;
  ownerEmail?:
    string | null;
  storeCount: number;
  userCount: number;
  ownerCount: number;
  managerCount: number;
  cashierCount: number;
  inventoryClerkCount: number;
  createdAt: string;
};

type Dashboard = {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  owners: number;
  managers: number;
  cashiers: number;
  inventoryClerks: number;
  recentBusinesses: Business[];
};

const DASHBOARD = gql`
  query PlatformAdminDashboardPage {
    platformAdminDashboard {
      totalBusinesses
      activeBusinesses
      suspendedBusinesses
      totalUsers
      owners
      managers
      cashiers
      inventoryClerks

      recentBusinesses {
        id
        name
        slug
        active
        ownerName
        ownerEmail
        storeCount
        userCount
        ownerCount
        managerCount
        cashierCount
        inventoryClerkCount
        createdAt
      }
    }
  }
`;

function date(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle:
        "medium"
    }
  ).format(
    new Date(
      value
    )
  );
}

export function PlatformAdminDashboard() {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    platformAdminDashboard:
      Dashboard;
  }>(
    DASHBOARD,
    {
      fetchPolicy:
        "network-only"
    }
  );

  if (
    loading &&
    !data
  ) {
    return (
      <section className="platform-admin-panel">
        Loading platform summary…
      </section>
    );
  }

  if (error) {
    return (
      <section className="platform-admin-error">
        Failed to load Platform Admin dashboard:{" "}
        {error.message}
      </section>
    );
  }

  const report =
    data
      ?.platformAdminDashboard;

  if (!report) {
    return null;
  }

  const cards = [
    [
      "Businesses",
      report.totalBusinesses,
      `${report.activeBusinesses} active`
    ],
    [
      "Suspended",
      report.suspendedBusinesses,
      "Business access blocked"
    ],
    [
      "Owners",
      report.owners,
      "Tenant owners"
    ],
    [
      "Managers",
      report.managers,
      "Across all businesses"
    ],
    [
      "Cashiers",
      report.cashiers,
      "Across all businesses"
    ],
    [
      "Inventory Clerks",
      report.inventoryClerks,
      `${report.totalUsers} total tenant users`
    ]
  ];

  return (
    <>
      <div className="platform-admin-toolbar-line">
        <span>
          Platform account metadata only
        </span>

        <button
          className="button secondary"
          type="button"
          onClick={() =>
            void refetch()
          }
        >
          Refresh
        </button>
      </div>

      <section className="platform-admin-kpi-grid">
        {cards.map(
          (
            [
              label,
              value,
              note
            ]
          ) => (
            <article
              key={
                label
              }
            >
              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

              <small>
                {note}
              </small>
            </article>
          )
        )}
      </section>

      <section className="platform-admin-panel">
        <div className="platform-admin-panel-head">
          <div>
            <h2>
              Recent Businesses
            </h2>

            <p>
              Registration and account status only.
            </p>
          </div>

          <Link
            href="/platform-admin/businesses"
            className="button secondary"
          >
            All Businesses
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Business
                </th>
                <th>
                  Owner
                </th>
                <th>
                  Stores
                </th>
                <th>
                  Users
                </th>
                <th>
                  Status
                </th>
                <th>
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {report
                .recentBusinesses
                .map(
                  (
                    business
                  ) => (
                    <tr
                      key={
                        business.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            business.name
                          }
                        </strong>

                        <div className="table-secondary">
                          {
                            business.slug
                          }
                        </div>
                      </td>

                      <td>
                        {
                          business.ownerName ??
                          "No owner"
                        }

                        <div className="table-secondary">
                          {
                            business.ownerEmail ??
                            "—"
                          }
                        </div>
                      </td>

                      <td>
                        {
                          business.storeCount
                        }
                      </td>

                      <td>
                        {
                          business.userCount
                        }
                      </td>

                      <td>
                        <span
                          className={
                            business.active
                              ? "platform-status active"
                              : "platform-status suspended"
                          }
                        >
                          {business.active
                            ? "ACTIVE"
                            : "SUSPENDED"}
                        </span>
                      </td>

                      <td>
                        {date(
                          business.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
