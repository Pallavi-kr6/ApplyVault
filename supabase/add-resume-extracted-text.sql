alter table public.resumes
  add column if not exists extracted_text text;
