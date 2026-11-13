"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, RefreshCw, AlertCircle, SwitchCamera, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CivicLiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackToUpload?: () => void;
}

export function CivicLiveCameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToUpload,
}: CivicLiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<
    "denied" | "unavailable" | "in_use" | "unsupported" | "insecure" | "generic" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorMessage(null);
    stopTracks();

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setIsLoading(false);
      setErrorType("insecure");
      setErrorMessage("Live camera access requires a secure connection (HTTPS or localhost).");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsLoading(false);
      setErrorType("unsupported");
      setErrorMessage("Your browser does not support live video capture.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsLoading(false);
        };
      }

      await refreshDevices();
    } catch (err: any) {
      setIsLoading(false);
      const name = err.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorType("denied");
        setErrorMessage("Camera permission was denied. Please allow camera access in browser settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setErrorType("unavailable");
        setErrorMessage("No video camera hardware detected on your device.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setErrorType("in_use");
        setErrorMessage("Camera is currently in use by another application or tab.");
      } else {
        setErrorType("generic");
        setErrorMessage(err.message || "Failed to initialize camera.");
      }
    }
  }, [selectedCameraId, stopTracks, refreshDevices]);

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

  const switchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].deviceId);
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (blob) {
          const file = new File(
            [blob],
            `civic_evidence_${Date.now()}.jpg`,
            { type: "image/jpeg", lastModified: Date.now() }
          );
          stopTracks();
          onCapture(file);
          onClose();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-emerald-950">
                Civic Evidence Camera
              </h2>
              <p className="text-xs text-emerald-800/70">
                Point camera at sanitation issue or dumped waste
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-emerald-100/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative flex-1 bg-black min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {errorType ? (
            <div className="p-6 text-center text-white max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Camera Access Restricted</h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Retry Camera
                </Button>
                {onFallbackToUpload && (
                  <Button
                    size="sm"
                    onClick={() => {
                      stopTracks();
                      onClose();
                      onFallbackToUpload();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Upload from Device Instead
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-950/80 text-white gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs sm:text-sm font-medium">Initializing camera feed...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Reticle */}
              {!isLoading && (
                <div className="absolute inset-8 sm:inset-12 pointer-events-none border border-white/40 rounded-xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-4 sm:px-6 py-4 bg-white border-t border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {availableCameras.length > 1 && !errorType && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                title="Switch between front and back cameras"
                className="text-emerald-900 border-emerald-200"
              >
                <SwitchCamera className="w-4 h-4 mr-1.5" />
                Switch Camera
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                stopTracks();
                onClose();
              }}
              className="text-gray-700"
            >
              Cancel
            </Button>

            {!errorType && (
              <Button
                size="md"
                onClick={handleCaptureFrame}
                disabled={isLoading || isCapturing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 shadow-md shadow-emerald-700/20"
              >
                {isCapturing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Capture Evidence Photo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

