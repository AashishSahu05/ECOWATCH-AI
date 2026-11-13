"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Camera, Trash2, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CivicLiveCameraModal } from "./CivicLiveCameraModal";

interface CivicImageUploaderProps {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  previewUrl: string | null;
  onClearImage: () => void;
  isAnalyzing?: boolean;
}

export function CivicImageUploader({
  onImageSelected,
  selectedImage,
  previewUrl,
  onClearImage,
  isAnalyzing = false,
}: CivicImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setClientError(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setClientError("Unsupported format. Please select a JPG, PNG, or WebP photograph.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setClientError("Image size exceeds 10MB limit. Please upload a smaller photo.");
      return;
    }

    onImageSelected(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {clientError && (
        <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{clientError}</span>
        </div>
      )}

      {previewUrl ? (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-950">
                Photographic Evidence Attached
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearImage}
              disabled={isAnalyzing}
              className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Retake / Replace
            </Button>
          </div>

          <div className="relative w-full max-h-[360px] sm:max-h-[420px] rounded-xl overflow-hidden bg-emerald-950/5 flex items-center justify-center border border-emerald-100">
            {/* Using regular img for inline base64/blob preview to handle varying aspect ratios */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Civic evidence preview"
              className="w-full h-auto max-h-[380px] object-contain rounded-xl"
            />
          </div>

          {selectedImage && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-800/80 pt-1">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-950 truncate max-w-[200px]">
                  {selectedImage.name}
                </span>
              </div>
              <div>Size: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</div>
              <div>Type: {selectedImage.type}</div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors ${
            dragActive
              ? "border-emerald-500 bg-emerald-50/60"
              : "border-emerald-200 hover:border-emerald-400 bg-white"
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
              <Camera className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-semibold text-emerald-950">
                Attach Photographic Evidence
              </h4>
              <p className="text-xs sm:text-sm text-emerald-800/70 mt-1">
                Upload an existing photograph or capture a live frame with your camera.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto border-emerald-300 text-emerald-900 hover:bg-emerald-50/50"
              >
                <Upload className="w-4 h-4 mr-2 text-emerald-700" />
                Upload from Device
              </Button>

              <Button
                type="button"
                size="md"
                onClick={() => setIsCameraOpen(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                Open Live Camera
              </Button>
            </div>

            <p className="text-[11px] text-emerald-800/60">
              Supports JPG, PNG, and WebP up to 10MB.
            </p>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      <CivicLiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => handleFile(file)}
        onFallbackToUpload={() => fileInputRef.current?.click()}
      />
    </div>
  );
}

