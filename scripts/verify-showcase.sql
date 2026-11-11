-- Read-only counts and original aggregate fingerprint; no account/identity data.
SELECT tenant, version, md5(payload::text) AS aggregate_fingerprint,
 (SELECT count(*) FROM jsonb_each(payload->'agencies')) AS agencies,
 (SELECT count(*) FROM jsonb_each(payload->'rebates')) AS rebates,
 (SELECT count(*) FROM jsonb_each(payload->'cases') c WHERE c.value->>'state' NOT IN ('SIMULATED_PAID','REJECTED','SUPERSEDED')) AS active_cases,
 (SELECT count(*) FROM jsonb_each(payload->'tasks') t WHERE t.value->>'state'='OPEN') AS open_tasks,
 (SELECT count(*) FROM nx_audit a WHERE a.tenant=s.tenant) AS audit_rows,
 (SELECT count(*) FROM nx_payment_items p WHERE p.tenant=s.tenant) AS paid_items
FROM nx_state s WHERE tenant IN ('lounge','lounge-showcase-v1') ORDER BY tenant;
