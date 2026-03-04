create extension if not exists "pgcrypto";

create table if not exists interest_tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists customers (
  id                uuid      primary key default gen_random_uuid(),
  name              text      not null,
  contact           text,
  favourite_product text      not null,
  created_at        timestamp not null default now()
);

create table if not exists customer_interests (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers(id)     on delete cascade,
  interest_tag_id uuid not null references interest_tags(id) on delete cascade,
  unique (customer_id, interest_tag_id)
);

create table if not exists campaigns (
  id                    uuid      primary key default gen_random_uuid(),
  batch_id              uuid      not null,
  theme                 text      not null,
  segment_description   text      not null,
  why_now               text      not null,
  message               text      not null,
  time_window           text,
  generated_from_period text      not null check (generated_from_period in ('all_time', '7d', '30d')),
  created_at            timestamp not null default now(),
  is_active             boolean   not null default true
);

create index if not exists idx_customers_name          on customers(name);
create index if not exists idx_customers_created_at    on customers(created_at desc);
create index if not exists idx_customer_interests_cust on customer_interests(customer_id);
create index if not exists idx_customer_interests_tag  on customer_interests(interest_tag_id);
create index if not exists idx_campaigns_batch_id      on campaigns(batch_id);
create index if not exists idx_campaigns_created_at    on campaigns(created_at desc);
create index if not exists idx_campaigns_is_active     on campaigns(is_active);