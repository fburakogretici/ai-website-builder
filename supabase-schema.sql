-- Websites Table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  html_content TEXT NOT NULL,
  sections JSONB DEFAULT '{}'::jsonb,
  analysis JSONB,
  original_prompt TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, archived
  custom_domain TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own websites"
  ON websites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own websites"
  ON websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites"
  ON websites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites"
  ON websites FOR DELETE
  USING (auth.uid() = user_id);

-- Public access for published sites
CREATE POLICY "Anyone can view published websites"
  ON websites FOR SELECT
  USING (status = 'active');

-- Indexes
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_slug ON websites(slug);
CREATE INDEX idx_websites_status ON websites(status);

-- Website Edits History (for versioning)
CREATE TABLE IF NOT EXISTS website_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  previous_content TEXT,
  new_content TEXT,
  edit_type TEXT, -- manual, ai-regenerate, ai-refine
  prompt TEXT, -- if AI edit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_website_edits_website_id ON website_edits(website_id);

-- Comments
COMMENT ON TABLE websites IS 'User-generated static websites with AI';
COMMENT ON COLUMN websites.sections IS 'Parsed HTML sections for granular editing';
COMMENT ON COLUMN websites.analysis IS 'Original AI analysis data';
COMMENT ON COLUMN websites.slug IS 'URL-friendly identifier (e.g., my-business-site)';
COMMENT ON TABLE website_edits IS 'Version history of all website edits';
