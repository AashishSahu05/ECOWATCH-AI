-- EcoWatch AI | Initial schema
-- Supabase PostgreSQL. Apply with: supabase db reset
begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

do $$ begin
  create type public.app_role as enum ('citizen','municipal_officer','administrator');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.account_status as enum ('pending','active','suspended');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.waste_category as enum ('wet','dry','sanitary','special_care','unknown');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.analysis_status as enum ('pending','processing','completed','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.report_status as enum ('submitted','under_review','approved','rejected','assigned','in_progress','resolved');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.review_decision as enum ('approved','rejected','needs_information');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.risk_level as enum ('low','medium','high');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.cleanup_status as enum ('assigned','in_progress','completed','verified','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.assessment_review_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  country text not null default 'India',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name,state,country)
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  name text not null,
  description text,
  boundary extensions.geography(MultiPolygon,4326),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(municipality_id,name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  phone text,
  role public.app_role not null default 'citizen',
  municipality_id uuid references public.municipalities(id) on delete restrict,
  account_status public.account_status not null default 'active',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_role_municipality_chk check (
    (role = 'citizen') or municipality_id is not null
  )
);

create table public.officer_service_areas (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid not null references public.profiles(id) on delete restrict,
  service_area_id uuid not null references public.service_areas(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  constraint officer_service_area_role_chk check (officer_id is not null),
  unique(officer_id,service_area_id,assigned_at)
);
create unique index officer_service_areas_active_uq
  on public.officer_service_areas(officer_id,service_area_id) where revoked_at is null;

create table public.waste_reference_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category public.waste_category not null check (category <> 'unknown'),
  description text not null,
  handling_guidance text not null,
  processing_guidance text,
  safety_notes text,
  reference_source text not null,
  source_verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(item_name,category)
);

create table public.waste_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  image_path text not null,
  analysis_status public.analysis_status not null default 'pending',
  contamination_detected boolean,
  general_guidance text,
  model_name text,
  prompt_version text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint waste_analysis_completion_chk check (completed_at is null or completed_at >= created_at)
);

create table public.waste_analysis_items (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.waste_analyses(id) on delete cascade,
  item_name text not null,
  category public.waste_category not null,
  explanation text,
  disposal_guidance text,
  confidence_estimate numeric(5,4) check (confidence_estimate between 0 and 1),
  is_uncertain boolean not null default false,
  safety_warning text,
  created_at timestamptz not null default now()
);

create table public.dumping_reports (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete restrict,
  service_area_id uuid references public.service_areas(id) on delete set null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(Point,4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
  address text,
  description text,
  ai_assessment jsonb,
  status public.report_status not null default 'submitted',
  duplicate_flag boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.dumping_reports(id) on delete restrict,
  storage_path text not null unique,
  image_type text not null default 'incident' check (image_type in ('incident','additional_evidence')),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.report_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.dumping_reports(id) on delete restrict,
  officer_id uuid not null references public.profiles(id) on delete restrict,
  decision public.review_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.hotspots (
  id uuid primary key default gen_random_uuid(),
  service_area_id uuid references public.service_areas(id) on delete set null,
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(Point,4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
  risk_score numeric(5,2) check (risk_score between 0 and 100),
  risk_level public.risk_level,
  last_calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hotspot_reports (
  hotspot_id uuid not null references public.hotspots(id) on delete restrict,
  report_id uuid not null references public.dumping_reports(id) on delete restrict,
  linked_at timestamptz not null default now(),
  primary key(hotspot_id,report_id)
);

create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  hotspot_id uuid not null references public.hotspots(id) on delete restrict,
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  risk_level public.risk_level not null,
  scoring_version text not null,
  contributing_factors jsonb not null default '{}'::jsonb,
  supporting_report_count integer not null check (supporting_report_count >= 0),
  calculated_at timestamptz not null default now()
);

create table public.collection_schedules (
  id uuid primary key default gen_random_uuid(),
  service_area_id uuid not null references public.service_areas(id) on delete restrict,
  scheduled_at timestamptz not null,
  collection_type text not null,
  assigned_team text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','missed','cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.collection_records (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.collection_schedules(id) on delete restrict,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  actual_completed_at timestamptz,
  status text not null check (status in ('completed','missed','partial')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.root_cause_assessments (
  id uuid primary key default gen_random_uuid(),
  hotspot_id uuid not null references public.hotspots(id) on delete restrict,
  model_name text,
  prompt_version text,
  observed_pattern jsonb not null,
  possible_factors jsonb not null,
  recommendations jsonb not null,
  uncertainty_notes text,
  review_status public.assessment_review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.assessment_evidence (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.root_cause_assessments(id) on delete restrict,
  evidence_type text not null check (evidence_type in ('dumping_report','collection_record','facility')),
  evidence_id uuid not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.cleanup_tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.dumping_reports(id) on delete restrict,
  title text not null,
  description text,
  assigned_officer_id uuid references public.profiles(id) on delete set null,
  status public.cleanup_status not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'verified') or (verified_by is not null and verified_at is not null)),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.cleanup_tasks(id) on delete restrict,
  assigned_to uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

create table public.cleanup_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.cleanup_tasks(id) on delete restrict,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  evidence_type text not null check (evidence_type in ('before','after')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.disposal_facilities (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid references public.municipalities(id) on delete set null,
  name text not null,
  facility_type text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(Point,4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
  operating_hours jsonb,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  source_reference text,
  created_at timestamptz not null default now()
);

create table public.facility_categories (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.disposal_facilities(id) on delete cascade,
  waste_category public.waste_category not null check (waste_category <> 'unknown'),
  accepted boolean not null default true,
  unique(facility_id,waste_category)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['municipalities','profiles','dumping_reports','hotspots','cleanup_tasks','notification_preferences','system_settings'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t||'_set_updated_at', t);
  end loop;
end $$;

-- Auth signup creates a citizen profile; elevated roles are never accepted from signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,role,account_status)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'New Citizen'),
          'citizen'::public.app_role, 'active'::public.account_status)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Trusted role and scope helpers. SECURITY DEFINER avoids recursive RLS policy evaluation.
create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.account_status = 'active'
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_role() = 'administrator'::public.app_role,false)
$$;
create or replace function public.is_officer()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_role() = 'municipal_officer'::public.app_role,false)
$$;
create or replace function public.officer_has_area(area_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.officer_service_areas osa
    join public.profiles p on p.id = osa.officer_id
    where osa.officer_id = (select auth.uid()) and osa.service_area_id = area_id
      and osa.revoked_at is null and p.account_status = 'active'
  )
$$;
create or replace function public.can_access_report(report_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.dumping_reports r
    where r.id = report_uuid and (
      r.citizen_id = (select auth.uid()) or public.is_admin()
      or (public.is_officer() and r.service_area_id is not null and public.officer_has_area(r.service_area_id))
    )
  )
$$;
create or replace function public.can_access_task(task_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cleanup_tasks t
    join public.dumping_reports r on r.id = t.report_id
    where t.id = task_uuid and (
      public.is_admin() or r.citizen_id = (select auth.uid())
      or (public.is_officer() and (
        t.assigned_officer_id = (select auth.uid()) or public.officer_has_area(r.service_area_id)
      ))
    )
  )
$$;

-- Prevent self-promotion and direct role/municipality changes. Admin changes are audited separately.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.role is distinct from old.role or new.municipality_id is distinct from old.municipality_id)
     and not public.is_admin() then
    raise exception 'Only an administrator may change role or municipality';
  end if;
  return new;
end $$;
create trigger profiles_protect_privileges before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Indexes for foreign keys, filters and spatial lookups.
create index service_areas_municipality_idx on public.service_areas(municipality_id);
create index profiles_role_municipality_idx on public.profiles(role,municipality_id);
create index officer_service_areas_assigned_by_idx on public.officer_service_areas(assigned_by);
create index officer_service_areas_officer_idx on public.officer_service_areas(officer_id);
create index officer_service_areas_area_idx on public.officer_service_areas(service_area_id);
create index waste_analyses_user_created_idx on public.waste_analyses(user_id,created_at desc);
create index waste_analysis_items_analysis_category_idx on public.waste_analysis_items(analysis_id,category);
create index dumping_reports_citizen_created_idx on public.dumping_reports(citizen_id,created_at desc);
create index dumping_reports_status_idx on public.dumping_reports(status);\ncreate index dumping_reports_reviewed_by_idx on public.dumping_reports(reviewed_by);
create index dumping_reports_area_status_idx on public.dumping_reports(service_area_id,status);
create index dumping_reports_location_gix on public.dumping_reports using gist(location);
create index report_images_report_idx on public.report_images(report_id);\ncreate index report_images_uploaded_by_idx on public.report_images(uploaded_by);
create index report_reviews_report_created_idx on public.report_reviews(report_id,created_at desc);\ncreate index report_reviews_officer_idx on public.report_reviews(officer_id);
create index hotspots_risk_area_idx on public.hotspots(risk_level,service_area_id);
create index hotspots_location_gix on public.hotspots using gist(location);
create index hotspot_reports_report_idx on public.hotspot_reports(report_id);
create index risk_assessments_hotspot_calculated_idx on public.risk_assessments(hotspot_id,calculated_at desc);
create index collection_schedules_area_date_idx on public.collection_schedules(service_area_id,scheduled_at,status);
create index collection_records_schedule_status_idx on public.collection_records(schedule_id,status);\ncreate index collection_records_recorded_by_idx on public.collection_records(recorded_by);
create index root_cause_assessments_hotspot_status_idx on public.root_cause_assessments(hotspot_id,review_status);
create index cleanup_tasks_report_idx on public.cleanup_tasks(report_id);
create index cleanup_tasks_officer_status_idx on public.cleanup_tasks(assigned_officer_id,status);
create index task_assignments_task_idx on public.task_assignments(task_id,assigned_at desc);
create index cleanup_evidence_task_idx on public.cleanup_evidence(task_id);\ncreate index cleanup_evidence_uploaded_by_idx on public.cleanup_evidence(uploaded_by);
create index disposal_facilities_location_gix on public.disposal_facilities using gist(location);
create index notifications_recipient_read_created_idx on public.notifications(recipient_id,read_at,created_at desc);\ncreate index notification_preferences_user_idx on public.notification_preferences(user_id);\ncreate index task_assignments_assigned_to_idx on public.task_assignments(assigned_to);\ncreate index task_assignments_assigned_by_idx on public.task_assignments(assigned_by);\ncreate index disposal_facilities_municipality_idx on public.disposal_facilities(municipality_id);\ncreate index facility_categories_facility_idx on public.facility_categories(facility_id);
create index audit_logs_actor_entity_created_idx on public.audit_logs(actor_id,entity_type,entity_id,created_at desc);

-- Enable RLS on every exposed application table.
do $$ declare t text; begin
  foreach t in array array[
    'municipalities','service_areas','profiles','officer_service_areas','waste_reference_items',
    'waste_analyses','waste_analysis_items','dumping_reports','report_images','report_reviews',
    'hotspots','hotspot_reports','risk_assessments','collection_schedules','collection_records',
    'root_cause_assessments','assessment_evidence','cleanup_tasks','task_assignments','cleanup_evidence',
    'disposal_facilities','facility_categories','notifications','notification_preferences',
    'system_settings','audit_logs','contact_inquiries'
  ] loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

-- Explicit grants; RLS remains the row-level gate.
grant usage on schema public to anon, authenticated;
grant select,insert,update,delete on public.municipalities, public.service_areas,
  public.officer_service_areas, public.waste_reference_items, public.hotspots,
  public.disposal_facilities, public.facility_categories to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.waste_analyses, public.waste_analysis_items to authenticated;
grant select,insert,update on public.dumping_reports to authenticated;
grant select,insert on public.report_images to authenticated;
grant select,insert on public.report_reviews to authenticated;
grant select,insert,update on public.hotspot_reports, public.risk_assessments to authenticated;
grant select,insert,update on public.collection_schedules, public.collection_records to authenticated;
grant select,insert,update on public.root_cause_assessments, public.assessment_evidence to authenticated;
grant select,insert,update on public.cleanup_tasks, public.task_assignments, public.cleanup_evidence to authenticated;
grant select,insert,update on public.notifications, public.notification_preferences to authenticated;
grant select,insert,update on public.system_settings to authenticated;
grant select,insert on public.audit_logs to authenticated;
revoke all on public.contact_inquiries from anon, authenticated;
grant select,insert on public.contact_inquiries to anon, authenticated;

-- Profiles: own profile, admin sees all. Self-update trigger blocks role/municipality edits.
create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and role = 'citizen' and municipality_id is null);
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

create policy municipalities_read on public.municipalities for select to authenticated
using (true);
create policy municipalities_admin_all on public.municipalities for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy service_areas_read on public.service_areas for select to authenticated
using (is_active or public.is_admin() or public.officer_has_area(id));
create policy service_areas_admin_all on public.service_areas for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy officer_area_read on public.officer_service_areas for select to authenticated
using (officer_id = (select auth.uid()) or public.is_admin() or public.officer_has_area(service_area_id));
create policy officer_area_admin_all on public.officer_service_areas for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy waste_reference_read on public.waste_reference_items for select to authenticated using (is_active or public.is_admin());
create policy waste_reference_admin_all on public.waste_reference_items for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy waste_analyses_select on public.waste_analyses for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
create policy waste_analyses_insert on public.waste_analyses for insert to authenticated
with check (user_id = (select auth.uid()));
create policy waste_analyses_update on public.waste_analyses for update to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());
create policy waste_analyses_delete on public.waste_analyses for delete to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
create policy waste_items_select on public.waste_analysis_items for select to authenticated
using (exists(select 1 from public.waste_analyses wa where wa.id=analysis_id and (wa.user_id=(select auth.uid()) or public.is_admin())));
create policy waste_items_insert on public.waste_analysis_items for insert to authenticated
with check (exists(select 1 from public.waste_analyses wa where wa.id=analysis_id and wa.user_id=(select auth.uid())));
create policy waste_items_update on public.waste_analysis_items for update to authenticated
using (exists(select 1 from public.waste_analyses wa where wa.id=analysis_id and (wa.user_id=(select auth.uid()) or public.is_admin())))
with check (exists(select 1 from public.waste_analyses wa where wa.id=analysis_id and (wa.user_id=(select auth.uid()) or public.is_admin())));
create policy waste_items_delete on public.waste_analysis_items for delete to authenticated
using (exists(select 1 from public.waste_analyses wa where wa.id=analysis_id and (wa.user_id=(select auth.uid()) or public.is_admin())));

create policy reports_select on public.dumping_reports for select to authenticated using (public.can_access_report(id));
create policy reports_insert on public.dumping_reports for insert to authenticated with check (citizen_id=(select auth.uid()));
create policy reports_update on public.dumping_reports for update to authenticated
using (public.is_admin() or (public.is_officer() and service_area_id is not null and public.officer_has_area(service_area_id)))
with check (public.is_admin() or (public.is_officer() and service_area_id is not null and public.officer_has_area(service_area_id)));
create policy report_images_select on public.report_images for select to authenticated using (public.can_access_report(report_id));
create policy report_images_insert on public.report_images for insert to authenticated
with check (uploaded_by=(select auth.uid()) and exists(select 1 from public.dumping_reports r where r.id=report_id and r.citizen_id=(select auth.uid())));
create policy report_reviews_select on public.report_reviews for select to authenticated
using (public.can_access_report(report_id));
create policy report_reviews_insert on public.report_reviews for insert to authenticated
with check (officer_id=(select auth.uid()) and (public.is_admin() or exists(select 1 from public.dumping_reports r where r.id=report_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id))));

create policy hotspots_read on public.hotspots for select to authenticated
using (service_area_id is null or public.is_admin() or public.officer_has_area(service_area_id) or exists(select 1 from public.hotspot_reports hr join public.dumping_reports r on r.id=hr.report_id where hr.hotspot_id=id and r.citizen_id=(select auth.uid())));
create policy hotspots_admin_all on public.hotspots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hotspot_reports_select on public.hotspot_reports for select to authenticated
using (public.can_access_report(report_id));
create policy hotspot_reports_insert on public.hotspot_reports for insert to authenticated
with check (public.is_admin() or exists(select 1 from public.dumping_reports r where r.id=report_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id)));
create policy risk_assessments_select on public.risk_assessments for select to authenticated
using (exists(select 1 from public.hotspots h where h.id=hotspot_id and (h.service_area_id is null or public.is_admin() or public.officer_has_area(h.service_area_id))));
create policy risk_assessments_write on public.risk_assessments for all to authenticated
using (public.is_admin() or (public.is_officer() and exists(select 1 from public.hotspots h where h.id=hotspot_id and public.officer_has_area(h.service_area_id))))
with check (public.is_admin() or (public.is_officer() and exists(select 1 from public.hotspots h where h.id=hotspot_id and public.officer_has_area(h.service_area_id))));

create policy collection_schedules_select on public.collection_schedules for select to authenticated
using (public.is_admin() or public.officer_has_area(service_area_id));
create policy collection_schedules_admin_officer_write on public.collection_schedules for all to authenticated
using (public.is_admin() or public.officer_has_area(service_area_id))
with check (public.is_admin() or public.officer_has_area(service_area_id));
create policy collection_records_select on public.collection_records for select to authenticated
using (public.is_admin() or exists(select 1 from public.collection_schedules cs where cs.id=schedule_id and public.officer_has_area(cs.service_area_id)));
create policy collection_records_write on public.collection_records for all to authenticated
using (public.is_admin() or (recorded_by=(select auth.uid()) and exists(select 1 from public.collection_schedules cs where cs.id=schedule_id and public.officer_has_area(cs.service_area_id))))
with check (public.is_admin() or (recorded_by=(select auth.uid()) and exists(select 1 from public.collection_schedules cs where cs.id=schedule_id and public.officer_has_area(cs.service_area_id))));

create policy root_cause_select on public.root_cause_assessments for select to authenticated
using (public.is_admin() or exists(select 1 from public.hotspots h where h.id=hotspot_id and public.officer_has_area(h.service_area_id)));
create policy root_cause_write on public.root_cause_assessments for all to authenticated
using (public.is_admin() or exists(select 1 from public.hotspots h where h.id=hotspot_id and public.officer_has_area(h.service_area_id)))
with check (public.is_admin() or exists(select 1 from public.hotspots h where h.id=hotspot_id and public.officer_has_area(h.service_area_id)));
create policy assessment_evidence_select on public.assessment_evidence for select to authenticated
using (exists(select 1 from public.root_cause_assessments a where a.id=assessment_id and (public.is_admin() or exists(select 1 from public.hotspots h where h.id=a.hotspot_id and public.officer_has_area(h.service_area_id)))));
create policy assessment_evidence_write on public.assessment_evidence for all to authenticated
using (public.is_admin() or exists(select 1 from public.root_cause_assessments a join public.hotspots h on h.id=a.hotspot_id where a.id=assessment_id and public.officer_has_area(h.service_area_id)))
with check (public.is_admin() or exists(select 1 from public.root_cause_assessments a join public.hotspots h on h.id=a.hotspot_id where a.id=assessment_id and public.officer_has_area(h.service_area_id)));

create policy cleanup_tasks_select on public.cleanup_tasks for select to authenticated using (public.can_access_report(report_id));
create policy cleanup_tasks_insert on public.cleanup_tasks for insert to authenticated
with check (public.is_admin() or exists(select 1 from public.dumping_reports r where r.id=report_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id)));
create policy cleanup_tasks_update on public.cleanup_tasks for update to authenticated
using (public.is_admin() or assigned_officer_id=(select auth.uid()) or exists(select 1 from public.dumping_reports r where r.id=report_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id)))
with check (public.is_admin() or assigned_officer_id=(select auth.uid()) or exists(select 1 from public.dumping_reports r where r.id=report_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id)));
create policy task_assignments_select on public.task_assignments for select to authenticated using (public.can_access_task(task_id));
create policy task_assignments_insert on public.task_assignments for insert to authenticated
with check (assigned_by=(select auth.uid()) and (public.is_admin() or exists(select 1 from public.cleanup_tasks t join public.dumping_reports r on r.id=t.report_id where t.id=task_id and r.service_area_id is not null and public.officer_has_area(r.service_area_id))));
create policy cleanup_evidence_select on public.cleanup_evidence for select to authenticated using (public.can_access_task(task_id));
create policy cleanup_evidence_insert on public.cleanup_evidence for insert to authenticated
with check (uploaded_by=(select auth.uid()) and public.can_access_task(task_id) and exists(select 1 from public.cleanup_tasks t where t.id=task_id and (t.assigned_officer_id=(select auth.uid()) or public.is_admin())));

create policy facilities_read on public.disposal_facilities for select to authenticated using (verification_status='verified' or public.is_admin());
create policy facilities_admin_all on public.disposal_facilities for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy facility_categories_read on public.facility_categories for select to authenticated
using (exists(select 1 from public.disposal_facilities f where f.id=facility_id and (f.verification_status='verified' or public.is_admin())));
create policy facility_categories_admin_all on public.facility_categories for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy notifications_own_select on public.notifications for select to authenticated using (recipient_id=(select auth.uid()) or public.is_admin());
create policy notifications_own_update on public.notifications for update to authenticated
using (recipient_id=(select auth.uid()) or public.is_admin())
with check (recipient_id=(select auth.uid()) or public.is_admin());
create policy notification_preferences_own_all on public.notification_preferences for all to authenticated
using (user_id=(select auth.uid()) or public.is_admin())
with check (user_id=(select auth.uid()) or public.is_admin());
create policy settings_admin_all on public.system_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_logs_insert_actor on public.audit_logs for insert to authenticated
with check (actor_id=(select auth.uid()) or public.is_admin());
create policy contact_inquiries_insert on public.contact_inquiries for insert to anon,authenticated with check (true);
create policy contact_inquiries_admin_read on public.contact_inquiries for select to authenticated using (public.is_admin());

-- Private storage buckets. Use 10 MB and image MIME allow-list; adjust if product requirements change.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('waste-images','waste-images',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('dumping-images','dumping-images',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('cleanup-images','cleanup-images',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy waste_storage_select on storage.objects for select to authenticated
using (bucket_id='waste-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy waste_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='waste-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy waste_storage_delete on storage.objects for delete to authenticated
using (bucket_id='waste-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy dumping_storage_select on storage.objects for select to authenticated
using (bucket_id='dumping-images' and exists(
  select 1 from public.report_images ri join public.dumping_reports r on r.id=ri.report_id
  where ri.storage_path=name and public.can_access_report(r.id)
));
create policy dumping_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='dumping-images' and exists(
  select 1 from public.dumping_reports r where r.id::text=(storage.foldername(name))[1] and r.citizen_id=(select auth.uid())
));

create policy cleanup_storage_select on storage.objects for select to authenticated
using (bucket_id='cleanup-images' and exists(
  select 1 from public.cleanup_evidence ce where ce.storage_path=name and public.can_access_task(ce.task_id)
));
create policy cleanup_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='cleanup-images' and exists(
  select 1 from public.cleanup_tasks t
  where t.id::text=(storage.foldername(name))[1]
    and (t.assigned_officer_id=(select auth.uid()) or public.is_admin())
));

-- Analytics views. They remain subject to underlying-table RLS for invoker queries.
create or replace view public.citizen_activity_summary with (security_invoker=true) as
select p.id as citizen_id, count(distinct wa.id) as waste_analysis_count,
       count(distinct dr.id) as dumping_report_count,
       max(greatest(coalesce(wa.created_at,'-infinity'),coalesce(dr.created_at,'-infinity'))) as last_activity_at
from public.profiles p
left join public.waste_analyses wa on wa.user_id=p.id
left join public.dumping_reports dr on dr.citizen_id=p.id
group by p.id;

create or replace view public.dumping_report_summary with (security_invoker=true) as
select status, count(*) as report_count, count(*) filter(where duplicate_flag) as duplicate_count,
       min(created_at) as first_report_at, max(created_at) as latest_report_at
from public.dumping_reports group by status;

create or replace view public.hotspot_summary with (security_invoker=true) as
select h.id as hotspot_id,h.name,h.risk_score,h.risk_level,h.service_area_id,
       count(hr.report_id) as linked_report_count,
       max(hr.linked_at) as latest_linked_at
from public.hotspots h left join public.hotspot_reports hr on hr.hotspot_id=h.id
group by h.id;

create or replace view public.collection_performance_summary with (security_invoker=true) as
select cs.service_area_id,count(*) as scheduled_count,
       count(*) filter(where cs.status='completed') as completed_count,
       count(*) filter(where cs.status='missed') as missed_count,
       round(100.0*count(*) filter(where cs.status='completed')/nullif(count(*),0),2) as completion_percentage
from public.collection_schedules cs group by cs.service_area_id;

create or replace view public.cleanup_performance_summary with (security_invoker=true) as
select status,count(*) as task_count,
       count(*) filter(where verified_at is not null) as verified_count,
       avg(extract(epoch from (completed_at-started_at))/3600.0) filter(where completed_at is not null and started_at is not null) as avg_completion_hours
from public.cleanup_tasks group by status;

create or replace view public.waste_analysis_summary with (security_invoker=true) as
select wa.id as analysis_id,wa.user_id,wa.analysis_status,wa.created_at,
       count(wai.id) as detected_item_count,
       count(wai.id) filter(where wai.category='unknown') as uncertain_item_count
from public.waste_analyses wa left join public.waste_analysis_items wai on wai.analysis_id=wa.id
group by wa.id;

grant select on public.citizen_activity_summary,public.dumping_report_summary,public.hotspot_summary,
 public.collection_performance_summary,public.cleanup_performance_summary,public.waste_analysis_summary to authenticated;

commit;
