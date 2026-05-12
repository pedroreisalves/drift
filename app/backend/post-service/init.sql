CREATE DATABASE post_db;

\connect post_db

CREATE TABLE posts (
	id UUID PRIMARY KEY
	,client_id UUID NOT NULL
	,client_name TEXT NOT NULL
	,title TEXT NOT NULL
	,body TEXT NOT NULL
	,tags TEXT [] NOT NULL DEFAULT '{}'
	,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

CREATE INDEX posts_client_id_idx ON posts (client_id);

CREATE INDEX posts_created_at_idx ON posts (created_at DESC);
