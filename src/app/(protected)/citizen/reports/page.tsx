"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CivicReport, CivicReportStatus, CivicCategoryId } from "@/lib/civic/types";
import { CIVIC_CATEGORIES } from "@/lib/civic/categories";
import { CivicReportCard } from "@/components/civic/CivicReportCard";
import { Button } from "@/components/ui/Button";
import {
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CivicReportStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CivicCategoryId | "all">("all");

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/civic/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn("Error fetching citizen reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950">
            My Civic Sanitation Reports
          </h1>
          <p className="text-xs sm:text-sm text-emerald-800/80">
            Track real-time progress, municipal inspection notes, and cleanup verification.
          </p>
        </div>

        <Link href="/citizen/report">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20">
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Report New Issue</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference number, title, street address..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-emerald-50/30 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="border-emerald-300 text-emerald-900 shrink-0"
          >
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-50">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-emerald-800/70 font-semibold mr-1">Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "submitted", label: "Submitted" },
              { id: "under_review", label: "Under Review" },
              { id: "verified", label: "Verified" },
              { id: "assigned", label: "Assigned" },
              { id: "in_progress", label: "In Progress" },
              { id: "resolved", label: "Resolved" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  statusFilter === s.id
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-white border border-emerald-200 rounded-lg text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {CIVIC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-950">Loading reports...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <CivicReportCard
              key={report.id}
              report={report}
              detailHref={`/citizen/reports/${report.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-950">
              No civic reports found
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800/70 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No complaints match your current search and filter settings."
                : "You haven't submitted any civic sanitation reports yet."}
            </p>
          </div>
          <Link href="/citizen/report">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
              <PlusCircle className="w-4 h-4 mr-2" />
              <span>Report an Issue Now</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

