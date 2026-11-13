"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, RefreshCw, AlertCircle, SwitchCamera, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackToUpload?: () => void;
}

export function LiveCameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToUpload,
}: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<
    "denied" | "unavailable" | "in_use" | "unsupported" | "insecure" | "generic" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-camera support
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Stop all active media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(videoDevices);
    } catch {
      // ignore
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorMessage(null);
    stopTracks();

    // Check secure context
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setIsLoading(false);
      setErrorType("insecure");
      setErrorMessage("Live camera access requires a secure connection (HTTPS or localhost).");
      return;
    }

    // Check getUserMedia support
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setIsLoading(false);
      setErrorType("unsupported");
      setErrorMessage("Your browser does not support live camera video streams.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
            },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        // Fallback constraint if overconstrained
        if (firstErr.name === "OverconstrainedError" || firstErr.name === "ConstraintNotSatisfiedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsLoading(false);
        };
      } else {
        setIsLoading(false);
      }

      // Enumerate cameras after permission is granted
      await refreshDevices();
    } catch (err: any) {
      stopTracks();
      setIsLoading(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorType("denied");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to scan items directly.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorType("unavailable");
        setErrorMessage("No camera hardware was detected on this device. Please upload an image from your device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorType("in_use");
        setErrorMessage("Camera is currently in use by another application or browser tab. Please close other camera apps and retry.");
      } else {
        setErrorType("generic");
        setErrorMessage(err.message || "Failed to initialize camera. Please try again or upload a photo.");
      }
    }
  }, [selectedCameraId, stopTracks, refreshDevices]);

  // Start on open, stop on close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopTracks();
    }

    return () => {
      stopTracks();
    };
  }, [isOpen, startCamera, stopTracks]);

  // Switch camera handler
  const handleSwitchCamera = () => {
    if (availableCameras.length < 2) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].deviceId);
  };

  // Capture frame
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    setIsCapturing(true);

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not acquire 2D rendering canvas context");

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert to JPEG Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsCapturing(false);
            setErrorMessage("Failed to encode photograph frame.");
            return;
          }

          const file = new File(
            [blob],
            `waste_capture_${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );

          // Stop camera tracks immediately
          stopTracks();
          setIsCapturing(false);

          // Deliver file to parent handler
          onCapture(file);
          onClose();
        },
        "image/jpeg",
        0.92
      );
    } catch (err: any) {
      setIsCapturing(false);
      setErrorMessage(err.message || "Failed to capture photo frame.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-deep-green/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-brand-soft-sage shadow-card overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-brand-soft-sage flex items-center justify-between gap-3 bg-brand-cloud-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-mint-cream border border-brand-soft-sage flex items-center justify-center text-brand-emerald">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold font-manrope text-base sm:text-lg text-brand-deep-green">
                Live Waste Camera
              </h3>
              <p className="text-[11px] font-inter text-brand-muted-slate hidden sm:block">
                Center discarded item in frame for optical perception
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {availableCameras.length > 1 && !errorType && !isLoading && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-brand-soft-sage bg-white hover:bg-brand-mint-cream text-xs font-semibold text-brand-deep-green transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-brand-fresh-green" />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopTracks();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-brand-mint-cream text-brand-muted-slate hover:text-brand-deep-green transition-colors focus:outline-none"
              aria-label="Close camera modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Live Viewfinder or Error State */}
        <div className="relative w-full bg-slate-950 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Live Video Stream */}
          {!errorType && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Optical Targeting Reticle Overlay */}
          {!errorType && !isLoading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-full h-full max-w-md max-h-72 border-2 border-white/40 border-dashed rounded-3xl relative flex items-center justify-center">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-fresh-green rounded-tl-xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-fresh-green rounded-tr-xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-fresh-green rounded-bl-xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-fresh-green rounded-br-xl -mb-1 -mr-1" />

                <span className="text-[11px] font-mono font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                  Align Waste Item Within Bounds
                </span>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !errorType && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-white z-20">
              <div className="w-10 h-10 border-4 border-brand-fresh-green/30 border-t-brand-fresh-green rounded-full animate-spin" />
              <span className="text-xs font-mono text-white/80">
                Initializing Live Video Stream...
              </span>
            </div>
          )}

          {/* Explicit Error State */}
          {errorType && (
            <div className="absolute inset-0 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-green">
                  {errorType === "denied"
                    ? "Camera Permission Denied"
                    : errorType === "unavailable"
                    ? "No Camera Detected"
                    : errorType === "in_use"
                    ? "Camera Already in Use"
                    : errorType === "insecure"
                    ? "Insecure Context"
                    : "Camera Unavailable"}
                </h4>
                <p className="text-xs text-brand-muted-slate font-inter leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Camera
                </Button>

                {onFallbackToUpload && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      stopTracks();
                      onClose();
                      onFallbackToUpload();
                    }}
                    icon={<Upload className="w-3.5 h-3.5 text-brand-mint" />}
                  >
                    Upload from Device
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Controls / Trigger Footer */}
        <div className="p-4 sm:p-5 bg-brand-cloud-white border-t border-brand-soft-sage flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="text-xs"
          >
            Cancel
          </Button>

          {!errorType && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleCapturePhoto}
                disabled={isLoading || isCapturing}
                icon={<Camera className="w-4 h-4 text-brand-mint" />}
                className="px-6 font-manrope font-bold text-sm shadow-md"
              >
                {isCapturing ? "Processing..." : "Capture Photo"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
