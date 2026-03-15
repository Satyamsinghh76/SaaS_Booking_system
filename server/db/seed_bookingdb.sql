-- Seed data for booking SaaS project
-- Target database: bookingdb
-- Apply with:
--   psql -U postgres -d bookingdb -f server/db/seed_bookingdb.sql

BEGIN;

-- Example services
INSERT INTO services (name, description, duration_minutes, price, is_active)
VALUES
  ('Haircut', 'Professional haircut and styling session.', 45, 25.00, TRUE),
  ('Fitness Training', 'Personalized one-on-one fitness coaching.', 60, 40.00, TRUE),
  ('Doctor Consultation', 'General health consultation with a physician.', 30, 60.00, TRUE),
  ('Coding Coaching', 'Mentorship session for coding and interview prep.', 60, 50.00, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Example availability slots (at least 5)
-- Uses service names to resolve service_id so IDs can vary by environment.
INSERT INTO availability (service_id, date, start_time, end_time)
VALUES
  ((SELECT id FROM services WHERE name = 'Haircut'), CURRENT_DATE + 1, '09:00', '09:45'),
  ((SELECT id FROM services WHERE name = 'Haircut'), CURRENT_DATE + 1, '10:00', '10:45'),
  ((SELECT id FROM services WHERE name = 'Fitness Training'), CURRENT_DATE + 1, '07:00', '08:00'),
  ((SELECT id FROM services WHERE name = 'Fitness Training'), CURRENT_DATE + 2, '18:00', '19:00'),
  ((SELECT id FROM services WHERE name = 'Doctor Consultation'), CURRENT_DATE + 1, '11:00', '11:30'),
  ((SELECT id FROM services WHERE name = 'Doctor Consultation'), CURRENT_DATE + 1, '11:30', '12:00'),
  ((SELECT id FROM services WHERE name = 'Coding Coaching'), CURRENT_DATE + 2, '15:00', '16:00'),
  ((SELECT id FROM services WHERE name = 'Coding Coaching'), CURRENT_DATE + 3, '17:00', '18:00')
ON CONFLICT DO NOTHING;

COMMIT;
