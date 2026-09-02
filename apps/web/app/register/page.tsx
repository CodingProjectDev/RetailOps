"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Link from "next/link";
import {
  FormEvent,
  useState
} from "react";
import { useRouter } from "next/navigation";

const REGISTER_BUSINESS = gql`
  mutation RegisterBusiness(
    $input: RegisterBusinessInput!
  ) {
    registerBusiness(input: $input) {
      id
      name
      email
      role
      businessId
    }
  }
`;

export default function RegisterPage() {
  const router = useRouter();

  const [
    businessName,
    setBusinessName
  ] = useState("");

  const [
    ownerName,
    setOwnerName
  ] = useState("");

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [
    localError,
    setLocalError
  ] = useState("");

  const [
    registerBusiness,
    {
      loading,
      error
    }
  ] = useMutation<{
    registerBusiness: {
      id: string;
      name: string;
      email: string;
      role: string;
      businessId: string;
    };
  }>(REGISTER_BUSINESS);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setLocalError("");

    if (
      password !==
      confirmPassword
    ) {
      setLocalError(
        "Passwords do not match"
      );

      return;
    }

    try {
      await registerBusiness({
        variables: {
          input: {
            businessName,
            ownerName,
            email,
            password
          }
        }
      });

      router.replace(
        "/manager/business"
      );
    } catch {
      // Apollo exposes the mutation error below.
    }
  }

  return (
    <main className="landing registration-landing">
      <section className="login-card registration-card">
        <div className="brand-mark small">
          RO
        </div>

        <p className="eyebrow">
          CREATE BUSINESS
        </p>

        <h1>Start with RetailOps</h1>

        <p className="muted">
          Create an isolated business account. You will become the OWNER
          and can add managers, employees and stores later.
        </p>

        <form
          className="auth-form"
          onSubmit={submit}
        >
          <label>
            Business name

            <input
              type="text"
              value={businessName}
              onChange={(event) =>
                setBusinessName(
                  event.target.value
                )
              }
              placeholder="Example: Maria Market"
              required
              autoFocus
            />
          </label>

          <label>
            Owner name

            <input
              type="text"
              value={ownerName}
              onChange={(event) =>
                setOwnerName(
                  event.target.value
                )
              }
              placeholder="Your name"
              required
            />
          </label>

          <label>
            Owner email

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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          <label>
            Confirm password

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Re-enter password"
              minLength={8}
              required
            />
          </label>

          {(localError || error) && (
            <div className="auth-error">
              {localError ||
                error?.message}
            </div>
          )}

          <button
            className="button primary auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading
              ? "Creating business…"
              : "Create Business"}
          </button>
        </form>

        <div className="registration-login-link">
          <span>
            Already have a RetailOps account?
          </span>

          <Link href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
