CREATE TABLE IF NOT EXISTS nx_state (
 tenant text PRIMARY KEY,
 version bigint NOT NULL DEFAULT 0,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS nx_audit (
 tenant text NOT NULL REFERENCES nx_state(tenant),
 sequence bigint NOT NULL,
 event_id uuid NOT NULL,
 event jsonb NOT NULL,
 PRIMARY KEY (tenant, sequence),
 UNIQUE (tenant,event_id)
);
CREATE TABLE IF NOT EXISTS nx_payment_items (
 tenant text NOT NULL REFERENCES nx_state(tenant),
 rebate_id text NOT NULL,
 receipt_id text NOT NULL,
 PRIMARY KEY (tenant,rebate_id)
);
CREATE OR REPLACE FUNCTION nx_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit events are append-only'; END;
$$;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='nx_audit_immutable_trigger' AND tgrelid='nx_audit'::regclass) THEN
  CREATE TRIGGER nx_audit_immutable_trigger BEFORE UPDATE OR DELETE ON nx_audit
  FOR EACH ROW EXECUTE FUNCTION nx_audit_immutable();
 END IF;
END $$;
