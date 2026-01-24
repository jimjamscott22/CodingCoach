-- Coding Coach Database Schema
-- Phase 4.1: Initial schema with files, reviews, suggestions tables

-- ====================================
-- TABLES
-- ====================================

-- Files table: stores code files submitted for review
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('javascript', 'python', 'java', 'c')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table: stores review results for files
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scores
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  score_breakdown JSONB NOT NULL,

  -- Content
  summary TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('javascript', 'python', 'java', 'c')),
  verbosity TEXT NOT NULL CHECK (verbosity IN ('quick', 'deep')),

  -- Metadata
  reviewed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suggestions table: stores individual suggestions from reviews
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,

  -- Suggestion data
  principle TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
  message TEXT NOT NULL,
  code_snippet TEXT,
  suggested_fix TEXT,
  line_range JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- INDEXES
-- ====================================

-- Files indexes
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_user_language ON files(user_id, language);

-- Reviews indexes
CREATE INDEX idx_reviews_file_id ON reviews(file_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_overall_score ON reviews(overall_score);
CREATE INDEX idx_reviews_user_created ON reviews(user_id, created_at DESC);

-- Suggestions indexes
CREATE INDEX idx_suggestions_review_id ON suggestions(review_id);
CREATE INDEX idx_suggestions_severity ON suggestions(severity);
CREATE INDEX idx_suggestions_principle ON suggestions(principle);

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can read own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can read own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Suggestions policies (read via reviews)
CREATE POLICY "Users can read suggestions of own reviews"
  ON suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM reviews
    WHERE reviews.id = suggestions.review_id
    AND reviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM reviews
    WHERE reviews.id = suggestions.review_id
    AND reviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete suggestions of own reviews"
  ON suggestions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM reviews
    WHERE reviews.id = suggestions.review_id
    AND reviews.user_id = auth.uid()
  ));

-- ====================================
-- VIEWS
-- ====================================

-- Review deltas view: compute score improvements over time
CREATE OR REPLACE VIEW review_deltas AS
WITH ranked_reviews AS (
  SELECT
    id,
    file_id,
    user_id,
    overall_score,
    score_breakdown,
    reviewed_at,
    LAG(overall_score) OVER (PARTITION BY file_id ORDER BY reviewed_at) AS prev_score,
    LAG(reviewed_at) OVER (PARTITION BY file_id ORDER BY reviewed_at) AS prev_reviewed_at
  FROM reviews
)
SELECT
  id,
  file_id,
  user_id,
  overall_score,
  prev_score,
  (overall_score - COALESCE(prev_score, overall_score)) AS score_delta,
  reviewed_at,
  prev_reviewed_at
FROM ranked_reviews;

-- ====================================
-- FUNCTIONS
-- ====================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update files.updated_at on UPDATE
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- COMMENTS (for documentation)
-- ====================================

COMMENT ON TABLE files IS 'Stores code files submitted by users for review';
COMMENT ON TABLE reviews IS 'Stores review results with scores and feedback for each file';
COMMENT ON TABLE suggestions IS 'Stores individual improvement suggestions for each review';
COMMENT ON VIEW review_deltas IS 'Computed view showing score improvements between consecutive reviews of the same file';

COMMENT ON COLUMN files.content IS 'The actual code content submitted for review';
COMMENT ON COLUMN reviews.score_breakdown IS 'JSONB object containing scores for all 7 evaluation principles';
COMMENT ON COLUMN suggestions.line_range IS 'JSONB object with start and end line numbers: {"start": 10, "end": 15}';
