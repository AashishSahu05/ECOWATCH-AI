"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CivicLocation } from "@/lib/civic/types";
import {
  getCurrentBrowserLocation,
  reverseGeocodeCoordinates,
  determineServiceAreaId,
} from "@/lib/geo/google-maps";
import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";
import {
  MapPin,
  Crosshair,
  Navigation,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CivicMapSelectorProps {
  location: CivicLocation;
  onChangeLocation: (newLocation: CivicLocation) => void;
}

export function CivicMapSelector({
  location,
  onChangeLocation,
}: CivicMapSelectorProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Handle GPS button click
  const handleGetGPS = async () => {
    setIsLocating(true);
    setLocationError(null);
    setGpsSuccess(false);

    try {
      const coords = await getCurrentBrowserLocation();
      setIsReverseGeocoding(true);
      const geoResult = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      setIsReverseGeocoding(false);

      onChangeLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        formattedAddress: geoResult.formattedAddress,
        landmark: geoResult.landmark || location.landmark || "",
        serviceAreaId: geoResult.serviceAreaId || determineServiceAreaId(coords.latitude, coords.longitude),
      });

      setGpsSuccess(true);
    } catch (err: any) {
      setIsReverseGeocoding(false);
      setLocationError(err?.message || "Could not retrieve GPS coordinates.");
    } finally {
      setIsLocating(false);
    }
  };

  // Handle coordinate drag / selection
  const handleCoordinateChange = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const geoResult = await reverseGeocodeCoordinates(lat, lng);
        onChangeLocation({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          accuracy: null, // manual selection
          formattedAddress: geoResult.formattedAddress,
          landmark: geoResult.landmark || location.landmark || "",
          serviceAreaId: geoResult.serviceAreaId || determineServiceAreaId(lat, lng),
        });
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [location.landmark, onChangeLocation]
  );

  // Initialize Google Maps if API key is present
  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else if ((window as any).google?.maps) {
      initMap();
    }

    function initMap() {
      if (!googleMapRef.current || !(window as any).google?.maps) return;

      const position = { lat: location.latitude, lng: location.longitude };
      const map = new (window as any).google.maps.Map(googleMapRef.current, {
        center: position,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
      });
      mapInstanceRef.current = map;

      const marker = new (window as any).google.maps.Marker({
        position,
        map,
        draggable: true,
        title: "Incident Location (Drag to adjust)",
      });
      markerInstanceRef.current = marker;

      marker.addListener("dragend", () => {
        const newPos = marker.getPosition();
        if (newPos) {
          handleCoordinateChange(newPos.lat(), newPos.lng());
        }
      });

      map.addListener("click", (e: any) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          handleCoordinateChange(e.latLng.lat(), e.latLng.lng());
        }
      });
    }
  }, [apiKey, handleCoordinateChange, location.latitude, location.longitude]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-emerald-950">
          Geographic Location & Geo-Tagging
        </h3>
        <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
          Pin the precise location of the sanitation issue so municipal squads can navigate directly to the site.
        </p>
      </div>

      {/* GPS Trigger & Status Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
              <span>Browser Geolocation</span>
              {gpsSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  GPS Acquired
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-800/70">
              {location.accuracy
                ? `High accuracy GPS active (approx. ±${location.accuracy}m)`
                : "Grant browser permission for instant high-precision coordinates."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGetGPS}
          disabled={isLocating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
        >
          {isLocating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4 mr-2" />
          )}
          {isLocating ? "Acquiring GPS..." : "Use My Current GPS"}
        </Button>
      </div>

      {locationError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{locationError}</p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              You can manually drag the pin marker on the map or type your address below.
            </p>
          </div>
        </div>
      )}

      {/* Map Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-200 bg-emerald-950/5 shadow-sm">
        {apiKey ? (
          <div ref={googleMapRef} className="w-full h-[320px] sm:h-[380px]" />
        ) : (
          /* Interactive Coordinate Canvas Fallback (No Google Maps API Key or Offline) */
          <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-100 flex flex-col justify-between p-4 overflow-hidden select-none">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(#194735 1.5px, transparent 1.5px), radial-gradient(#194735 1.5px, #f1f5f9 1.5px)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 12px 12px",
              }}
            />

            {/* Top Bar with coordinates */}
            <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-950">
                  Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
                </span>
              </div>
              {isReverseGeocoding && (
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Resolving address...
                </span>
              )}
            </div>

            {/* Center Pin Indicator */}
            <div className="relative z-10 flex flex-col items-center justify-center m-auto">
              <div className="relative -mt-6">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="w-3 h-1.5 bg-emerald-950/30 rounded-full mx-auto blur-[1px] mt-0.5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-950 bg-white/95 px-2.5 py-1 rounded-full shadow-sm border border-emerald-100 mt-2">
                Selected Incident Pin
              </span>
            </div>

            {/* Bottom Ward Center Quick-Select Presets */}
            <div className="relative z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-emerald-100 shadow-sm">
              <div className="text-[11px] font-semibold text-emerald-900 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Jump to Ward Center:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CIVIC_SERVICE_AREAS.map((ward) => (
                  <button
                    key={ward.id}
                    type="button"
                    onClick={() => handleCoordinateChange(ward.centerLat, ward.centerLng)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      location.serviceAreaId === ward.id
                        ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                        : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {ward.wardNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address & Landmark Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">
            Street Address / Location Summary *
          </label>
          <input
            type="text"
            required
            value={location.formattedAddress}
            onChange={(e) =>
              onChangeLocation({
                ...location,
                formattedAddress: e.target.value,
              })
            }
            placeholder="e.g. 14th Cross Rd, Lake View Layout"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-emerald-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-950 mb-1">
            Nearest Landmark / Navigation Clue (Optional)
          </label>
          <input
            type="text"
            value={location.landmark || ""}
            onChange={(e) =>
              onChangeLocation({
                ...location,
                landmark: e.target.value,
              })
            }
            placeholder="e.g. Opposite Lake Garden East Gate"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-emerald-950"
          />
        </div>
      </div>
    </div>
  );
}

