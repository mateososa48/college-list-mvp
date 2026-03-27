-- ============================================================
-- Essay Requirements Rich Metadata
-- ============================================================

create table if not exists essay_requirement_summaries (
  school_id text primary key references schools(id) on delete cascade,
  display_title text default 'Essay Requirements',
  application_type text,
  essay_count_summary text,
  word_limit_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table essay_prompts
  add column if not exists section_key text,
  add column if not exists section_title text,
  add column if not exists section_order integer,
  add column if not exists prompt_order integer,
  add column if not exists prompt_title text;

alter table essay_requirement_summaries enable row level security;

create policy "Anyone can read essay requirement summaries"
  on essay_requirement_summaries for select using (true);

create policy "Service role can manage essay requirement summaries"
  on essay_requirement_summaries for all using (auth.role() = 'service_role');

create index if not exists essay_prompts_school_section_prompt_idx
  on essay_prompts (school_id, section_order, prompt_order);
