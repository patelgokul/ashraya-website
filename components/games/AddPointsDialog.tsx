"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { X } from "lucide-react";
import { GameScoreSchema, MAX_POINTS_PER_ENTRY, type GameScoreInput } from "@/lib/validations/game";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

interface Props {
  eventId: string;
  games: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => Promise<void>;
}

export function AddPointsDialog({ eventId, games, open, onOpenChange, onAdded }: Props) {
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
    if (!res.ok) {
      setServerError(res.status === 401 ? "Your session expired. Please register again." : "Couldn't save points. Please try again.");
      return;
    }
    await onAdded();
    handleOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-2xl p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="font-display text-xl font-bold text-gray-900">Add Your Points</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Enter the game you played and the points you scored.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Game</label>
              <select {...register("game")} defaultValue="" className={`${inputClass} bg-white`}>
                <option value="" disabled>Select a game</option>
                {games.map((game) => <option key={game} value={game}>{game}</option>)}
              </select>
              {errors.game && <p className="text-red-500 text-xs mt-1">{errors.game.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Points</label>
              <input {...register("points")} type="number" inputMode="numeric" min={1} max={MAX_POINTS_PER_ENTRY} placeholder="e.g. 50" className={inputClass} />
              {errors.points && <p className="text-red-500 text-xs mt-1">{errors.points.message}</p>}
            </div>

            {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              {isSubmitting ? "Saving..." : "Add Points"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
