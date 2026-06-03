-- Analytics RPC functions

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    total_rev NUMERIC;
    ac_users INT;
    pend_approvals INT;
    tot_listings INT;
    admin_cnt INT;
    agent_cnt INT;
    cust_cnt INT;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_rev FROM payments WHERE status = 'completed';
    SELECT COUNT(*) INTO ac_users FROM profiles;
    SELECT COUNT(*) INTO pend_approvals FROM properties WHERE status = 'pending';
    SELECT COUNT(*) INTO tot_listings FROM properties;
    
    SELECT count(*) INTO admin_cnt FROM profiles WHERE role = 'Admin';
    SELECT count(*) INTO agent_cnt FROM profiles WHERE role = 'Agent';
    SELECT count(*) INTO cust_cnt FROM profiles WHERE role = 'Customer';

    RETURN json_build_object(
        'revenue', total_rev,
        'totalUsers', ac_users,
        'pendingApprovals', pend_approvals,
        'totalListings', tot_listings,
        'userRoles', json_build_object(
            'Admin', admin_cnt,
            'Agent', agent_cnt,
            'Customer', cust_cnt
        ),
        'adPerformance', json_build_object(
            'totalClicks', 1250, -- Mock data or compute from clicks table
            'totalImpressions', 45000
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_activity_daily()
RETURNS JSON AS $$
BEGIN
    -- Would return an array of {date, count} for signups
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_listing_stats()
RETURNS JSON AS $$
BEGIN
    -- Would return stats by category
    RETURN '{}'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
