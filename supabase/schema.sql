-- =========================================================
-- Badminton Match & Leaderboard Tracker Database Schema
-- Run this script inside the Supabase SQL Editor
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Members Table
-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  avatar_color VARCHAR(20) DEFAULT '#10b981',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration if table already exists
ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Match Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE DEFAULT CURRENT_DATE,
  location VARCHAR(100) DEFAULT 'Local Court',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration if table already exists
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  court_number INT DEFAULT 1,
  team_a_player1_id UUID REFERENCES members(id) ON DELETE CASCADE,
  team_a_player2_id UUID REFERENCES members(id) ON DELETE CASCADE,
  team_b_player1_id UUID REFERENCES members(id) ON DELETE CASCADE,
  team_b_player2_id UUID REFERENCES members(id) ON DELETE CASCADE,
  score_team_a INT DEFAULT 0,
  score_team_b INT DEFAULT 0,
  winning_team VARCHAR(10) DEFAULT 'PENDING' CHECK (winning_team IN ('TEAM_A', 'TEAM_B', 'PENDING')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 5. Open RLS Policies for Anon Public Access (Free Tier friendly)
DROP POLICY IF EXISTS "Public access to members" ON members;
CREATE POLICY "Public access to members" ON members
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to sessions" ON sessions;
CREATE POLICY "Public access to sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to matches" ON matches;
CREATE POLICY "Public access to matches" ON matches
  FOR ALL USING (true) WITH CHECK (true);

-- 6. View for Daily & All-Time Player Statistics
CREATE OR REPLACE VIEW player_stats AS
SELECT 
  m.id AS member_id,
  m.name,
  m.nickname,
  m.avatar_color,
  m.avatar_url,
  COUNT(DISTINCT match_participants.match_id) AS total_matches,
  COUNT(CASE WHEN match_participants.is_winner THEN 1 END) AS wins,
  COUNT(CASE WHEN NOT match_participants.is_winner AND match_participants.winning_team != 'PENDING' THEN 1 END) AS losses,
  CASE 
    WHEN COUNT(DISTINCT match_participants.match_id) = 0 THEN 0 
    ELSE ROUND((COUNT(CASE WHEN match_participants.is_winner THEN 1 END)::NUMERIC / COUNT(DISTINCT match_participants.match_id)::NUMERIC) * 100, 1)
  END AS win_rate,
  COALESCE(SUM(match_participants.points_scored), 0) AS total_points_scored,
  COALESCE(SUM(match_participants.points_conceded), 0) AS total_points_conceded
FROM members m
LEFT JOIN (
  SELECT 
    id AS match_id, 
    team_a_player1_id AS member_id, 
    (winning_team = 'TEAM_A') AS is_winner, 
    winning_team,
    score_team_a AS points_scored,
    score_team_b AS points_conceded
  FROM matches
  WHERE winning_team != 'PENDING'
  UNION ALL
  SELECT 
    id AS match_id, 
    team_a_player2_id AS member_id, 
    (winning_team = 'TEAM_A') AS is_winner, 
    winning_team,
    score_team_a AS points_scored,
    score_team_b AS points_conceded
  FROM matches
  WHERE winning_team != 'PENDING'
  UNION ALL
  SELECT 
    id AS match_id, 
    team_b_player1_id AS member_id, 
    (winning_team = 'TEAM_B') AS is_winner, 
    winning_team,
    score_team_b AS points_scored,
    score_team_a AS points_conceded
  FROM matches
  WHERE winning_team != 'PENDING'
  UNION ALL
  SELECT 
    id AS match_id, 
    team_b_player2_id AS member_id, 
    (winning_team = 'TEAM_B') AS is_winner, 
    winning_team,
    score_team_b AS points_scored,
    score_team_a AS points_conceded
  FROM matches
  WHERE winning_team != 'PENDING'
) match_participants ON m.id = match_participants.member_id
GROUP BY m.id, m.name, m.nickname, m.avatar_color;

-- 7. Seed Initial Players (Example squad from specification)
INSERT INTO members (name, nickname, avatar_color)
VALUES 
  ('Chethan', 'Smash Master', '#10b981'),
  ('Ganja', 'Drop Specialist', '#3b82f6'),
  ('Suhas', 'Net Wizard', '#f59e0b'),
  ('Gay Prateek', 'Rocket Serve', '#ec4899'),
  ('Chandan', 'Court Beast', '#8b5cf6'),
  ('Royden', 'Iron Wall', '#06b6d4')
ON CONFLICT DO NOTHING;

-- 8. High-Performance Database Indexes (Scalable for thousands of matches)
CREATE INDEX IF NOT EXISTS idx_matches_session_id ON matches(session_id);
CREATE INDEX IF NOT EXISTS idx_matches_round_number ON matches(round_number);
CREATE INDEX IF NOT EXISTS idx_matches_winning_team ON matches(winning_team);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_team_a_p1 ON matches(team_a_player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_a_p2 ON matches(team_a_player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_p1 ON matches(team_b_player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_p2 ON matches(team_b_player2_id);

