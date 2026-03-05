-- Migration: 005_users_table.sql
-- Description: Creates the users table for backend JWT authentication

CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  password   text NOT NULL,          -- bcrypt hash
  name       text NOT NULL,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

