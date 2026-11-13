-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public','profiles','profiles table exists');
select has_table('public','waste_analyses','waste_analyses table exists');
select has_table('public','waste_analysis_items','waste items table exists');
select has_table('public','dumping_reports','dumping reports table exists');
select has_table('public','report_images','report images table exists');
select has_table('public','hotspots','hotspots table exists');
select has_table('public','hotspot_reports','hotspot join table exists');
select has_table('public','cleanup_tasks','cleanup tasks table exists');
select has_table('public','cleanup_evidence','cleanup evidence table exists');
select has_view('public','citizen_activity_summary','citizen analytics view exists');
select has_view('public','dumping_report_summary','report analytics view exists');
select has_view('public','hotspot_summary','hotspot analytics view exists');
select has_view('public','collection_performance_summary','collection analytics view exists');
select has_view('public','cleanup_performance_summary','cleanup analytics view exists');
select has_view('public','waste_analysis_summary','waste analytics view exists');
select ok((select relrowsecurity from pg_class where oid='public.dumping_reports'::regclass),'dumping reports RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.waste_analyses'::regclass),'waste analyses RLS enabled');
select is((select count(*)::int from storage.buckets where id in ('waste-images','dumping-images','cleanup-images')),3,'three private buckets created');

select * from finish();
rollback;
