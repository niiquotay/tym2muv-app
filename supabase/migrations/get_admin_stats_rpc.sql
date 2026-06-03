-- Migration for getting admin stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users INT;
  v_total_listings INT;
  v_total_ads INT;
  v_admin_users INT;
  v_agent_users INT;
  v_customer_users INT;
  v_rent_listings INT;
  v_sale_listings INT;
  v_total_clicks INT;
  v_total_impressions INT;
BEGIN
  SELECT count(*) INTO v_total_users FROM profiles;
  SELECT count(*) INTO v_total_listings FROM properties;
  SELECT count(*) INTO v_total_ads FROM monetization_ads;
  
  SELECT count(*) INTO v_admin_users FROM profiles WHERE role = 'Admin';
  SELECT count(*) INTO v_agent_users FROM profiles WHERE role = 'Agent';
  SELECT count(*) INTO v_customer_users FROM profiles WHERE role IN ('Customer', 'Tenant');
  
  SELECT count(*) INTO v_rent_listings FROM properties WHERE listing_type = 'Rent';
  SELECT count(*) INTO v_sale_listings FROM properties WHERE listing_type = 'Sale';
  
  SELECT COALESCE(sum(clicks), 0), COALESCE(sum(impressions), 0) 
  INTO v_total_clicks, v_total_impressions 
  FROM monetization_ads;
  
  RETURN jsonb_build_object(
    'totalUsers', v_total_users,
    'totalListings', v_total_listings,
    'totalAds', v_total_ads,
    'userRoles', jsonb_build_object('Admin', v_admin_users, 'Agent', v_agent_users, 'Customer', v_customer_users),
    'listingTypes', jsonb_build_object('Rent', v_rent_listings, 'Sale', v_sale_listings),
    'adPerformance', jsonb_build_object('totalClicks', v_total_clicks, 'totalImpressions', v_total_impressions)
  );
END;
$$;

-- Function to increment ad stats
CREATE OR REPLACE FUNCTION increment_ad_stat(ad_id uuid, field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF field = 'clicks' THEN
    UPDATE monetization_ads SET clicks = clicks + 1 WHERE id = ad_id;
  ELSIF field = 'impressions' THEN
    UPDATE monetization_ads SET impressions = impressions + 1 WHERE id = ad_id;
  END IF;
END;
$$;
