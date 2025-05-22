/*
  # Seed initial data

  1. Sample Data
    - Add sample subjects
    - Add sample documents
    - Add sample announcements
    - Add sample attendance records

  2. Notes
    - Uses realistic sample data for testing
    - Maintains referential integrity
    - Safe to run multiple times due to conflict handling
*/

-- Insert sample subjects
INSERT INTO subjects (code, name) VALUES
  ('CS101', 'Introduction to Computer Science'),
  ('MATH201', 'Advanced Mathematics'),
  ('PHYS101', 'Physics I'),
  ('ENG102', 'English Composition'),
  ('CHEM101', 'Chemistry I')
ON CONFLICT (code) DO NOTHING;

-- Insert sample documents
INSERT INTO documents (title, type, file_url, uploaded_by)
SELECT 
  'Academic Calendar 2025-2026',
  'calendar',
  'https://example.com/calendar.pdf',
  users.id
FROM users
WHERE role = 'faculty'
LIMIT 1;

INSERT INTO documents (title, type, file_url, uploaded_by)
SELECT 
  'Spring 2025 Timetable',
  'timetable',
  'https://example.com/timetable.pdf',
  users.id
FROM users
WHERE role = 'faculty'
LIMIT 1;

-- Insert sample announcements
INSERT INTO announcements (content, user_id, media_url)
SELECT 
  'Welcome to the new semester! Check out the updated calendar.',
  users.id,
  '{}'
FROM users
WHERE role = 'faculty'
LIMIT 1;

-- Insert sample attendance records
INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
SELECT 
  student.id,
  subjects.id,
  CURRENT_DATE - INTERVAL '1 day',
  'present',
  faculty.id
FROM users student
CROSS JOIN subjects
CROSS JOIN users faculty
WHERE student.role = 'student'
AND faculty.role = 'faculty'
LIMIT 5;