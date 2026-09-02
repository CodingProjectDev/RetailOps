"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ME = gql`
  query MeForGate {
    me {
      id
      role
    }
  }
`;

export function AuthGate({
  allowedRoles,
  children
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, loading, error } = useQuery<{ me: { id: string; role: string } }>(ME, { fetchPolicy: "network-only" });

  useEffect(() => {
    if (error) {
      router.replace("/login");
      return;
    }

    const role = data?.me?.role;
    if (!loading && role && !allowedRoles.includes(role)) {
      router.replace(role === "CASHIER" ? "/employee/pos" : "/manager/dashboard");
    }
  }, [allowedRoles, data, error, loading, router]);

  if (loading || error || !data?.me || !allowedRoles.includes(data.me.role)) {
    return <main className="auth-loading">Checking RetailOps access…</main>;
  }

  return children;
}
