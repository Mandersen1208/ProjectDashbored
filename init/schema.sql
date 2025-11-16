-- JobHunter Database Schema
-- Clean initialization script for Docker PostgreSQL

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create application when job is inserted
CREATE OR REPLACE FUNCTION create_application_for_job()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO applications (job_id, status)
    VALUES (NEW.id, 'new');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track status changes in applications
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (application_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLES
-- ============================================

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
    display_name VARCHAR(255) NOT NULL,
    UNIQUE (city, state, country)
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
    external_id VARCHAR(100) NOT NULL UNIQUE,
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
    job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'new',
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_location ON jobs(location_id);
CREATE INDEX idx_jobs_date_found ON jobs(date_found);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trg_create_application
    AFTER INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION create_application_for_job();

CREATE TRIGGER trg_track_status
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION track_status_change();

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW vw_jobs_full AS
SELECT
    j.id,
    j.external_id,
    j.title,
    c.name AS company_name,
    l.display_name AS location,
    cat.name AS category,
    j.salary_min,
    j.salary_max,
    j.description,
    j.job_url,
    j.date_found,
    j.apply_by,
    COALESCE(a.status, 'new') AS status,
    a.date_applied,
    a.notes
FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN locations l ON j.location_id = l.id
    LEFT JOIN categories cat ON j.category_id = cat.id
    LEFT JOIN applications a ON j.id = a.job_id;
