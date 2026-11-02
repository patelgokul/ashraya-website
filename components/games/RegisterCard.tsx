"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GameLoginSchema, GameRegisterSchema } from "@/lib/validations/game";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

type RegisterCardProps = {
  company: string;
  onRegistered: () => Promise<void>;
  intro?: { register: string; login: string };
};

export function RegisterCard({ company, onRegistered, intro }: RegisterCardProps) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [alias, setAlias] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setServerError(null);
    const parsed = registering
      ? GameRegisterSchema.safeParse({ alias, name, phone })
      : GameLoginSchema.safeParse({ alias });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] = issue.message;
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await fetch(registering ? "/api/games/register" : "/api/games/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (body?.code === "NOT_REGISTERED") {
          setMode("register");
          setServerError("This alias is not registered. Please register to continue.");
          return;
        }
        if (body?.code === "ALREADY_REGISTERED") {
          setMode("login");
          setServerError("This alias is already registered. Log in instead.");
          return;
        }
        const apiFields = body?.error?.fieldErrors ?? {};
        const entries = Object.entries(apiFields) as [string, string[]][];
        if (entries.length) {
          setFieldErrors(Object.fromEntries(entries.map(([field, messages]) => [field, messages[0]])));
          return;
        }
        setServerError(typeof body?.error === "string" ? body.error : registering ? "Registration failed. Please try again." : "Could not log in. Please try again.");
        return;
      }
      await onRegistered();
    } catch {
      setServerError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">{registering ? "Register" : "Log in"}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {intro
            ? registering ? intro.register : intro.login
            : registering
            ? `Create your ${company} player profile. Your name is what other players see. Your ${company} alias is only for logging in.`
            : `Enter the ${company} alias you registered with. Anyone who knows it can sign in as you.`}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="game-alias" className="block text-sm font-medium text-gray-700 mb-1.5">Your {company} alias</label>
            <input id="game-alias" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="akp" autoComplete="username" autoCapitalize="none" maxLength={20} required className={inputClass} />
            {fieldErrors.alias && <p className="text-red-500 text-xs mt-1">{fieldErrors.alias}</p>}
          </div>
          {registering && (
            <>
              <div>
                <label htmlFor="game-name" className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
                <input id="game-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Anurag Kumar Padney" autoComplete="name" maxLength={80} required className={inputClass} />
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="game-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Contact number</label>
                <input id="game-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel" required className={inputClass} />
                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>
            </>
          )}

          {serverError && <p role="alert" className="text-red-500 text-sm">{serverError}</p>}

          <button type="submit" disabled={busy}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
            {busy ? (registering ? "Registering..." : "Logging in...") : (registering ? "Register" : "Log in")}
          </button>
        </form>

        {registering ? (
          <button type="button" onClick={() => { setMode("login"); setFieldErrors({}); setServerError(null); }} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">
            Already registered? Log in
          </button>
        ) : (
          <button type="button" onClick={() => { setMode("register"); setFieldErrors({}); setServerError(null); }} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">
            New here? Register
          </button>
        )}
      </div>
    </motion.div>
  );
}
