-- Demo SQL snippets: execute as the relevant authenticated user or trusted officer session.
-- Replace UUID placeholders with actual IDs from your local Auth users and records.

-- Citizen profile is auto-created by auth.users trigger.
select id, full_name, role from public.profiles where id = auth.uid();

-- Citizen creates a waste analysis (image must already be uploaded to private storage).
insert into public.waste_analyses(user_id,image_path,analysis_status,model_name,prompt_version)
values (auth.uid(),'waste-images/<AUTH_UID>/<ANALYSIS_UUID>/<IMAGE_UUID>.jpg','completed','Gemini','v1')
returning id;

-- Add multiple detected items to the returned analysis id.
insert into public.waste_analysis_items(analysis_id,item_name,category,confidence_estimate)
values
('<ANALYSIS_UUID>','Vegetable peels','wet',0.97),
('<ANALYSIS_UUID>','Plastic bottle','dry',0.94);

-- Citizen creates a dumping report, then uploads photo and inserts report_images metadata.
insert into public.dumping_reports(citizen_id,service_area_id,latitude,longitude,address,description)
values(auth.uid(),'<SERVICE_AREA_UUID>',26.8467,80.9462,'Hazratganj, Lucknow','Demo illegal dumping report')
returning id;

-- Officer review (requires officer role and active assignment to the report's service area).
insert into public.report_reviews(report_id,officer_id,decision,comment)
values('<REPORT_UUID>',auth.uid(),'approved','Verified during demonstration');

-- Link multiple reports to one hotspot.
insert into public.hotspot_reports(hotspot_id,report_id)
values ('<HOTSPOT_UUID>','<REPORT_UUID_1>'),
       ('<HOTSPOT_UUID>','<REPORT_UUID_2>');

-- Cleanup task assignment and evidence metadata.
insert into public.cleanup_tasks(report_id,title,assigned_officer_id,status)
values('<REPORT_UUID>','Remove illegal dumping','<OFFICER_UUID>','assigned')
returning id;
insert into public.task_assignments(task_id,assigned_to,assigned_by)
values('<TASK_UUID>','<OFFICER_UUID>','<ADMIN_OR_AUTHORISED_OFFICER_UUID>');

-- After task work and evidence uploads:
update public.cleanup_tasks set status='completed',started_at=now(),completed_at=now()
where id='<TASK_UUID>';
update public.cleanup_tasks set status='verified',verified_by=auth.uid(),verified_at=now()
where id='<TASK_UUID>'; -- verifier must be an authorised officer/admin through the trusted workflow.
