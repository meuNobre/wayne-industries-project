CREATE DATABASE IF NOT EXISTS wayne_industries;
USE wayne_industries;

-- =========================

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('employee', 'manager', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
CREATE TABLE resources (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================

CREATE TABLE activity_logs (
  id INT NOT NULL AUTO_INCREMENT,
  resource_id INT DEFAULT NULL,
  resource_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(50) DEFAULT NULL,
  new_status VARCHAR(50) DEFAULT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  old_value TEXT,
  new_value TEXT,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_resource_id (resource_id),
  KEY idx_created_at (created_at),
  CONSTRAINT fk_activity_resource
    FOREIGN KEY (resource_id)
    REFERENCES resources(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
