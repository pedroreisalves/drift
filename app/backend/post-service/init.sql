CREATE DATABASE post_db;

\connect post_db

CREATE TABLE posts (
	id UUID PRIMARY KEY
	,client_id UUID NOT NULL
	,client_name TEXT NOT NULL
	,title TEXT NOT NULL
	,body TEXT NOT NULL
	,tags TEXT [] NOT NULL DEFAULT '{}'
	,engagement_drop_flagged BOOLEAN NOT NULL DEFAULT FALSE
	,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

CREATE INDEX posts_client_id_idx ON posts (client_id);

CREATE INDEX posts_created_at_idx ON posts (created_at DESC);

CREATE TABLE post_featured (
	post_id     UUID        NOT NULL PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE
	,featured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

CREATE TABLE post_locks (
	post_id   UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE
	,lock_type TEXT        NOT NULL
	,locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	,PRIMARY KEY (post_id, lock_type)
	);
