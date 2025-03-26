/*
  # Add Scanning and Verification Tables

  1. New Tables
    - `scans`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `scan_type` (text) - inbound, outbound, handoff
      - `scanned_by` (uuid, references auth.users)
      - `driver_id` (uuid, optional, references drivers)
      - `scan_location` (point, optional)
      - `created_at` (timestamp)
    
    - `order_status_logs`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `status` (text)
      - `notes` (text, optional)
      - `logged_by` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `order_issues`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `issue_type` (text) - missing_item, damaged, wrong_item, etc.
      - `description` (text)
      - `reported_by` (uuid, references auth.users)
      - `resolved_at` (timestamp, optional)
      - `resolution_notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and service role
*/

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  scan_type text NOT NULL CHECK (scan_type IN ('inbound', 'outbound', 'handoff')),
  scanned_by uuid REFERENCES auth.users(id),
  driver_id uuid REFERENCES drivers(id),
  scan_location point,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read scans they created"
  ON scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = scanned_by);

CREATE POLICY "Users can create scans"
  ON scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = scanned_by);

-- Create order_status_logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  logged_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read status logs"
  ON order_status_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create status logs"
  ON order_status_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = logged_by);

-- Create order_issues table
CREATE TABLE IF NOT EXISTS order_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  issue_type text NOT NULL CHECK (issue_type IN ('missing_item', 'damaged', 'wrong_item', 'other')),
  description text NOT NULL,
  reported_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read issues"
  ON order_issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create issues"
  ON order_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Add service role policies
CREATE POLICY "Service role can do everything with scans"
  ON scans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything with status logs"
  ON order_status_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything with issues"
  ON order_issues
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add indexes for better query performance
CREATE INDEX idx_scans_order_id ON scans(order_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_order_status_logs_order_id ON order_status_logs(order_id);
CREATE INDEX idx_order_status_logs_created_at ON order_status_logs(created_at DESC);
CREATE INDEX idx_order_issues_order_id ON order_issues(order_id);
CREATE INDEX idx_order_issues_created_at ON order_issues(created_at DESC);