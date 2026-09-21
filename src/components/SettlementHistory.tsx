"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import { Card } from "@/components/ui";

interface Settlement {
  id: string;
  amount: Decimal | string;
  date: Date | string;
  notes?: string;
  payer: { displayName: string };
  receiver: { displayName: string };
}

interface SettlementHistoryProps {
  settlements: Settlement[];
  onSettlementDeleted?: () => void;
}

export function SettlementHistory({ settlements, onSettlementDeleted }: SettlementHistoryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this settlement? This action cannot be undone.")) {
      return;
    }

    setDeleting(id);
    setError(null);

    try {
      const response = await fetch(`/api/settlements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete settlement.");
      }

      // Refresh the page or call the callback
      if (onSettlementDeleted) {
        onSettlementDeleted();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting settlement.");
      setDeleting(null);
    }
  };

  return (
    <>
      <h2 className="text-lg font-bold text-slate-900 pt-2">Settlement History</h2>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      <Card className="divide-y divide-slate-100 !p-0">
        {settlements.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No settlements yet.</p>
        )}
        {settlements.map((s) => (
          <div key={s.id} className="p-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-900">
                {s.payer.displayName} → {s.receiver.displayName}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(s.date).toLocaleDateString()}
                {s.notes ? ` · ${s.notes}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-green-600">
                ₹{new Decimal(s.amount.toString()).toFixed(2)}
              </p>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deleting === s.id}
                className="text-red-600 hover:text-red-800 disabled:text-slate-300 text-sm font-medium transition"
                title="Delete settlement"
              >
                {deleting === s.id ? "Deleting..." : "🗑️"}
              </button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
