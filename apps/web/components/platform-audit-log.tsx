
"use client";

import {
  gql
} from "@apollo/client";
import {
  useQuery
} from "@apollo/client/react";

type AuditLog = {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?:
    string | null;
  targetLabel?:
    string | null;
  details?:
    string | null;
  createdAt: string;
};

const AUDIT_LOG = gql`
  query PlatformAuditLogPage {
    platformAuditLogs {
      id
      adminName
      action
      targetType
      targetId
      targetLabel
      details
      createdAt
    }
  }
`;

function dateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short"
    }
  ).format(
    new Date(
      value
    )
  );
}

function actionLabel(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        value
      ) =>
        value.toUpperCase()
    );
}

export function PlatformAuditLog() {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    platformAuditLogs:
      AuditLog[];
  }>(
    AUDIT_LOG,
    {
      fetchPolicy:
        "network-only"
    }
  );

  return (
    <section className="platform-admin-panel">
      <div className="platform-admin-panel-head">
        <div>
          <h2>
            Platform Audit Log
          </h2>

          <p>
            Administrative login, business-status and tenant-user-status actions.
          </p>
        </div>

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

      {error && (
        <div className="platform-admin-error">
          Failed to load audit log:{" "}
          {error.message}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                Time
              </th>
              <th>
                Admin
              </th>
              <th>
                Action
              </th>
              <th>
                Target
              </th>
              <th>
                Reason / Details
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={
                    5
                  }
                >
                  Loading audit log…
                </td>
              </tr>
            )}

            {!loading &&
              (
                data
                  ?.platformAuditLogs
                  ?.length ??
                0
              ) ===
                0 && (
                <tr>
                  <td
                    colSpan={
                      5
                    }
                    style={{
                      textAlign:
                        "center",
                      padding:
                        34
                    }}
                  >
                    No platform-admin actions recorded yet.
                  </td>
                </tr>
              )}

            {data
              ?.platformAuditLogs
              ?.map(
                (
                  log
                ) => (
                  <tr
                    key={
                      log.id
                    }
                  >
                    <td>
                      {dateTime(
                        log.createdAt
                      )}
                    </td>

                    <td>
                      {
                        log.adminName
                      }
                    </td>

                    <td>
                      <strong>
                        {actionLabel(
                          log.action
                        )}
                      </strong>
                    </td>

                    <td>
                      {
                        log.targetLabel ??
                        log.targetType
                      }

                      {log.targetId && (
                        <div className="table-secondary platform-target-id">
                          {
                            log.targetId
                          }
                        </div>
                      )}
                    </td>

                    <td>
                      {
                        log.details ??
                        "—"
                      }
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
