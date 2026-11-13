// Generated contract for EcoWatch AI schema (initial migration).
// Keep in sync with supabase/migrations/*.sql. Never place service-role keys in frontend code.
export type AppRole = 'citizen' | 'municipal_officer' | 'administrator';
export type AccountStatus = 'pending' | 'active' | 'suspended';
export type WasteCategory = 'wet' | 'dry' | 'sanitary' | 'special_care' | 'unknown';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReportStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'resolved';
export type ReviewDecision = 'approved' | 'rejected' | 'needs_information';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CleanupStatus = 'assigned' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
export type AssessmentReviewStatus = 'pending' | 'approved' | 'rejected';

type Insertable<T, Required extends keyof T> = Pick<T, Required> & Partial<Omit<T, Required>>;
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row; Insert: Insert; Update: Update; Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      municipalities: Table<{id:string;name:string;state:string;country:string;created_at:string;updated_at:string}, Insertable<{id?:string;name:string;state:string;country?:string;created_at?:string;updated_at?:string},'name'|'state'>>;
      service_areas: Table<{id:string;municipality_id:string;name:string;description:string|null;boundary:unknown|null;is_active:boolean;created_at:string}, Insertable<{id?:string;municipality_id:string;name:string;description?:string|null;boundary?:unknown|null;is_active?:boolean;created_at?:string},'municipality_id'|'name'>>;
      profiles: Table<{id:string;full_name:string;phone:string|null;role:AppRole;municipality_id:string|null;account_status:AccountStatus;avatar_path:string|null;created_at:string;updated_at:string}, Insertable<{id:string;full_name:string;phone?:string|null;role?:AppRole;municipality_id?:string|null;account_status?:AccountStatus;avatar_path?:string|null},'id'|'full_name'>>;
      officer_service_areas: Table<{id:string;officer_id:string;service_area_id:string;assigned_at:string;assigned_by:string|null;revoked_at:string|null}, Insertable<{id?:string;officer_id:string;service_area_id:string;assigned_at?:string;assigned_by?:string|null;revoked_at?:string|null},'officer_id'|'service_area_id'>>;
      waste_reference_items: Table<{id:string;item_name:string;category:WasteCategory;description:string;handling_guidance:string;processing_guidance:string|null;safety_notes:string|null;reference_source:string;source_verified_at:string|null;is_active:boolean;created_at:string}, Insertable<{id?:string;item_name:string;category:WasteCategory;description:string;handling_guidance:string;processing_guidance?:string|null;safety_notes?:string|null;reference_source:string;source_verified_at?:string|null;is_active?:boolean},'item_name'|'category'|'description'|'handling_guidance'|'reference_source'>>;
      waste_analyses: Table<{id:string;user_id:string;image_path:string;analysis_status:AnalysisStatus;contamination_detected:boolean|null;general_guidance:string|null;model_name:string|null;prompt_version:string|null;error_message:string|null;created_at:string;completed_at:string|null}, Insertable<{id?:string;user_id:string;image_path:string;analysis_status?:AnalysisStatus;contamination_detected?:boolean|null;general_guidance?:string|null;model_name?:string|null;prompt_version?:string|null;error_message?:string|null;completed_at?:string|null},'user_id'|'image_path'>>;
      waste_analysis_items: Table<{id:string;analysis_id:string;item_name:string;category:WasteCategory;explanation:string|null;disposal_guidance:string|null;confidence_estimate:number|null;is_uncertain:boolean;safety_warning:string|null;created_at:string}, Insertable<{id?:string;analysis_id:string;item_name:string;category:WasteCategory;explanation?:string|null;disposal_guidance?:string|null;confidence_estimate?:number|null;is_uncertain?:boolean;safety_warning?:string|null},'analysis_id'|'item_name'|'category'>>;
      dumping_reports: Table<{id:string;citizen_id:string;service_area_id:string|null;latitude:number;longitude:number;location:unknown;address:string|null;description:string|null;ai_assessment:unknown|null;status:ReportStatus;duplicate_flag:boolean;reviewed_by:string|null;created_at:string;updated_at:string}, Insertable<{id?:string;citizen_id:string;service_area_id?:string|null;latitude:number;longitude:number;address?:string|null;description?:string|null;ai_assessment?:unknown|null;status?:ReportStatus;duplicate_flag?:boolean;reviewed_by?:string|null},'citizen_id'|'latitude'|'longitude'>>;
      report_images: Table<{id:string;report_id:string;storage_path:string;image_type:string;uploaded_by:string;created_at:string}, Insertable<{id?:string;report_id:string;storage_path:string;image_type?:string;uploaded_by:string},'report_id'|'storage_path'|'uploaded_by'>>;
      report_reviews: Table<{id:string;report_id:string;officer_id:string;decision:ReviewDecision;comment:string|null;created_at:string}, Insertable<{id?:string;report_id:string;officer_id:string;decision:ReviewDecision;comment?:string|null},'report_id'|'officer_id'|'decision'>>;
      hotspots: Table<{id:string;service_area_id:string|null;name:string;latitude:number;longitude:number;location:unknown;risk_score:number|null;risk_level:RiskLevel|null;last_calculated_at:string|null;created_at:string;updated_at:string}, Insertable<{id?:string;service_area_id?:string|null;name:string;latitude:number;longitude:number;risk_score?:number|null;risk_level?:RiskLevel|null;last_calculated_at?:string|null},'name'|'latitude'|'longitude'>>;
      hotspot_reports: Table<{hotspot_id:string;report_id:string;linked_at:string}, Insertable<{hotspot_id:string;report_id:string;linked_at?:string},'hotspot_id'|'report_id'>>;
      risk_assessments: Table<{id:string;hotspot_id:string;risk_score:number;risk_level:RiskLevel;scoring_version:string;contributing_factors:unknown;supporting_report_count:number;calculated_at:string}, Insertable<{id?:string;hotspot_id:string;risk_score:number;risk_level:RiskLevel;scoring_version:string;contributing_factors:unknown;supporting_report_count:number;calculated_at?:string},'hotspot_id'|'risk_score'|'risk_level'|'scoring_version'|'contributing_factors'|'supporting_report_count'>>;
      collection_schedules: Table<{id:string;service_area_id:string;scheduled_at:string;collection_type:string;assigned_team:string|null;status:string;created_by:string|null;created_at:string}, Insertable<{id?:string;service_area_id:string;scheduled_at:string;collection_type:string;assigned_team?:string|null;status?:string;created_by?:string|null},'service_area_id'|'scheduled_at'|'collection_type'>>;
      collection_records: Table<{id:string;schedule_id:string;recorded_by:string;actual_completed_at:string|null;status:string;notes:string|null;created_at:string}, Insertable<{id?:string;schedule_id:string;recorded_by:string;actual_completed_at?:string|null;status:string;notes?:string|null},'schedule_id'|'recorded_by'|'status'>>;
      root_cause_assessments: Table<{id:string;hotspot_id:string;model_name:string|null;prompt_version:string|null;observed_pattern:unknown;possible_factors:unknown;recommendations:unknown;uncertainty_notes:string|null;review_status:AssessmentReviewStatus;reviewed_by:string|null;created_at:string}, Insertable<{id?:string;hotspot_id:string;model_name?:string|null;prompt_version?:string|null;observed_pattern:unknown;possible_factors:unknown;recommendations:unknown;uncertainty_notes?:string|null;review_status?:AssessmentReviewStatus;reviewed_by?:string|null},'hotspot_id'|'observed_pattern'|'possible_factors'|'recommendations'>>;
      assessment_evidence: Table<{id:string;assessment_id:string;evidence_type:string;evidence_id:string;description:string;created_at:string}, Insertable<{id?:string;assessment_id:string;evidence_type:string;evidence_id:string;description:string},'assessment_id'|'evidence_type'|'evidence_id'|'description'>>;
      cleanup_tasks: Table<{id:string;report_id:string;title:string;description:string|null;assigned_officer_id:string|null;status:CleanupStatus;started_at:string|null;completed_at:string|null;verified_by:string|null;verified_at:string|null;resolution_notes:string|null;created_at:string;updated_at:string}, Insertable<{id?:string;report_id:string;title:string;description?:string|null;assigned_officer_id?:string|null;status?:CleanupStatus;started_at?:string|null;completed_at?:string|null;verified_by?:string|null;verified_at?:string|null;resolution_notes?:string|null},'report_id'|'title'>>;
      task_assignments: Table<{id:string;task_id:string;assigned_to:string;assigned_by:string;assigned_at:string;unassigned_at:string|null}, Insertable<{id?:string;task_id:string;assigned_to:string;assigned_by:string;assigned_at?:string;unassigned_at?:string|null},'task_id'|'assigned_to'|'assigned_by'>>;
      cleanup_evidence: Table<{id:string;task_id:string;uploaded_by:string;storage_path:string;evidence_type:string;notes:string|null;created_at:string}, Insertable<{id?:string;task_id:string;uploaded_by:string;storage_path:string;evidence_type:string;notes?:string|null},'task_id'|'uploaded_by'|'storage_path'|'evidence_type'>>;
      disposal_facilities: Table<{id:string;municipality_id:string|null;name:string;facility_type:string;address:string;latitude:number;longitude:number;location:unknown;operating_hours:unknown|null;verification_status:string;source_reference:string|null;created_at:string}, Insertable<{id?:string;municipality_id?:string|null;name:string;facility_type:string;address:string;latitude:number;longitude:number;operating_hours?:unknown|null;verification_status?:string;source_reference?:string|null},'name'|'facility_type'|'address'|'latitude'|'longitude'>>;
      facility_categories: Table<{id:string;facility_id:string;waste_category:WasteCategory;accepted:boolean}, Insertable<{id?:string;facility_id:string;waste_category:WasteCategory;accepted?:boolean},'facility_id'|'waste_category'>>;
      notifications: Table<{id:string;recipient_id:string;title:string;message:string;notification_type:string;related_entity_type:string|null;related_entity_id:string|null;read_at:string|null;created_at:string}, Insertable<{id?:string;recipient_id:string;title:string;message:string;notification_type:string;related_entity_type?:string|null;related_entity_id?:string|null;read_at?:string|null},'recipient_id'|'title'|'message'|'notification_type'>>;
      notification_preferences: Table<{id:string;user_id:string;in_app_enabled:boolean;email_enabled:boolean;push_enabled:boolean;updated_at:string}, Insertable<{id?:string;user_id:string;in_app_enabled?:boolean;email_enabled?:boolean;push_enabled?:boolean},'user_id'>>;
      system_settings: Table<{id:string;setting_key:string;setting_value:unknown;description:string|null;updated_by:string|null;updated_at:string}, Insertable<{id?:string;setting_key:string;setting_value:unknown;description?:string|null;updated_by?:string|null},'setting_key'|'setting_value'>>;
      audit_logs: Table<{id:string;actor_id:string|null;action:string;entity_type:string;entity_id:string;old_values:unknown|null;new_values:unknown|null;created_at:string}, Insertable<{id?:string;actor_id?:string|null;action:string;entity_type:string;entity_id:string;old_values?:unknown|null;new_values?:unknown|null},'action'|'entity_type'|'entity_id'>>;
      contact_inquiries: Table<{id:string;full_name:string;email:string;subject:string|null;message:string;created_at:string}, Insertable<{id?:string;full_name:string;email:string;subject?:string|null;message:string},'full_name'|'email'|'message'>>;
    };
    Views: {
      citizen_activity_summary: { Row: {citizen_id:string;waste_analysis_count:number;dumping_report_count:number;last_activity_at:string|null}; Relationships: [] };
      dumping_report_summary: { Row: {status:ReportStatus;report_count:number;duplicate_count:number;first_report_at:string|null;latest_report_at:string|null}; Relationships: [] };
      hotspot_summary: { Row: {hotspot_id:string;name:string;risk_score:number|null;risk_level:RiskLevel|null;service_area_id:string|null;linked_report_count:number;latest_linked_at:string|null}; Relationships: [] };
      collection_performance_summary: { Row: {service_area_id:string;scheduled_count:number;completed_count:number;missed_count:number;completion_percentage:number|null}; Relationships: [] };
      cleanup_performance_summary: { Row: {status:CleanupStatus;task_count:number;verified_count:number;avg_completion_hours:number|null}; Relationships: [] };
      waste_analysis_summary: { Row: {analysis_id:string;user_id:string;analysis_status:AnalysisStatus;created_at:string;detected_item_count:number;uncertain_item_count:number}; Relationships: [] };
    };
    Functions: {
      current_role: { Args: Record<PropertyKey, never>; Returns: AppRole | null };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_officer: { Args: Record<PropertyKey, never>; Returns: boolean };
      officer_has_area: { Args: {area_id:string}; Returns: boolean };
      can_access_report: { Args: {report_uuid:string}; Returns: boolean };
      can_access_task: { Args: {task_uuid:string}; Returns: boolean };
    };
    Enums: {
      app_role: AppRole; account_status: AccountStatus; waste_category: WasteCategory;
      analysis_status: AnalysisStatus; report_status: ReportStatus; review_decision: ReviewDecision;
      risk_level: RiskLevel; cleanup_status: CleanupStatus; assessment_review_status: AssessmentReviewStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
