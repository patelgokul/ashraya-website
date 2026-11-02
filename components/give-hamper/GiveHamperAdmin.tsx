"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { RegisterCard } from "@/components/games/RegisterCard";
import { OFFICE_LOCATIONS, officeById, type HamperAdminRow } from "@/lib/give-hamper";
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

const PAGE_SIZE = 20;
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

function officeLabel(row: HamperAdminRow) {
  if (!row.officeLocation) return null;
  return officeById(row.officeLocation)?.label ?? row.officeLocation;
}

function HamperTable({ rows, onLock, onSaved }: { rows: HamperAdminRow[]; onLock: () => Promise<void>; onSaved: (row: HamperAdminRow) => void }) {
  const [query, setQuery] = useState("");
  const [office, setOffice] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (office === "none" && row.officeLocation) return false;
      if (office && office !== "none" && row.officeLocation !== office) return false;
      if (!needle) return true;
      return [row.name, row.alias, officeLabel(row)].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [rows, query, office]);
  const withHours = filtered.filter((row) => row.hoursTracked !== null);
  const totalHours = withHours.reduce((sum, row) => sum + (row.hoursTracked ?? 0), 0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const from = filtered.length ? currentPage * PAGE_SIZE + 1 : 0;
  const to = Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE);

  function changeQuery(value: string) { setQuery(value); setPage(0); }
  function changeOffice(value: string) { setOffice(value); setPage(0); }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-gray-900">Give Hampers</h1>
          <p className="mt-1 hidden text-sm text-gray-500 sm:block">{filtered.length} of {rows.length} registered · {withHours.length} with hours · {totalHours} hours in total</p>
        </div>
        <button onClick={onLock} title="Lock admin" aria-label="Lock admin" className="shrink-0 rounded-xl border border-gray-200 bg-white p-3 text-gray-600 hover:text-gray-900">
          <LockKeyhole className="h-4 w-4" />
        </button>
      </header>

      <dl className="grid grid-cols-3 gap-2 sm:hidden">
        {[
          ["Shown", filtered.length],
          ["With hours", withHours.length],
          ["Hours", totalHours],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white px-2 py-2.5 text-center">
            <dt className="text-[11px] text-gray-500">{label}</dt>
            <dd className="text-sm font-bold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <span className="sr-only">Search</span>
          <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search name or alias" className={`${inputClass} pl-10`} />
        </label>
        <label className="block sm:w-72">
          <span className="sr-only">Filter by office location</span>
          <select value={office} onChange={(event) => changeOffice(event.target.value)} className={inputClass}>
            <option value="">All office locations</option>
            <option value="none">No office location</option>
            {OFFICE_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
          </select>
        </label>
      </div>

      {!pageRows.length && <p className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">No participants found.</p>}

      <ul className="space-y-3 md:hidden">
        {pageRows.map((row) => (
          <li key={row.alias} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-gray-900">{row.name}</p>
                <p className="font-mono text-xs text-gray-400">{row.alias}</p>
              </div>
              <p className="shrink-0 text-xs text-gray-500">{formatDate(row.registeredAt)}</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">{officeLabel(row) ?? "No office location"}</p>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">Hours logged</p>
              <HoursCell row={row} onSaved={onSaved} />
            </div>
          </li>
        ))}
      </ul>

      {!!pageRows.length && <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white md:block">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {["Name", "Registered", "Office location", "Hours logged"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageRows.map((row) => (
              <tr key={row.alias} className="align-top hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{row.name}</p>
                  <p className="font-mono text-xs text-gray-400">{row.alias}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(row.registeredAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{officeLabel(row) ?? <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3"><HoursCell row={row} onSaved={onSaved} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      <Pager page={currentPage} pageCount={pageCount} from={from} to={to} total={filtered.length} onPage={setPage} />
    </div>
  );
}

function Pager({ page, pageCount, from, to, total, onPage }: { page: number; pageCount: number; from: number; to: number; total: number; onPage: (page: number) => void }) {
  if (total <= PAGE_SIZE) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-gray-500">{from}–{to} of {total}</p>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm font-medium text-gray-700">{page + 1} / {pageCount}</span>
        <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => onPage(page + 1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
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
    <form onSubmit={save}>
      <div className="flex items-center gap-2">
        <input aria-label={`Hours for ${row.name}`} type="number" inputMode="decimal" min={0.25} max={MAX_HAMPER_HOURS} step={0.25}
          value={hours} onChange={(event) => setHours(event.target.value)} placeholder="—" className={`${inputClass} w-24 min-w-0 flex-1 px-3 py-2.5 sm:flex-none`} />
        <button disabled={busy || hours.trim() === "" || hours === saved} className={`${buttonClass} min-h-11 px-4`}>{busy ? "Saving" : row.hoursTracked === null ? "Add" : "Save"}</button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}
