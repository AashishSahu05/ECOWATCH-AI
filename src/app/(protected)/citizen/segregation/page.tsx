"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { WasteAnalysis, DetectedWasteObject, WasteCategory, ImageQualityAssessment } from "@/lib/segregation/types";
import { ImageUploader } from "@/components/segregation/ImageUploader";
import { ImagePreview } from "@/components/segregation/ImagePreview";
import { AnalysisResults } from "@/components/segregation/AnalysisResults";
import { AnalysisHistory } from "@/components/segregation/AnalysisHistory";
import { SegregationSkeleton } from "@/components/segregation/SegregationSkeleton";
import { ClassificationOverrideModal } from "@/components/segregation/ClassificationOverrideModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Eye,
  Gavel,
} from "lucide-react";

export default function SmartSegregationPage() {
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQualityAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<WasteAnalysis | null>(null);
  const [history, setHistory] = useState<WasteAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Bounding Box & Card Hover Sync
  const [activeObjectId, setActiveObjectId] = useState<string | null>(null);

  // Citizen Correction Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetOverrideObject, setTargetOverrideObject] = useState<DetectedWasteObject | null>(null);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);

  // Load initial demo history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const { SEED_ANALYSES } = await import("@/lib/segregation/mock-adapter");
        const stored = localStorage.getItem("ecowatch_segregation_history");
        if (stored) {
          try {
            setHistory(JSON.parse(stored));
            return;
          } catch {
            // fallback
          }
        }
        setHistory(SEED_ANALYSES);
      } catch {
        // Fallback
      }
    }
    loadHistory();
  }, []);

  const handleImageSelected = (file: File, url: string, quality?: ImageQualityAssessment) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setImageQuality(quality || null);
    setErrorMessage(null);
    setCurrentAnalysis(null);
    setFeedbackSuccessMessage(null);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageQuality(null);
    setErrorMessage(null);
    setActiveObjectId(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setFeedbackSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/segregation/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze photograph.");
      }

      const result: WasteAnalysis = await response.json();
      setCurrentAnalysis(result);

      // Prepend to history
      setHistory((prev) => [result, ...prev]);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to complete AI waste analysis. Please check image and retry."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageQuality(null);
    setCurrentAnalysis(null);
    setErrorMessage(null);
    setActiveObjectId(null);
  };

  const handleHistoryDeleted = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(null);
    }
  };

  const handleOpenOverride = (object: DetectedWasteObject) => {
    setTargetOverrideObject(object);
    setOverrideModalOpen(true);
  };

  const handleOverrideSuccess = (objectId: string, newCategory: WasteCategory) => {
    if (!currentAnalysis) return;

    const updatedObjects = currentAnalysis.detectedObjects.map((obj) => {
      if (obj.id === objectId) {
        return {
          ...obj,
          category: newCategory,
          classificationCertainty: "high" as const,
          requiresManualVerification: false,
        };
      }
      return obj;
    });

    const updatedAnalysis: WasteAnalysis = {
      ...currentAnalysis,
      detectedObjects: updatedObjects,
    };

    setCurrentAnalysis(updatedAnalysis);
    setFeedbackSuccessMessage("Classification correction saved. Record updated with citizen feedback.");
    setTimeout(() => setFeedbackSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Page Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-fresh-green hover:text-brand-emerald transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
              AI Smart Waste Segregation
            </h1>
            <Badge variant="mint">
              Module 02 Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter max-w-xl">
            Point-of-disposal optical perception. Photograph discarded items to detect objects, render interactive bounding boxes, and receive statutory municipal bin guidance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-full bg-brand-mint-cream border border-brand-soft-sage text-xs font-mono font-semibold text-brand-deep-green flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-fresh-green" />
            <span>Gemini Vision Perception</span>
          </div>
        </div>
      </div>

      {/* Success Notification for Citizen Override */}
      {feedbackSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-inter flex items-center gap-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>{feedbackSuccessMessage}</span>
        </div>
      )}

      {/* Error Alert with Non-Destructive Retry */}
      {errorMessage && (
        <div className="p-4 rounded-3xl bg-red-50 border border-red-200 text-red-900 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-bold font-manrope text-sm block">Analysis Error</span>
              <p className="text-red-800 leading-relaxed font-inter">{errorMessage}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Analysis
          </Button>
        </div>
      )}

      {/* Active Analysis Mode: Results View with Synced Bounding Box Image Preview */}
      {currentAnalysis && (
        <AnalysisResults
          analysis={currentAnalysis}
          imagePreview={
            <ImagePreview
              previewUrl={currentAnalysis.imageUrl}
              fileName={selectedFile?.name || "Analyzed Scene"}
              onClear={handleReset}
              detectedObjects={currentAnalysis.detectedObjects}
              activeObjectId={activeObjectId}
              onHoverObject={setActiveObjectId}
              onSelectObject={(id) => setActiveObjectId(id)}
            />
          }
          activeObjectId={activeObjectId}
          onHoverObject={setActiveObjectId}
          onOpenOverride={handleOpenOverride}
          onReset={handleReset}
        />
      )}

      {/* Analyzing Scanning Telemetry State */}
      {isAnalyzing && <SegregationSkeleton />}

      {/* Upload & Preview Workspace (Visible when not showing results or scanning) */}
      {!currentAnalysis && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {!previewUrl ? (
              <ImageUploader onImageSelected={handleImageSelected} />
            ) : (
              <div className="space-y-4">
                <ImagePreview
                  previewUrl={previewUrl}
                  fileName={selectedFile?.name}
                  fileSize={selectedFile?.size}
                  onClear={handleClearImage}
                  isAnalyzing={isAnalyzing}
                  imageQuality={imageQuality}
                />

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleAnalyze}
                    icon={<Sparkles className="w-4 h-4 text-brand-mint" />}
                    className="w-full sm:flex-1 font-bold"
                  >
                    Run AI Segregation Analysis
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleClearImage}
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Retake / Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Guidance Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-brand-soft-sage shadow-card space-y-4">
              <div className="flex items-center gap-2 text-brand-deep-green font-bold font-manrope text-sm pb-2 border-b border-brand-soft-sage">
                <ShieldCheck className="w-4 h-4 text-brand-fresh-green" />
                <span>Four-Stream Segregation Protocols</span>
              </div>

              <div className="space-y-3 text-xs font-inter">
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 font-manrope">Wet Waste (Green Bin):</strong>
                    <p className="text-emerald-900/80 mt-0.5 leading-relaxed">
                      Fruit peels, food leftovers, tea leaves, compostable organic matter. Keep free of plastics.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-brand-mint-cream/80 border border-brand-soft-sage flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-brand-fresh-green mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-brand-deep-green font-manrope">Recyclable (Blue Bin):</strong>
                    <p className="text-brand-muted-slate mt-0.5 leading-relaxed">
                      Clean rigid plastics (#1 PET, #2 HDPE), metal cans, clean paper, empty glass bottles.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-950 font-manrope">Dry Waste (Grey Bin):</strong>
                    <p className="text-slate-800/80 mt-0.5 leading-relaxed">
                      Soiled non-recyclable wrappers, plastic pouches, thermal receipts, ceramics.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-red-950 font-manrope">Hazardous / Special (Direct Kiosk):</strong>
                    <p className="text-red-900/80 mt-0.5 leading-relaxed">
                      Spent batteries, paint cans, aerosol canisters, e-waste, fluorescent bulbs, sharps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Feed */}
      <div className="pt-6 border-t border-brand-soft-sage">
        <AnalysisHistory
          history={history}
          onSelect={(analysis) => {
            setCurrentAnalysis(analysis);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDeleted={handleHistoryDeleted}
        />
      </div>

      {/* Citizen Classification Override Modal */}
      {currentAnalysis && (
        <ClassificationOverrideModal
          analysisId={currentAnalysis.id}
          object={targetOverrideObject}
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </div>
  );
}
