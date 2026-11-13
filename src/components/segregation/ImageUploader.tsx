"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Camera, FolderOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { analyzeBrowserImageQuality } from "@/lib/segregation/image-validator";
import { ImageQualityAssessment } from "@/lib/segregation/types";
import { LiveCameraModal } from "./LiveCameraModal";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelected: (file: File, previewUrl: string, quality?: ImageQualityAssessment) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelected, disabled = false }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Pre-flight image quality and format check
    const quality = await analyzeBrowserImageQuality(file);

    if (!quality.isValid) {
      setErrorMessage(quality.warnings[0] || "Invalid file format or size limit exceeded.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      onImageSelected(file, previewUrl, quality);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden Native File Input for Explicit Upload from Device */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
          }
        }}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center",
          isDragOver
            ? "border-brand-emerald bg-brand-mint-cream/80 scale-[1.01]"
            : "border-brand-soft-sage bg-white hover:bg-brand-mint-cream/20 hover:border-brand-fresh-green/50",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center mb-4 shadow-subtle group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 text-brand-emerald" />
        </div>

        <h3 className="font-manrope font-bold text-lg sm:text-xl text-brand-deep-green">
          Drag & drop your waste photograph
        </h3>
        <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-1.5 max-w-md mx-auto leading-relaxed">
          Upload packaging, unsegregated trash, or discarded items to receive instant multi-object categorization, bounding boxes, and statutory bin directives.
        </p>

        {/* Issue 2: Two clearly distinguishable actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            icon={<FolderOpen className="w-4 h-4 text-brand-mint" />}
            disabled={disabled}
            className="shadow-sm font-semibold text-xs sm:text-sm"
          >
            Upload from Device
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsCameraOpen(true)}
            icon={<Camera className="w-4 h-4 text-brand-deep-green" />}
            disabled={disabled}
            className="font-semibold text-xs sm:text-sm"
          >
            Open Camera
          </Button>
        </div>

        <div className="mt-5 text-[11px] text-brand-muted-slate/80 font-mono">
          Supported Formats: JPG, PNG, WebP • Maximum Size: 5MB • Pre-flight Quality Verified
        </div>
      </div>

      {/* Live In-Browser Camera Modal (getUserMedia) */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => processFile(file)}
        onFallbackToUpload={() => fileInputRef.current?.click()}
      />
    </div>
  );
}
