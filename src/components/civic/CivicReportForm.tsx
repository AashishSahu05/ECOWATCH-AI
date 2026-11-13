"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CivicCategoryId,
  CivicLocation,
  CivicAIAnalysisDTO,
} from "@/lib/civic/types";
import { CIVIC_CATEGORIES, getCategoryName } from "@/lib/civic/categories";
import { getDefaultServiceArea } from "@/lib/civic/service-areas";
import { CivicCategorySelector } from "./CivicCategorySelector";
import { CivicImageUploader } from "./CivicImageUploader";
import { CivicAIAnalysisCard } from "./CivicAIAnalysisCard";
import { CivicMapSelector } from "./CivicMapSelector";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Camera,
  MapPin,
  FileText,
  Shield,
  RefreshCw,
} from "lucide-react";

export function CivicReportForm() {
  const router = useRouter();

  // Wizard state (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [categoryId, setCategoryId] = useState<CivicCategoryId>("cat_dumping");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CivicAIAnalysisDTO | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const defaultArea = getDefaultServiceArea();
  const [location, setLocation] = useState<CivicLocation>({
    latitude: defaultArea.centerLat,
    longitude: defaultArea.centerLng,
    accuracy: null,
    formattedAddress: "Lake View Perimeter Road, South Lake District, Bengaluru",
    landmark: "Near South Lake Garden East Gate",
    serviceAreaId: defaultArea.id,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // When image is selected, trigger Gemini AI analysis
  const handleImageSelected = async (file: File) => {
    setSelectedFile(file);

    // Create client-side preview immediately
    const reader = new FileReader();
    reader.onload = async (e) => {
      const clientUrl = e.target?.result as string;
      setPreviewUrl(clientUrl);

      // Trigger server-side AI analysis
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("category", categoryId);

        const res = await fetch("/api/civic/reports/analyze", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze photograph.");
        }

        setAiAnalysis(data.analysis);

        // Prepopulate title and description if empty
        if (!title) {
          const catName = getCategoryName(data.analysis.suggestedCategory || categoryId);
          setTitle(`${catName} reported near ${location.landmark || "neighborhood"}`);
        }
        if (!description) {
          setDescription(data.analysis.sceneDescription);
        }
      } catch (err: any) {
        console.warn("AI analysis warning:", err);
        setAnalysisError(err?.message || "AI analysis unavailable; you can proceed manually.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiAnalysis(null);
    setAnalysisError(null);
  };

  // Submit report to server
  const handleSubmitReport = async () => {
    if (!previewUrl) {
      setSubmitError("Photographic evidence is required.");
      return;
    }
    if (!title.trim() || title.length < 5) {
      setSubmitError("Please provide a descriptive title (at least 5 characters).");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setSubmitError("Please provide a detailed description (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        categoryId,
        title,
        description,
        location,
        media: [
          {
            publicUrl: previewUrl,
            mediaType: selectedFile?.type || "image/jpeg",
            fileSizeBytes: selectedFile?.size || 102400,
          },
        ],
        aiAnalysis: aiAnalysis
          ? {
              suggested_category: aiAnalysis.suggestedCategory,
              scene_description: aiAnalysis.sceneDescription,
              visible_materials: aiAnalysis.visibleMaterials,
              evidence_clarity: aiAnalysis.evidenceClarity,
              suggested_severity: aiAnalysis.suggestedSeverity,
              identification_uncertainty: aiAnalysis.identificationUncertainty,
              possible_hazards: aiAnalysis.possibleHazards,
              recommended_action: aiAnalysis.recommendedAction,
              estimated_waste_volume: aiAnalysis.estimatedWasteVolume,
            }
          : undefined,
        isAnonymous,
      };

      const res = await fetch("/api/civic/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to submit report.");
      }

      router.push(`/citizen/report/success?ref=${result.referenceNumber}&id=${result.id}`);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    { num: 1, label: "Category", icon: FileText },
    { num: 2, label: "Evidence", icon: Camera },
    { num: 3, label: "AI & Details", icon: Sparkles },
    { num: 4, label: "Location", icon: MapPin },
    { num: 5, label: "Review", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Wizard Step Progress Header */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {stepTitles.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const Icon = step.icon;

            return (
              <div key={step.num} className="flex-1 flex flex-col items-center text-center relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.num as any);
                  }}
                  disabled={!isCompleted && !isCurrent}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-50"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                    isCurrent ? "text-emerald-950" : isCompleted ? "text-emerald-800" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* STEP 1: Category */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <CivicCategorySelector
              selectedCategoryId={categoryId}
              onSelectCategory={(id) => setCategoryId(id)}
            />

            <div className="flex justify-end pt-4 border-t border-emerald-50">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Evidence */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-emerald-950">
                Photographic Evidence
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
                Clear photographs assist municipal inspectors in dispatching the appropriate equipment and crew.
              </p>
            </div>

            <CivicImageUploader
              onImageSelected={handleImageSelected}
              selectedImage={selectedFile}
              previewUrl={previewUrl}
              onClearImage={handleClearImage}
              isAnalyzing={isAnalyzing}
            />

            <div className="flex items-center justify-between pt-4 border-t border-emerald-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-emerald-200 text-emerald-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Category
              </Button>

              <Button
                type="button"
                disabled={!previewUrl || isAnalyzing}
                onClick={() => setCurrentStep(3)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Evidence...
                  </>
                ) : (
                  <>
                    <span>Proceed to Inspection & Details</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: AI & Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* AI Analysis Display */}
            {aiAnalysis ? (
              <CivicAIAnalysisCard analysis={aiAnalysis} />
            ) : isAnalyzing ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-emerald-950">
                  Gemini is inspecting your photographic evidence...
                </h4>
                <p className="text-xs text-emerald-800/70">
                  Detecting waste composition, hazard flags, and estimated volume.
                </p>
              </div>
            ) : null}

            {analysisError && (
              <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Illegal garbage dumping on 14th Cross pathway"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Detailed Scene Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the approximate size, duration, vehicle or offender observations (if known), and public impact..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-emerald-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="border-emerald-200 text-emerald-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evidence
              </Button>

              <Button
                type="button"
                disabled={!title.trim() || !description.trim()}
                onClick={() => setCurrentStep(4)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Geo-Tagging */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <CivicMapSelector
              location={location}
              onChangeLocation={(loc) => setLocation(loc)}
            />

            <div className="flex items-center justify-between pt-4 border-t border-emerald-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="border-emerald-200 text-emerald-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Details
              </Button>

              <Button
                type="button"
                disabled={!location.formattedAddress.trim()}
                onClick={() => setCurrentStep(5)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Review & Submit Report</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-emerald-950">
                Review Incident Report
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
                Verify all information before official submission to the municipal sanitation queue.
              </p>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {previewUrl && (
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-emerald-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Summary preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="inline-block text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {getCategoryName(categoryId)}
                  </div>
                  <h4 className="text-base font-bold text-emerald-950">{title}</h4>
                  <p className="text-xs text-emerald-900/80 line-clamp-3">{description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-100 text-xs">
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-800/70 font-medium block">
                    Incident Location
                  </span>
                  <p className="font-semibold text-emerald-950 mt-0.5">{location.formattedAddress}</p>
                  {location.landmark && (
                    <p className="text-[11px] text-emerald-800/70 mt-0.5">
                      Landmark: {location.landmark}
                    </p>
                  )}
                  <p className="text-[11px] font-mono text-emerald-800/60 mt-1">
                    GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-800/70 font-medium block">
                    AI Inspection Status
                  </span>
                  <p className="font-semibold text-emerald-950 mt-0.5">
                    Advisory Severity:{" "}
                    <span className="capitalize text-emerald-800">
                      {aiAnalysis?.suggestedSeverity || "Medium"}
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-800/70 mt-0.5">
                    Materials: {aiAnalysis?.visibleMaterials.slice(0, 3).join(", ") || "General refuse"}
                  </p>
                  <p className="text-[11px] text-emerald-800/60 mt-1">
                    Clarity: {aiAnalysis?.evidenceClarity || "Clear"}
                  </p>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      Submit Anonymously
                    </span>
                    <span className="text-emerald-800/70 block text-[11px]">
                      Your citizen name and email will be hidden from the public dispatch record.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-emerald-50">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(4)}
                className="border-emerald-200 text-emerald-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Location
              </Button>

              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-md shadow-emerald-700/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Incident Report
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

