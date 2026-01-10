-- JobHunter Database Schema
-- Clean initialization script for Docker PostgreSQL

-- ============================================
-- TABLES
-- ============================================

-- Roles table (defined early for FK references)
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table with role_id foreign key
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id BIGINT NOT NULL REFERENCES roles(id) DEFAULT 1,
    enabled BOOLEAN DEFAULT TRUE,
    account_non_expired BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(2) NOT NULL,
    display_name VARCHAR(255) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Categories table
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tag VARCHAR(100) NOT NULL UNIQUE
);

-- Jobs table
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    company_id BIGINT REFERENCES companies(id),
    location_id BIGINT REFERENCES locations(id),
    category_id BIGINT REFERENCES categories(id),
    salary_min NUMERIC(12,2),
    salary_max NUMERIC(12,2),
    description TEXT,
    job_url TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'adzuna',
    created_date TIMESTAMP NOT NULL,
    date_found TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    apply_by DATE,
    UNIQUE (external_id, source)
);

-- Applications table
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    job_url TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'applied',
    date_applied DATE,
    resume_version VARCHAR(100),
    cover_letter_version VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status history table
CREATE TABLE status_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Saved queries table for scheduled job searches (moved after users table)
CREATE TABLE saved_queries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    query VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    distance INTEGER DEFAULT 25,
    results_per_page INTEGER DEFAULT 100,
    full_time INTEGER DEFAULT 1,
    excluded_terms VARCHAR(500),
    date_from DATE,
    date_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_run_at TIMESTAMP,
    new_jobs_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, query, location)
);

-- Refresh tokens table (unchanged)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_location ON jobs(location_id);
CREATE INDEX idx_jobs_date_found ON jobs(date_found);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_saved_queries_active ON saved_queries(is_active);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_locations_latitude ON locations(latitude);
CREATE INDEX idx_locations_longitude ON locations(longitude);

-- ============================================
-- TRIGGERS
-- ============================================
-- (Removed old triggers dependent on deprecated functions)

-- ============================================
-- VIEWS
-- ============================================
-- (Removed old view depending on applications.job_id)

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_USER', 'Standard user with basic access'),
    ('ROLE_ADMIN', 'Administrator with full access');

-- Insert default admin user (password: admin123)
-- BCrypt hash generated with strength 10: $2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id)
VALUES (
    'admin',
    'admin@projectdashbored.com',
    '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6',
    'System',
    'Administrator',
    (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
);
