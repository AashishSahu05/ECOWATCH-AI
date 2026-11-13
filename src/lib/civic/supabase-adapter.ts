import { createClient } from "@/lib/supabase/client";
import {
  CivicReportAdapter,
  CivicReport,
  CreateCivicReportDTO,
  UpdateCivicReportStatusDTO,
  AssignCivicReportDTO,
  RecordResolutionEvidenceDTO,
  RecordFeedbackDTO,
  CivicReportFilter,
  CivicReportCategory,
  CivicServiceArea,
} from "./types";
import { CIVIC_CATEGORIES } from "./categories";
import { CIVIC_SERVICE_AREAS } from "./service-areas";

export class SupabaseCivicReportAdapter implements CivicReportAdapter {
  isMockMode = false;

  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase credentials are not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return client;
  }

  private mapReportRow(row: any): CivicReport {
    const media = (row.civic_report_media || []).map((m: any) => ({
      id: m.id,
      reportId: m.report_id,
      mediaType: m.media_type,
      storagePath: m.storage_path,
      publicUrl: m.public_url,
      fileSizeBytes: m.file_size_bytes,
      isPrimary: m.is_primary,
      createdAt: m.created_at,
    }));

    const ai = row.civic_ai_analyses
      ? {
          id: row.civic_ai_analyses.id,
          reportId: row.civic_ai_analyses.report_id,
          suggestedCategory: row.civic_ai_analyses.suggested_category,
          sceneDescription: row.civic_ai_analyses.scene_description,
          visibleMaterials: row.civic_ai_analyses.visible_materials,
          evidenceClarity: row.civic_ai_analyses.evidence_clarity,
          suggestedSeverity: row.civic_ai_analyses.suggested_severity,
          identificationUncertainty: row.civic_ai_analyses.identification_uncertainty,
          possibleHazards: row.civic_ai_analyses.possible_hazards || [],
          recommendedAction: row.civic_ai_analyses.recommended_action,
          estimatedWasteVolume: row.civic_ai_analyses.estimated_waste_volume,
          isMockResult: Boolean(row.civic_ai_analyses.is_mock_result),
          createdAt: row.civic_ai_analyses.created_at,
        }
      : null;

    const history = (row.civic_report_status_history || []).map((h: any) => ({
      id: h.id,
      reportId: h.report_id,
      actorId: h.actor_id,
      actorRole: h.actor_role,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      remarks: h.remarks,
      createdAt: h.created_at,
    }));

    const assignment = row.civic_report_assignments?.[0]
      ? {
          id: row.civic_report_assignments[0].id,
          reportId: row.civic_report_assignments[0].report_id,
          assignedBy: row.civic_report_assignments[0].assigned_by,
          assignedToTeam: row.civic_report_assignments[0].assigned_to_team,
          officerInChargeId: row.civic_report_assignments[0].officer_in_charge_id,
          targetResolutionDate: row.civic_report_assignments[0].target_resolution_date,
          specialInstructions: row.civic_report_assignments[0].special_instructions,
          createdAt: row.civic_report_assignments[0].created_at,
        }
      : null;

    const evidence = row.civic_resolution_evidence?.[0]
      ? {
          id: row.civic_resolution_evidence[0].id,
          reportId: row.civic_resolution_evidence[0].report_id,
          officerId: row.civic_resolution_evidence[0].officer_id,
          resolutionNotes: row.civic_resolution_evidence[0].resolution_notes,
          wasteVolumeClearedMetric: row.civic_resolution_evidence[0].waste_volume_cleared_metric,
          destinationFacility: row.civic_resolution_evidence[0].destination_facility,
          afterPhotographUrl: row.civic_resolution_evidence[0].after_photograph_url,
          createdAt: row.civic_resolution_evidence[0].created_at,
        }
      : null;

    const feedback = row.civic_report_feedback?.[0]
      ? {
          id: row.civic_report_feedback[0].id,
          reportId: row.civic_report_feedback[0].report_id,
          citizenId: row.civic_report_feedback[0].citizen_id,
          rating: row.civic_report_feedback[0].rating,
          feedbackComment: row.civic_report_feedback[0].feedback_comment,
          createdAt: row.civic_report_feedback[0].created_at,
        }
      : null;

    return {
      id: row.id,
      referenceNumber: row.reference_number,
      citizenId: row.citizen_id,
      citizenName: row.is_anonymous ? "Anonymous Citizen" : row.profiles?.full_name || "Citizen",
      categoryId: row.category_id,
      categoryName: row.civic_issue_categories?.name,
      serviceAreaId: row.service_area_id,
      wardName: row.civic_service_areas ? `${row.civic_service_areas.ward_number} — ${row.civic_service_areas.ward_name}` : undefined,
      title: row.title,
      description: row.description,
      status: row.status,
      officialSeverity: row.official_severity,
      advisorySeverity: ai?.suggestedSeverity || "medium",
      location: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        accuracy: row.location_accuracy ? Number(row.location_accuracy) : null,
        formattedAddress: row.formatted_address,
        landmark: row.landmark,
        serviceAreaId: row.service_area_id,
      },
      media,
      aiAnalysis: ai,
      statusHistory: history,
      currentAssignment: assignment,
      resolutionEvidence: evidence,
      feedback,
      isAnonymous: Boolean(row.is_anonymous),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createReport(
    dto: CreateCivicReportDTO,
    citizenId: string
  ): Promise<CivicReport> {
    const supabase = this.getClient();
    const referenceNumber = `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: reportRow, error: reportErr } = await supabase
      .from("civic_reports")
      .insert({
        reference_number: referenceNumber,
        citizen_id: citizenId,
        category_id: dto.categoryId,
        service_area_id: dto.location.serviceAreaId || "ward_04",
        title: dto.title,
        description: dto.description,
        status: "submitted",
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        location_accuracy: dto.location.accuracy || null,
        formatted_address: dto.location.formattedAddress,
        landmark: dto.location.landmark || null,
        is_anonymous: Boolean(dto.isAnonymous),
      })
      .select()
      .single();

    if (reportErr || !reportRow) {
      throw new Error(`Failed to create civic report in Supabase: ${reportErr?.message || "Unknown error"}`);
    }

    // Insert media records
    if (dto.media.length > 0) {
      await supabase.from("civic_report_media").insert(
        dto.media.map((m, idx) => ({
          report_id: reportRow.id,
          media_type: m.mediaType,
          storage_path: m.storagePath || `reports/${reportRow.id}/${idx}`,
          public_url: m.publicUrl,
          file_size_bytes: m.fileSizeBytes,
          is_primary: idx === 0,
        }))
      );
    }

    // Insert AI analysis if provided
    if (dto.aiAnalysis) {
      await supabase.from("civic_ai_analyses").insert({
        report_id: reportRow.id,
        suggested_category: dto.aiAnalysis.suggestedCategory,
        scene_description: dto.aiAnalysis.sceneDescription,
        visible_materials: dto.aiAnalysis.visibleMaterials,
        evidence_clarity: dto.aiAnalysis.evidenceClarity,
        suggested_severity: dto.aiAnalysis.suggestedSeverity,
        identification_uncertainty: dto.aiAnalysis.identificationUncertainty,
        possible_hazards: dto.aiAnalysis.possibleHazards || [],
        recommended_action: dto.aiAnalysis.recommendedAction,
        estimated_waste_volume: dto.aiAnalysis.estimatedWasteVolume || null,
        raw_model_response: dto.aiAnalysis.rawModelResponse || {},
        is_mock_result: Boolean(dto.aiAnalysis.isMockResult),
      });
    }

    // Insert initial status history
    await supabase.from("civic_report_status_history").insert({
      report_id: reportRow.id,
      actor_id: citizenId,
      actor_role: "citizen",
      previous_status: "submitted",
      new_status: "submitted",
      remarks: "Initial report lodged.",
    });

    const created = await this.getReportById(reportRow.id);
    if (!created) {
      throw new Error("Created report could not be retrieved from Supabase.");
    }
    return created;
  }

  async getReportById(id: string): Promise<CivicReport | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("civic_reports")
      .select(`
        *,
        civic_report_media (*),
        civic_ai_analyses (*),
        civic_report_status_history (*),
        civic_report_assignments (*),
        civic_resolution_evidence (*),
        civic_report_feedback (*),
        civic_issue_categories (name),
        civic_service_areas (ward_number, ward_name)
      `)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapReportRow(data);
  }

  async getReportByReference(referenceNumber: string): Promise<CivicReport | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("civic_reports")
      .select(`
        *,
        civic_report_media (*),
        civic_ai_analyses (*),
        civic_report_status_history (*),
        civic_report_assignments (*),
        civic_resolution_evidence (*),
        civic_report_feedback (*),
        civic_issue_categories (name),
        civic_service_areas (ward_number, ward_name)
      `)
      .eq("reference_number", referenceNumber.trim())
      .single();

    if (error || !data) return null;
    return this.mapReportRow(data);
  }

  async getReportsByCitizen(citizenId: string, filter?: CivicReportFilter): Promise<CivicReport[]> {
    const supabase = this.getClient();
    let query = supabase
      .from("civic_reports")
      .select(`
        *,
        civic_report_media (*),
        civic_ai_analyses (*),
        civic_report_status_history (*),
        civic_report_assignments (*),
        civic_resolution_evidence (*),
        civic_report_feedback (*),
        civic_issue_categories (name),
        civic_service_areas (ward_number, ward_name)
      `)
      .eq("citizen_id", citizenId)
      .order("created_at", { ascending: false });

    if (filter?.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== "all") {
      query = query.eq("category_id", filter.categoryId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r: any) => this.mapReportRow(r));
  }

  async getReportsForOfficer(filter?: CivicReportFilter): Promise<{ reports: CivicReport[]; total: number }> {
    const supabase = this.getClient();
    let query = supabase
      .from("civic_reports")
      .select(`
        *,
        civic_report_media (*),
        civic_ai_analyses (*),
        civic_report_status_history (*),
        civic_report_assignments (*),
        civic_resolution_evidence (*),
        civic_report_feedback (*),
        civic_issue_categories (name),
        civic_service_areas (ward_number, ward_name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter?.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== "all") {
      query = query.eq("category_id", filter.categoryId);
    }
    if (filter?.serviceAreaId && filter.serviceAreaId !== "all") {
      query = query.eq("service_area_id", filter.serviceAreaId);
    }

    if (filter?.limit) {
      const from = filter.offset || 0;
      query = query.range(from, from + filter.limit - 1);
    }

    const { data, count, error } = await query;
    if (error || !data) return { reports: [], total: 0 };
    return {
      reports: data.map((r: any) => this.mapReportRow(r)),
      total: count || 0,
    };
  }

  async updateReportStatus(dto: UpdateCivicReportStatusDTO): Promise<CivicReport> {
    const supabase = this.getClient();
    const updatePayload: Record<string, unknown> = {
      status: dto.newStatus,
      updated_at: new Date().toISOString(),
    };
    if (dto.officialSeverity) {
      updatePayload.official_severity = dto.officialSeverity;
    }

    const { error: updateErr } = await supabase
      .from("civic_reports")
      .update(updatePayload)
      .eq("id", dto.reportId);

    if (updateErr) {
      throw new Error(`Failed to update report status: ${updateErr.message}`);
    }

    await supabase.from("civic_report_status_history").insert({
      report_id: dto.reportId,
      actor_id: dto.actorId,
      actor_role: dto.actorRole,
      previous_status: "unknown",
      new_status: dto.newStatus,
      remarks: dto.remarks || null,
    });

    const updated = await this.getReportById(dto.reportId);
    if (!updated) throw new Error("Could not retrieve updated report.");
    return updated;
  }

  async assignReport(dto: AssignCivicReportDTO): Promise<CivicReport> {
    const supabase = this.getClient();

    const { error: asgnErr } = await supabase.from("civic_report_assignments").insert({
      report_id: dto.reportId,
      assigned_by: dto.assignedBy,
      assigned_to_team: dto.assignedToTeam,
      officer_in_charge_id: dto.officerInChargeId || dto.assignedBy,
      target_resolution_date: dto.targetResolutionDate || null,
      special_instructions: dto.specialInstructions || null,
    });

    if (asgnErr) throw new Error(`Failed to assign report: ${asgnErr.message}`);

    return this.updateReportStatus({
      reportId: dto.reportId,
      actorId: dto.assignedBy,
      actorRole: "municipal_officer",
      newStatus: "assigned",
      remarks: `Assigned to ${dto.assignedToTeam}`,
    });
  }

  async recordResolutionEvidence(dto: RecordResolutionEvidenceDTO): Promise<CivicReport> {
    const supabase = this.getClient();

    const { error: evErr } = await supabase.from("civic_resolution_evidence").insert({
      report_id: dto.reportId,
      officer_id: dto.officerId,
      resolution_notes: dto.resolutionNotes,
      waste_volume_cleared_metric: dto.wasteVolumeClearedMetric || null,
      destination_facility: dto.destinationFacility || null,
      after_photograph_url: dto.afterPhotographUrl,
    });

    if (evErr) throw new Error(`Failed to save resolution evidence: ${evErr.message}`);

    return this.updateReportStatus({
      reportId: dto.reportId,
      actorId: dto.officerId,
      actorRole: "municipal_officer",
      newStatus: "resolved",
      remarks: `Resolved. Volume: ${dto.wasteVolumeClearedMetric || "N/A"}. Facility: ${dto.destinationFacility || "N/A"}`,
    });
  }

  async recordFeedback(dto: RecordFeedbackDTO): Promise<CivicReport> {
    const supabase = this.getClient();

    const { error: fbErr } = await supabase.from("civic_report_feedback").insert({
      report_id: dto.reportId,
      citizen_id: dto.citizenId,
      rating: dto.rating,
      feedback_comment: dto.feedbackComment || null,
    });

    if (fbErr) throw new Error(`Failed to save feedback: ${fbErr.message}`);

    const report = await this.getReportById(dto.reportId);
    if (!report) throw new Error("Could not retrieve report after feedback.");
    return report;
  }

  async getCategories(): Promise<CivicReportCategory[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from("civic_issue_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!data || data.length === 0) return CIVIC_CATEGORIES;
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      iconName: d.icon_name,
      defaultSeverity: d.default_severity,
      isActive: d.is_active,
      displayOrder: d.display_order,
    }));
  }

  async getServiceAreas(): Promise<CivicServiceArea[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from("civic_service_areas")
      .select("*")
      .eq("is_active", true);

    if (!data || data.length === 0) return CIVIC_SERVICE_AREAS;
    return data.map((d: any) => ({
      id: d.id,
      wardNumber: d.ward_number,
      wardName: d.ward_name,
      centerLat: d.center_lat || 12.9352,
      centerLng: d.center_lng || 77.6245,
      isActive: d.is_active,
    }));
  }
}
