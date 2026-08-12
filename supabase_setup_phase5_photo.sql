-- Phase 5: 개인 사진 위젯용 Storage 버킷 (Supabase SQL Editor에서 실행)

insert into storage.buckets (id, name, public)
values ('dashboard-photos', 'dashboard-photos', true)
on conflict (id) do nothing;

create policy "users can upload own photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'dashboard-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update own photo" on storage.objects for update to authenticated
  using (bucket_id = 'dashboard-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete own photo" on storage.objects for delete to authenticated
  using (bucket_id = 'dashboard-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "anyone can view dashboard photos" on storage.objects for select
  using (bucket_id = 'dashboard-photos');
