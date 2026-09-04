
"use client";

import {
  gql
} from "@apollo/client";
import {
  useApolloClient,
  useMutation,
  useQuery
} from "@apollo/client/react";
import Link from "next/link";
import {
  usePathname,
  useRouter
} from "next/navigation";
import {
  useEffect
} from "react";

const PLATFORM_ADMIN_ME = gql`
  query PlatformAdminShellMe {
    platformAdminMe {
      id
      name
      email
      active
      lastLoginAt
    }
  }
`;

const PLATFORM_ADMIN_LOGOUT = gql`
  mutation PlatformAdminLogout {
    platformAdminLogout
  }
`;

const links = [
  [
    "Dashboard",
    "/admin/dashboard"
  ],
  [
    "Businesses",
    "/admin/businesses"
  ],
  [
    "Users",
    "/admin/users"
  ],
  [
    "Audit Log",
    "/admin/audit"
  ]
];

export function PlatformAdminShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children:
    React.ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const client =
    useApolloClient();

  const {
    data,
    loading,
    error
  } = useQuery<{
    platformAdminMe: {
      id: string;
      name: string;
      email: string;
      active: boolean;
      lastLoginAt?:
        string | null;
    };
  }>(
    PLATFORM_ADMIN_ME,
    {
      fetchPolicy:
        "network-only",
      retry:
        false
    } as any
  );

  const [
    logout,
    logoutState
  ] = useMutation(
    PLATFORM_ADMIN_LOGOUT
  );

  useEffect(() => {
    if (
      !loading &&
      error
    ) {
      router.replace(
        "/admin/login"
      );
    }
  }, [
    loading,
    error,
    router
  ]);

  async function signOut() {
    try {
      await logout();
    } finally {
      await client.clearStore();

      router.replace(
        "/admin/login"
      );
    }
  }

  if (loading) {
    return (
      <main className="platform-admin-loading">
        Loading Platform Admin…
      </main>
    );
  }

  if (
    error ||
    !data?.platformAdminMe
  ) {
    return (
      <main className="platform-admin-loading">
        Redirecting to Platform Admin login…
      </main>
    );
  }

  return (
    <div className="platform-admin-shell">
      <aside className="platform-admin-sidebar">
        <Link
          href="/admin/dashboard"
          className="platform-admin-sidebar-brand"
        >
          <span className="platform-admin-brand-mark small">
            RO
          </span>

          <span>
            <strong>
              RetailOps
            </strong>

            <small>
              Platform Admin
            </small>
          </span>
        </Link>

        <div className="platform-admin-scope-note">
          <strong>
            PLATFORM CONTROL
          </strong>

          <span>
            No tenant inventory, sales, POS, purchasing, reports, or cash data.
          </span>
        </div>

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
                className={
                  pathname ===
                    href
                    ? "active"
                    : ""
                }
              >
                {label}
              </Link>
            )
          )}
        </nav>

        <button
          className="platform-admin-signout"
          type="button"
          onClick={
            signOut
          }
          disabled={
            logoutState.loading
          }
        >
          {logoutState.loading
            ? "Signing out…"
            : "Sign out"}
        </button>
      </aside>

      <main className="platform-admin-workspace">
        <header className="platform-admin-head">
          <div>
            <p className="eyebrow">
              RETAILOPS PLATFORM
            </p>

            <h1>
              {title}
            </h1>

            <p>
              {subtitle}
            </p>
          </div>

          <div className="platform-admin-user-chip">
            <strong>
              {
                data
                  .platformAdminMe
                  .name
              }
            </strong>

            <span>
              {
                data
                  .platformAdminMe
                  .email
              }
            </span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
