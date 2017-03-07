-- Up
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  login_type TEXT NOT NULL,
  login_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES users(id);
CREATE UNIQUE INDEX unique_user ON users(login_type, login_id);

-- Down
ALTER TABLE messages DROP COLUMN user_id;
DROP TABLE users;
