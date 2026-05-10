CREATE DATABASE post_db;

\connect post_db

CREATE TABLE posts (
    id           UUID PRIMARY KEY,
    client_id    UUID        NOT NULL,
    client_name  TEXT        NOT NULL,
    title        TEXT        NOT NULL,
    body         TEXT        NOT NULL,
    tags         TEXT[]      NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX posts_client_id_idx  ON posts (client_id);
CREATE INDEX posts_created_at_idx ON posts (created_at DESC);

CREATE DATABASE tag_db;

\connect tag_db

CREATE TABLE tagging_process (
    id      UUID PRIMARY KEY,
    post_id      UUID NOT NULL,
    retry_count  INTEGER     NOT NULL DEFAULT 0,
    title        TEXT        NOT NULL,
    body         TEXT        NOT NULL,
    status       TEXT        NOT NULL,
    reason       TEXT        NULL,
    tags         TEXT[]      NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tagging_process_status_idx ON tagging_process (status);
CREATE INDEX tagging_process_post_id_created_at_idx ON tagging_process (post_id, created_at DESC);
