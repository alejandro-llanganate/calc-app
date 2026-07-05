"use client";

import { useState } from "react";
import { Pencil, Trash2, UserRound, X, Check } from "lucide-react";
import { useAppData } from "@/context/AppDataProvider";
import type { CashierUser } from "@/lib/types";

export default function AdminUsuariosPage() {
  const {
    ready,
    cashierUsers,
    activeUser,
    addCashierUser,
    updateCashierUser,
    removeCashierUser,
  } = useAppData();

  const [name, setName] = useState("");
  const [cedula, setCedula] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCedula, setEditCedula] = useState("");

  if (!ready) {
    return (
      <p className="py-8 text-center text-stone-500">Cargando…</p>
    );
  }

  const cedulaTaken = (value: string, excludeId?: string) => {
    const code = value.trim().toLowerCase();
    if (!code) return false;
    return cashierUsers.some(
      (u) =>
        u.id !== excludeId && u.cedula?.trim().toLowerCase() === code,
    );
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Escribe el nombre del usuario.");
      return;
    }
    if (cedulaTaken(cedula)) {
      setFormError("Ya existe un usuario con esa cédula.");
      return;
    }
    const created = addCashierUser(trimmed, cedula);
    if (!created) {
      setFormError("No se pudo crear el usuario.");
      return;
    }
    setName("");
    setCedula("");
    setFormError("");
  };

  const startEdit = (user: CashierUser) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditCedula(user.cedula ?? "");
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCedula("");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setFormError("El nombre no puede estar vacío.");
      return;
    }
    if (cedulaTaken(editCedula, editingId)) {
      setFormError("Ya existe un usuario con esa cédula.");
      return;
    }
    updateCashierUser(editingId, {
      name: trimmed,
      cedula: editCedula.trim() || undefined,
    });
    cancelEdit();
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#1a1a1a]">Usuarios</h1>
          <p className="mt-1 text-sm text-[var(--calc-muted)]">
            Personas que pueden registrar ventas en la caja. Nombre y cédula.
          </p>
        </div>

        <form
          className="space-y-3 rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <h2 className="font-medium text-[#1a1a1a]">Agregar usuario</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-[var(--calc-muted)]">Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError("");
                }}
                placeholder="Ej. María González"
                className="mt-1 w-full rounded-lg border border-[var(--calc-border)] px-3 py-2.5 text-base outline-none focus:border-[var(--calc-accent)]"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--calc-muted)]">Cédula</span>
              <input
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value);
                  setFormError("");
                }}
                placeholder="Opcional — ej. 1234567890"
                className="mt-1 w-full rounded-lg border border-[var(--calc-border)] px-3 py-2.5 font-mono text-base outline-none focus:border-[var(--calc-accent)]"
              />
            </label>
          </div>
          {formError && !editingId && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-[var(--calc-accent)] px-5 py-2.5 text-sm font-medium text-white disabled:bg-[#c8c6c4]"
          >
            Agregar usuario
          </button>
        </form>

        <section className="overflow-hidden rounded-xl border border-[var(--calc-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--calc-border)] bg-[#faf9f8] px-5 py-3">
            <h2 className="font-medium text-[#1a1a1a]">
              {cashierUsers.length}{" "}
              {cashierUsers.length === 1 ? "usuario" : "usuarios"}
            </h2>
          </div>
          <ul className="divide-y divide-[var(--calc-border)]">
            {cashierUsers.map((user) => {
              const editing = editingId === user.id;
              const isActive = activeUser?.id === user.id;

              return (
                <li key={user.id} className="px-5 py-4">
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-lg border border-[var(--calc-border)] px-3 py-2 text-base outline-none focus:border-[var(--calc-accent)]"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editCedula}
                          onChange={(e) => setEditCedula(e.target.value)}
                          placeholder="Cédula"
                          className="rounded-lg border border-[var(--calc-border)] px-3 py-2 font-mono text-base outline-none focus:border-[var(--calc-accent)]"
                        />
                      </div>
                      {formError && editingId === user.id && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                          {formError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-1 rounded-lg border border-[var(--calc-border)] px-3 py-2 text-sm"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="flex items-center gap-1 rounded-lg bg-[var(--calc-accent)] px-3 py-2 text-sm text-white"
                        >
                          <Check className="h-4 w-4" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#deecf9] text-[var(--calc-accent)]">
                          <UserRound className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1a1a1a]">
                            {user.name}
                            {isActive && (
                              <span className="ml-2 rounded-full bg-[var(--calc-accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                                Activo en caja
                              </span>
                            )}
                          </p>
                          {user.cedula ? (
                            <p className="mt-0.5 font-mono text-sm text-[var(--calc-muted)]">
                              Cédula: {user.cedula}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
                              Sin cédula registrada
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded-lg p-2 text-[var(--calc-accent)] hover:bg-[#f3f2f1]"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCashierUser(user.id)}
                          disabled={cashierUsers.length <= 1}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          aria-label="Eliminar"
                          title={
                            cashierUsers.length <= 1
                              ? "Debe quedar al menos un usuario"
                              : "Eliminar"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-xs text-[var(--calc-muted)]">
          Los usuarios se guardan en Supabase y se sincronizan entre dispositivos.
        </p>
      </div>
  );
}
