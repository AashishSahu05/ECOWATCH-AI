import React from "react";
import { CivicCategoryId } from "@/lib/civic/types";
import { CIVIC_CATEGORIES } from "@/lib/civic/categories";
import {
  AlertTriangle,
  Trash2,
  Layers,
  CalendarX,
  MapPin,
  Waves,
  Hammer,
  HelpCircle,
  LucideIcon,
  CheckCircle2,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle,
  Trash2,
  Layers,
  CalendarX,
  MapPin,
  Waves,
  Hammer,
  HelpCircle,
};

interface CivicCategorySelectorProps {
  selectedCategoryId: CivicCategoryId;
  onSelectCategory: (categoryId: CivicCategoryId) => void;
}

export function CivicCategorySelector({
  selectedCategoryId,
  onSelectCategory,
}: CivicCategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-emerald-950">
          Select Sanitation Issue Category
        </h3>
        <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
          Choose the category that best matches the sanitation problem you are reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CIVIC_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const Icon = ICON_MAP[cat.iconName] || HelpCircle;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`relative text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-50/80 border-emerald-600 shadow-sm ring-1 ring-emerald-600"
                  : "bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                </div>
              )}

              <div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-100/70 text-emerald-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="font-semibold text-sm text-emerald-950 pr-4">
                  {cat.name}
                </div>
                <p className="text-xs text-emerald-800/70 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </div>

              {cat.id === "cat_dumping" && (
                <div className="mt-3">
                  <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Primary Sanitation Focus
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

