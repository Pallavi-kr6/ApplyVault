create extension if not exists "pgcrypto";

create type application_status as enum (
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  application_url text not null,
  location text,
  employment_type text,
  salary text,
  status application_status not null default 'Applied',
  applied_at timestamptz not null default now(),
  source_platform text not null,
  created_at timestamptz not null default now()
);

create table public.job_snapshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  raw_html text,
  raw_job_description text
);

create table public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  summary text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  qualifications text[] not null default '{}',
  experience_required text,
  ai_match_score integer check (ai_match_score is null or ai_match_score between 0 and 100),
  missing_skills text[] not null default '{}',
  strength_areas text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  content_type text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_status_idx on public.applications(status);
create index applications_company_role_idx on public.applications using gin (
  to_tsvector('english', company_name || ' ' || job_title)
);

alter table public.users enable row level security;
alter table public.applications enable row level security;
alter table public.job_snapshots enable row level security;
alter table public.ai_analysis enable row level security;
alter table public.resumes enable row level security;

create policy "Users can read themselves"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update themselves"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can read own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

create policy "Users can read own snapshots"
  on public.job_snapshots for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = job_snapshots.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can insert own snapshots"
  on public.job_snapshots for insert
  with check (
    exists (
      select 1 from public.applications
      where applications.id = job_snapshots.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can read own analysis"
  on public.ai_analysis for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = ai_analysis.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can read own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload own resume objects"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own resume objects"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own resume objects"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
