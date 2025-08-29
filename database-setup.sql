-- BBY Service Menu Manager Database Setup Script
-- This script creates the complete database structure

-- Connect to PostgreSQL and create database
-- Run this script as: psql -U postgres -f database-setup.sql

-- Create database (run this separately if needed)
-- CREATE DATABASE bby_service_menu;

-- Connect to the database
\c bby_service_menu;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 2. Service Sections Table
CREATE TABLE service_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique order per user
    UNIQUE(user_id, display_order),
    UNIQUE(user_id, name)
);

-- 3. Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES service_sections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique order within each section
    UNIQUE(section_id, display_order),
    UNIQUE(section_id, name)
);

-- 4. Service Packages Table
CREATE TABLE service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES service_sections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
    total_duration_minutes INTEGER NOT NULL CHECK (total_duration_minutes > 0),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique order within each section
    UNIQUE(section_id, display_order),
    UNIQUE(section_id, name)
);

-- 5. Package Services Junction Table
CREATE TABLE package_services (
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (package_id, service_id)
);

-- 6. Menu Versions Table
CREATE TABLE menu_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    UNIQUE(user_id, version_number)
);

-- 7. Change Log Table
CREATE TABLE change_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_id UUID REFERENCES menu_versions(id),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id)
);

-- Create Indexes for Performance
CREATE INDEX idx_sections_user_order ON service_sections(user_id, display_order);
CREATE INDEX idx_sections_user_name ON service_sections(user_id, name);

CREATE INDEX idx_services_section_order ON services(section_id, display_order);
CREATE INDEX idx_services_section_active ON services(section_id, is_active);
CREATE INDEX idx_services_section_name ON services(section_id, name);

CREATE INDEX idx_packages_section_order ON service_packages(section_id, display_order);
CREATE INDEX idx_packages_section_active ON service_packages(section_id, is_active);
CREATE INDEX idx_packages_section_name ON service_packages(section_id, name);

CREATE INDEX idx_package_services_package ON package_services(package_id);
CREATE INDEX idx_package_services_service ON package_services(service_id);

CREATE INDEX idx_menu_versions_user ON menu_versions(user_id);
CREATE INDEX idx_change_log_user ON change_log(user_id);
CREATE INDEX idx_change_log_version ON change_log(version_id);
CREATE INDEX idx_change_log_table_record ON change_log(table_name, record_id);

-- Create Triggers for Auto-updating Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_sections_updated_at BEFORE UPDATE ON service_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data
-- Create a sample user
INSERT INTO users (email, business_name) VALUES 
('demo@bbysalon.com', 'BBY Beauty Salon');

-- Get the user ID for sample data
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@bbysalon.com';
    
    -- Insert sample sections
    INSERT INTO service_sections (user_id, name, description, display_order) VALUES
    (demo_user_id, 'Hair Services', 'Professional hair styling and treatments', 1),
    (demo_user_id, 'Facial Treatments', 'Rejuvenating facial care services', 2),
    (demo_user_id, 'Nail Care', 'Beautiful nails with professional care', 3);
    
    -- Insert sample services for Hair Services
    INSERT INTO services (section_id, name, description, duration_minutes, price_cents, display_order) VALUES
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Haircut & Style', 'Professional haircut with styling and blowout', 60, 7500, 1),
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Hair Color', 'Full hair coloring service', 120, 15000, 2),
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Highlights', 'Partial or full highlights', 90, 12000, 3),
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Hair Treatment', 'Deep conditioning and repair treatment', 45, 6500, 4);
    
    -- Insert sample services for Facial Treatments
    INSERT INTO services (section_id, name, description, duration_minutes, price_cents, display_order) VALUES
    ((SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id), 'Classic Facial', 'Deep cleansing and moisturizing facial', 60, 8500, 1),
    ((SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id), 'Anti-Aging Facial', 'Advanced anti-aging treatment', 75, 11000, 2),
    ((SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id), 'Acne Treatment', 'Specialized acne clearing facial', 45, 7000, 3),
    ((SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id), 'Hydrating Facial', 'Intensive hydration treatment', 60, 9000, 4);
    
    -- Insert sample services for Nail Care
    INSERT INTO services (section_id, name, description, duration_minutes, price_cents, display_order) VALUES
    ((SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id), 'Manicure', 'Classic manicure with polish', 45, 3500, 1),
    ((SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id), 'Pedicure', 'Relaxing pedicure treatment', 60, 4500, 2),
    ((SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id), 'Gel Manicure', 'Long-lasting gel polish', 60, 5000, 3),
    ((SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id), 'Nail Art', 'Creative nail design', 30, 2500, 4);
    
    -- Insert sample packages
    INSERT INTO service_packages (section_id, name, description, total_price_cents, total_duration_minutes, display_order) VALUES
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Bridal Glam Package', 'Complete bridal hair styling package', 20000, 105, 1),
    ((SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id), 'Color & Style Combo', 'Hair coloring with styling service', 19000, 180, 2),
    ((SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id), 'Glow & Hydrate Package', 'Facial treatment with hydration boost', 15000, 120, 1),
    ((SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id), 'Hand & Foot Combo', 'Manicure and pedicure together', 7000, 105, 1);
    
    -- Link services to packages
    INSERT INTO package_services (package_id, service_id) VALUES
    ((SELECT id FROM service_packages WHERE name = 'Bridal Glam Package'), (SELECT id FROM services WHERE name = 'Haircut & Style' AND section_id = (SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Bridal Glam Package'), (SELECT id FROM services WHERE name = 'Hair Treatment' AND section_id = (SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Color & Style Combo'), (SELECT id FROM services WHERE name = 'Hair Color' AND section_id = (SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Color & Style Combo'), (SELECT id FROM services WHERE name = 'Haircut & Style' AND section_id = (SELECT id FROM service_sections WHERE name = 'Hair Services' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Glow & Hydrate Package'), (SELECT id FROM services WHERE name = 'Classic Facial' AND section_id = (SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Glow & Hydrate Package'), (SELECT id FROM services WHERE name = 'Hydrating Facial' AND section_id = (SELECT id FROM service_sections WHERE name = 'Facial Treatments' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Hand & Foot Combo'), (SELECT id FROM services WHERE name = 'Manicure' AND section_id = (SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id))),
    ((SELECT id FROM service_packages WHERE name = 'Hand & Foot Combo'), (SELECT id FROM services WHERE name = 'Pedicure' AND section_id = (SELECT id FROM service_sections WHERE name = 'Nail Care' AND user_id = demo_user_id)));
    
END $$;

-- Display the created data
SELECT 'Database setup complete!' as status;
SELECT 'Sample data inserted:' as info;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Sections:', COUNT(*) FROM service_sections
UNION ALL
SELECT 'Services:', COUNT(*) FROM services
UNION ALL
SELECT 'Packages:', COUNT(*) FROM service_packages
UNION ALL
SELECT 'Package Services:', COUNT(*) FROM package_services; 