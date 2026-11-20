"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import {
  Flame,
  MapPin,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPinOff,
  Navigation,
  Eye,
} from "lucide-react";

interface CitizenHotspotMapProps {
  reports: CivicReport[];
  isLoading?: boolean;
  selectedWard?: string;
  className?: string;
}

export function CitizenHotspotMap({
  reports,
  isLoading = false,
  selectedWard = "Ward 04",
  className = "",
}: CitizenHotspotMapProps) {
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Filter for reports with valid geographic coordinates
  const geoReports = React.useMemo(() => {
    return reports.filter(
      (r) =>
        r.location &&
        typeof r.location.latitude === "number" &&
        typeof r.location.longitude === "number" &&
        !isNaN(r.location.latitude) &&
        !isNaN(r.location.longitude)
    );
  }, [reports]);

  // Select initial report
  useEffect(() => {
    if (geoReports.length > 0 && !selectedReport) {
      setSelectedReport(geoReports[0]);
    } else if (geoReports.length === 0) {
      setSelectedReport(null);
    }
  }, [geoReports, selectedReport]);

  // Google Maps JS Initialization
  useEffect(() => {
    if (!apiKey || typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        if (!(window as any).google?.maps) {
          const existingScript = document.getElementById("citizen-maps-script");
          if (!existingScript) {
            const script = document.createElement("script");
            script.id = "citizen-maps-script";
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            document.head.appendChild(script);

            await new Promise<void>((resolve) => {
              script.onload = () => resolve();
            });
          }
        }

        if (!isMounted || !mapContainerRef.current || !(window as any).google?.maps) return;

        const centerLat = geoReports.length > 0 ? geoReports[0].location.latitude : 12.9348;
        const centerLng = geoReports.length > 0 ? geoReports[0].location.longitude : 77.6251;

        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });

        // Add markers for each reported dumping location
        geoReports.forEach((r) => {
          const markerColor =
            r.categoryId === "cat_dumping"
              ? "#DC2626" // Red for illegal dumping
              : r.categoryId === "cat_missed_collection"
              ? "#D97706" // Amber for missed collection
              : "#059669"; // Emerald for other civic reports

          // Add radius halo for dumping spots
          new (window as any).google.maps.Circle({
            strokeColor: markerColor,
            strokeOpacity: 0.8,
            strokeWeight: 1.5,
            fillColor: markerColor,
            fillOpacity: 0.15,
            map,
            center: { lat: r.location.latitude, lng: r.location.longitude },
            radius: 150, // 150m perimeter
          });

          const marker = new (window as any).google.maps.Marker({
            position: { lat: r.location.latitude, lng: r.location.longitude },
            map,
            title: `${r.referenceNumber}: ${r.title}`,
          });

          marker.addListener("click", () => {
            setSelectedReport(r);
          });
        });

        setIsGoogleMapsLoaded(true);
      } catch (err) {
        console.warn("[CitizenHotspotMap] Google Maps load fallback to vector canvas:", err);
        setIsGoogleMapsLoaded(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [apiKey, geoReports]);

  // Canvas normalization coordinates
  const minLat = 12.91;
  const maxLat = 12.99;
  const minLng = 77.57;
  const maxLng = 77.67;

  const toPercentX = (lng: number) => {
    const clamped = Math.max(minLng, Math.min(maxLng, lng));
    return ((clamped - minLng) / (maxLng - minLng)) * 80 + 10;
  };

  const toPercentY = (lat: number) => {
    const clamped = Math.max(minLat, Math.min(maxLat, lat));
    return (1 - (clamped - minLat) / (maxLat - minLat)) * 75 + 12;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-brand-soft-sage p-8 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-emerald/20 border-t-brand-emerald rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-brand-muted-slate">
          Loading spatial dumping records from Municipal Backend...
        </p>
      </div>
    );
  }

  // Clear Empty State when no real reports exist
  if (geoReports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-soft-sage p-8 sm:p-12 text-center space-y-4 shadow-subtle">
        <div className="w-14 h-14 rounded-2xl bg-brand-mint-cream border border-brand-soft-sage text-brand-emerald flex items-center justify-center mx-auto">
          <MapPinOff className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold font-manrope text-brand-deep-green">
            No Dumping Hotspots Recorded
          </h3>
          <p className="text-xs text-brand-muted-slate font-inter max-w-md mx-auto">
            There are currently no active illegal garbage dumping locations or verified hotspots recorded in your surveillance area.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/citizen/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-deep-green hover:bg-brand-emerald text-white text-xs font-semibold font-manrope transition-all shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Report First Dumping Site</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-brand-soft-sage p-5 sm:p-6 shadow-subtle space-y-5 ${className}`}>
      {/* Section Header with View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span>Reported Dumping Locations & Surveillance Hotspots</span>
            </h3>
            <span className="text-[10px] font-mono font-bold bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage px-2 py-0.5 rounded-full">
              {geoReports.length} {geoReports.length === 1 ? "Location" : "Locations"}
            </span>
          </div>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Real-time coordinates of reported civic sanitation incidents in {selectedWard}.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-brand-cloud-white p-1 rounded-xl border border-brand-soft-sage self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-brand-emerald text-white shadow-xs"
                : "text-brand-deep-green hover:bg-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-brand-emerald text-white shadow-xs"
                : "text-brand-deep-green hover:bg-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location List</span>
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Map Visualizer Area */}
          <div className="lg:col-span-8 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage overflow-hidden relative shadow-inner h-[320px] sm:h-[380px]">
            {/* Map Mode Indicator */}
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-brand-soft-sage shadow-xs text-[10px] font-mono text-brand-deep-green flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiKey && isGoogleMapsLoaded ? "bg-emerald-500" : "bg-blue-500"}`} />
              <span>
                {apiKey && isGoogleMapsLoaded
                  ? "Google Maps Platform Live"
                  : "Interactive Coordinate Canvas"}
              </span>
            </div>

            {/* Google Maps Div */}
            {apiKey ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              /* Vector Coordinate Canvas Fallback */
              <div className="w-full h-full relative p-4 flex flex-col justify-between select-none">
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="citizen-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#237A55" strokeWidth="0.5" strokeOpacity="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#citizen-grid)" />
                  <path d="M 40 100 Q 220 70, 500 150 T 800 220" fill="none" stroke="#164734" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.3" />
                  <path d="M 80 280 Q 320 200, 600 300" fill="none" stroke="#164734" strokeWidth="1" strokeDasharray="2 4" strokeOpacity="0.25" />
                </svg>

                {/* Plot Markers */}
                <div className="absolute inset-0">
                  {geoReports.map((r) => {
                    const isSelected = selectedReport?.id === r.id;
                    const x = toPercentX(r.location.longitude);
                    const y = toPercentY(r.location.latitude);

                    const isDumping = r.categoryId === "cat_dumping";
                    const pinColor = isDumping
                      ? "bg-red-500 text-white border-red-600"
                      : "bg-emerald-600 text-white border-emerald-700";

                    return (
                      <div
                        key={r.id}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedReport(r)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      >
                        {/* Halos */}
                        <div
                          className={`w-12 h-12 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full pointer-events-none transition-all ${
                            isSelected
                              ? "bg-brand-emerald/30 border-2 border-brand-emerald scale-110"
                              : "bg-brand-fresh-green/10 border border-brand-fresh-green/20 group-hover:scale-105"
                          }`}
                        />

                        {/* Centroid Pin */}
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[10px] shadow-md transition-transform group-hover:scale-110 ${pinColor} ${
                            isSelected ? "ring-4 ring-brand-emerald/40 scale-110" : ""
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </div>

                        {/* Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-brand-deep-green text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30">
                          {r.referenceNumber} • {r.title.slice(0, 24)}...
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-auto self-start bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-brand-soft-sage text-[10px] text-brand-deep-green flex items-center gap-3 shadow-xs z-10">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Illegal Dumping</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Other Sanitation Issue</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location Detail Inspector */}
          <div className="lg:col-span-4 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-soft-sage/80 pb-2.5">
              <span className="text-[10px] font-mono uppercase font-bold text-brand-muted-slate tracking-wider">
                Location Inspector
              </span>
              {selectedReport?.categoryId === "cat_dumping" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-red-600" />
                  Illegal Dumping
                </span>
              )}
            </div>

            {selectedReport ? (
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-brand-emerald">
                      {selectedReport.referenceNumber}
                    </span>
                    <CivicStatusBadge status={selectedReport.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold font-manrope text-brand-deep-green mt-1 line-clamp-2">
                    {selectedReport.title}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-brand-deep-green">
                    <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">
                      {selectedReport.location.formattedAddress || "Ward 04 Municipal Corridor"}
                    </span>
                  </div>

                  {selectedReport.location.landmark && (
                    <p className="text-[10px] text-brand-muted-slate pl-5 font-mono">
                      Landmark: {selectedReport.location.landmark}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-brand-muted-slate pt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] font-mono">
                      Reported: {new Date(selectedReport.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-soft-sage/80">
                  <Link
                    href={`/citizen/reports/${selectedReport.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-brand-deep-green hover:bg-brand-emerald text-white text-xs font-semibold font-manrope flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Complaint Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-brand-muted-slate">
                Click any marker on the map to inspect reported dumping details.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List Mode View */
        <div className="divide-y divide-brand-soft-sage/70 overflow-hidden rounded-xl border border-brand-soft-sage">
          {geoReports.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setSelectedReport(r);
                setViewMode("map");
              }}
              className="p-3.5 sm:p-4 hover:bg-brand-mint-cream/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-deep-green">
                    {r.referenceNumber}
                  </span>
                  <CivicStatusBadge status={r.status} size="sm" />
                  {r.categoryId === "cat_dumping" && (
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                      Dumping
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-brand-deep-green truncate">
                  {r.title}
                </p>
                <p className="text-[11px] text-brand-muted-slate flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-brand-emerald shrink-0" />
                  <span>{r.location.formattedAddress}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-[10px] font-mono text-brand-muted-slate">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/citizen/reports/${r.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-brand-cloud-white hover:bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage"
                  title="View report"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
