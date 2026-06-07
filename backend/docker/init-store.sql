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

CREATE TABLE IF NOT EXISTS level_slot_assignments (
  id TEXT PRIMARY KEY,
  level_suffix TEXT NOT NULL UNIQUE,
  submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id),
  source_level_id TEXT NOT NULL REFERENCES levels(id),
  assigned_by_id TEXT NOT NULL REFERENCES users(id),
  assigned_at TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS ui_button_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_data_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'business',
  scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect',
  slice TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ui_button_templates_name_idx ON ui_button_templates(name);

CREATE TABLE IF NOT EXISTS ui_stretch_visual_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_data_url TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'smallPanel',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_kind_idx ON ui_stretch_visual_templates(kind);
CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_name_idx ON ui_stretch_visual_templates(name);

TRUNCATE TABLE ui_stretch_visual_templates, ui_button_templates, level_slot_assignments, favorites, comments, ratings, submissions, levels, users CASCADE;

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

INSERT INTO ui_button_templates (id, name, source_data_url, category, scaling_mode, slice, created_at, updated_at) VALUES
  ('btn-demo-primary', '演示按钮底座', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22360%22%20height%3D%22144%22%20viewBox%3D%220%200%20360%20144%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22button%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%237dd3fc%22%2F%3E%3Cstop%20offset%3D%220.52%22%20stop-color%3D%22%232563eb%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231e3a8a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22340%22%20height%3D%22124%22%20rx%3D%2234%22%20fill%3D%22url(%23button)%22%2F%3E%3Cpath%20d%3D%22M42%2025h276c18%200%2030%2012%2030%2030v6H12v-6c0-18%2012-30%2030-30z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.28)%22%2F%3E%3Cpath%20d%3D%22M42%20126h276c18%200%2030-12%2030-30v-10H12v10c0%2018%2012%2030%2030%2030z%22%20fill%3D%22rgba(15%2C23%2C42%2C0.2)%22%2F%3E%3C%2Fsvg%3E', 'business', 'fixedAspect', '{"top":24,"right":24,"bottom":24,"left":24}', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z');

INSERT INTO ui_stretch_visual_templates (id, name, source_data_url, kind, category, created_at, updated_at) VALUES
  ('panel-demo-surface', '演示面板背景', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22420%22%20height%3D%22280%22%20viewBox%3D%220%200%20420%20280%22%3E%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%22396%22%20height%3D%22256%22%20rx%3D%2228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%228%22%2F%3E%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%22364%22%20height%3D%2256%22%20rx%3D%2216%22%20fill%3D%22%23dbeafe%22%2F%3E%3Crect%20x%3D%2228%22%20y%3D%2296%22%20width%3D%22364%22%20height%3D%22156%22%20rx%3D%2220%22%20fill%3D%22%23f8fafc%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%224%22%2F%3E%3C%2Fsvg%3E', 'panel', 'levelBackground', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('pattern-demo-star', '演示图案', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22160%22%20height%3D%22160%22%20viewBox%3D%220%200%20160%20160%22%3E%3Ccircle%20cx%3D%2280%22%20cy%3D%2280%22%20r%3D%2256%22%20fill%3D%22%23fde68a%22%20stroke%3D%22%23f59e0b%22%20stroke-width%3D%228%22%2F%3E%3Cpath%20d%3D%22M80%2034l12%2028h29l-23%2018%209%2029-27-17-27%2017%209-29-23-18h29z%22%20fill%3D%22%23f97316%22%2F%3E%3C%2Fsvg%3E', 'pattern', 'button', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z');
