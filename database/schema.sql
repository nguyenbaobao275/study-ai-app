-- StudyAI database schema for Supabase PostgreSQL
-- Chạy toàn bộ file này trong Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

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
  created_at timestamp with time zone default now()
);

create table if not exists summaries (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  summary_type text default 'ai_summary',
  content text not null,
  created_at timestamp with time zone default now()
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

create index if not exists idx_subjects_user_id on subjects(user_id);
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_summaries_document_id on summaries(document_id);
create index if not exists idx_flashcards_document_id on flashcards(document_id);
create index if not exists idx_quizzes_document_id on quizzes(document_id);
