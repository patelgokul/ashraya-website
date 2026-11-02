"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { X } from "lucide-react";
import { GameScoreSchema, MAX_POINTS_PER_ENTRY, type GameScoreInput } from "@/lib/validations/game";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

export function AddPointsDialog({ eventId, games, open, onOpenChange, onAdded }: {
  eventId: string;
  games: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => Promise<void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GameScoreInput>({
    resolver: zodResolver(GameScoreSchema),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setServerError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(data: GameScoreInput) {
    setServerError(null);
    const res = await fetch(`/api/games/events/${eventId}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setServerError(typeof body?.error === "string" ? body.error : "Couldn't save points. Please try again.");
      return;
    }
    await onAdded();
    handleOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-xl font-bold text-gray-900">Add your points</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">Enter the game you played and the points you scored.</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 hover:bg-gray-100" aria-label="Close"><X className="h-4 w-4" /></Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Game</label>
              <select {...register("game")} defaultValue="" className={`${inputClass} bg-white`}>
                <option value="" disabled>Select a game</option>
                {games.map((game) => <option key={game} value={game}>{game}</option>)}
              </select>
              {errors.game && <p className="mt-1 text-xs text-red-500">{errors.game.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Points</label>
              <input {...register("points")} type="number" inputMode="numeric" min={1} max={MAX_POINTS_PER_ENTRY} placeholder="e.g. 50" className={inputClass} />
              {errors.points && <p className="mt-1 text-xs text-red-500">{errors.points.message}</p>}
            </div>
            {serverError && <p className="text-sm text-red-500">{serverError}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Add points"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
