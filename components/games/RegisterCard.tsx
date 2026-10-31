"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { GameRegisterSchema, type GameRegisterInput } from "@/lib/validations/game";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

type FieldErrors = Partial<Record<keyof GameRegisterInput, string[]>>;

export function RegisterCard({ company, onRegistered }: { company: string; onRegistered: () => Promise<void> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<GameRegisterInput>({
    resolver: zodResolver(GameRegisterSchema),
  });

  async function onSubmit(data: GameRegisterInput) {
    setServerError(null);
    const res = await fetch("/api/games/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const fieldErrors: FieldErrors = body?.error?.fieldErrors ?? {};
      const fields = Object.entries(fieldErrors) as [keyof GameRegisterInput, string[]][];
      if (fields.length === 0) {
        setServerError("Registration failed. Please try again.");
        return;
      }
      fields.forEach(([field, messages]) => setError(field, { message: messages[0] }));
      return;
    }
    await onRegistered();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Join the Game</h2>
        <p className="text-sm text-gray-500 mb-6">
          Register once and play every event. Already registered? Just enter the same alias to sign in on any phone.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your {company} Alias</label>
            <input {...register("alias")} placeholder="e.g. akp" autoComplete="nickname" autoCapitalize="none" className={inputClass} />
            {errors.alias && <p className="text-red-500 text-xs mt-1">{errors.alias.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input {...register("name")} placeholder="e.g. Anurag Kumar Pandey" autoComplete="name" className={inputClass} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
            <input {...register("phone")} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel-national" className={inputClass} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
            {isSubmitting ? "Joining..." : "Join & See Leaderboard →"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
