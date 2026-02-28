-- Rate limiting: track messages per user
alter table besh_users add column if not exists messages_today integer default 0;
alter table besh_users add column if not exists last_message_date date default current_date;
alter table besh_users add column if not exists messages_this_month integer default 0;
alter table besh_users add column if not exists month_start_date date default date_trunc('month', current_date);
create index if not exists idx_besh_users_rate on besh_users(id, last_message_date);
