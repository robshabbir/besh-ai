-- Subscription status - PAID is source of truth, not webhooks
alter table besh_users add column if not exists subscription_tier text default 'free'; -- free, pro, premium
alter table besh_users add column if not exists subscription_status text default 'active'; -- active, canceled, past_due
alter table besh_users add column if not exists subscription_expires_at timestamptz;
alter table besh_users add column if not exists stripe_customer_id text;
alter table besh_users add column if not exists stripe_subscription_id text;
alter table besh_users add column if not exists paid_at timestamptz; -- when they first paid
create index if not exists idx_besh_users_subscription on besh_users(subscription_tier, subscription_status);
