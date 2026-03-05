-- Besh Conversation Insights - For smarter AI and analytics
-- Stores intent, sentiment, and conversation metadata

CREATE TABLE IF NOT EXISTS besh_conversation_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES besh_users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES besh_conversations(id) ON DELETE CASCADE,
  
  -- Intent Detection
  intent VARCHAR(50) NOT NULL,
  intent_confidence DECIMAL(3,2),
  sentiment VARCHAR(20), -- positive, negative, neutral
  sentiment_score DECIMAL(3,2),
  
  -- Routing
  route VARCHAR(20), -- 'llm' or 'rule'
  handler VARCHAR(50),
  
  -- Message Metadata
  message_length INTEGER,
  response_time_ms INTEGER,
  llm_tokens_used INTEGER,
  
  -- Context
  goals_active_at_time INTEGER DEFAULT 0,
  time_of_day VARCHAR(20), -- morning, afternoon, evening, night
  day_of_week VARCHAR(10),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON besh_conversation_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_intent ON besh_conversation_insights(intent);
CREATE INDEX IF NOT EXISTS idx_insights_sentiment ON besh_conversation_insights(sentiment);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON besh_conversation_insights(created_at);

-- Enable RLS
ALTER TABLE besh_conversation_insights ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role full access" ON besh_conversation_insights
  FOR ALL USING (true) WITH CHECK (true);
