-- Migration to add increment_voucher_usage RPC function
-- This function atomically increments the used_count of a voucher.

CREATE OR REPLACE FUNCTION increment_voucher_usage(v_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vouchers
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION increment_voucher_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_voucher_usage(UUID) TO service_role;
