-- Base demonstration/reference data. Run after migrations.
insert into public.municipalities(name,state,country)
values ('Lucknow Municipal Corporation','Uttar Pradesh','India')
on conflict(name,state,country) do nothing;

insert into public.service_areas(municipality_id,name,description)
select id,'Hazratganj','Demonstration service area for EcoWatch AI'
from public.municipalities where name='Lucknow Municipal Corporation'
on conflict(municipality_id,name) do nothing;

insert into public.waste_reference_items(item_name,category,description,handling_guidance,processing_guidance,reference_source)
values
('Vegetable peels','wet','Biodegradable kitchen waste','Keep in a covered wet-waste container.','Composting or biomethanation.','EcoWatch AI demo reference'),
('Plastic bottle','dry','Clean recyclable plastic packaging','Empty, rinse and keep dry.','Send to an authorised material recovery/recycling facility.','EcoWatch AI demo reference'),
('Used sanitary pad','sanitary','Sanitary waste requiring safe wrapping','Wrap securely and follow local municipal collection guidance.','Use authorised sanitary waste processing route.','EcoWatch AI demo reference'),
('Battery','special_care','Household hazardous/special-care item','Do not mix with wet or dry household waste.','Use an authorised battery take-back/recycling channel.','EcoWatch AI demo reference')
on conflict(item_name,category) do nothing;

insert into public.disposal_facilities(municipality_id,name,facility_type,address,latitude,longitude,verification_status,source_reference)
select m.id,'EcoWatch Demonstration Material Recovery Facility','material_recovery','Demonstration location, Lucknow, Uttar Pradesh, India',26.8467,80.9462,'verified','Synthetic demo data'
from public.municipalities m where m.name='Lucknow Municipal Corporation'
and not exists(select 1 from public.disposal_facilities f where f.name='EcoWatch Demonstration Material Recovery Facility');

insert into public.facility_categories(facility_id,waste_category,accepted)
select f.id,v.category,true
from public.disposal_facilities f
cross join (values ('dry'::public.waste_category),('special_care'::public.waste_category)) v(category)
where f.name='EcoWatch Demonstration Material Recovery Facility'
on conflict(facility_id,waste_category) do nothing;

-- Demo identities are intentionally NOT created here. Create users via Supabase Auth first;
-- the on_auth_user_created trigger provisions citizen profiles automatically.
