/*
  # Add Estimated Delivery Column to Orders Table

  1. Changes
    - Add `estimated_delivery` column to `orders` table
      - Type: timestamp with time zone
      - Can be null (some orders may not have estimated delivery times)
      - Default: null
    
  2. Purpose
    - Allow tracking of estimated delivery times for orders
    - Enable filtering and sorting orders by delivery time
    - Support scheduling and planning features
*/

-- Add estimated_delivery column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery 
ON orders(estimated_delivery);

-- Update trigger function to handle estimated delivery updates
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_status_update = now();
  
  -- Set estimated delivery time based on order type and status
  IF NEW.status = 'processing' AND NEW.estimated_delivery IS NULL THEN
    CASE NEW.type
      WHEN 'pickup' THEN
        -- For pickup orders, estimate 2 hours from now
        NEW.estimated_delivery = now() + interval '2 hours';
      WHEN 'delivery' THEN
        -- For delivery orders, estimate 4 hours from now
        NEW.estimated_delivery = now() + interval '4 hours';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;