"use client";

import { gql } from "@apollo/client";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import { FormEvent, useEffect, useState } from "react";

const BUSINESS_SETTINGS = gql`
  query BusinessSettings {
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
      active
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_BUSINESS = gql`
  mutation UpdateMyBusiness(
    $input: UpdateBusinessInput!
  ) {
    updateMyBusiness(input: $input) {
      id
      name
      slug
      active
      updatedAt
    }
  }
`;

export function BusinessSettings() {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(BUSINESS_SETTINGS, {
    fetchPolicy: "network-only"
  });

  const [
    updateBusiness,
    updateState
  ] = useMutation(
    UPDATE_BUSINESS
  );

  const [name, setName] =
    useState("");

  const [message, setMessage] =
    useState("");

  const business =
    data?.myBusiness;

  const me =
    data?.me;

  const canEdit =
    me?.role === "OWNER";

  useEffect(() => {
    if (business?.name) {
      setName(
        business.name
      );
    }
  }, [business?.name]);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    setMessage("");

    try {
      await updateBusiness({
        variables: {
          input: {
            name
          }
        }
      });

      setMessage(
        "Business name updated."
      );

      await refetch();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update business."
      );
    }
  }

  if (loading) {
    return (
      <section className="panel business-message">
        Loading business account…
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel shift-error">
        Failed to load business:{" "}
        {error.message}
      </section>
    );
  }

  return (
    <div className="business-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>
              Business Account
            </h2>

            <p className="table-secondary">
              Top-level tenant for this RetailOps account.
            </p>
          </div>
        </div>

        <form
          className="business-form"
          onSubmit={submit}
        >
          <label>
            Business name

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              disabled={!canEdit}
              maxLength={100}
            />
          </label>

          <label>
            Business slug

            <input
              value={
                business?.slug ??
                ""
              }
              disabled
            />
          </label>

          <label>
            Tenant ID

            <input
              value={
                business?.id ??
                ""
              }
              disabled
            />
          </label>

          <label>
            Status

            <input
              value={
                business?.active
                  ? "ACTIVE"
                  : "INACTIVE"
              }
              disabled
            />
          </label>

          {message && (
            <div className="business-note">
              {message}
            </div>
          )}

          {canEdit ? (
            <button
              className="button primary"
              type="submit"
              disabled={
                updateState.loading
              }
            >
              {updateState.loading
                ? "Saving…"
                : "Save Business"}
            </button>
          ) : (
            <div className="business-readonly">
              Only the business owner can change business settings.
            </div>
          )}
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>
              Tenant Isolation
            </h2>

            <p className="table-secondary">
              Phase 6 status
            </p>
          </div>
        </div>

        <div className="business-foundation-list">
          <div>
            <strong>
              Business identity
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              User → Business assignment
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              JWT tenant context
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Employee tenant scope
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Products / inventory / sales tenant scope
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Purchasing / shifts / refunds tenant scope
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Reports / daily closing tenant scope
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Multiple business registration
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Stores / staff assignments
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Store-specific operations
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              Platform administration
            </strong>
            <span>
              Active
            </span>
          </div>
        </div>

        <div className="business-security-warning">
          Separate-owner registration, store assignments, store-specific
          operations and platform administration are active. Platform
          administrators manage business and account access only; tenant
          inventory, POS, sales, purchasing, reports and cash operations
          remain outside the platform-admin portal.
        </div>
      </section>
    </div>
  );
}
