
"use client";

import {
  gql
} from "@apollo/client";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import Link from "next/link";
import {
  useMemo,
  useState
} from "react";

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

const BUSINESSES = gql`
  query PlatformBusinessesPage(
    $search: String
    $active: Boolean
  ) {
    platformBusinesses(
      search: $search
      active: $active
    ) {
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
`;

const CREATE_BUSINESS_OWNER = gql`
  mutation PlatformCreateBusinessOwner(
    $input: CreatePlatformBusinessOwnerInput!
  ) {
    platformCreateBusinessOwner(
      input: $input
    ) {
      id
      name
      slug
      active
      ownerName
      ownerEmail
      storeCount
      userCount
      createdAt
    }
  }
`;

const RESET_OWNER_PASSWORD = gql`
  mutation PlatformResetBusinessOwnerPassword(
    $businessId: String!
    $newTemporaryPassword: String!
  ) {
    platformResetBusinessOwnerPassword(
      businessId: $businessId
      newTemporaryPassword: $newTemporaryPassword
    ) {
      id
      name
      email
      role
      active
      businessId
      businessName
    }
  }
`;

const SET_BUSINESS_ACTIVE = gql`
  mutation PlatformSetBusinessActive(
    $businessId: String!
    $active: Boolean!
    $reason: String
  ) {
    platformSetBusinessActive(
      businessId: $businessId
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

export function PlatformBusinesses() {
  const [
    search,
    setSearch
  ] = useState("");

  const [
    status,
    setStatus
  ] = useState(
    "ALL"
  );


  const [
    createOpen,
    setCreateOpen
  ] = useState(
    false
  );

  const [
    createForm,
    setCreateForm
  ] = useState({
    businessName:
      "",
    ownerName:
      "",
    ownerEmail:
      "",
    temporaryPassword:
      ""
  });

  const [
    createMessage,
    setCreateMessage
  ] = useState("");


  const [
    resetBusiness,
    setResetBusiness
  ] = useState<Business | null>(
    null
  );

  const [
    resetPassword,
    setResetPassword
  ] = useState("");

  const [
    resetMessage,
    setResetMessage
  ] = useState("");





  const variables =
    useMemo(
      () => ({
        search:
          search.trim() ||
          undefined,
        active:
          status ===
          "ACTIVE"
            ? true
            : status ===
                "SUSPENDED"
              ? false
              : undefined
      }),
      [
        search,
        status
      ]
    );

  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    platformBusinesses:
      Business[];
  }>(
    BUSINESSES,
    {
      variables,
      fetchPolicy:
        "network-only"
    }
  );

  const [
    setBusinessActive,
    mutationState
  ] = useMutation(
    SET_BUSINESS_ACTIVE
  );


  const [
    createBusinessOwner,
    createState
  ] = useMutation(
    CREATE_BUSINESS_OWNER
  );


  const [
    resetOwnerPassword,
    resetPasswordState
  ] = useMutation(
    RESET_OWNER_PASSWORD
  );





  const [
    actionError,
    setActionError
  ] = useState("");


  async function submitCreate(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    setCreateMessage("");

    try {
      await createBusinessOwner({
        variables: {
          input: {
            businessName:
              createForm.businessName.trim(),
            ownerName:
              createForm.ownerName.trim(),
            ownerEmail:
              createForm.ownerEmail.trim(),
            temporaryPassword:
              createForm.temporaryPassword
          }
        }
      });

      setCreateMessage(
        "Business owner created successfully."
      );

      setCreateForm({
        businessName:
          "",
        ownerName:
          "",
        ownerEmail:
          "",
        temporaryPassword:
          ""
      });

      await refetch();

      setTimeout(
        () => {
          setCreateOpen(
            false
          );

          setCreateMessage(
            ""
          );
        },
        700
      );
    } catch (
      error
    ) {
      setCreateMessage(
        error instanceof Error
          ? error.message
          : "Unable to create business owner."
      );
    }
  }


  async function submitResetPassword(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    if (!resetBusiness) {
      return;
    }

    setResetMessage("");

    if (
      resetPassword.length <
      8
    ) {
      setResetMessage(
        "Temporary password must be at least 8 characters."
      );

      return;
    }

    try {
      await resetOwnerPassword({
        variables: {
          businessId:
            resetBusiness.id,
          newTemporaryPassword:
            resetPassword
        }
      });

      setResetMessage(
        "Owner password reset successfully."
      );

      setResetPassword("");

      setTimeout(
        () => {
          setResetBusiness(
            null
          );

          setResetMessage(
            ""
          );
        },
        700
      );
    } catch (
      error
    ) {
      setResetMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset owner password."
      );
    }
  }

  async function changeStatus(
    business: Business
  ) {
    setActionError("");

    const nextActive =
      !business.active;

    let reason:
      string | undefined =
      undefined;

    if (!nextActive) {
      const entered =
        window.prompt(
          `Why are you suspending ${business.name}?`
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
          "Suspension reason must be at least 3 characters."
        );

        return;
      }
    } else {
      const confirmed =
        window.confirm(
          `Reactivate ${business.name}?`
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      await setBusinessActive({
        variables: {
          businessId:
            business.id,
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
          : "Unable to change business status."
      );
    }
  }

  return (
    <>
      <section className="platform-admin-privacy-banner">
        <strong>
          Platform boundary
        </strong>

        <span>
          This page reads business registration, owner, store-count and user-count metadata only.
          It does not query tenant inventory, sales, POS, purchases, reports, refunds or cash data.
        </span>
      </section>

      <div className="platform-admin-create-owner-bar">
        <div>
          <strong>
            Business onboarding
          </strong>

          <span>
            Create a new Business and OWNER account.
          </span>
        </div>

        <button
          className="button primary"
          type="button"
          onClick={() =>
            setCreateOpen(
              true
            )
          }
        >
          + Add Business Owner
        </button>
      </div>

      <section className="platform-admin-panel">
        <div className="platform-admin-filters">
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
            placeholder="Search business, owner or email"
          />

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
            <option value="SUSPENDED">
              Suspended
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
            Failed to load businesses:{" "}
            {error.message}
          </div>
        )}

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
                  Staff
                </th>
                <th>
                  Status
                </th>
                <th>
                  Created
                </th>
                <th>
                  Actions
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
                    Loading businesses…
                  </td>
                </tr>
              )}

              {!loading &&
                (
                  data
                    ?.platformBusinesses
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
                      No businesses match this filter.
                    </td>
                  </tr>
                )}

              {data
                ?.platformBusinesses
                ?.map(
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
                        <strong>
                          {
                            business.userCount
                          }
                        </strong>

                        <div className="table-secondary">
                          M{" "}
                          {
                            business.managerCount
                          }{" "}
                          · C{" "}
                          {
                            business.cashierCount
                          }{" "}
                          · I{" "}
                          {
                            business.inventoryClerkCount
                          }
                        </div>
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

                      <td>
                        <div className="platform-admin-row-actions">
                          <Link
                            href={`/platform-admin/users?businessId=${encodeURIComponent(
                              business.id
                            )}`}
                            className="button secondary"
                          >
                            View Users
                          </Link>

                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => {
                              setResetBusiness(
                                business
                              );

                              setResetPassword(
                                ""
                              );

                              setResetMessage(
                                ""
                              );
                            }}
                          >
                            Reset Owner Password
                          </button>

                          <button
                            type="button"
                            className={
                              business.active
                                ? "button danger"
                                : "button primary"
                            }
                            disabled={
                              mutationState.loading
                            }
                            onClick={() =>
                              void changeStatus(
                                business
                              )
                            }
                          >
                            {business.active
                              ? "Suspend"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen && (
        <div
          className="platform-admin-modal-backdrop"
          role="presentation"
        >
          <section
            className="platform-admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-owner-title"
          >
            <div className="platform-admin-modal-head">
              <div>
                <p className="eyebrow">
                  BUSINESS ONBOARDING
                </p>

                <h2 id="create-owner-title">
                  Add Business Owner
                </h2>

                <p>
                  Creates the Business, OWNER account, Main Store, and starter categories.
                </p>
              </div>

              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  setCreateOpen(
                    false
                  )
                }
                disabled={
                  createState.loading
                }
              >
                Close
              </button>
            </div>

            <form
              className="platform-admin-create-owner-form"
              onSubmit={
                submitCreate
              }
            >
              <label>
                Business name

                <input
                  required
                  minLength={
                    2
                  }
                  value={
                    createForm.businessName
                  }
                  onChange={(
                    event
                  ) =>
                    setCreateForm({
                      ...createForm,
                      businessName:
                        event.target.value
                    })
                  }
                  placeholder="Example: Dallas Quick Mart"
                />
              </label>

              <label>
                Owner name

                <input
                  required
                  minLength={
                    2
                  }
                  value={
                    createForm.ownerName
                  }
                  onChange={(
                    event
                  ) =>
                    setCreateForm({
                      ...createForm,
                      ownerName:
                        event.target.value
                    })
                  }
                  placeholder="Owner full name"
                />
              </label>

              <label>
                Owner email

                <input
                  required
                  type="email"
                  value={
                    createForm.ownerEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setCreateForm({
                      ...createForm,
                      ownerEmail:
                        event.target.value
                    })
                  }
                  placeholder="owner@example.com"
                />
              </label>

              <label>
                Temporary password

                <input
                  required
                  type="password"
                  minLength={
                    8
                  }
                  value={
                    createForm.temporaryPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setCreateForm({
                      ...createForm,
                      temporaryPassword:
                        event.target.value
                    })
                  }
                  placeholder="At least 8 characters"
                />
              </label>

              {createMessage && (
                <div
                  className={
                    createMessage.includes(
                      "successfully"
                    )
                      ? "platform-admin-success"
                      : "platform-admin-error"
                  }
                >
                  {
                    createMessage
                  }
                </div>
              )}

              <div className="platform-admin-modal-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    setCreateOpen(
                      false
                    )
                  }
                  disabled={
                    createState.loading
                  }
                >
                  Cancel
                </button>

                <button
                  className="button primary"
                  type="submit"
                  disabled={
                    createState.loading
                  }
                >
                  {createState.loading
                    ? "Creating…"
                    : "Create Business Owner"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}


      {resetBusiness && (
        <div
          className="platform-admin-modal-backdrop"
          role="presentation"
        >
          <section
            className="platform-admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-owner-password-title"
          >
            <div className="platform-admin-modal-head">
              <div>
                <p className="eyebrow">
                  ACCOUNT ACCESS
                </p>

                <h2 id="reset-owner-password-title">
                  Reset Owner Password
                </h2>

                <p>
                  {resetBusiness.name}
                  {" · "}
                  {resetBusiness.ownerEmail ?? "Business Owner"}
                </p>
              </div>

              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  setResetBusiness(
                    null
                  )
                }
                disabled={
                  resetPasswordState.loading
                }
              >
                Close
              </button>
            </div>

            <form
              className="platform-admin-create-owner-form"
              onSubmit={
                submitResetPassword
              }
            >
              <div className="platform-admin-password-warning">
                The current password cannot be viewed. Enter a new temporary password.
              </div>

              <label>
                New temporary password

                <input
                  required
                  type="password"
                  minLength={
                    8
                  }
                  autoComplete="new-password"
                  value={
                    resetPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setResetPassword(
                      event.target.value
                    )
                  }
                  placeholder="At least 8 characters"
                />
              </label>

              {resetMessage && (
                <div
                  className={
                    resetMessage.includes(
                      "successfully"
                    )
                      ? "platform-admin-success"
                      : "platform-admin-error"
                  }
                >
                  {resetMessage}
                </div>
              )}

              <div className="platform-admin-modal-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    setResetBusiness(
                      null
                    )
                  }
                  disabled={
                    resetPasswordState.loading
                  }
                >
                  Cancel
                </button>

                <button
                  className="button primary"
                  type="submit"
                  disabled={
                    resetPasswordState.loading
                  }
                >
                  {resetPasswordState.loading
                    ? "Resetting…"
                    : "Reset Owner Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </>
  );
}
