# EcoWatch AI — ER Diagram

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "identity"
  MUNICIPALITIES ||--o{ SERVICE_AREAS : contains
  MUNICIPALITIES ||--o{ PROFILES : governs
  PROFILES ||--o{ OFFICER_SERVICE_AREAS : assigned
  SERVICE_AREAS ||--o{ OFFICER_SERVICE_AREAS : covered
  PROFILES ||--o{ WASTE_ANALYSES : creates
  WASTE_ANALYSES ||--o{ WASTE_ANALYSIS_ITEMS : detects
  PROFILES ||--o{ DUMPING_REPORTS : submits
  SERVICE_AREAS ||--o{ DUMPING_REPORTS : classifies
  DUMPING_REPORTS ||--o{ REPORT_IMAGES : has
  DUMPING_REPORTS ||--o{ REPORT_REVIEWS : reviewed
  HOTSPOTS ||--o{ HOTSPOT_REPORTS : groups
  DUMPING_REPORTS ||--o{ HOTSPOT_REPORTS : linked
  HOTSPOTS ||--o{ RISK_ASSESSMENTS : assessed
  SERVICE_AREAS ||--o{ COLLECTION_SCHEDULES : schedules
  COLLECTION_SCHEDULES ||--o{ COLLECTION_RECORDS : records
  HOTSPOTS ||--o{ ROOT_CAUSE_ASSESSMENTS : analysed
  ROOT_CAUSE_ASSESSMENTS ||--o{ ASSESSMENT_EVIDENCE : supported
  DUMPING_REPORTS ||--o{ CLEANUP_TASKS : triggers
  CLEANUP_TASKS ||--o{ TASK_ASSIGNMENTS : assignment_history
  CLEANUP_TASKS ||--o{ CLEANUP_EVIDENCE : evidence
  MUNICIPALITIES ||--o{ DISPOSAL_FACILITIES : operates
  DISPOSAL_FACILITIES ||--o{ FACILITY_CATEGORIES : accepts
  PROFILES ||--o{ NOTIFICATIONS : receives
  PROFILES ||--o| NOTIFICATION_PREFERENCES : configures
  PROFILES ||--o{ AUDIT_LOGS : acts
```

`hotspot_reports` is the many-to-many bridge between hotspots and dumping reports. `assessment_evidence.evidence_id` is a polymorphic reference validated by trusted backend logic, as specified in the design document.
