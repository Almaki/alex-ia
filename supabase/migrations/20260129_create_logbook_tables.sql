-- Create enum for activity types
CREATE TYPE activity_type AS ENUM (
  'flight',
  'sim',
  'ground',
  'standby',
  'off',
  'vacation',
  'training',
  'medical',
  'other'
);

-- Create roster_uploads table
CREATE TABLE roster_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create logbook_entries table
CREATE TABLE logbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roster_upload_id UUID REFERENCES roster_uploads(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL,
  activity_type activity_type NOT NULL DEFAULT 'other',
  check_in TIME,
  check_out TIME,
  hotel TEXT,
  notes TEXT,
  crew_captain TEXT,
  crew_first_officer TEXT,
  crew_purser TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

-- Create logbook_flights table
CREATE TABLE logbook_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  flight_number TEXT,
  aircraft_type TEXT,
  aircraft_registration TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  std TIME,
  sta TIME,
  block_off TIME,
  block_on TIME,
  block_hours NUMERIC(5, 2),
  flight_hours NUMERIC(5, 2),
  is_pf BOOLEAN DEFAULT FALSE,
  is_night BOOLEAN DEFAULT FALSE,
  is_cat_ii_iii BOOLEAN DEFAULT FALSE,
  approach_type TEXT,
  remarks TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_roster_uploads_user_id ON roster_uploads(user_id);
CREATE INDEX idx_roster_uploads_status ON roster_uploads(status);
CREATE INDEX idx_roster_uploads_month_year ON roster_uploads(month, year);

CREATE INDEX idx_logbook_entries_user_id ON logbook_entries(user_id);
CREATE INDEX idx_logbook_entries_entry_date ON logbook_entries(entry_date);
CREATE INDEX idx_logbook_entries_user_date ON logbook_entries(user_id, entry_date);
CREATE INDEX idx_logbook_entries_activity_type ON logbook_entries(activity_type);

CREATE INDEX idx_logbook_flights_entry_id ON logbook_flights(entry_id);
CREATE INDEX idx_logbook_flights_aircraft_type ON logbook_flights(aircraft_type);
CREATE INDEX idx_logbook_flights_origin ON logbook_flights(origin);
CREATE INDEX idx_logbook_flights_destination ON logbook_flights(destination);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_logbook_entries_updated_at
  BEFORE UPDATE ON logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE roster_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_flights ENABLE ROW LEVEL SECURITY;

-- Roster uploads policies
CREATE POLICY "Users can view their own roster uploads"
  ON roster_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roster uploads"
  ON roster_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roster uploads"
  ON roster_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roster uploads"
  ON roster_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Logbook entries policies
CREATE POLICY "Users can view their own logbook entries"
  ON logbook_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own logbook entries"
  ON logbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logbook entries"
  ON logbook_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logbook entries"
  ON logbook_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Logbook flights policies
CREATE POLICY "Users can view flights for their entries"
  ON logbook_flights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM logbook_entries
      WHERE logbook_entries.id = logbook_flights.entry_id
      AND logbook_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create flights for their entries"
  ON logbook_flights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM logbook_entries
      WHERE logbook_entries.id = logbook_flights.entry_id
      AND logbook_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flights for their entries"
  ON logbook_flights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM logbook_entries
      WHERE logbook_entries.id = logbook_flights.entry_id
      AND logbook_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flights for their entries"
  ON logbook_flights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM logbook_entries
      WHERE logbook_entries.id = logbook_flights.entry_id
      AND logbook_entries.user_id = auth.uid()
    )
  );

-- Create view for logbook statistics
CREATE OR REPLACE VIEW logbook_user_stats AS
SELECT
  e.user_id,
  COUNT(DISTINCT f.id) AS total_flights,
  COALESCE(SUM(f.block_hours), 0) AS total_block_hours,
  COALESCE(SUM(f.flight_hours), 0) AS total_flight_hours,
  COUNT(DISTINCT f.id) FILTER (WHERE f.is_night = TRUE) AS night_flights,
  COUNT(DISTINCT f.id) FILTER (WHERE f.is_pf = TRUE) AS pf_flights
FROM logbook_entries e
LEFT JOIN logbook_flights f ON f.entry_id = e.id
GROUP BY e.user_id;

-- Grant access to the view
GRANT SELECT ON logbook_user_stats TO authenticated;

-- Add RLS policy for the view
CREATE POLICY "Users can view their own stats"
  ON logbook_user_stats FOR SELECT
  USING (auth.uid() = user_id);
