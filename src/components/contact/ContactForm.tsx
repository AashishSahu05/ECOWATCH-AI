"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormData {
  fullName: string;
  email: string;
  organizationType: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  organizationType?: string;
  subject?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    organizationType: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid work email address.";
    }

    if (!formData.organizationType) {
      newErrors.organizationType = "Please select your organization type.";
    }

    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      newErrors.subject = "Please enter a subject (minimum 3 characters).";
    }

    if (!formData.message.trim() || formData.message.trim().length < 15) {
      newErrors.message = "Please enter a detailed message (minimum 15 characters).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field being edited
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate clean client-side submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      organizationType: "",
      subject: "",
      message: "",
    });
    setErrors({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="rounded-3xl bg-brand-soft-sage/40 border border-brand-leaf-green/40 p-8 sm:p-12 text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-brand-forest-green text-brand-mint flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-brand-mint" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-leaf-green/15 text-brand-forest-green border border-brand-leaf-green/30 text-xs font-semibold">
          Frontend Validation Passed • Simulated Submission
        </div>
        <h3 className="font-manrope font-extrabold text-2xl text-brand-deep-forest">
          Demonstration Submission Recorded
        </h3>
        <p className="text-sm text-brand-charcoal/80 font-inter max-w-md mx-auto leading-relaxed">
          Thank you, <span className="font-semibold">{formData.fullName}</span>. All fields passed client-side validation for subject{" "}
          <span className="font-medium text-brand-deep-forest">&ldquo;{formData.subject}&rdquo;</span>.
        </p>
        <div className="bg-white/80 p-3.5 rounded-xl border border-brand-forest-green/15 text-xs text-brand-charcoal/70 text-left max-w-md mx-auto space-y-1">
          <span className="font-bold text-brand-deep-forest block">
            Module 00 Architecture Notice:
          </span>
          <p>
            This submission is an interactive client-side simulation. In accordance with Module 00 boundaries,
            no real backend network transmission or email dispatch was initiated. Backend delivery will be integrated in future modules.
          </p>
        </div>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Reset Form Demonstration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Full Name & Work Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
          >
            Full Name <span className="text-brand-leaf-green">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Dr. Sarah Jenkins"
            aria-invalid={!!errors.fullName}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-white border text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 transition-all",
              errors.fullName
                ? "border-red-500 focus:ring-red-400"
                : "border-brand-forest-green/20 focus:border-brand-leaf-green focus:ring-brand-leaf-green/20"
            )}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
          >
            Work Email <span className="text-brand-leaf-green">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="sarah.jenkins@citygov.org"
            aria-invalid={!!errors.email}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-white border text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 transition-all",
              errors.email
                ? "border-red-500 focus:ring-red-400"
                : "border-brand-forest-green/20 focus:border-brand-leaf-green focus:ring-brand-leaf-green/20"
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Organization Type & Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label
            htmlFor="organizationType"
            className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
          >
            Organization Type <span className="text-brand-leaf-green">*</span>
          </label>
          <select
            id="organizationType"
            name="organizationType"
            value={formData.organizationType}
            onChange={handleChange}
            aria-invalid={!!errors.organizationType}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-white border text-sm text-brand-charcoal font-inter focus:outline-none focus:ring-2 transition-all cursor-pointer",
              errors.organizationType
                ? "border-red-500 focus:ring-red-400"
                : "border-brand-forest-green/20 focus:border-brand-leaf-green focus:ring-brand-leaf-green/20"
            )}
          >
            <option value="">Select an organization type...</option>
            <option value="municipality">Municipality / City Sanitation Department</option>
            <option value="enterprise">Commercial / Waste Management Enterprise</option>
            <option value="civic-ngo">Civic Group / Environmental NGO</option>
            <option value="academic">Academic / Environmental Research Institute</option>
            <option value="buildathon">Google Startup Buildathon Judge / Mentor</option>
            <option value="other">Other Inquirer</option>
          </select>
          {errors.organizationType && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.organizationType}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="subject"
            className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
          >
            Inquiry Subject <span className="text-brand-leaf-green">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g. Ward Pilot Demonstration Request"
            aria-invalid={!!errors.subject}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-white border text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 transition-all",
              errors.subject
                ? "border-red-500 focus:ring-red-400"
                : "border-brand-forest-green/20 focus:border-brand-leaf-green focus:ring-brand-leaf-green/20"
            )}
          />
          {errors.subject && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.subject}</span>
            </p>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="space-y-1.5">
        <label
          htmlFor="message"
          className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
        >
          Message Details <span className="text-brand-leaf-green">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Please describe your city or jurisdiction, current waste collection challenges, or specific module evaluation requirements..."
          aria-invalid={!!errors.message}
          className={cn(
            "w-full px-4 py-3 rounded-xl bg-white border text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 transition-all resize-y",
            errors.message
              ? "border-red-500 focus:ring-red-400"
              : "border-brand-forest-green/20 focus:border-brand-leaf-green focus:ring-brand-leaf-green/20"
          )}
        />
        {errors.message && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-inter">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.message}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          icon={
            isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-brand-mint" />
            ) : (
              <Send className="w-4 h-4 text-brand-mint" />
            )
          }
        >
          {isSubmitting ? "Validating & Submitting..." : "Submit Inquiry to Municipal Team (Simulation)"}
        </Button>
      </div>

      <p className="text-[11px] text-center text-brand-charcoal/60 font-inter">
        <strong>Demonstration Notice:</strong> Module 00 tests client-side form validation and simulates submission states without backend transmission.
      </p>
    </form>
  );
}

