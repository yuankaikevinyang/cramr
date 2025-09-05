-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    full_name VARCHAR(40),
    major VARCHAR(100),
    year VARCHAR(20),
    bio TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transfer BOOLEAN DEFAULT false,
    banner_color VARCHAR(100),
    school VARCHAR(100),
    pronouns VARCHAR(100),
    prompt_1 VARCHAR(100),
    prompt_1_answer VARCHAR(100),
    prompt_2 VARCHAR(100),
    prompt_2_answer VARCHAR(100),
    prompt_3 VARCHAR(100),
    prompt_3_answer VARCHAR(100),
    phone_number VARCHAR(20),
    push_notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT false,
    verification_code VARCHAR(255), -- Stores 6-digit verification code or temporary reset token
    verification_code_expiry TIMESTAMP, -- Expiry time for verification code (10 min) or reset token (5 min)
    following_ids UUID[] DEFAULT '{}', -- Array of user IDs that this user is following
    followers_ids UUID[] DEFAULT '{}', -- Array of user IDs that are following this user
    following INTEGER DEFAULT 0, -- Count of users this user is following
    followers INTEGER DEFAULT 0 -- Count of users following this user
);

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    location VARCHAR(200),
    class VARCHAR(100),
    date_and_time TIMESTAMP NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    capacity INTEGER,
    tags TEXT[],
    banner_color VARCHAR(100),
    event_format VARCHAR(20) DEFAULT 'In Person',
    virtual_room_link TEXT,
    materials_count INTEGER DEFAULT 0
);

-- Create event_attendees table
CREATE TABLE event_attendees (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'invited',
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);

-- Create follows table to manage user follow relationships
CREATE TABLE follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- Foreign key referencing the follower
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key referencing the user being followed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,            -- Timestamp for when the follow was created
    PRIMARY KEY (follower_id, following_id)                   -- Composite primary key to ensure no duplicate follows
);

-- Create blocks table to manage user blocks relationships
CREATE TABLE blocks (
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- Foreign key referencing the blocker
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key referencing the user being blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- Timestamp for when the block was created
    PRIMARY KEY (blocker_id, blocked_id)                    -- Composite primary key to ensure no duplicate blocks
);

-- Create notifications table to manage user notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,     -- User receiving the notification
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- User who triggered the notification
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,   -- Related event (optional)
    type VARCHAR(50) NOT NULL,                              -- Type of notification (follow, event_invite, event_rsvp, etc.)
    message TEXT NOT NULL,                                  -- Notification message
    is_read BOOLEAN DEFAULT false,                          -- Whether notification has been read
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- When notification was created
    metadata JSONB                                          -- Additional data for the notification
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments
CREATE INDEX idx_comments_event_id ON comments(event_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Insert sample data into users
-- INSERT INTO users (username, password_hash, email, full_name, major, year, bio, profile_picture_url)
-- VALUES 
-- ('kevinyang123', 'hashedpassword', 'alice@ucsd.edu', 'Kevin Yang', 'Computer Science', 'Senior', 'I love In-N-Out', 'http://132.249.242.182/profile-pictures/innout.png');

-- Insert sample data into events
-- INSERT INTO events (title, description, location, class, date_and_time, creator_id, event_type, status, capacity, tags, invited_ids, accepted_ids, declined_ids, invited_count, accepted_count, declined_count)
-- VALUES 
-- ('CS101 Study Group', 'Study group for CS101: Introduction to Computer Science', 'Room 101, UCSD', 'CS101', '2025-09-15 10:00:00', 
--  '2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', 'In-person', 'Upcoming', 30, ARRAY['CS101', 'Computer Science', 'Quiet'], 
--  ARRAY['2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5'::UUID], ARRAY['2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5'::UUID], ARRAY[]::UUID[], 1, 1, 0);

-- Insert sample data into event_attendees
-- INSERT INTO event_attendees (event_id, user_id, status)
-- VALUES 
-- ('3272c557-e2c8-451b-8114-e9b2d5269d0a', '2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', 'Accepted');

-- -- Insert sample data into friends
-- INSERT INTO friends (user_id, friend_id, status)
-- VALUES ('user_uuid_1', 'user_uuid_2', 'accepted');

-- Query to see the data in the tables
SELECT * FROM users;
SELECT * FROM events;
SELECT * FROM event_attendees;

-- Insert sample notifications (uncomment and modify as needed for testing)
-- INSERT INTO notifications (user_id, sender_id, type, message, event_id, metadata) VALUES
--   ('user_uuid_1', 'user_uuid_2', 'follow', 'jessicastacy started following you.', NULL, '{"action": "follow"}'),
--   ('user_uuid_1', 'user_uuid_3', 'event_invite', 'You''ve been invited to CS101 Study Group', 'event_uuid_1', '{"event_title": "CS101 Study Group", "location": "Room 101, UCSD"}'),
--   ('user_uuid_1', 'user_uuid_4', 'event_rsvp', 'caileymnm RSVPed to In-N-Out Study Session', 'event_uuid_2', '{"event_title": "In-N-Out Study Session", "status": "accepted"}');

-- Insert sample notifications for specific user 2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5
-- Note: Replace the sender_id UUIDs with actual user IDs from your database
INSERT INTO notifications (user_id, sender_id, type, message, event_id, metadata) VALUES
  ('2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', '2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', 'follow', 'jessicastacy started following you.', NULL, '{"action": "follow"}'),
  ('2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', '2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', 'event_invite', 'You''ve been invited to CS101 Study Group', NULL, '{"event_title": "CS101 Study Group", "location": "Room 101, UCSD"}'),
  ('2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', '2e629fee-b5fa-4f18-8a6a-2f3a950ba8f5', 'event_rsvp', 'caileymnm RSVPed to In-N-Out Study Session', NULL, '{"event_title": "In-N-Out Study Session", "status": "accepted"}');

CREATE TABLE study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT true
);
