/*
  # Add Order Status Tracking

  1. Changes
    - Add trigger to track order status changes
    - Create order_status_history table
    - Add policies and indexes for efficient querying
    
  2. Purpose
    - Track all status changes for orders
    - Record timestamps and users who made changes
    - Enable audit trail for order processing
*/

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  notes text
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at 
ON order_status_history(changed_at DESC);

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read status history"
  ON order_status_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can do everything"
  ON order_status_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to handle status changes
CREATE OR REPLACE FUNCTION handle_order_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track actual status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Insert into history table
    INSERT INTO order_status_history (
      order_id,
      previous_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE NEW.status
        WHEN 'processing' THEN 'Order moved to processing'
        WHEN 'shipped' THEN 'Order marked as shipped'
        WHEN 'delivered' THEN 'Order delivered successfully'
        WHEN 'cancelled' THEN 'Order cancelled'
        ELSE 'Status updated'
      END
    );

    -- Update last_status_update timestamp
    NEW.last_status_update = now();

    -- Handle specific status transitions
    CASE NEW.status
      WHEN 'processing' THEN
        -- Set estimated delivery time if not set
        IF NEW.estimated_delivery IS NULL THEN
          NEW.estimated_delivery = 
            CASE NEW.type
              WHEN 'pickup' THEN now() + interval '2 hours'
              WHEN 'delivery' THEN now() + interval '4 hours'
            END;
        END IF;
      WHEN 'cancelled' THEN
        -- Clear estimated delivery time for cancelled orders
        NEW.estimated_delivery = NULL;
      ELSE
        -- Keep existing estimated_delivery
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS order_state_transition_trigger ON orders;
CREATE TRIGGER order_state_transition_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_state_transition();