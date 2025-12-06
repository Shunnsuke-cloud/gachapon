-- migrations/001_init.sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  display_name VARCHAR(100),
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- gachas table
CREATE TABLE IF NOT EXISTS gachas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  thumbnail TEXT,
  description TEXT,
  author_id BIGINT UNSIGNED NULL,
  category VARCHAR(100),
  rarity_rates JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- gacha_items
CREATE TABLE IF NOT EXISTS gacha_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  gacha_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  rarity ENUM('N','R','SR','SSR') NOT NULL,
  img_src TEXT,
  weight INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gacha_id) REFERENCES gachas(id) ON DELETE CASCADE
);

-- gacha_rolls
CREATE TABLE IF NOT EXISTS gacha_rolls (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  gacha_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NULL,
  rarity ENUM('N','R','SR','SSR') NULL,
  meta JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (gacha_id) REFERENCES gachas(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES gacha_items(id) ON DELETE SET NULL
);

-- optional refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes if they do not already exist (safe for re-run)
-- MySQL doesn't support CREATE INDEX IF NOT EXISTS directly in older versions,
-- so use a conditional prepared statement to avoid duplicate-key errors.

SET @db = DATABASE();
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'gachas' AND index_name = 'idx_gacha_author') = 0,
  'CREATE INDEX idx_gacha_author ON gachas(author_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'gacha_rolls' AND index_name = 'idx_roll_user') = 0,
  'CREATE INDEX idx_roll_user ON gacha_rolls(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'gacha_items' AND index_name = 'idx_item_gacha') = 0,
  'CREATE INDEX idx_item_gacha ON gacha_items(gacha_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
