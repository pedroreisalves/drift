CREATE DATABASE analytics_db;

\connect analytics_db

CREATE TABLE analytics_log (
	id UUID PRIMARY KEY
	,event_type VARCHAR NOT NULL
	,post_id UUID
	,client_id UUID NOT NULL
	,TIMESTAMP TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

CREATE INDEX analytics_log_event_post_time_idx
  ON analytics_log (event_type, post_id, timestamp DESC);

CREATE TABLE deleted_posts (
	post_id UUID PRIMARY KEY
	,deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

CREATE TABLE engagement_state (
	post_id UUID PRIMARY KEY
	,last_signal VARCHAR NOT NULL
	,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
