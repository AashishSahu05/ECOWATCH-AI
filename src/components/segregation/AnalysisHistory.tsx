"use client";

import React, { useState } from "react";
import { WasteAnalysis } from "@/lib/segregation/types";
import { CategoryBadge } from "./CategoryBadge";
import { Trash2, Clock, Layers, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AnalysisHistoryProps {
  history: WasteAnalysis[];
  onSelect: (analysis: WasteAnalysis) => void;
  onDeleted: (id: string) => void;
}

export function AnalysisHistory({ history, onSelect, onDeleted }: AnalysisHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan record?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/segregation/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted(id);
      }
    } catch (err) {
      console.error("Failed to delete analysis:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="rounded-3xl p-8 sm:p-12 bg-white border border-brand-soft-sage text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-mint-cream text-brand-emerald flex items-center justify-center mx-auto border border-brand-soft-sage">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="font-manrope font-bold text-base text-brand-deep-green">
          No Scan History Yet
        </h4>
        <p className="text-xs text-brand-muted-slate font-inter max-w-sm mx-auto">
          Photographs you analyze with Nagardrishti AI will appear here for quick reference and bin verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-manrope font-bold text-lg text-brand-deep-green flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-fresh-green" />
          <span>Recent Segregation Scans ({history.length})</span>
        </h4>
        <span className="text-xs text-brand-muted-slate font-mono">
          Session & Local Persistence
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group rounded-3xl bg-white border border-brand-soft-sage p-5 shadow-card hover:border-brand-fresh-green/50 hover:shadow-elevated transition-all duration-200 cursor-pointer space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={item.overallCategory} size="sm" />
                  <span className="text-[11px] font-mono text-brand-muted-slate">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <h5 className="font-bold font-manrope text-sm text-brand-deep-green line-clamp-1 group-hover:text-brand-fresh-green transition-colors">
                  {item.summary}
                </h5>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(e, item.id)}
                disabled={deletingId === item.id}
                className="p-2 rounded-xl text-brand-muted-slate/60 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Delete scan record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Detected items chip previews */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.detectedObjects.map((obj) => (
                <span
                  key={obj.id}
                  className="text-[11px] font-inter bg-brand-mint-cream/60 text-brand-deep-green px-2.5 py-0.5 rounded-lg border border-brand-soft-sage truncate max-w-[180px]"
                >
                  {obj.label}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-brand-soft-sage/60 flex items-center justify-between text-xs font-manrope font-semibold text-brand-emerald">
              <span>View Full Classification</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

