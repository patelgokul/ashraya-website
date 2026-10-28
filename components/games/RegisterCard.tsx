"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { GameRegisterSchema, type GameRegisterInput } from "@/lib/validations/game";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

export function RegisterCard({ onRegistered }: { onRegistered: () => Promise<void> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GameRegisterInput>({
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
      setServerError("Registration failed. Please try again.");
      return;
    }
    await onRegistered();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Join the Game</h2>
        <p className="text-sm text-gray-500 mb-6">
          Register once on this phone. You&apos;ll stay signed in on this device for the whole event.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input {...register("name")} placeholder="e.g. Anurag Kumar Pandey" autoComplete="name" className={inputClass} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Microsoft Alias</label>
            <input {...register("alias")} placeholder="e.g. akp" autoComplete="nickname" className={inputClass} />
            {errors.alias && <p className="text-red-500 text-xs mt-1">{errors.alias.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
            <input {...register("phone")} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel-national" className={inputClass} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
            {isSubmitting ? "Registering..." : "Register & See Leaderboard →"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
