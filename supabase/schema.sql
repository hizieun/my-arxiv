-- my-arxiv 커뮤니티 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- (이미 일부가 존재해도 안전하도록 if not exists / drop policy 처리)

-- ─────────────────────────────────────────────
-- 1. profiles : auth.users 1:1 공개 프로필
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "프로필 공개 조회" on public.profiles;
create policy "프로필 공개 조회"
  on public.profiles for select
  using (true);

drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- 2. posts : 학습 글(TIL, 마크다운)
-- ─────────────────────────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text not null,                 -- 마크다운 원문
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "글 공개 조회" on public.posts;
create policy "글 공개 조회"
  on public.posts for select
  using (true);

drop policy if exists "로그인 사용자 글 작성" on public.posts;
create policy "로그인 사용자 글 작성"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "본인 글만 수정" on public.posts;
create policy "본인 글만 수정"
  on public.posts for update
  using (auth.uid() = author_id);

drop policy if exists "본인 글만 삭제" on public.posts;
create policy "본인 글만 삭제"
  on public.posts for delete
  using (auth.uid() = author_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 3. 신규 가입 시 프로필 자동 생성
--    GitHub OAuth 메타데이터(user_name/avatar_url)에서 시드.
--    username 충돌 시 짧은 uid suffix로 유일화.
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  final_name text;
begin
  base_name := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    'user'
  );
  final_name := base_name;
  if exists (select 1 from public.profiles where username = final_name) then
    final_name := base_name || '-' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    final_name,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
