-- 커뮤니티 글 이미지 업로드용 Storage (Phase 5 후속 — 이미지)
-- Supabase 대시보드 → SQL Editor 에 붙여 실행하세요.

-- 1) 공개 버킷 생성 (이미 있으면 무시)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- 2) storage.objects RLS 정책
--    공개 읽기 + 로그인 사용자는 자기 폴더(uid/...)에만 업로드 + 본인 파일만 삭제
drop policy if exists "post-images 공개 읽기" on storage.objects;
create policy "post-images 공개 읽기"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "post-images 로그인 업로드" on storage.objects;
create policy "post-images 로그인 업로드"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post-images 본인 삭제" on storage.objects;
create policy "post-images 본인 삭제"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and owner = auth.uid());
