
"use client";

import {
  gql
} from "@apollo/client";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import {
  useSearchParams
} from "next/navigation";
import {
  useMemo,
  useState
} from "react";

type Store = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  businessId: string;
  businessName: string;
  stores: Store[];
  createdAt: string;
};

const USERS = gql`
  query PlatformUsersPage(
    $search: String
    $role: UserRole
    $active: Boolean
    $businessId: String
  ) {
    platformUsers(
      search: $search
      role: $role
      active: $active
      businessId: $businessId
    ) {
      id
      name
      email
      role
      active
      businessId
      businessName
      createdAt

      stores {
        id
        name
        code
        active
      }
    }
  }
`;

const SET_USER_ACTIVE = gql`
  mutation PlatformSetUserActive(
    $userId: String!
    $active: Boolean!
    $reason: String
  ) {
    platformSetUserActive(
      userId: $userId
      active: $active
      reason: $reason
    ) {
      id
      active
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

export function PlatformUsers() {
  const searchParams =
    useSearchParams();

  const businessId =
    searchParams.get(
      "businessId"
    ) ||
    undefined;

  const [
    search,
    setSearch
  ] = useState("");

  const [
    role,
    setRole
  ] = useState(
    "ALL"
  );

  const [
    status,
    setStatus
  ] = useState(
    "ALL"
  );

  const variables =
    useMemo(
      () => ({
        search:
          search.trim() ||
          undefined,
        role:
          role ===
          "ALL"
            ? undefined
            : role,
        active:
          status ===
          "ACTIVE"
            ? true
            : status ===
                "INACTIVE"
              ? false
              : undefined,
        businessId
      }),
      [
        search,
        role,
        status,
        businessId
      ]
    );

  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    platformUsers:
      User[];
  }>(
    USERS,
    {
      variables,
      fetchPolicy:
        "network-only"
    }
  );

  const [
    setUserActive,
    mutationState
  ] = useMutation(
    SET_USER_ACTIVE
  );

  const [
    actionError,
    setActionError
  ] = useState("");

  async function changeStatus(
    user: User
  ) {
    setActionError("");

    const nextActive =
      !user.active;

    let reason:
      string | undefined =
      undefined;

    if (!nextActive) {
      const entered =
        window.prompt(
          `Why are you deactivating ${user.name} (${user.email})?`
        );

      if (
        entered ===
        null
      ) {
        return;
      }

      reason =
        entered.trim();

      if (
        reason.length <
        3
      ) {
        setActionError(
          "Deactivation reason must be at least 3 characters."
        );

        return;
      }
    } else {
      const confirmed =
        window.confirm(
          `Reactivate ${user.email}?`
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      await setUserActive({
        variables: {
          userId:
            user.id,
          active:
            nextActive,
          reason
        }
      });

      await refetch();
    } catch (
      error
    ) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to change account status."
      );
    }
  }

  return (
    <>
      <section className="platform-admin-privacy-banner">
        <strong>
          Account metadata only
        </strong>

        <span>
          Platform Admin can see tenant user identity, role, business and assigned store names.
          Passwords and tenant operational data are never displayed.
        </span>
      </section>

      {businessId && (
        <section className="platform-admin-filter-banner">
          Showing users for one selected business.
          Clear the business filter by opening the Users link in the sidebar.
        </section>
      )}

      <section className="platform-admin-panel">
        <div className="platform-admin-filters platform-user-filters">
          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }
            placeholder="Search name, email or business"
          />

          <select
            value={
              role
            }
            onChange={(
              event
            ) =>
              setRole(
                event
                  .target
                  .value
              )
            }
          >
            <option value="ALL">
              All roles
            </option>
            <option value="OWNER">
              Owner
            </option>
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

          <select
            value={
              status
            }
            onChange={(
              event
            ) =>
              setStatus(
                event
                  .target
                  .value
              )
            }
          >
            <option value="ALL">
              All statuses
            </option>
            <option value="ACTIVE">
              Active
            </option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>

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

        {actionError && (
          <div className="platform-admin-error">
            {actionError}
          </div>
        )}

        {error && (
          <div className="platform-admin-error">
            Failed to load users:{" "}
            {error.message}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  User
                </th>
                <th>
                  Role
                </th>
                <th>
                  Business
                </th>
                <th>
                  Store Access
                </th>
                <th>
                  Status
                </th>
                <th>
                  Created
                </th>
                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={
                      7
                    }
                  >
                    Loading tenant users…
                  </td>
                </tr>
              )}

              {!loading &&
                (
                  data
                    ?.platformUsers
                    ?.length ??
                  0
                ) ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        7
                      }
                      style={{
                        textAlign:
                          "center",
                        padding:
                          34
                      }}
                    >
                      No tenant users match this filter.
                    </td>
                  </tr>
                )}

              {data
                ?.platformUsers
                ?.map(
                  (
                    user
                  ) => (
                    <tr
                      key={
                        user.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            user.name
                          }
                        </strong>

                        <div className="table-secondary">
                          {
                            user.email
                          }
                        </div>
                      </td>

                      <td>
                        <span className="platform-role-badge">
                          {
                            user.role.replaceAll(
                              "_",
                              " "
                            )
                          }
                        </span>
                      </td>

                      <td>
                        {
                          user.businessName
                        }
                      </td>

                      <td>
                        {user.role ===
                        "OWNER" ? (
                          <span>
                            All stores
                          </span>
                        ) : user.stores
                            .length ===
                          0 ? (
                          <span className="table-secondary">
                            No stores
                          </span>
                        ) : (
                          <div className="platform-store-tags">
                            {user.stores.map(
                              (
                                store
                              ) => (
                                <span
                                  key={
                                    store.id
                                  }
                                >
                                  {
                                    store.name
                                  }{" "}
                                  ·{" "}
                                  {
                                    store.code
                                  }
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            user.active
                              ? "platform-status active"
                              : "platform-status suspended"
                          }
                        >
                          {user.active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>
                      </td>

                      <td>
                        {date(
                          user.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            user.active
                              ? "button danger"
                              : "button primary"
                          }
                          disabled={
                            mutationState.loading
                          }
                          onClick={() =>
                            void changeStatus(
                              user
                            )
                          }
                        >
                          {user.active
                            ? "Deactivate"
                            : "Reactivate"}
                        </button>
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
