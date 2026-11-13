"use client";

import React from "react";
import { DetectedWasteObject } from "@/lib/segregation/types";
import { cn } from "@/lib/utils";

interface ObjectBoundingBoxesProps {
  objects: DetectedWasteObject[];
  activeObjectId: string | null;
  onHoverObject: (id: string | null) => void;
  onSelectObject?: (id: string) => void;
}

export function ObjectBoundingBoxes({
  objects,
  activeObjectId,
  onHoverObject,
  onSelectObject,
}: ObjectBoundingBoxesProps) {
  const getStreamStyles = (category: string, isActive: boolean) => {
    switch (category) {
      case "wet":
        return {
          border: isActive ? "border-emerald-600 ring-4 ring-emerald-400/30" : "border-emerald-500",
          bg: isActive ? "bg-emerald-500/20" : "bg-emerald-500/10",
          tag: "bg-emerald-700 text-white",
        };
      case "recyclable":
        return {
          border: isActive ? "border-brand-emerald ring-4 ring-brand-fresh-green/40" : "border-brand-fresh-green",
          bg: isActive ? "bg-brand-emerald/20" : "bg-brand-emerald/10",
          tag: "bg-brand-emerald text-white",
        };
      case "hazardous":
        return {
          border: isActive ? "border-red-600 ring-4 ring-red-400/40" : "border-red-500",
          bg: isActive ? "bg-red-500/25" : "bg-red-500/10",
          tag: "bg-red-700 text-white animate-pulse",
        };
      case "dry":
      default:
        return {
          border: isActive ? "border-slate-700 ring-4 ring-slate-400/30" : "border-slate-500",
          bg: isActive ? "bg-slate-500/20" : "bg-slate-500/10",
          tag: "bg-slate-700 text-white",
        };
    }
  };

  const objectsWithBoxes = objects.filter((o) => Array.isArray(o.box2d) && o.box2d.length === 4);

  if (objectsWithBoxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {objectsWithBoxes.map((obj, idx) => {
        const [ymin, xmin, ymax, xmax] = obj.box2d!;
        const top = ymin / 10;
        const left = xmin / 10;
        const height = (ymax - ymin) / 10;
        const width = (xmax - xmin) / 10;

        const isActive = activeObjectId === obj.id;
        const style = getStreamStyles(obj.category, isActive);

        return (
          <div
            key={obj.id}
            onMouseEnter={() => onHoverObject(obj.id)}
            onMouseLeave={() => onHoverObject(null)}
            onClick={() => onSelectObject?.(obj.id)}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
            className={cn(
              "absolute pointer-events-auto rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-start",
              style.border,
              style.bg,
              isActive ? "z-30 scale-[1.01]" : "z-20 hover:scale-[1.005]"
            )}
            title={`${obj.label} (${Math.round(obj.identificationConfidence * 100)}% confidence)`}
          >
            {/* Floating Tag */}
            <div
              className={cn(
                "absolute flex items-center gap-1 z-40 pointer-events-none",
                top < 8 ? "top-1 left-1" : "-top-6 left-0"
              )}
            >
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md font-mono text-[10px] font-bold shadow-md truncate max-w-[180px]",
                  style.tag
                )}
              >
                #{idx + 1} {obj.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

