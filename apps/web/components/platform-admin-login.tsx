
"use client";

import {
  gql
} from "@apollo/client";
import {
  useMutation
} from "@apollo/client/react";
import {
  FormEvent,
  useState
} from "react";
import {
  useRouter
} from "next/navigation";

const PLATFORM_ADMIN_LOGIN = gql`
  mutation PlatformAdminLogin(
    $input: PlatformAdminLoginInput!
  ) {
    platformAdminLogin(
      input: $input
    ) {
      id
      name
      email
      active
    }
  }
`;

export function PlatformAdminLogin() {
  const router =
    useRouter();

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    message,
    setMessage
  ] = useState("");

  const [
    login,
    {
      loading
    }
  ] = useMutation(
    PLATFORM_ADMIN_LOGIN
  );

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");

    try {
      await login({
        variables: {
          input: {
            email:
              email.trim(),
            password
          }
        }
      });

      router.replace(
        "/admin/dashboard"
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    }
  }

  return (
    <main className="platform-admin-login-page">
      <section className="platform-admin-login-card">
        <div className="platform-admin-login-brand">
          <span className="platform-admin-brand-mark">
            RO
          </span>

          <div>
            <strong>
              RetailOps
            </strong>

            <small>
              Platform Administration
            </small>
          </div>
        </div>

        <div className="platform-admin-login-copy">
          <p className="eyebrow">
            PLATFORM CONTROL
          </p>

          <h1>
            Platform Admin
          </h1>

          <p>
            Manage RetailOps businesses and account access.
            Tenant operational data is not available in this portal.
          </p>
        </div>

        <form
          className="platform-admin-login-form"
          onSubmit={
            submit
          }
        >
          <label>
            Email

            <input
              type="email"
              autoComplete="username"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event
                    .target
                    .value
                )
              }
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              autoComplete="current-password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event
                    .target
                    .value
                )
              }
              required
            />
          </label>

          {message && (
            <div className="shift-error platform-admin-login-error">
              {message}
            </div>
          )}

          <button
            className="button primary"
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Signing in…"
              : "Sign in to Platform Admin"}
          </button>
        </form>

        <div className="platform-admin-login-note">
          Business owners and employees continue to use the regular RetailOps login.
        </div>
      </section>
    </main>
  );
}
