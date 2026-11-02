"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { RegisterCard } from "@/components/games/RegisterCard";
import { officeById, type HamperAdminRow } from "@/lib/give-hamper";
import { AdminHamperHoursSchema, MAX_HAMPER_HOURS } from "@/lib/validations/give-hamper";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

type View =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "login" }
  | { kind: "not-admin"; message: string }
  | { kind: "pin"; name: string }
  | { kind: "ready"; rows: HamperAdminRow[] };

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function GiveHamperAdmin() {
  const [view, setView] = useState<View>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/give-hamper/admin", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (res.status === 401) return setView({ kind: "login" });
      if (body?.code === "NOT_ADMIN") return setView({ kind: "not-admin", message: body.error });
      if (body?.code === "PIN_REQUIRED") return setView({ kind: "pin", name: body.name });
      if (!res.ok) throw new Error(body?.error ?? "Could not load Give Hampers. Please retry.");
      setView({ kind: "ready", rows: body.rows });
    } catch (failure) {
      setView({ kind: "error", message: (failure as Error).message });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    await fetch("/api/games/register", { method: "DELETE" }).catch(() => null);
    await load();
  }

  async function lock() {
    await fetch("/api/games/admin/pin", { method: "DELETE" }).catch(() => null);
    await load();
  }

  if (view.kind === "loading" || view.kind === "error") {
    return (
      <div className="py-20 text-center text-sm text-gray-600" role="status">
        <Clock3 className="mx-auto mb-3 h-6 w-6 text-blue-700" />
        {view.kind === "error" ? view.message : "Loading..."}
        {view.kind === "error" && <button onClick={load} className="ml-2 font-semibold text-blue-700 underline">Retry</button>}
      </div>
    );
  }

  if (view.kind === "login") {
    return (
      <RegisterCard company="Microsoft" onRegistered={load} initialMode="login"
        intro={{ login: "Log in with your admin alias to manage Give Hampers.", register: "Register with your Microsoft alias." }} />
    );
  }

  if (view.kind === "not-admin") {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-700">{view.message}.</p>
        <button onClick={signOut} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">Log in with a different alias</button>
      </div>
    );
  }

  if (view.kind === "pin") return <PinForm name={view.name} onUnlocked={load} />;

  return <HamperTable rows={view.rows} onLock={lock} onSaved={(row) => setView({ kind: "ready", rows: view.rows.map((item) => item.alias === row.alias ? row : item) })} />;
}

function PinForm({ name, onUnlocked }: { name: string; onUnlocked: () => Promise<void> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/games/admin/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not unlock. Please retry.");
      setPin("");
      await onUnlocked();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <ShieldCheck className="h-8 w-8 text-blue-700" />
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Give Hampers admin</h2>
        <p className="text-sm text-gray-500">Signed in as {name}</p>
      </div>
      <label className="block text-sm font-medium text-gray-700">
        Admin PIN
        <input type="password" required autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} className={`${inputClass} mt-1.5`} />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className={`${buttonClass} w-full`}>{busy ? "Unlocking..." : "Unlock"}</button>
    </form>
  );
}

function HamperTable({ rows, onLock, onSaved }: { rows: HamperAdminRow[]; onLock: () => Promise<void>; onSaved: (row: HamperAdminRow) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => [row.name, row.alias, row.officeLocation ? officeById(row.officeLocation)?.label : ""]
      .some((value) => value?.toLowerCase().includes(needle)));
  }, [rows, query]);
  const withHours = rows.filter((row) => row.hoursTracked !== null);
  const totalHours = withHours.reduce((sum, row) => sum + (row.hoursTracked ?? 0), 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Give Hampers</h1>
          <p className="text-sm text-gray-500">{rows.length} registered · {withHours.length} with hours · {totalHours} hours in total</p>
        </div>
        <button onClick={onLock} title="Lock admin" aria-label="Lock admin" className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:text-gray-900">
          <LockKeyhole className="h-4 w-4" />
        </button>
      </header>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <span className="sr-only">Search</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, alias, or office" className={`${inputClass} pl-10`} />
      </label>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["Name", "Registered", "Office location", "Hours logged"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row) => (
                <tr key={row.alias} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{row.name}</p>
                    <p className="font-mono text-xs text-gray-400">{row.alias}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(row.registeredAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.officeLocation ? officeById(row.officeLocation)?.label ?? row.officeLocation : <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3"><HoursCell row={row} onSaved={onSaved} /></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">No participants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HoursCell({ row, onSaved }: { row: HamperAdminRow; onSaved: (row: HamperAdminRow) => void }) {
  const saved = row.hoursTracked === null ? "" : String(row.hoursTracked);
  const [hours, setHours] = useState(saved);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setHours(saved); }, [saved]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsed = AdminHamperHoursSchema.safeParse({ alias: row.alias, hoursTracked: hours });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid hours");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/give-hamper/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save. Please retry.");
      onSaved(body.row);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="min-w-[11rem]">
      <div className="flex items-center gap-2">
        <input aria-label={`Hours for ${row.name}`} type="number" inputMode="decimal" min={0.25} max={MAX_HAMPER_HOURS} step={0.25}
          value={hours} onChange={(event) => setHours(event.target.value)} placeholder="—" className={`${inputClass} w-24 px-3 py-2`} />
        <button disabled={busy || hours.trim() === "" || hours === saved} className={`${buttonClass} px-3 py-2`}>{busy ? "Saving" : row.hoursTracked === null ? "Add" : "Save"}</button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}
