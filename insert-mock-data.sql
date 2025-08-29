-- Insert Mock Data for BBY Service Menu Manager
-- This script inserts sample data for testing the application

-- Make sure we're connected to the right database
\c bby_service_menu;

-- Insert mock data for the existing user
-- User ID: d36f1938-e025-48c2-94d6-48fe7bd57699

-- 1. Insert Service Sections
INSERT INTO service_sections (id, user_id, name, description, display_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'd36f1938-e025-48c2-94d6-48fe7bd57699', 'Hair Services', 'Professional hair styling and treatments', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'd36f1938-e025-48c2-94d6-48fe7bd57699', 'Facial Treatments', 'Rejuvenating facial care services', 2, true)
ON CONFLICT (user_id, name) DO NOTHING;

-- 2. Insert Services for Hair Services section
INSERT INTO services (id, section_id, name, description, duration_minutes, price_cents, display_order, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Haircut & Style', 'Professional haircut with styling and blowout', 60, 7500, 1, true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Hair Color', 'Full hair coloring service', 120, 15000, 2, true)
ON CONFLICT (section_id, name) DO NOTHING;

-- 3. Insert Services for Facial Treatments section
INSERT INTO services (id, section_id, name, description, duration_minutes, price_cents, display_order, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Classic Facial', 'Deep cleansing and moisturizing facial', 60, 8500, 1, true)
ON CONFLICT (section_id, name) DO NOTHING;

-- 4. Insert Service Package for Hair Services
INSERT INTO service_packages (id, section_id, name, description, total_price_cents, total_duration_minutes, display_order, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bridal Glam Package', 'Complete bridal hair styling package', 20000, 105, 1, true)
ON CONFLICT (section_id, name) DO NOTHING;

-- 5. Link Package to Services (Bridal Glam Package includes Haircut & Style)
INSERT INTO package_services (package_id, service_id) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (package_id, service_id) DO NOTHING;

-- 6. Update the user's business name if needed
UPDATE users 
SET business_name = 'BBY Beauty Salon', 
    updated_at = CURRENT_TIMESTAMP 
WHERE id = 'd36f1938-e025-48c2-94d6-48fe7bd57699';

-- Verify the data was inserted
SELECT 
    'Sections' as type,
    COUNT(*) as count
FROM service_sections 
WHERE user_id = 'd36f1938-e025-48c2-94d6-48fe7bd57699'

UNION ALL

SELECT 
    'Services' as type,
    COUNT(*) as count
FROM services s
JOIN service_sections ss ON s.section_id = ss.id
WHERE ss.user_id = 'd36f1938-e025-48c2-94d6-48fe7bd57699'

UNION ALL

SELECT 
    'Packages' as type,
    COUNT(*) as count
FROM service_packages sp
JOIN service_sections ss ON sp.section_id = ss.id
WHERE ss.user_id = 'd36f1938-e025-48c2-94d6-48fe7bd57699'; 