"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CivicCategoryId,
  CivicLocation,
  CivicAIAnalysisDTO,
  CivicAIAnalysisStatus,
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
  CloudOff,
  HelpCircle,
  Clock,
  UserCheck,
} from "lucide-react";

interface CivicReportFormProps {
  initialCategoryId?: CivicCategoryId;
}

const AI_ANALYSIS_STAGES = [
  { id: 1, label: "Uploading photographic evidence & geolocation context", threshold: 20 },
  { id: 2, label: "Initializing Gemini 3.5 multi-modal perception model", threshold: 45 },
  { id: 3, label: "Scanning scene context & identifying visible waste materials", threshold: 70 },
  { id: 4, label: "Evaluating advisory severity (LOW / MEDIUM / HIGH) & hazard risks", threshold: 90 },
  { id: 5, label: "Structuring municipal inspection findings", threshold: 100 },
];

export function CivicReportForm({ initialCategoryId = "cat_dumping" }: CivicReportFormProps) {
  const router = useRouter();

  // Wizard state: Steps 1 to 5
  // Step 1: Category
  // Step 2: Evidence (Photo)
  // Step 3: Location & GPS
  // Step 4: Dedicated AI Analysis Screen
  // Step 5: Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [categoryId, setCategoryId] = useState<CivicCategoryId>(initialCategoryId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Dedicated AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<CivicAIAnalysisDTO | null>(null);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<CivicAIAnalysisStatus>("PENDING");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Security: prevent duplicate AI calls for the same file
  const analyzedFileSignatureRef = useRef<string | null>(null);

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

  // Handle Photo selection in Step 2
  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset previous analysis if a different photo is picked
    setAiAnalysis(null);
    setAiAnalysisStatus("PENDING");
    setAnalysisError(null);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiAnalysis(null);
    setAiAnalysisStatus("PENDING");
    setAnalysisError(null);
    analyzedFileSignatureRef.current = null;
  };

  // Dedicated Gemini AI Service Execution (Automatically called in Step 4)
  const runGeminiAnalysis = async () => {
    if (!selectedFile) return;

    const fileSig = `${selectedFile.name}_${selectedFile.size}_${selectedFile.lastModified}`;
    // Prevent duplicate AI requests
    if (isAnalyzing || (analyzedFileSignatureRef.current === fileSig && aiAnalysis)) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(10);
    setCurrentStageIndex(0);

    // Simulated progress stage ticker for visual feedback while server-side Gemini runs
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev < 85) {
          const next = prev + Math.floor(Math.random() * 12 + 6);
          if (next >= 75) setCurrentStageIndex(3);
          else if (next >= 45) setCurrentStageIndex(2);
          else if (next >= 20) setCurrentStageIndex(1);
          return next;
        }
        return prev;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("category", categoryId);
      if (location.formattedAddress) {
        formData.append("locationAddress", location.formattedAddress);
      }

      const res = await fetch("/api/civic/reports/analyze", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setCurrentStageIndex(4);

      const data = await res.json();

      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        setAiAnalysisStatus("COMPLETED");
        analyzedFileSignatureRef.current = fileSig;

        // Auto-suggest title & description if not manually entered
        if (!title.trim()) {
          const catName = getCategoryName(data.analysis.suggestedCategory || categoryId);
          setTitle(`${catName} reported near ${location.landmark || "neighborhood"}`);
        }
        if (!description.trim() && data.analysis.sceneDescription) {
          setDescription(data.analysis.sceneDescription);
        }
      } else {
        // AI analysis unavailable or failed on backend
        setAiAnalysis(null);
        setAiAnalysisStatus("FAILED");
        setAnalysisError(data.error || "AI analysis temporarily unavailable");

        // Still prepopulate default title if empty
        if (!title.trim()) {
          const catName = getCategoryName(categoryId);
          setTitle(`${catName} reported at ${location.landmark || "neighborhood"}`);
        }
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.warn("[CivicReportForm] AI analysis request error:", err);
      setAiAnalysis(null);
      setAiAnalysisStatus("FAILED");
      setAnalysisError("AI analysis temporarily unavailable");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Automatically trigger Gemini analysis when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && selectedFile && !aiAnalysis && aiAnalysisStatus === "PENDING" && !isAnalyzing) {
      runGeminiAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedFile]);

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
        aiAnalysisStatus,
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
    { num: 2, label: "Photo Evidence", icon: Camera },
    { num: 3, label: "GPS & Location", icon: MapPin },
    { num: 4, label: "AI Analysis", icon: Sparkles },
    { num: 5, label: "Review & Submit", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Wizard Step Progress Header */}
      <div className="bg-white border border-brand-soft-sage rounded-2xl p-4 sm:p-5 shadow-subtle">
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
                      ? "bg-brand-deep-green text-white shadow-md shadow-brand-deep-green/30 ring-4 ring-brand-mint-cream"
                      : isCompleted
                      ? "bg-brand-mint-cream text-brand-deep-green hover:bg-brand-soft-sage cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-brand-emerald" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-1.5 hidden sm:block font-manrope ${
                    isCurrent ? "text-brand-deep-green font-bold" : isCompleted ? "text-brand-emerald" : "text-gray-400"
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
      <div className="bg-white border border-brand-soft-sage rounded-2xl p-5 sm:p-7 shadow-subtle">
        {/* ======================================================== */}
        {/* STEP 1: Category Selection                               */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <CivicCategorySelector
              selectedCategoryId={categoryId}
              onSelectCategory={(id) => setCategoryId(id)}
            />

            <div className="flex justify-end pt-4 border-t border-brand-soft-sage/80">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-brand-deep-green hover:bg-brand-emerald text-white"
              >
                <span>Continue to Photo Evidence</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Photographic Evidence                            */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-green">
                Photographic Evidence
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-0.5">
                Capture or upload clear photographic evidence of the sanitation issue.
              </p>
            </div>

            <CivicImageUploader
              onImageSelected={handleImageSelected}
              selectedImage={selectedFile}
              previewUrl={previewUrl}
              onClearImage={handleClearImage}
              isAnalyzing={false}
            />

            <div className="flex items-center justify-between pt-4 border-t border-brand-soft-sage/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-brand-soft-sage text-brand-deep-green"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Category
              </Button>

              <Button
                type="button"
                disabled={!previewUrl}
                onClick={() => setCurrentStep(3)}
                className="bg-brand-deep-green hover:bg-brand-emerald text-white"
              >
                <span>Continue to Location & GPS</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Incident Location & GPS                          */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-green">
                Incident Location & GPS Coordinates
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-0.5">
                Verify the exact municipal incident coordinates. Next, our Gemini multi-modal engine will analyze your evidence.
              </p>
            </div>

            <CivicMapSelector
              location={location}
              onChangeLocation={(loc) => setLocation(loc)}
            />

            <div className="flex items-center justify-between pt-4 border-t border-brand-soft-sage/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="border-brand-soft-sage text-brand-deep-green"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evidence
              </Button>

              <Button
                type="button"
                disabled={!location.formattedAddress.trim()}
                onClick={() => setCurrentStep(4)}
                className="bg-[#143D2B] hover:bg-[#113525] text-white font-bold font-manrope shadow-md shadow-[#143D2B]/20"
              >
                <Sparkles className="w-4 h-4 mr-2 text-white" />
                <span>Proceed to Dedicated AI Inspection</span>
                <ArrowRight className="w-4 h-4 ml-2 text-white" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: DEDICATED AI ANALYSIS SCREEN                     */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-brand-soft-sage pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-emerald" />
                  <span>Google Gemini Multi-Modal Vision Analysis</span>
                </h3>
                <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
                  Automated scene perception, discarded material classification, and advisory severity estimation.
                </p>
              </div>

              {aiAnalysis && (
                <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Analysis Complete
                </span>
              )}
            </div>

            {/* 1. In-Progress State: Progress Bar & Analysis Stages */}
            {isAnalyzing && (
              <div className="bg-brand-cloud-white rounded-2xl border border-brand-soft-sage p-6 sm:p-8 space-y-6 shadow-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-deep-green text-white flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-manrope text-brand-deep-green">
                        Gemini Multi-Modal Inspection in Progress
                      </h4>
                      <p className="text-xs text-brand-muted-slate font-inter">
                        Please wait while server-side models evaluate photographic evidence...
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-brand-emerald">
                    {analysisProgress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-brand-soft-sage/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-emerald h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>

                {/* Analysis Stages Checklist */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brand-muted-slate block">
                    Analysis Pipeline Stages
                  </span>
                  <div className="space-y-2">
                    {AI_ANALYSIS_STAGES.map((stage, idx) => {
                      const isPast = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;

                      return (
                        <div
                          key={stage.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-inter transition-colors ${
                            isCurrent
                              ? "bg-brand-mint-cream border border-brand-emerald/40 text-brand-deep-green font-semibold"
                              : isPast
                              ? "text-brand-emerald bg-white"
                              : "text-brand-muted-slate/60 bg-transparent"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {isPast ? (
                              <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                            ) : isCurrent ? (
                              <RefreshCw className="w-4 h-4 text-brand-emerald animate-spin" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-brand-soft-sage" />
                            )}
                          </div>
                          <span className="truncate">{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Success State: Render Actual Gemini Structured Output */}
            {!isAnalyzing && aiAnalysis && (
              <div className="space-y-4">
                <CivicAIAnalysisCard analysis={aiAnalysis} />
              </div>
            )}

            {/* 3. Failure State: Gemini Unavailable Handling (Requirement 3) */}
            {!isAnalyzing && !aiAnalysis && (
              <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-6 space-y-4 text-amber-950">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CloudOff className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-manrope text-amber-950">
                      AI Analysis Temporarily Unavailable
                    </h4>
                    <p className="text-xs text-amber-900/90 font-inter leading-relaxed">
                      The automated vision inspection service could not complete at this moment. 
                      <strong> Your photographic evidence and GPS coordinates have been preserved safely.</strong>
                    </p>
                    <p className="text-xs text-amber-900/80 font-inter pt-1">
                      Your complaint will be forwarded directly to Ward 04 municipal sanitation officers for physical review. You can proceed to submit without delay.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={runGeminiAnalysis}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold font-manrope flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry AI Analysis</span>
                  </button>
                  <span className="text-[11px] font-mono text-amber-800">
                    Status: Marked as PENDING MANUAL REVIEW
                  </span>
                </div>
              </div>
            )}

            {/* Step 4 Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-soft-sage/80">
              <Button
                type="button"
                variant="outline"
                disabled={isAnalyzing}
                onClick={() => setCurrentStep(3)}
                className="border-brand-soft-sage text-brand-deep-green"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Location
              </Button>

              <Button
                type="button"
                disabled={isAnalyzing}
                onClick={() => setCurrentStep(5)}
                className="bg-brand-deep-green hover:bg-brand-emerald text-white"
              >
                <span>Continue to Review & Submit</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: Review & Submit Incident Report                  */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-green">
                Review & Confirm Incident Report
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-0.5">
                Verify all information before official submission to the Ward 04 municipal sanitation queue.
              </p>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Summary Review Card */}
            <div className="bg-brand-cloud-white border border-brand-soft-sage rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {previewUrl && (
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-brand-soft-sage shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Summary preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="inline-block text-xs font-semibold text-brand-deep-green bg-brand-mint-cream px-2.5 py-0.5 rounded-full border border-brand-soft-sage">
                    {getCategoryName(categoryId)}
                  </div>
                  <h4 className="text-base font-bold font-manrope text-brand-deep-green">
                    {title || "Untitled Incident Report"}
                  </h4>
                  <p className="text-xs text-brand-muted-slate font-inter line-clamp-3">
                    {description || "No scene description specified."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-brand-soft-sage text-xs">
                {/* Location Box */}
                <div className="p-3.5 bg-white rounded-xl border border-brand-soft-sage space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-brand-muted-slate block">
                    Incident Location
                  </span>
                  <p className="font-semibold text-brand-deep-green">{location.formattedAddress}</p>
                  {location.landmark && (
                    <p className="text-[11px] text-brand-muted-slate font-mono">
                      Landmark: {location.landmark}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-brand-emerald">
                    GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </p>
                </div>

                {/* AI Inspection Status Box */}
                <div className="p-3.5 bg-white rounded-xl border border-brand-soft-sage space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-brand-muted-slate block">
                    AI Inspection Status
                  </span>
                  {aiAnalysis ? (
                    <>
                      <p className="font-semibold text-brand-deep-green flex items-center gap-1.5">
                        <span>Advisory Urgency:</span>
                        <span className="font-mono font-bold uppercase text-brand-emerald">
                          {aiAnalysis.suggestedSeverity}
                        </span>
                      </p>
                      <p className="text-[11px] text-brand-muted-slate truncate">
                        Materials: {aiAnalysis.visibleMaterials.slice(0, 3).join(", ")}
                      </p>
                      {aiAnalysis.requiresHumanReview && (
                        <p className="text-[10px] text-amber-700 font-mono font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Flagged for Human Verification</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-amber-800">
                        AI Analysis Unavailable
                      </p>
                      <p className="text-[11px] text-brand-muted-slate">
                        Queued for manual triage by municipal officers.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Report Details */}
              <div className="space-y-4 pt-2 border-t border-brand-soft-sage">
                <div>
                  <label className="block text-xs font-bold font-manrope text-brand-deep-green mb-1">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Illegal garbage dumping on 14th Cross pathway"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-brand-soft-sage rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald text-brand-deep-green font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-manrope text-brand-deep-green mb-1">
                    Detailed Scene Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the approximate size, duration, vehicle or offender observations (if known)..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-brand-soft-sage rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald text-brand-deep-green font-medium"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-brand-emerald rounded border-brand-soft-sage focus:ring-brand-emerald"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-brand-deep-green flex items-center gap-1.5 font-manrope">
                        <Shield className="w-3.5 h-3.5 text-brand-emerald" />
                        Submit Anonymously
                      </span>
                      <span className="text-brand-muted-slate block text-[11px] font-inter">
                        Your citizen name and email will be omitted from public dispatch records.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-soft-sage/80">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(4)}
                className="border-brand-soft-sage text-brand-deep-green"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to AI Analysis
              </Button>

              <Button
                type="button"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                onClick={handleSubmitReport}
                className="bg-[#143D2B] hover:bg-[#113525] text-white font-bold font-manrope px-6 shadow-md shadow-[#143D2B]/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2 text-white" />
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
