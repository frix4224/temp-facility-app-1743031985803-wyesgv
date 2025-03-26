/*
  # Add Facility Note to Custom Price Quotes

  1. Changes
    - Add `facility_note` column to `custom_price_quotes` table
      - Optional text field for facility staff to add processing notes
      - Can be null if no special instructions are needed

  2. Purpose
    - Allow facilities to add processing notes when providing price quotes
    - Improve communication between facility staff and customers
*/

-- Add facility_note column to custom_price_quotes
ALTER TABLE custom_price_quotes 
ADD COLUMN IF NOT EXISTS facility_note text;