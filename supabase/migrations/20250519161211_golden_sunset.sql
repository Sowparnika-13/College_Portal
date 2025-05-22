/*
  # Initial Schema Setup for College Community Portal

  1. New Tables
    - users
      - id (uuid, primary key)
      - auth_id (uuid, references auth.users)
      - first_name (text)
      - last_name (text)
      - role (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - attendance
      - id (uuid, primary key)
      - student_id (uuid, references users)
      - subject_id (uuid, references subjects)
      - date (date)
      - status (text)
      - marked_by (uuid, references users)
      - created_at (timestamptz)
    
    - subjects
      - id (uuid, primary key)
      - name (text)
      - code (text)
      - created_at (timestamptz)
    
    - documents
      - id (uuid, primary key)
      - title (text)
      - type (text) -- 'calendar', 'timetable', or 'result'
      - file_url (text)
      - uploaded_by (uuid, references users)
      - created_at (timestamptz)
    
    - announcements
      - id (uuid, primary key)
      - content (text)
      - user_id (uuid, references users)
      - media_url (text[])
      - created_at (timestamptz)
    
    - announcement_likes
      - id (uuid, primary key)
      - announcement_id (uuid, references announcements)
      - user_id (uuid, references users)
      - created_at (timestamptz)
    
    - announcement_comments
      - id (uuid, primary key)
      - announcement_id (uuid, references announcements)
      - user_id (uuid, references users)
      - content (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Set up policies for each table based on user role
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'faculty');
CREATE TYPE document_type AS ENUM ('calendar', 'timetable', 'result');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users NOT NULL,
  subject_id uuid REFERENCES subjects NOT NULL,
  date date NOT NULL,
  status attendance_status NOT NULL,
  marked_by uuid REFERENCES users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, date)
);

-- Create documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type document_type NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  media_url text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create announcement likes table
CREATE TABLE announcement_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Create announcement comments table
CREATE TABLE announcement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Subjects policies
CREATE POLICY "Everyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only faculty can create subjects"
  ON subjects FOR INSERT
  TO authenticated
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'faculty');

-- Attendance policies
CREATE POLICY "Faculty can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'faculty');

CREATE POLICY "Students can view their own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Only faculty can mark attendance"
  ON attendance FOR INSERT
  TO authenticated
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'faculty');

-- Documents policies
CREATE POLICY "Everyone can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only faculty can upload documents"
  ON documents FOR INSERT
  TO authenticated
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'faculty');

-- Announcements policies
CREATE POLICY "Everyone can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  USING (true);

-- Announcement likes policies
CREATE POLICY "Everyone can view likes"
  ON announcement_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can like announcements"
  ON announcement_likes FOR INSERT
  TO authenticated
  USING (true);

-- Announcement comments policies
CREATE POLICY "Everyone can view comments"
  ON announcement_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON announcement_comments FOR INSERT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_subject_id ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcement_likes_announcement_id ON announcement_likes(announcement_id);
CREATE INDEX idx_announcement_comments_announcement_id ON announcement_comments(announcement_id);