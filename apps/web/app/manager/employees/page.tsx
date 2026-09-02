"use client";

import { FormEvent, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { PortalShell } from "@/components/portal-shell";

const EMPLOYEES = gql`
  query Employees {
    employees {
      id
      name
      email
      role
      active
      createdAt
    }
  }
`;

const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) {
      id
      name
      email
      role
      active
    }
  }
`;

export default function EmployeesPage() {
  type Employee = { id: string; name: string; email: string; role: string; active: boolean; createdAt: string };
  const { data, loading, refetch } = useQuery<{ employees: Employee[] }>(EMPLOYEES);
  const [createEmployee, mutation] = useMutation<
    { createEmployee: Employee },
    { input: { name: string; email: string; password: string } }
  >(CREATE_EMPLOYEE);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSuccess("");
    const result = await createEmployee({ variables: { input: { name, email, password } } });
    setSuccess(`${result.data?.createEmployee?.name} can now sign in as a cashier.`);
    setName("");
    setEmail("");
    setPassword("");
    await refetch();
  }

  return (
    <PortalShell role="manager" title="Employees" subtitle="Create cashier accounts and review current store users.">
      <section className="two-column employee-layout">
        <article className="panel">
          <div className="panel-head"><h2>Create employee</h2><span>CASHIER</span></div>
          <form className="auth-form" onSubmit={submit}>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Temporary password<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {mutation.error && <div className="auth-error">{mutation.error.message}</div>}
            {success && <div className="auth-success">{success}</div>}
            <button className="button primary auth-submit" disabled={mutation.loading} type="submit">
              {mutation.loading ? "Creating…" : "Create cashier account"}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head"><h2>Employees</h2><span>{data?.employees?.length ?? 0} accounts</span></div>
          {loading ? <p className="muted">Loading employees…</p> : (
            <div className="employee-list">
              {data?.employees?.map((employee) => (
                <div className="employee-row" key={employee.id}>
                  <div><strong>{employee.name}</strong><small>{employee.email}</small></div>
                  <span className="pill success">{employee.role}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </PortalShell>
  );
}
