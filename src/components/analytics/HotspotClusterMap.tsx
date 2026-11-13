"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HotspotCluster, HotspotSummary } from "@/lib/analytics/types";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import {
  Flame,
  MapPin,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  ExternalLink,
  Radio,
} from "lucide-react";

interface HotspotClusterMapProps {
  hotspots: HotspotSummary | null;
  isLoading: boolean;
  selectedWard?: string;
}

export function HotspotClusterMap({
  hotspots,
  isLoading,
  selectedWard,
}: HotspotClusterMapProps) {
  const [selectedCluster, setSelectedCluster] = useState<HotspotCluster | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const clusters = React.useMemo(() => hotspots?.clusters || [], [hotspots?.clusters]);

  // Default cluster selection
  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0]);
    }
  }, [clusters, selectedCluster]);

  // Dynamic Google Maps JS loader when API key is present
  useEffect(() => {
    if (!apiKey || typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initGoogleMap() {
      try {
        if (!(window as any).google?.maps) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
          });
        }

        if (!isMounted || !mapContainerRef.current || !(window as any).google?.maps) return;

        const defaultCenter = clusters.length > 0
          ? { lat: clusters[0].centerLatitude, lng: clusters[0].centerLongitude }
          : { lat: 12.9716, lng: 77.5946 };

        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Add 300m circles and markers
        clusters.forEach((c) => {
          const color =
            c.dominantSeverity === "critical"
              ? "#DC2626"
              : c.dominantSeverity === "high"
              ? "#EA580C"
              : c.dominantSeverity === "medium"
              ? "#CA8A04"
              : "#16A34A";

          // 300m radius circle
          new (window as any).google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.2,
            map,
            center: { lat: c.centerLatitude, lng: c.centerLongitude },
            radius: c.radiusMeters || 300,
          });

          // Marker
          const marker = new (window as any).google.maps.Marker({
            position: { lat: c.centerLatitude, lng: c.centerLongitude },
            map,
            title: `${c.approximateAddress} (${c.incidentCount} incidents)`,
          });

          marker.addListener("click", () => {
            setSelectedCluster(c);
          });
        });

        setIsGoogleMapsLoaded(true);
      } catch (err) {
        console.warn("[HotspotClusterMap] Google Maps failed to load, falling back to canvas:", err);
        setIsGoogleMapsLoaded(false);
      }
    }

    initGoogleMap();

    return () => {
      isMounted = false;
    };
  }, [apiKey, clusters]);

  // Coordinate normalizer for Canvas Fallback
  // Maps Bengaluru coordinates [12.91 - 12.99, 77.58 - 77.66] into 0..100% SVG coordinates
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

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              <span>Geographic Hotspot Intelligence & Dumping Corridors</span>
            </h2>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              300m Haversine Radius
            </span>
          </div>
          <p className="text-xs text-brand-muted-slate font-inter mt-1">
            Spatial density clustering aggregating recurring dumping sites and acute waste accumulation corridors.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dual-Mode Map vs Table Toggle */}
          <div className="flex items-center bg-brand-cloud-white p-1 rounded-xl border border-brand-soft-sage">
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
              <span>Interactive Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-brand-emerald text-white shadow-xs"
                  : "text-brand-deep-green hover:bg-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Cluster Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Overview Density Badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 bg-brand-mint-cream px-3 py-1 rounded-full border border-brand-soft-sage text-brand-deep-green font-semibold">
          <span className="w-2 h-2 rounded-full bg-brand-emerald" />
          <span>{hotspots?.totalHotspots || 0} Spatial Clusters Identified</span>
        </span>
        <span className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-amber-900 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{hotspots?.highRiskHotspots || 0} High-Risk Corridors</span>
        </span>
        <span className="inline-flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full border border-red-200 text-red-900 font-semibold">
          <Flame className="w-3.5 h-3.5 text-red-600" />
          <span>{hotspots?.recurringZones || 0} Recurring Dumping Zones</span>
        </span>
      </div>

      {/* Interactive Map Visualizer */}
      {viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map View Container */}
          <div className="lg:col-span-8 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage overflow-hidden relative shadow-inner h-[380px] sm:h-[440px]">
            {/* Status Transparency Banner */}
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-brand-soft-sage shadow-xs text-[11px] font-mono text-brand-deep-green flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apiKey && isGoogleMapsLoaded ? "bg-emerald-500" : "bg-blue-500"}`} />
              <span>
                {apiKey && isGoogleMapsLoaded
                  ? "Google Maps Platform Live"
                  : "Interactive Vector Coordinate Canvas"}
              </span>
            </div>

            {/* Mode 1: Live Google Maps Container */}
            {apiKey ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              /* Mode 2: Interactive Coordinate Canvas Fallback */
              <div className="w-full h-full relative p-4 flex flex-col justify-between select-none">
                {/* Simulated SVG Map Grid Background */}
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#237A55" strokeWidth="0.5" strokeOpacity="0.25" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  {/* Subtle Bengaluru Sector Curvature */}
                  <path
                    d="M 50 120 Q 200 80, 450 160 T 800 240"
                    fill="none"
                    stroke="#164734"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M 100 300 Q 350 220, 600 320"
                    fill="none"
                    stroke="#164734"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    strokeOpacity="0.2"
                  />
                </svg>

                {/* Hotspot Cluster Coordinates */}
                <div className="absolute inset-0">
                  {clusters.map((c) => {
                    const isSelected = selectedCluster?.id === c.id;
                    const x = toPercentX(c.centerLongitude);
                    const y = toPercentY(c.centerLatitude);

                    const severityColor =
                      c.dominantSeverity === "critical"
                        ? "bg-red-500 text-red-50 border-red-600"
                        : c.dominantSeverity === "high"
                        ? "bg-amber-500 text-amber-50 border-amber-600"
                        : c.dominantSeverity === "medium"
                        ? "bg-yellow-500 text-yellow-950 border-yellow-600"
                        : "bg-emerald-500 text-emerald-50 border-emerald-600";

                    return (
                      <div
                        key={c.id}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedCluster(c)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      >
                        {/* 300m Radius Visual Wave */}
                        <div
                          className={`w-14 h-14 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full pointer-events-none transition-all ${
                            isSelected
                              ? "bg-brand-emerald/25 border-2 border-brand-emerald scale-110"
                              : "bg-brand-fresh-green/10 border border-brand-fresh-green/30 group-hover:scale-105"
                          } ${c.isRecurringDumpingZone ? "animate-ping" : ""}`}
                        />

                        {/* Centroid Pin */}
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs shadow-md transition-transform group-hover:scale-110 ${severityColor} ${
                            isSelected ? "ring-4 ring-brand-emerald/40 scale-110" : ""
                          }`}
                        >
                          {c.incidentCount}
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-brand-deep-green text-white text-[10px] font-mono px-2 py-1 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-30">
                          {c.approximateAddress}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Map Legend */}
                <div className="mt-auto self-start bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-brand-soft-sage text-[10px] text-brand-deep-green flex items-center gap-3 shadow-xs z-10">
                  <span className="font-bold uppercase tracking-wider text-brand-muted-slate">Severity:</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Critical</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>High</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span>Medium</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Low</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cluster Inspector Card */}
          <div className="lg:col-span-4 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-soft-sage/80 pb-3">
              <span className="text-xs font-mono uppercase text-brand-muted-slate font-bold">
                Hotspot Inspector
              </span>
              {selectedCluster?.isRecurringDumpingZone && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-red-600" />
                  Recurring Zone
                </span>
              )}
            </div>

            {selectedCluster ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-brand-muted-slate block">Cluster Reference</span>
                  <div className="text-base font-extrabold font-manrope text-brand-deep-green">
                    {selectedCluster.id}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-brand-muted-slate block">Corridor Location</span>
                  <p className="text-xs font-semibold text-brand-deep-green flex items-start gap-1.5 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                    <span>{selectedCluster.approximateAddress}</span>
                  </p>
                  <p className="text-[11px] text-brand-muted-slate pl-5 font-mono">
                    Jurisdiction: {selectedCluster.wardName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-brand-soft-sage text-center">
                    <span className="text-[10px] font-mono text-brand-muted-slate uppercase block">Incidents</span>
                    <span className="text-xl font-extrabold font-manrope text-brand-deep-green">
                      {selectedCluster.incidentCount}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-brand-soft-sage text-center">
                    <span className="text-[10px] font-mono text-brand-muted-slate uppercase block">Risk Score</span>
                    <span className="text-xl font-extrabold font-manrope text-brand-emerald">
                      {selectedCluster.riskScore}
                      <span className="text-[10px] text-brand-muted-slate font-normal"> / 100</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted-slate">Dominant Severity:</span>
                    <CivicPriorityBadge severity={selectedCluster.dominantSeverity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted-slate">Coordinates:</span>
                    <span className="font-mono text-[11px] text-brand-deep-green">
                      {selectedCluster.centerLatitude.toFixed(4)}, {selectedCluster.centerLongitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-soft-sage/80">
                  <Link
                    href={`/officer/reports?ward=${selectedCluster.wardId}`}
                    className="w-full py-2 px-3 rounded-xl bg-brand-emerald hover:bg-brand-deep-green text-white text-xs font-semibold font-manrope flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>View Cluster Tickets in Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-brand-muted-slate">
                Select a cluster marker on the map to inspect spatial telemetry.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Cluster Matrix Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-brand-soft-sage/80 text-brand-muted-slate uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Cluster ID</th>
                <th className="py-3 px-4">Corridor Location</th>
                <th className="py-3 px-4">Ward Sector</th>
                <th className="py-3 px-4">Incidents</th>
                <th className="py-3 px-4">Dominant Severity</th>
                <th className="py-3 px-4">Recurrence</th>
                <th className="py-3 px-4 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft-sage/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted-slate font-inter">
                    Calculating spatial clusters...
                  </td>
                </tr>
              ) : clusters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted-slate font-inter">
                    No active spatial hotspots detected in current filter window.
                  </td>
                </tr>
              ) : (
                clusters.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedCluster(c);
                      setViewMode("map");
                    }}
                    className="hover:bg-brand-mint-cream/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-green">
                      {c.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-deep-green max-w-[240px] truncate" title={c.approximateAddress}>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                        <span className="truncate">{c.approximateAddress}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted-slate">
                      {c.wardName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-green">
                      {c.incidentCount} incidents
                    </td>
                    <td className="py-3.5 px-4">
                      <CivicPriorityBadge severity={c.dominantSeverity} />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isRecurringDumpingZone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 text-red-600" />
                          Recurring
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-muted-slate">Single Spurt</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-extrabold text-sm text-brand-deep-green">
                        {c.riskScore} <span className="text-[10px] text-brand-muted-slate font-normal">/ 100</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
