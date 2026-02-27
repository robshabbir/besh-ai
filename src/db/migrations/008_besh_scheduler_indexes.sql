-- Performance indexes for besh scheduler + check-ins

-- getDueReminders: filter by active=true AND next_fire_at <= now
create index if not exists idx_besh_reminders_due
  on besh_reminders(active, next_fire_at)
  where active = true;

-- hasCheckinToday: filter outbound conversations by user + date + meta
create index if not exists idx_besh_conversations_outbound_user
  on besh_conversations(user_id, direction, created_at)
  where direction = 'outbound';

-- getOnboardedUsersWithGoals: filter by onboarding_complete
create index if not exists idx_besh_users_onboarded
  on besh_users(onboarding_complete, created_at)
  where onboarding_complete = true;

-- Admin stats: count by status
create index if not exists idx_besh_goals_status
  on besh_goals(status);
