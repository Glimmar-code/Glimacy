-- ============================================================================
-- GLIMACY — Supabase Schema & Security Setup
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is safe to run multiple times (uses IF NOT EXISTS / CREATE OR REPLACE).
--
-- Creates: profiles, posts, follows
-- Enables: Row Level Security with sensible public-read / owner-write policies
-- Adds:    auto profile creation on signup + a public storage bucket for images
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- One row per auth user. The app reads/writes this in fetchUserData() and
-- handleSaveProfile().
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  first_name          text,
  last_name           text,
  name                text,
  handle              text,
  bio                 text,
  university          text,
  faculty             text,
  relationship_status text,
  gender              text,
  phone               text,
  hobby               text,
  avatar_url          text,
  cover_url           text,
  verified            boolean     not null default false,
  verified_type       text,
  tokens              integer     not null default 0,
  posts_count         integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. POSTS
-- The app reads these in fetchDatabasePosts() and inserts in handleCreatePost().
-- author_id has a single FK to profiles(id) so PostgREST can embed the author
-- via:  select("*, author:profiles(...)")
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  content    text,
  image_url  text,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "Users can insert their own posts" on public.posts;
create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- 3. FOLLOWS
-- The app reads/writes this in fetchUserData() and handleToggleFollow().
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

drop policy if exists "Users can follow on their own behalf" on public.follows;
create policy "Users can follow on their own behalf"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow on their own behalf" on public.follows;
create policy "Users can unfollow on their own behalf"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- 4. AUTO-CREATE A PROFILE ROW WHEN A USER SIGNS UP
-- Ensures profiles.id always exists for a logged-in user.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    '@' || split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. STORAGE BUCKET FOR POST IMAGES / AVATARS
-- handleCreatePost() uploads images here under a per-user folder (userId/...).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "Post images are publicly readable" on storage.objects;
create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Users can upload their own post images" on storage.objects;
create policy "Users can upload their own post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own post images" on storage.objects;
create policy "Users can update their own post images"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own post images" on storage.objects;
create policy "Users can delete their own post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
