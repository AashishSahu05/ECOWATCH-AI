"use client";

import React from "react";
import { X, FileText, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { DetectedWasteObject, ImageQualityAssessment } from "@/lib/segregation/types";
import { ObjectBoundingBoxes } from "./ObjectBoundingBoxes";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  previewUrl: string;
  fileName?: string;
  fileSize?: number;
  onClear: () => void;
  isAnalyzing?: boolean;
  detectedObjects?: DetectedWasteObject[];
  activeObjectId?: string | null;
  onHoverObject?: (id: string | null) => void;
  onSelectObject?: (id: string) => void;
  imageQuality?: ImageQualityAssessment | null;
}

export function ImagePreview({
  previewUrl,
  fileName,
  fileSize,
  onClear,
  isAnalyzing = false,
  detectedObjects = [],
  activeObjectId = null,
  onHoverObject = () => {},
  onSelectObject,
  imageQuality,
}: ImagePreviewProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  const hasBoxes = detectedObjects.some((o) => Array.isArray(o.box2d) && o.box2d.length === 4);

  return (
    <div className="relative rounded-3xl bg-white border border-brand-soft-sage p-4 shadow-card overflow-hidden animate-in fade-in duration-200 space-y-3">
      {/* Quality Warnings Banner if dark or blurry */}
      {imageQuality && imageQuality.warnings.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold font-manrope">Image Quality Notice</span>
            <p className="text-amber-800 leading-relaxed font-inter">
              {imageQuality.warnings[0]}
            </p>
          </div>
        </div>
      )}

      {/* Image Container with Bounding Box Layer */}
      <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-brand-mint-cream/50 flex items-center justify-center select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Waste Item for AI Inspection"
          className="w-full h-full object-contain"
        />

        {/* Interactive Bounding Box Overlay */}
        {hasBoxes && !isAnalyzing && (
          <ObjectBoundingBoxes
            objects={detectedObjects}
            activeObjectId={activeObjectId}
            onHoverObject={onHoverObject}
            onSelectObject={onSelectObject}
          />
        )}

        {/* Clear Action Button */}
        {!isAnalyzing && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-brand-deep-green hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-emerald z-40"
            aria-label="Remove image and select another"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Bounding box guide badge */}
        {hasBoxes && !isAnalyzing && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-brand-deep-green text-[10px] font-mono font-bold border border-brand-soft-sage shadow-sm flex items-center gap-1.5 backdrop-blur-xs pointer-events-none z-30">
            <Eye className="w-3 h-3 text-brand-fresh-green" />
            <span>Interactive Bounding Boxes Active</span>
          </div>
        )}

        {/* Optical Scanning Line Overlay when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-brand-emerald/10 pointer-events-none overflow-hidden z-40">
            <div className="w-full h-1 bg-brand-fresh-green shadow-[0_0_12px_#3B9B70] animate-[bounce_2s_infinite]" />
          </div>
        )}
      </div>

      {/* Metadata Bar */}
      <div className="px-1 flex flex-wrap items-center justify-between gap-2 text-xs font-inter text-brand-muted-slate">
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-3.5 h-3.5 text-brand-fresh-green shrink-0" />
          <span className="font-medium text-brand-deep-green truncate max-w-[200px]">
            {fileName || "Captured Photograph"}
          </span>
          {fileSize && (
            <span className="text-[11px] text-brand-muted-slate/80 font-mono">
              ({formatSize(fileSize)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Validated for Perception</span>
        </div>
      </div>
    </div>
  );
}
