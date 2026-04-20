-- VCL AI Readiness Assessment — MySQL Schema
-- Run this once on your Hostinger MySQL database.

SET FOREIGN_KEY_CHECKS = 0;

-- ─── dimensions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dimensions (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    dimension_key VARCHAR(255) NOT NULL UNIQUE,
    title         VARCHAR(255) NOT NULL,
    short_title   VARCHAR(255) NOT NULL,
    description   TEXT         NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── questions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    dimension_id  VARCHAR(36)  NOT NULL,
    question_key  VARCHAR(255) NOT NULL,
    text          TEXT         NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    question_type VARCHAR(20)  NOT NULL DEFAULT 'rating',
    tags          JSON,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dimension_id) REFERENCES dimensions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── question_options ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_options (
    id            VARCHAR(36)   NOT NULL PRIMARY KEY,
    question_id   VARCHAR(36)   NOT NULL,
    label         VARCHAR(255)  NOT NULL,
    grade         DECIMAL(5,2)  NOT NULL DEFAULT 0,
    display_order INT           NOT NULL DEFAULT 0,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── participants ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
    id                 VARCHAR(36)  NOT NULL PRIMARY KEY,
    domain             VARCHAR(255) NOT NULL,
    original_website   VARCHAR(500),
    full_name          VARCHAR(255),
    email              VARCHAR(255),
    phone_number       VARCHAR(50),
    consent_to_contact TINYINT(1)   DEFAULT 0,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── assessment_results ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_results (
    id             VARCHAR(36)   NOT NULL PRIMARY KEY,
    participant_id VARCHAR(36),
    overall_score  DECIMAL(6,2),
    level_number   INT,
    level_label    VARCHAR(255),
    scores         JSON,
    agent_result   JSON,
    answers        JSON,
    pdf_url        VARCHAR(500),
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
