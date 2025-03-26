/*
  # Add Custom Price Quotes Feature

  1. New Tables
    - `custom_price_quotes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `item_name` (text)
      - `description` (text)
      - `image_url` (text[])
      - `suggested_price` (numeric)
      - `status` (text)
      - `urgency` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `custom_price_quotes` table
    - Add policies for authenticated users to:
      - Create their own quotes
      - Read their own quotes
    - Add policy for service role to manage all quotes

  3. Constraints
    - Valid status values
    - Valid urgency values
*/

CREATE TABLE IF NOT EXISTS custom_price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  item_name text NOT NULL,
  description text NOT NULL,
  image_url text[],
  suggested_price numeric(10,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined')),
  urgency text NOT NULL DEFAULT 'standard' CHECK (urgency IN ('standard', 'express')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_price_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies with unique names
CREATE POLICY "quotes_read_own_20250324"
  ON custom_price_quotes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "quotes_insert_own_20250324"
  ON custom_price_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quotes_service_role_20250324"
  ON custom_price_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes with unique names
CREATE INDEX IF NOT EXISTS custom_price_quotes_user_id_idx ON custom_price_quotes(user_id);
CREATE INDEX IF NOT EXISTS custom_price_quotes_status_idx ON custom_price_quotes(status);
CREATE INDEX IF NOT EXISTS custom_price_quotes_created_at_idx ON custom_price_quotes(created_at DESC);