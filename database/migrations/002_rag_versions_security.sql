-- StudyAI: RAG, AI generations, storage and token revocation.
-- Safe to run after the original schema on an existing Supabase project.

create extension if not exists "uuid-ossp";
create extension if not exists vector;

alter table users add column if not exists role text not null default 'user';
alter table users add column if not exists token_version integer not null default 0;

do $$ begin
  alter table users add constraint users_role_check
    check (role in ('user', 'admin'));
exception when duplicate_object then null;
end $$;

alter table documents add column if not exists index_status text not null default 'pending';
alter table documents add column if not exists index_error text;
alter table documents add column if not exists indexed_at timestamp with time zone;
alter table documents add column if not exists storage_path text;

do $$ begin
  alter table documents add constraint documents_index_status_check
    check (index_status in ('pending', 'processing', 'completed', 'failed'));
exception when duplicate_object then null;
end $$;

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

create index if not exists idx_document_chunks_document_id on document_chunks(document_id);
create index if not exists idx_document_chunks_user_id on document_chunks(user_id);
create index if not exists idx_document_chunks_user_document on document_chunks(user_id, document_id);
create index if not exists idx_document_chunks_embedding_hnsw
  on document_chunks using hnsw (embedding vector_cosine_ops);

create or replace function match_document_chunks(
  query_embedding vector(768),
  match_user_id uuid,
  match_document_id uuid default null,
  match_threshold double precision default 0.45,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  similarity double precision
)
language sql stable security definer set search_path = public
as $$
  select dc.id, dc.document_id, dc.content, dc.page_number, dc.chunk_index,
         dc.metadata, 1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.user_id = match_user_id
    and (match_document_id is null or dc.document_id = match_document_id)
    and 1 - (dc.embedding <=> query_embedding) >= match_threshold
  order by dc.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;

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

create unique index if not exists idx_one_active_generation
  on ai_generations(document_id, content_type) where is_active = true;
create index if not exists idx_ai_generations_owner on ai_generations(user_id, document_id);

alter table summaries add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table flashcards add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table quizzes add column if not exists generation_id uuid references ai_generations(id) on delete cascade;
alter table quiz_attempts add column if not exists generation_id uuid references ai_generations(id) on delete set null;
alter table summaries add column if not exists updated_at timestamp with time zone default now();
alter table flashcards add column if not exists updated_at timestamp with time zone default now();
alter table quizzes add column if not exists updated_at timestamp with time zone default now();
alter table document_chats add column if not exists citations jsonb not null default '[]'::jsonb;

create or replace function activate_ai_generation(target_generation_id uuid, owner_user_id uuid)
returns ai_generations
language plpgsql security definer set search_path = public
as $$
declare target ai_generations;
begin
  select * into target from ai_generations
  where id = target_generation_id and user_id = owner_user_id and status = 'completed'
  for update;
  if target.id is null then raise exception 'Generation not found or incomplete'; end if;
  update ai_generations set is_active = false, updated_at = now()
    where document_id = target.document_id and content_type = target.content_type and is_active = true;
  update ai_generations set is_active = true, updated_at = now()
    where id = target.id returning * into target;
  return target;
end;
$$;

-- Backfill one legacy generation per document/content type without duplicating reruns.
insert into ai_generations (user_id, document_id, content_type, version_number, status, source, is_active)
select d.user_id, d.id, 'summary', 1, 'completed', 'legacy', true
from documents d where exists (select 1 from summaries s where s.document_id = d.id)
on conflict (document_id, content_type, version_number) do nothing;
update summaries s set generation_id = g.id
from ai_generations g where s.document_id = g.document_id and g.content_type = 'summary'
  and g.version_number = 1 and s.generation_id is null;

insert into ai_generations (user_id, document_id, content_type, version_number, status, source, is_active)
select d.user_id, d.id, 'flashcards', 1, 'completed', 'legacy', true
from documents d where exists (select 1 from flashcards f where f.document_id = d.id)
on conflict (document_id, content_type, version_number) do nothing;
update flashcards f set generation_id = g.id
from ai_generations g where f.document_id = g.document_id and g.content_type = 'flashcards'
  and g.version_number = 1 and f.generation_id is null;

insert into ai_generations (user_id, document_id, content_type, version_number, status, source, is_active)
select d.user_id, d.id, 'quiz', 1, 'completed', 'legacy', true
from documents d where exists (select 1 from quizzes q where q.document_id = d.id)
on conflict (document_id, content_type, version_number) do nothing;
update quizzes q set generation_id = g.id
from ai_generations g where q.document_id = g.document_id and g.content_type = 'quiz'
  and g.version_number = 1 and q.generation_id is null;

insert into storage.buckets (id, name, public)
values ('study-documents', 'study-documents', false)
on conflict (id) do update set public = false;
