"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Link from "next/link";
import {
  FormEvent,
  useState
} from "react";
import { useRouter } from "next/navigation";

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      id
      name
      email
      role
      businessId
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    login,
    {
      loading,
      error
    }
  ] = useMutation<{
    login: {
      id: string;
      name: string;
      email: string;
      role: string;
      businessId: string;
    };
  }>(LOGIN);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      const result =
        await login({
          variables: {
            input: {
              email,
              password
            }
          }
        });

      const role =
        result.data?.login?.role;

      router.replace(
        role === "CASHIER"
          ? "/employee/pos"
          : "/manager/dashboard"
      );
    } catch {
      // Apollo mutation error is rendered below.
    }
  }

  return (
    <main className="landing">
      <section className="login-card compact-login">
        <div className="brand-mark small">
          RO
        </div>

        <p className="eyebrow">
          SECURE SIGN IN
        </p>

        <h1>RetailOps</h1>

        <p className="muted">
          Sign in to your business account.
        </p>

        <form
          className="auth-form"
          onSubmit={submit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="owner@example.com"
              required
              autoFocus
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter password"
              required
            />
          </label>

          {error && (
            <div className="auth-error">
              {error.message}
            </div>
          )}

          <button
            className="button primary auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading
              ? "Signing in…"
              : "Sign in"}
          </button>
        </form>

        

        
      </section>
    </main>
  );
}
