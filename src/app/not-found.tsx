import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Compass, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center py-20 px-4 text-center bg-brand-warm-white">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-soft-sage text-brand-forest-green flex items-center justify-center mx-auto border border-brand-forest-green/20">
          <Compass className="w-8 h-8 text-brand-forest-green" />
        </div>

        <Badge variant="leaf">Error 404 • Coordinate Unresolved</Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold font-manrope text-brand-deep-forest">
          Page Not Located
        </h1>

        <p className="text-sm text-brand-charcoal/80 font-inter leading-relaxed">
          The requested route is outside the mapped EcoWatch AI jurisdiction. Please return to the
          homepage or explore our core capabilities.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            href="/"
            variant="primary"
            size="md"
            icon={<Home className="w-4 h-4" />}
            iconPosition="left"
          >
            Return to Home
          </Button>
          <Button href="/features" variant="outline" size="md">
            View Capabilities
          </Button>
        </div>
      </div>
    </div>
  );
}

