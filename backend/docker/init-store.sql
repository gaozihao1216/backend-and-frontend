CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  admin_level TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS levels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  data TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  rejection_reason TEXT,
  average_rating DOUBLE PRECISION NOT NULL,
  rating_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  submitter_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  reviewer_id TEXT REFERENCES users(id),
  review_note TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  player_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (level_id, player_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (level_id, user_id)
);

CREATE TABLE IF NOT EXISTS ui_button_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_data_url TEXT NOT NULL,
  scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect',
  slice TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ui_button_templates_name_idx ON ui_button_templates(name);

TRUNCATE TABLE ui_button_templates, favorites, comments, ratings, submissions, levels, users CASCADE;

INSERT INTO users (id, username, display_name, role, admin_level, created_at, updated_at) VALUES
  ('player-1', 'local-player-0000001', 'Player One', 'player', NULL, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('designer-1', 'local-designer-0000002', 'Designer One', 'designer', NULL, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('admin-1', 'local-admin-0000003', 'Admin One', 'admin', 'standard', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('admin-director-1', 'local-admin-director-0000004', 'Director Admin', 'admin', 'director', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z');

INSERT INTO levels (
  id, title, description, tags, data, author_id, status, rejection_reason,
  average_rating, rating_count, created_at, updated_at, published_at
) VALUES
  (
    'level-1',
    'Starter Siege',
    'Published sample level for profile and rating demos.',
    'beginner,puzzle',
    '{"world":{"width":1600.0,"height":900.0,"gravity":1.0},"ground":{"type":"line","points":[{"x":0.0,"y":760.0},{"x":1600.0,"y":760.0}]},"terrain":null,"birdInventory":{"basic":3},"obstacles":[{"id":"obstacle-1","material":"wood","position":{"x":960.0,"y":650.0},"size":{"width":120.0,"height":30.0},"angle":0.0}],"enemies":[{"id":"enemy-1","type":"pig","position":{"x":1020.0,"y":610.0},"size":{"width":48.0,"height":48.0}}]}',
    'designer-1',
    'published',
    NULL,
    4.0,
    1,
    '2026-06-03T00:00:00Z',
    '2026-06-03T00:00:00Z',
    '2026-06-03T00:00:00Z'
  ),
  (
    'level-2',
    'Pending Glass Tower',
    'Pending review sample for admin demo.',
    'hard',
    '{"world":{"width":1600.0,"height":900.0,"gravity":1.0},"ground":{"type":"line","points":[{"x":0.0,"y":760.0},{"x":1600.0,"y":760.0}]},"terrain":null,"birdInventory":{"basic":3},"obstacles":[{"id":"obstacle-1","material":"wood","position":{"x":960.0,"y":650.0},"size":{"width":120.0,"height":30.0},"angle":0.0}],"enemies":[{"id":"enemy-1","type":"pig","position":{"x":1020.0,"y":610.0},"size":{"width":48.0,"height":48.0}}]}',
    'designer-1',
    'pending_review',
    NULL,
    0.0,
    0,
    '2026-06-03T00:00:00Z',
    '2026-06-03T00:00:00Z',
    NULL
  );

INSERT INTO submissions (
  id, level_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
) VALUES
  (
    'submission-1',
    'level-1',
    'designer-1',
    'approved',
    'admin-1',
    'Published as baseline sample.',
    '2026-06-03T00:00:00Z',
    '2026-06-03T00:00:00Z'
  ),
  (
    'submission-2',
    'level-2',
    'designer-1',
    'pending_review',
    NULL,
    NULL,
    '2026-06-03T00:00:00Z',
    NULL
  );

INSERT INTO ratings (id, level_id, player_id, score, created_at, updated_at) VALUES
  ('rating-1', 'level-1', 'player-1', 4, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z');

INSERT INTO comments (id, level_id, user_id, content, created_at) VALUES
  ('comment-1', 'level-1', 'player-1', 'Solid tutorial pacing.', '2026-06-03T00:00:00Z');
