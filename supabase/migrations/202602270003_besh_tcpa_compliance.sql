-- TCPA Compliance: unsubscribed flag + STOP handling
alter table besh_users add column if not exists unsubscribed boolean default false;
create index if not exists idx_besh_users_unsubscribed on besh_users(unsubscribed) where unsubscribed = false;
