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
  note TEXT,
  bird_pool_json TEXT
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

CREATE TABLE IF NOT EXISTS player_wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  coins INTEGER NOT NULL DEFAULT 0,
  gems INTEGER NOT NULL DEFAULT 0,
  fragments INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_weekly_check_ins (
  user_id TEXT NOT NULL REFERENCES users(id),
  week_key TEXT NOT NULL,
  signed_slots TEXT NOT NULL DEFAULT '',
  signed_today BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, week_key)
);

CREATE TABLE IF NOT EXISTS check_in_panel_rewards (
  panel_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  gems INTEGER NOT NULL DEFAULT 0,
  fragments INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (panel_id, slot_index)
);

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  catalog_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  purchased_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS shop_purchases_user_id_idx ON shop_purchases (user_id, purchased_at DESC);

CREATE TABLE IF NOT EXISTS player_level_progress (
  user_id TEXT NOT NULL REFERENCES users(id),
  level_suffix TEXT NOT NULL,
  cleared_at TEXT NOT NULL,
  PRIMARY KEY (user_id, level_suffix)
);

CREATE TABLE IF NOT EXISTS player_legacy_check_ins (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_friends (
  user_id TEXT NOT NULL REFERENCES users(id),
  friend_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, friend_user_id),
  CHECK (user_id <> friend_user_id)
);

CREATE TABLE IF NOT EXISTS player_private_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS player_private_messages_pair_idx
  ON player_private_messages (sender_id, receiver_id, created_at);

CREATE TABLE IF NOT EXISTS player_bird_upgrades (
  user_id TEXT NOT NULL REFERENCES users(id),
  bird_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  tier INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, bird_type)
);

CREATE TABLE IF NOT EXISTS player_slingshot_upgrades (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bird_designs (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  attack INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  tier_skills_json TEXT NOT NULL,
  preview_image_url TEXT NOT NULL,
  mechanism_tags_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS bird_submissions (
  id TEXT PRIMARY KEY,
  bird_design_id TEXT NOT NULL REFERENCES bird_designs(id),
  submitter_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  reviewer_id TEXT REFERENCES users(id),
  review_note TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT
);

TRUNCATE TABLE bird_submissions, bird_designs, player_private_messages, player_slingshot_upgrades, player_bird_upgrades, player_friends, shop_purchases, shop_items, check_in_panel_rewards, player_legacy_check_ins, player_level_progress, player_weekly_check_ins, player_wallets, ui_stretch_visual_templates, ui_button_templates, level_slot_assignments, favorites, comments, ratings, submissions, levels, users CASCADE;

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

INSERT INTO player_wallets (user_id, coins, gems, fragments, updated_at) VALUES
  ('player-1', 1280, 96, 32, '2026-06-03T00:00:00Z');

INSERT INTO player_friends (user_id, friend_user_id, created_at) VALUES
  ('player-1', 'designer-1', '2026-06-03T00:00:00Z'),
  ('designer-1', 'player-1', '2026-06-03T00:00:00Z');

INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at) VALUES
  ('player-1', 'basic', 1, 1, '2026-06-03T00:00:00Z'),
  ('player-1', 'split', 1, 1, '2026-06-03T00:00:00Z'),
  ('player-1', 'bomb', 1, 1, '2026-06-03T00:00:00Z');

INSERT INTO player_slingshot_upgrades (user_id, level, updated_at) VALUES
  ('player-1', 1, '2026-06-03T00:00:00Z');

INSERT INTO player_level_progress (user_id, level_suffix, cleared_at) VALUES
  ('player-1', 'level01', '2026-06-03T00:00:00Z');

INSERT INTO check_in_panel_rewards (panel_id, slot_index, coins, gems, fragments) VALUES
  ('player.home.checkIn', 1, 10, 0, 0),
  ('player.home.checkIn', 2, 15, 0, 0),
  ('player.home.checkIn', 3, 20, 0, 1),
  ('player.home.checkIn', 4, 30, 0, 0),
  ('player.home.checkIn', 5, 35, 0, 2),
  ('player.home.checkIn', 6, 40, 1, 0),
  ('player.home.checkIn', 7, 50, 2, 5);

INSERT INTO shop_items (id, name, description, price, currency, catalog_index, active, sort_order, created_at, updated_at) VALUES
  ('shop-scope', '精准瞄准镜', '下一次发射获得更稳定的落点辅助。', 120, 'coins', 0, TRUE, 1, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-coupon', '双倍奖励券', '本日通关金币奖励翻倍一次。', 8, 'gems', 0, TRUE, 2, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-steel', '钢羽皮肤', '为基础鸟解锁金属风格外观。', 260, 'coins', 0, TRUE, 3, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-starter', '新手补给包', '包含金币、钻石和一次关卡复活机会。', 18, 'gems', 0, TRUE, 4, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-booster', '爆裂推进器', '短时间提升冲击力，适合拆高塔关卡。', 420, 'coins', 1, TRUE, 1, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-feather', '流光羽饰', '稀有外观部件，提升测试服收藏感。', 24, 'gems', 1, TRUE, 2, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-crate', '工程物资箱', '解锁更多练习素材和试验配置。', 360, 'coins', 1, TRUE, 3, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
  ('shop-vip', '测试员礼包', '内含钻石、金币和限定称号。', 32, 'gems', 1, TRUE, 4, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z');
