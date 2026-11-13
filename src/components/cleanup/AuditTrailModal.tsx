"use client";

import React, { useEffect, useState } from "react";
import { CivicResponseTicket, CivicAuditLogEntry, CivicNotificationLog } from "@/lib/cleanup/types";
import {
  X,
  History,
  Bell,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Truck,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface AuditTrailModalProps {
  ticket: CivicResponseTicket;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditTrailModal({ ticket, isOpen, onClose }: AuditTrailModalProps) {
  const [auditHistory, setAuditHistory] = useState<CivicAuditLogEntry[]>(ticket.auditHistory || []);
  const [notificationLogs, setNotificationLogs] = useState<CivicNotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "notifications">("audit");

  useEffect(() => {
    if (!isOpen) return;

    const fetchAudit = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/civic/response/${ticket.reportId}/audit`);
        if (res.ok) {
          const data = await res.json();
          if (data.auditHistory) setAuditHistory(data.auditHistory);
          if (data.notificationLogs) setNotificationLogs(data.notificationLogs);
        }
      } catch (err) {
        console.warn("Could not fetch remote audit trail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudit();
  }, [isOpen, ticket.reportId]);

  if (!isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "municipal_officer":
      case "administrator":
        return <Shield className="w-3.5 h-3.5 text-brand-emerald" />;
      case "citizen":
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-brand-soft-sage max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-soft-sage bg-brand-cloud-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-mint-cream px-2 py-0.5 rounded border border-brand-soft-sage">
                  {ticket.referenceNumber}
                </span>
                <span className="text-xs font-semibold text-brand-muted-charcoal">
                  Immutable Audit Ledger
                </span>
              </div>
              <h3 className="text-base font-bold text-brand-dark-moss line-clamp-1">
                Lifecycle Transitions & Dispatch Logs
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted-charcoal hover:text-brand-dark-moss hover:bg-brand-soft-sage/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-brand-soft-sage flex items-center gap-2 bg-brand-cloud-white/40">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "audit"
                ? "border-brand-emerald text-brand-emerald"
                : "border-transparent text-brand-muted-charcoal hover:text-brand-dark-moss"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>State Transitions ({auditHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "notifications"
                ? "border-brand-emerald text-brand-emerald"
                : "border-transparent text-brand-muted-charcoal hover:text-brand-dark-moss"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Multi-Channel Dispatches ({notificationLogs.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-brand-muted-charcoal flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-emerald" />
              <span>Loading ledger data...</span>
            </div>
          ) : activeTab === "audit" ? (
            /* Audit History Timeline */
            <div className="space-y-4">
              {auditHistory.length === 0 ? (
                <p className="text-xs text-brand-muted-charcoal text-center py-8">
                  No audit history recorded.
                </p>
              ) : (
                <div className="relative border-l-2 border-brand-soft-sage ml-3 space-y-5">
                  {auditHistory.map((item, index) => (
                    <div key={item.id || index} className="relative pl-6">
                      {/* Timeline Node */}
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-brand-emerald flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                      </div>

                      <div className="bg-brand-cloud-white/60 p-3 rounded-xl border border-brand-soft-sage/80 space-y-1 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-brand-dark-moss">
                            {item.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-brand-muted-charcoal flex items-center gap-1">
                            <Clock className="w-3 h-3 text-brand-emerald" />
                            {new Date(item.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-brand-dark-moss font-medium">
                          {getRoleIcon(item.actorRole)}
                          <span>{item.actorName}</span>
                          <span className="text-brand-muted-charcoal capitalize">({item.actorRole.replace(/_/g, " ")})</span>
                        </div>

                        {item.remarks && (
                          <p className="text-[11px] text-brand-muted-charcoal bg-white p-2 rounded-lg border border-brand-soft-sage/50 mt-1">
                            {item.remarks}
                          </p>
                        )}

                        <div className="text-[10px] text-brand-muted-charcoal font-mono pt-1">
                          Transition: <span className="font-semibold text-brand-dark-moss">{item.previousStatus}</span> →{" "}
                          <span className="font-semibold text-brand-emerald">{item.newStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Notification Logs */
            <div className="space-y-3">
              {notificationLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-muted-charcoal">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-brand-emerald" />
                  <p>No dispatch logs for this complaint yet.</p>
                </div>
              ) : (
                notificationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-brand-cloud-white rounded-xl border border-brand-soft-sage space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage">
                          {log.channel}
                        </span>
                        <span className="font-semibold text-brand-dark-moss">{log.recipientRole} ({log.recipientName})</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          log.status === "delivered" || log.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-dark-moss bg-white p-2 rounded-lg border border-brand-soft-sage/50">
                      {log.messageText}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-brand-muted-charcoal">
                      <span>Destination: {log.recipientContact}</span>
                      <span>{new Date(log.dispatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-soft-sage bg-brand-cloud-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-brand-muted-charcoal hover:text-brand-dark-moss bg-white hover:bg-brand-soft-sage/40 rounded-xl border border-brand-soft-sage transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
