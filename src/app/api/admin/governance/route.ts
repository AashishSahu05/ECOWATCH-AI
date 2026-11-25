import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerRole, authenticationErrorResponse } from "@/lib/auth/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import {
  listWards,
  createWard,
  updateWard,
  listOfficers,
  createOfficer,
  assignOfficerWard,
} from "@/lib/admin/governance-store";

const CreateWardSchema = z.object({
  action: z.literal("create_ward"),
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(24),
  centerLat: z.number().min(-90).max(90).optional(),
  centerLng: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(200).max(50000).optional(),
});

const CreateOfficerSchema = z.object({
  action: z.literal("create_officer"),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  ward: z.string().trim().min(2).max(120),
});

const UpdateWardSchema = z.object({
  action: z.literal("update_ward"),
  id: z.string().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  radiusMeters: z.number().min(200).max(50000).optional(),
});

const AssignOfficerWardSchema = z.object({
  action: z.literal("assign_officer_ward"),
  officerId: z.string().min(1),
  ward: z.string().trim().min(2).max(120),
});

const ReassignComplaintSchema = z.object({
  action: z.literal("reassign_complaint"),
  reportId: z.string().min(1),
  officerInChargeId: z.string().min(1),
  officerInChargeName: z.string().trim().min(2).max(100),
  assignedToTeam: z.string().trim().min(2).max(120),
  specialInstructions: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["administrator"], { freshUser: true });

    const adapter = getCivicReportAdapter();
    const { reports } = await adapter.getReportsForOfficer();
    const wards = listWards().map((w) => ({
      ...w,
      name: w.wardName,
      code: w.wardNumber,
      reportCount: reports.filter((r) => r.location.serviceAreaId === w.id).length,
      pendingCount: reports.filter(
        (r) =>
          r.location.serviceAreaId === w.id &&
          !["resolved", "closed", "rejected", "duplicate", "cancelled"].includes(r.status)
      ).length,
    }));

    const officers = listOfficers();

    const auditLogs = reports
      .flatMap((r) =>
        (r.statusHistory || []).map((h) => ({
          id: h.id,
          reportId: r.id,
          referenceNumber: r.referenceNumber,
          wardName: r.wardName || "Ward 04",
          actorName: h.actorName || "System",
          actorRole: h.actorRole,
          previousStatus: h.previousStatus,
          newStatus: h.newStatus,
          remarks: h.remarks || "",
          createdAt: h.createdAt,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25);

    const activeComplaints = reports
      .filter((r) => !["resolved", "closed", "rejected", "duplicate", "cancelled"].includes(r.status))
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        title: r.title,
        wardName: r.wardName || "Ward 04",
        status: r.status,
        currentOfficer: r.currentAssignment?.officerInChargeName || "Unassigned",
        currentTeam: r.currentAssignment?.assignedToTeam || "Unassigned",
      }));

    return NextResponse.json(
      {
        wards,
        officers,
        auditLogs,
        activeComplaints,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || "Failed to load governance registry." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireServerRole(request, ["administrator"], { freshUser: true });
    const body = await request.json();

    if (body?.action === "create_ward") {
      const parsed = CreateWardSchema.parse(body);
      const ward = createWard(parsed);
      return NextResponse.json({ ward }, { status: 201 });
    }

    if (body?.action === "create_officer") {
      const parsed = CreateOfficerSchema.parse(body);
      const officer = createOfficer(parsed);
      return NextResponse.json({ officer }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported governance POST action." }, { status: 400 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create governance record." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireServerRole(request, ["administrator"], { freshUser: true });
    const body = await request.json();

    if (body?.action === "update_ward") {
      const parsed = UpdateWardSchema.parse(body);
      const ward = updateWard(parsed.id, {
        name: parsed.name,
        isActive: parsed.isActive,
      });
      return NextResponse.json({ ward }, { status: 200 });
    }

    if (body?.action === "assign_officer_ward") {
      const parsed = AssignOfficerWardSchema.parse(body);
      const officer = assignOfficerWard(parsed.officerId, parsed.ward);
      return NextResponse.json({ officer }, { status: 200 });
    }

    if (body?.action === "reassign_complaint") {
      const parsed = ReassignComplaintSchema.parse(body);
      const adapter = getCivicReportAdapter();
      const updated = await adapter.assignReport({
        reportId: parsed.reportId,
        assignedBy: admin.id,
        assignedByName: admin.name,
        assignedToTeam: parsed.assignedToTeam,
        officerInChargeId: parsed.officerInChargeId,
        officerInChargeName: parsed.officerInChargeName,
        specialInstructions: parsed.specialInstructions || "Reassigned by City Administrator.",
      });
      return NextResponse.json({ report: updated }, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported governance PATCH action." }, { status: 400 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update governance record." },
      { status: 400 }
    );
  }
}
