"use client";

import { useState } from "react";

type Props = {
  onLogin: (cedula: string, code: string) => boolean;
};

export function AdminLogin({ onLogin }: Props) {
  const [cedula, setCedula] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(cedula, code);
    if (ok) {
      setError("");
      setCedula("");
      setCode("");
    } else {
      setError("Cédula o código incorrectos.");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f3f3f3] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-[var(--calc-border)] bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Administración</h1>
        <p className="mt-1 text-sm text-[var(--calc-muted)]">
          Inicia sesión para ver reportes y usuarios.
        </p>
        <label className="mt-5 block">
          <span className="text-sm text-[var(--calc-muted)]">Cédula</span>
          <input
            type="text"
            inputMode="numeric"
            value={cedula}
            onChange={(e) => {
              setCedula(e.target.value);
              setError("");
            }}
            className="mt-1 w-full rounded-lg border border-[var(--calc-border)] px-3 py-2.5 font-mono outline-none focus:border-[var(--calc-accent)]"
            autoFocus
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-[var(--calc-muted)]">Código</span>
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            className="mt-1 w-full rounded-lg border border-[var(--calc-border)] px-3 py-2.5 font-mono outline-none focus:border-[var(--calc-accent)]"
          />
        </label>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-[var(--calc-accent)] py-3 text-sm font-medium text-white"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
