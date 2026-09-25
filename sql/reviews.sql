-- Run in your Supabase project's SQL editor before enabling public reviews.
create table if not exists public.app_reviews (
 id uuid primary key default gen_random_uuid(),
 app_slug text not null check(app_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 display_name text not null check(char_length(trim(display_name)) between 2 and 60),
 rating smallint not null check(rating between 1 and 5),
 body text not null check(char_length(trim(body)) between 10 and 2000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 unique(app_slug,author_id)
);
create index if not exists app_reviews_approved_idx on public.app_reviews(app_slug,created_at desc) where status='approved';
alter table public.app_reviews enable row level security;
revoke all on public.app_reviews from anon,authenticated;
grant select on public.app_reviews to anon,authenticated;
grant insert on public.app_reviews to authenticated;
create policy "Read approved or own reviews" on public.app_reviews for select to anon,authenticated using(status='approved' or author_id=(select auth.uid()));
create policy "Only user submits pending" on public.app_reviews for insert to authenticated with check(author_id=(select auth.uid()) and status='pending');
