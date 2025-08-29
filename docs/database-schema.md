# Database Schema for BBY Service Menu Manager

## Overview

This document outlines the database schema designed to support the drag-and-drop service menu management system. The schema is designed to be flexible, scalable, and support multi-user environments.

## Database Design Philosophy

### Key Principles

1. **Normalized Structure**: Avoid data duplication while maintaining performance
2. **Flexible Ordering**: Support dynamic reordering of sections, services, and packages
3. **Audit Trail**: Track changes and maintain version history
4. **Multi-tenant Ready**: Support multiple businesses/users
5. **Scalable**: Handle large numbers of services and frequent updates

## Core Tables

### 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### 2. Service Sections Table

```sql
CREATE TABLE service_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Index for efficient ordering queries
CREATE INDEX idx_sections_user_order ON service_sections(user_id, display_order);
```

### 3. Services Table

```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes for efficient queries
CREATE INDEX idx_services_section_order ON services(section_id, display_order);
CREATE INDEX idx_services_section_active ON services(section_id, is_active);
```

### 4. Service Packages Table

```sql
CREATE TABLE service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes
CREATE INDEX idx_packages_section_order ON service_packages(section_id, display_order);
CREATE INDEX idx_packages_section_active ON service_packages(section_id, is_active);
```

### 5. Package Services Junction Table

```sql
CREATE TABLE package_services (
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (package_id, service_id)
);

-- Indexes
CREATE INDEX idx_package_services_package ON package_services(package_id);
CREATE INDEX idx_package_services_service ON package_services(service_id);
```

## Audit and Versioning Tables

### 6. Menu Versions Table

```sql
CREATE TABLE menu_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    UNIQUE(user_id, version_number)
);

-- Index
CREATE INDEX idx_menu_versions_user ON menu_versions(user_id);
```

### 7. Change Log Table

```sql
CREATE TABLE change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes
CREATE INDEX idx_change_log_user ON change_log(user_id);
CREATE INDEX idx_change_log_version ON change_log(version_id);
CREATE INDEX idx_change_log_table_record ON change_log(table_name, record_id);
```

## Advanced Features Tables

### 8. Service Categories Table (Optional)

```sql
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color_hex VARCHAR(7),
    icon_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, name)
);
```

### 9. Pricing Rules Table (Optional)

```sql
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('DISCOUNT', 'SURCHARGE', 'PACKAGE_DISCOUNT')),
    conditions JSONB NOT NULL,
    discount_percentage DECIMAL(5,2),
    discount_amount_cents INTEGER,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Triggers

### Auto-update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_service_sections_updated_at
    BEFORE UPDATE ON service_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at
    BEFORE UPDATE ON service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Change Logging Trigger

```sql
-- Function to log changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO change_log (user_id, table_name, record_id, action_type, new_values)
        VALUES (NEW.user_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO change_log (user_id, table_name, record_id, action_type, old_values, new_values)
        VALUES (NEW.user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO change_log (user_id, table_name, record_id, action_type, old_values)
        VALUES (OLD.user_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER log_service_sections_changes
    AFTER INSERT OR UPDATE OR DELETE ON service_sections
    FOR EACH ROW EXECUTE FUNCTION log_changes();
```

## Sample Queries

### Get Complete Menu for User

```sql
SELECT
    s.id as section_id,
    s.name as section_name,
    s.description as section_description,
    s.display_order as section_order,
    serv.id as service_id,
    serv.name as service_name,
    serv.description as service_description,
    serv.duration_minutes,
    serv.price_cents,
    serv.display_order as service_order,
    p.id as package_id,
    p.name as package_name,
    p.description as package_description,
    p.total_price_cents,
    p.total_duration_minutes,
    p.display_order as package_order
FROM service_sections s
LEFT JOIN services serv ON s.id = serv.section_id AND serv.is_active = true
LEFT JOIN service_packages p ON s.id = p.section_id AND p.is_active = true
WHERE s.user_id = $1 AND s.is_active = true
ORDER BY s.display_order, serv.display_order, p.display_order;
```

### Update Service Order

```sql
-- This would be wrapped in a transaction
UPDATE services
SET display_order = CASE
    WHEN id = $1 THEN $2
    WHEN id = $2 THEN $1
    ELSE display_order
END
WHERE section_id = $3 AND id IN ($1, $2);
```

## Performance Considerations

### Indexing Strategy

- Primary keys are UUIDs for security and distribution
- Composite indexes on (user_id, display_order) for efficient ordering
- Partial indexes on is_active for active records only
- JSONB indexes for complex querying on change logs

### Partitioning Strategy

- Consider partitioning change_log by date for large deployments
- Partition by user_id for multi-tenant setups

### Caching Strategy

- Redis for frequently accessed menu data
- In-memory caching for active user sessions
- CDN for static menu displays

## Security Considerations

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE service_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own data" ON service_sections
    FOR ALL USING (user_id = current_user_id());
```

### Data Encryption

- Encrypt sensitive data at rest
- Use TLS for data in transit
- Hash user authentication data

## Migration Strategy

### Version 1.0 to 1.1

```sql
-- Add new fields without breaking existing functionality
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create new indexes
CREATE INDEX CONCURRENTLY idx_services_category ON services(category_id);
CREATE INDEX CONCURRENTLY idx_services_tags ON services USING GIN(tags);
```

This schema provides a solid foundation for the service menu system while maintaining flexibility for future enhancements and ensuring data integrity and performance.
