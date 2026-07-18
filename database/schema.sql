-- StudyAI database schema for Supabase PostgreSQL
-- Chạy toàn bộ file này trong Supabase SQL Editor.

create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  token_version integer not null default 0,
  created_at timestamp with time zone default now()
);

alter table users add column if not exists role text not null default 'user';
alter table users add column if not exists token_version integer not null default 0;

create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  description text,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'overdue')),
  created_at timestamp with time zone default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  file_name text,
  file_path text,
  file_url text,
  file_type text default 'txt',
  extracted_text text,
  storage_path text,
  index_status text not null default 'pending' check (index_status in ('pending', 'processing', 'completed', 'failed')),
  index_error text,
  indexed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table documents add column if not exists storage_path text;
alter table documents add column if not exists index_status text not null default 'pending';
alter table documents add column if not exists index_error text;
alter table documents add column if not exists indexed_at timestamp with time zone;

create table if not exists summaries (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  summary_type text default 'ai_summary',
  content text not null,
  created_at timestamp with time zone default now()
);

create table if not exists document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page_number integer,
  char_start integer,
  char_end integer,
  token_estimate integer,
  embedding vector(768) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  unique(document_id, chunk_index)
);

create table if not exists ai_generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  content_type text not null check (content_type in ('summary', 'flashcards', 'quiz')),
  version_number integer not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  source text not null default 'ai' check (source in ('ai', 'manual', 'legacy')),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(document_id, content_type, version_number)
);

create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default now()
);

create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null,
  explanation text,
  created_at timestamp with time zone default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  score numeric(5,2) not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists flashcard_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  rating text not null check (rating in ('easy', 'hard', 'forgot')),
  reviewed_at timestamp with time zone default now()
);

create table if not exists document_chats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  question text not null,
  answer text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists study_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_subjects_user_id on subjects(user_id);
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_summaries_document_id on summaries(document_id);
create index if not exists idx_flashcards_document_id on flashcards(document_id);
create index if not exists idx_quizzes_document_id on quizzes(document_id);
create index if not exists idx_quiz_attempts_user_id on quiz_attempts(user_id);
create index if not exists idx_flashcard_reviews_user_id on flashcard_reviews(user_id);
create index if not exists idx_document_chats_document_id on document_chats(document_id);
create index if not exists idx_study_plans_user_id on study_plans(user_id);
create index if not exists idx_document_chunks_document_id on document_chunks(document_id);
create index if not exists idx_document_chunks_user_id on document_chunks(user_id);
create index if not exists idx_document_chunks_user_document on document_chunks(user_id, document_id);
create index if not exists idx_document_chunks_embedding_hnsw on document_chunks using hnsw (embedding vector_cosine_ops);
create unique index if not exists idx_one_active_generation on ai_generations(document_id, content_type) where is_active = true;

alter table summaries add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table flashcards add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table quizzes add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table quiz_attempts add column if not exists generation_id uuid references ai_generations(id) on delete set null;
alter table summaries add column if not exists updated_at timestamp with time zone default now();
alter table flashcards add column if not exists updated_at timestamp with time zone default now();
alter table quizzes add column if not exists updated_at timestamp with time zone default now();
alter table document_chats add column if not exists citations jsonb not null default '[]'::jsonb;

create or replace function match_document_chunks(query_embedding vector(768), match_user_id uuid, match_document_id uuid default null,
  match_threshold double precision default 0.45, match_count integer default 8)
returns table (chunk_id uuid, document_id uuid, content text, page_number integer, chunk_index integer, metadata jsonb, similarity double precision)
language sql stable security definer set search_path = public as $$
  select dc.id, dc.document_id, dc.content, dc.page_number, dc.chunk_index, dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc where dc.user_id = match_user_id
    and (match_document_id is null or dc.document_id = match_document_id)
    and 1 - (dc.embedding <=> query_embedding) >= match_threshold
  order by dc.embedding <=> query_embedding limit greatest(1, least(match_count, 50));
$$;

create or replace function activate_ai_generation(target_generation_id uuid, owner_user_id uuid)
returns ai_generations language plpgsql security definer set search_path = public as $$
declare target ai_generations;
begin
  select * into target from ai_generations where id = target_generation_id and user_id = owner_user_id and status = 'completed' for update;
  if target.id is null then raise exception 'Generation not found or incomplete'; end if;
  update ai_generations set is_active = false, updated_at = now() where document_id = target.document_id and content_type = target.content_type and is_active;
  update ai_generations set is_active = true, updated_at = now() where id = target.id returning * into target;
  return target;
end; $$;

insert into storage.buckets (id, name, public) values ('study-documents', 'study-documents', false)
on conflict (id) do update set public = false;
