const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const { Client: MailjetClient } = require('node-mailjet');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:8081',  // Expo dev server
    'http://localhost:3000',  // Alternative dev port
    'http://192.168.1.3:8081', // Your local IP with dev port
    'http://localhost:19006', // Expo web dev server
    'http://192.168.1.3:19006' // Your local IP with Expo web port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Enable preflight for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(express.json());

const client = new Client({
  user: 'postgres',
  host: process.env.NODE_ENV === 'production' ? 'postgres' : process.env.CRAMR_DB_IP_ADDR,
  database: 'cramr_db',
  password: process.env.CRAMR_DB_POSTGRES_PASSWORD,
  port: 5432,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
});
client.connect();

// Initialize Mailjet client
const mailjet = new MailjetClient({
  apiKey: process.env.MJ_APIKEY_PUBLIC || '5c0d15bd4bd31ce23181131a4714e8e1',
  apiSecret: process.env.MJ_APIKEY_PRIVATE || 'dcc70eeccd3807c5f055808b8e3261ad'
});

// Store OTP codes in memory (in production, use Redis or database)
const otpStore = new Map();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure multer for study material uploads 
const studyMaterialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const studyMaterialsDir = path.join(__dirname, 'uploads', 'study-materials');
    if (!fs.existsSync(studyMaterialsDir)) {
      fs.mkdirSync(studyMaterialsDir, { recursive: true });
    }
    cb(null, studyMaterialsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const studyMaterialUpload = multer({
  storage: studyMaterialStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for study materials
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',                                                    // PDF
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'image/jpeg',                                                        // JPG
      'image/png',                                                         // PNG
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed! Only PDF, DOCX, PNG, JPG, and PPTX files are accepted.'), false);
    }
  }
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Helper function to get blocked users for a given user
async function getBlockedUsers(userId) {
  try {
    const result = await client.query(`
      SELECT blocked_id FROM blocks WHERE blocker_id = $1
    `, [userId]);
    return result.rows.map(row => row.blocked_id);
  } catch (err) {
    console.error('Error getting blocked users:', err);
    return [];
  }
}

// Helper function to get users who have blocked a given user
async function getUsersWhoBlocked(userId) {
  try {
    const result = await client.query(`
      SELECT blocker_id FROM blocks WHERE blocked_id = $1
    `, [userId]);
    return result.rows.map(row => row.blocker_id);
  } catch (err) {
    console.error('Error getting users who blocked:', err);
    return [];
  }
}

// Get all event IDs (for debugging)
app.get('/events/ids', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT id, title, creator_id, created_at 
      FROM events 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      events: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        creator_id: row.creator_id,
        created_at: row.created_at
      }))
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get events by current user (for debugging)
app.get('/users/:userId/events', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await client.query(`
      SELECT id, title, creator_id, created_at 
      FROM events 
      WHERE creator_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      events: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        creator_id: row.creator_id,
        created_at: row.created_at
      }))
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all events (filtered by blocking)
app.get('/events', async (req, res) => {
  try {
    const { userId } = req.query; // Optional: if provided, filter out blocked users
    
    console.log('Fetching events with creator info and attendee counts...');
    
    let query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.profile_picture_url as creator_profile_picture,
        u.username as creator_username
      FROM events e
      LEFT JOIN users u ON e.creator_id::uuid = u.id::uuid
    `;
    
    let params = [];
    
    // If userId is provided, filter out events from users they've blocked and events from users who have blocked them
    if (userId) {
      const blockedUsers = await getBlockedUsers(userId);
      const usersWhoBlocked = await getUsersWhoBlocked(userId);
      const allBlockedIds = [...blockedUsers, ...usersWhoBlocked];
      
      if (allBlockedIds.length > 0) {
        query += ` WHERE e.creator_id NOT IN (${allBlockedIds.map((_, index) => `$${index + 1}`).join(',')})`;
        params = allBlockedIds;
      }
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const result = await client.query(query, params);
    
    // Add attendee counts and IDs for each event
    console.log(`Processing ${result.rows.length} events to add attendee data...`);
    
    const eventsWithAttendees = await Promise.all(
      result.rows.map(async (event, index) => {
        console.log(`Processing event ${index + 1}/${result.rows.length}: ${event.id} - ${event.title}`);
        // Get attendee counts from event_attendees table
        const invitedResult = await client.query(
          "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'invited'",
          [event.id]
        );
        const invited_count = parseInt(invitedResult.rows[0].count);

        const acceptedResult = await client.query(
          "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'accepted'",
          [event.id]
        );
        const accepted_count = parseInt(acceptedResult.rows[0].count);

        const declinedResult = await client.query(
          "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'declined'",
          [event.id]
        );
        const declined_count = parseInt(declinedResult.rows[0].count);

        // Get user IDs for each status
        const invitedUsersResult = await client.query(
          "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'invited'",
          [event.id]
        );
        const invited_ids = invitedUsersResult.rows.map(row => row.user_id);

        const acceptedUsersResult = await client.query(
          "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'accepted'",
          [event.id]
        );
        const accepted_ids = acceptedUsersResult.rows.map(row => row.user_id);

        const declinedUsersResult = await client.query(
          "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'declined'",
          [event.id]
        );
        const declined_ids = declinedUsersResult.rows.map(row => row.user_id);

        // Get saved event user IDs
        const savedUsersResult = await client.query(
          "SELECT user_id FROM saved_events WHERE event_id = $1",
          [event.id]
        );
        const saved_ids = savedUsersResult.rows.map(row => row.user_id);
        const saved_count = saved_ids.length;

        const eventWithAttendees = {
          ...event,
          invited_ids,
          invited_count,
          accepted_ids,
          accepted_count,
          declined_ids,
          declined_count,
          saved_ids,
          saved_count,
          // Map accepted_ids to rsvped_ids for frontend compatibility
          rsvped_ids: accepted_ids,
          rsvped_count: accepted_count,
        };
        
        console.log(`Event ${event.id} attendee data:`, {
          invited_count,
          accepted_count,
          declined_count,
          accepted_ids
        });
        
        return eventWithAttendees;
      })
    );
    
    console.log('Events with attendee data:', eventsWithAttendees);
   
    res.json(eventsWithAttendees);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Create new event
app.post('/events', async (req, res) => {
  const { 
    title, 
    description, 
    location, 
    class: classField, 
    date_and_time, 
    tags, 
    capacity, 
    invitePeople, 
    creator_id,
    virtual_room_link,
    study_room, 
    event_format
  } = req.body;
  
  // Validate required fields
  if (!title || !creator_id) {
    return res.status(400).json({ error: 'Missing required fields: title and creator_id are required' });
  }

  try {
    // Verify that the creator_id exists in the users table
    const creatorCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [creator_id]
    );
    
    if (creatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid creator_id: user not found' });
    }

    // Create the event with virtual_room_link and study_room
    const result = await client.query(
      `INSERT INTO events (
        title, description, location, class, date_and_time, tags, capacity, 
        creator_id, virtual_room_link, study_room, event_format, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
      [
        title, description, location, classField, date_and_time, tags, capacity, 
        creator_id, virtual_room_link, study_room, event_format
      ]
    );
    
    const event = result.rows[0];
    
    // If invite people are provided, create event attendee records
    if (invitePeople && invitePeople.length > 0) {
      for (const userId of invitePeople) {
        // Validate that the user exists
        const userResult = await client.query(
          'SELECT id FROM users WHERE id = $1',
          [userId]
        );
        
        if (userResult.rows.length > 0) {
          // Add to event_attendees table
          await client.query(
            'INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (event_id, user_id) DO NOTHING',
            [event.id, userId, 'invited']
          );
          
          // Create notification for invited user
          await createNotification(
            userId,
            creator_id,
            'event_invite',
            `You've been invited to ${title}`,
            event.id,
            { event_title: title, location: location, date: date_and_time }
          );
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// User signup
app.post('/signup', async (req, res) => {
  const { username, password, email, full_name, created_at } = req.body;
  
  if (!username || !password || !email || !full_name) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  try {
    // Check both email and username simultaneously
    const [emailExists, usernameExists] = await Promise.all([
      client.query('SELECT 1 FROM users WHERE email = $1', [email]),
      client.query('SELECT 1 FROM users WHERE username = $1', [username])
    ]);
    
    console.log('Email check result:', { email, exists: emailExists.rows.length > 0 });
    console.log('Username check result:', { username, exists: usernameExists.rows.length > 0 });
    
    // Collect all errors
    const errors = {};
    if (emailExists.rows.length > 0) {
      errors.email = 'User with this email already exists';
    }
    if (usernameExists.rows.length > 0) {
      errors.username = 'Username is already taken';
    }
    
    // If there are any conflicts, return all errors
    if (Object.keys(errors).length > 0) {
      console.log('Returning 409 for conflicts:', errors);
      return res.status(409).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert new user with provided created_at or use NOW()
    const result = await client.query(
      'INSERT INTO users (username, password_hash, email, full_name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name',
      [username, passwordHash, email, full_name, created_at || new Date().toISOString()]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register user. Please try again.' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password' });
  }
  
  try {
    // Look up user by email
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email' });
    }
    const user = userResult.rows[0];
    
    // Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    const responseUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      following: user.following || 0,
      followers: user.followers || 0
    };
    
    console.log('Login successful for user:', responseUser);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: responseUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to log in. Please try again.' });
  }
});

// Password reset request
app.post('/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  try {
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }
    
    const user = userResult.rows[0];
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Store verification code and expiry in database
    await client.query(
      'UPDATE users SET verification_code = $1, verification_code_expiry = $2 WHERE id = $3',
      [verificationCode, resetTokenExpiry, user.id]
    );
    
    // Send email with verification code
    const data = {
      Messages: [
        {
          From: {
            Email: "tylervo.2002@gmail.com",
            Name: "Cramr Team" 
          },
          To: [
            {
              Email: user.email,
              Name: user.username
            },
          ],
          Subject: "Password Reset Verification Code",
          TextPart: `Hello ${user.username},\n\nYou have requested to reset your password. Use the following verification code to proceed:\n\n${verificationCode}\n\nThis code will expire in 10 minutes. If you did not request a password reset, please ignore this email.\n\nThank you,\nThe Cramr Team`
        }
      ]
    };
    
    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request(data);
    
    const { Status } = result.body.Messages[0];
    
    if (Status === 'success') {
      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send verification code' });
    }
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ success: false, message: 'Failed to process password reset request' });
  }
});

// Verify reset code
app.post('/auth/verify-reset-code', async (req, res) => {
  const { email, verificationCode } = req.body;
  
  if (!email || !verificationCode) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required' });
  }
  
  try {
    // Find user with valid verification code
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND verification_code = $2 AND verification_code_expiry > NOW()',
      [email, verificationCode]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code',
        details: 'The verification code has expired or is invalid. Please request a new code.',
        code: 'CODE_EXPIRED'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generate a temporary token for password reset (valid for 5 minutes)
    const tempToken = uuidv4();
    const tempTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store temporary token
    await client.query(
      'UPDATE users SET verification_code = $1, verification_code_expiry = $2 WHERE id = $3',
      [tempToken, tempTokenExpiry, user.id]
    );
    
    res.json({
      success: true,
      message: 'Verification code verified successfully',
      token: tempToken
    });
  } catch (err) {
    console.error('Code verification error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
});

// Password reset confirmation
app.post('/auth/reset-password/confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }
  
 
  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long',
      details: 'Please ensure your password meets all requirements: at least 8 characters, 1 capital letter, and 1 special character'
    });
  }
  
  // Check for capital letter
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must contain at least 1 capital letter',
      details: 'Please ensure your password meets all requirements: at least 8 characters, 1 capital letter, and 1 special character'
    });
  }
  
  // Check for special character
  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must contain at least 1 special character',
      details: 'Please ensure your password meets all requirements: at least 8 characters, 1 capital letter, and 1 special character'
    });
  }
  
  try {
    // Find user with valid reset token
    const userResult = await client.query(
      'SELECT id FROM users WHERE verification_code = $1 AND verification_code_expiry > NOW()',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token',
        details: 'The password reset token has expired or is invalid. Please request a new password reset from the login page.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    const user = userResult.rows[0];
    
    // Hash new password using the same method as signup
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear verification code
    await client.query(
      'UPDATE users SET password_hash = $1, verification_code = NULL, verification_code_expiry = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({
      success: true,
      message: 'Password reset successfully!',
      details: 'Your new password has been saved. You can now log in with your new password.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Search users
app.get('/users/search', async (req, res) => {
  const { q, currentUserId } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }
  
  try {
    let query = `
      SELECT id, username, full_name, email, following, followers, profile_picture_url, banner_color
      FROM users
      WHERE
        (LOWER(username) LIKE LOWER($1) OR
         LOWER(full_name) LIKE LOWER($1))
    `;
    let params = [`%${q}%`];
    
    // Exclude current user from search results if currentUserId is provided
    if (currentUserId) {
      query += ` AND id != $2`;
      params.push(currentUserId);
    }
    
    query += `
      ORDER BY
        CASE
          WHEN LOWER(username) = LOWER($1) THEN 1
          WHEN LOWER(full_name) = LOWER($1) THEN 2
          ELSE 3
        END,
        username
      LIMIT 20
    `;
    
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/send-2fa', async (req, res) => {
    const {email, name, code} = req.body;

    // how do I import the code from the Cramr frontend to the backend server
    
    const request = {
        Messages: [
            {
                From: {
                    Email: "tylervo.2002@gmail.com", //replace with our own created domain or something other than my email account if we have one.
                    Name: "Cramr Team" 
                },
                To: [
                    {
                        Email: email,
                        Name: name
                    },
                ],
                Subject: "Your One Time Passcode",
                TextPart: `Hello ${name},\n\nYou have tried to log in and your One Time Passcode is ${code}. If you did not request a One Time Password, please change your password as soon as possible.\n\nThank you,\nThe Cramr Team`
            }
        ]
    }

    try {
        const result = await mailjet.post('send', {version: 'v3.1'}).request(request);
        console.log("Email sent", result.body);
        return res.status(200).json({success: true, code});
    }
    catch (err) {
        console.error("Error sending email", err);
        return res.status(500).json({success: false, message: "Failed to send email."})
    }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get user by ID with follow counts
app.get('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get user data
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get follower count
    const followerResult = await client.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [id]
    );
    
    // Get following count
    const followingResult = await client.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [id]
    );
    
    // Get follower IDs
    const followerIdsResult = await client.query(
      'SELECT follower_id FROM follows WHERE following_id = $1',
      [id]
    );
    
    // Get following IDs
    const followingIdsResult = await client.query(
      'SELECT following_id FROM follows WHERE follower_id = $1',
      [id]
    );
    
    const response = {
      ...user,
      followers: parseInt(followerResult.rows[0].count),
      following: parseInt(followingResult.rows[0].count),
      follower_ids: followerIdsResult.rows.map(row => row.follower_id),
      following_ids: followingIdsResult.rows.map(row => row.following_id)
    };
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});



// Follow a user
app.post('/users/:id/follow', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (id === userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  try {
    // Check if user is blocked or has blocked the target user
    const blockedUsers = await getBlockedUsers(id);
    const usersWhoBlocked = await getUsersWhoBlocked(id);
    const allBlockedIds = [...blockedUsers, ...usersWhoBlocked];
    
    if (allBlockedIds.includes(userId)) {
      return res.status(403).json({ error: 'Cannot follow blocked users' });
    }
    
    // Check if already following
    const existingFollow = await client.query(`
      SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2
    `, [id, userId]);
    
    if (existingFollow.rows.length > 0) {
      return res.status(409).json({ error: 'Already following this user' });
    }
    
    // Create follow relationship
    const result = await client.query(`
      INSERT INTO follows (follower_id, following_id) 
      VALUES ($1, $2)
      RETURNING *
    `, [id, userId]);
    
    // Update follower's following_ids array and following count
    await client.query(`
      UPDATE users 
      SET following_ids = array_append(following_ids, $1), 
          following = following + 1,
          updated_at = NOW()
      WHERE id = $2
    `, [userId, id]);
    
    // Update followed user's followers_ids array and followers count
    await client.query(`
      UPDATE users 
      SET followers_ids = array_append(followers_ids, $1), 
          followers = followers + 1,
          updated_at = NOW()
      WHERE id = $2
    `, [id, userId]);
    
    // Create notification for the user being followed
    const followerUser = await client.query('SELECT username FROM users WHERE id = $1', [id]);
    if (followerUser.rows.length > 0) {
      await createNotification(
        userId, // user being followed
        id,     // follower
        'follow',
        `${followerUser.rows[0].username} started following you.`
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Now following user',
      follow: result.rows[0]
    });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Unfollow a user
app.delete('/users/:id/follow/:userId', async (req, res) => {
  const { id, userId } = req.params;
  
  try {
    const result = await client.query(`
      DELETE FROM follows 
      WHERE follower_id = $1 AND following_id = $2
      RETURNING *
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }
    
    // Update follower's following_ids array and following count
    await client.query(`
      UPDATE users 
      SET following_ids = array_remove(following_ids, $1), 
          following = GREATEST(following - 1, 0),
          updated_at = NOW()
      WHERE id = $2
    `, [userId, id]);
    
    // Update followed user's followers_ids array and followers count
    await client.query(`
      UPDATE users 
      SET followers_ids = array_remove(followers_ids, $1), 
          followers = GREATEST(followers - 1, 0),
          updated_at = NOW()
      WHERE id = $2
    `, [id, userId]);
    
    res.json({
      success: true,
      message: 'Unfollowed successfully'
    });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get users that the current user is following
app.get('/users/:id/following', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        u.id, u.username, u.full_name, u.email, u.profile_picture_url, u.banner_color,
        f.created_at as follow_date
      FROM users u
      INNER JOIN follows f ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      following: result.rows
    });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get users that are following the current user
app.get('/users/:id/followers', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        u.id, u.username, u.full_name, u.email, u.profile_picture_url, u.banner_color,
        f.created_at as follow_date
      FROM users u
      INNER JOIN follows f ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      followers: result.rows
    });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


// Block a user
app.post('/users/:id/block', async (req, res) => {
  const { id } = req.params;
  const { blockedId } = req.body;
  
  if (id === blockedId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }
  
  try {
    // Check if already blocked
    const existingBlock = await client.query(`
      SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_id = $2
    `, [id, blockedId]);
    
    if (existingBlock.rows.length > 0) {
      return res.status(409).json({ error: 'Already blocked!' });
    }
    
    // Create block relationship
    const result = await client.query(`
      INSERT INTO blocks (blocker_id, blocked_id) 
      VALUES ($1, $2)
      RETURNING *
    `, [id, blockedId]);
    
    // Remove follow relationships in both directions
    await client.query(`
      DELETE FROM follows 
      WHERE (follower_id = $1 AND following_id = $2) 
         OR (follower_id = $2 AND following_id = $1)
    `, [id, blockedId]);
    
    res.status(201).json({
      success: true,
      message: 'Blocked successfully and removed follow relationships!',
      block: result.rows[0]
    });
  } catch (err) {
    console.error('Blocking user error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

//Unblock a user
app.delete('/users/:id/blocks/:blockedId', async (req, res) => {
  const { id, blockedId } = req.params;
  
  try {
    const result = await client.query(`
      DELETE FROM blocks 
      WHERE blocker_id = $1 AND blocked_id = $2
      RETURNING *
    `, [id, blockedId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block relationship not found' });
    }
    
    res.json({
      success: true,
      message: 'Unblocked Successfully!'
    });
  } catch (err) {
    console.error('Unblock user error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

//Get blocked users
app.get('/users/:id/blocks', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        u.id, u.username, u.full_name, u.email,
        b.created_at as block_date
      FROM users u
      INNER JOIN blocks b ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      blocked_users: result.rows
    });
  } catch (err) {
    console.error('Getting blocked users error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

//Check if blocked
app.get('/users/:id/blocks/check/:userId', async (req, res) => {
  const { id, userId } = req.params;
  
  try {
    const result = await client.query(`
      SELECT * FROM blocks 
      WHERE blocker_id = $1 AND blocked_id = $2
    `, [id, userId]);
    
    res.json({
      success: true,
      is_blocked: result.rows.length > 0
    });
  } catch (err) {
    console.error('Check blocked status error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update user profile settings
app.put('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { 
    full_name, 
    major, 
    year, 
    bio, 
    profile_picture_url, 
    banner_color, 
    school, 
    pronouns, 
    transfer,
    prompt_1,
    prompt_1_answer,
    prompt_2,
    prompt_2_answer,
    prompt_3,
    prompt_3_answer
  } = req.body;
  
  try {
    const result = await client.query(`
      UPDATE users 
      SET 
        full_name = COALESCE($1, full_name),
        major = COALESCE($2, major),
        year = COALESCE($3, year),
        bio = COALESCE($4, bio),
        profile_picture_url = $5,
        banner_color = COALESCE($6, banner_color),
        school = COALESCE($7, school),
        pronouns = COALESCE($8, pronouns),
        transfer = COALESCE($9, transfer),
        prompt_1 = COALESCE($10, prompt_1),
        prompt_1_answer = COALESCE($11, prompt_1_answer),
        prompt_2 = COALESCE($12, prompt_2),
        prompt_2_answer = COALESCE($13, prompt_2_answer),
        prompt_3 = COALESCE($14, prompt_3),
        prompt_3_answer = COALESCE($15, prompt_3_answer),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `, [
      full_name, major, year, bio, profile_picture_url, banner_color, 
      school, pronouns, transfer, prompt_1, prompt_1_answer, 
      prompt_2, prompt_2_answer, prompt_3, prompt_3_answer, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update user account settings
app.put('/users/:id/account', async (req, res) => {
  const { id } = req.params;
  const { email, password, phone_number } = req.body;
  
  try {
    let query = 'UPDATE users SET updated_at = NOW()';
    let params = [id];
    let paramIndex = 2;
    
    if (email) {
      query += `, email = $${paramIndex}`;
      params.push(email);
      paramIndex++;
    }
    
    if (password) {
      query += `, password_hash = $${paramIndex}`;
      params.push(password); // In production, hash this password
      paramIndex++;
    }
    
    if (phone_number) {
      query += `, phone_number = $${paramIndex}`;
      params.push(phone_number);
      paramIndex++;
    }
    
    query += ` WHERE id = $1 RETURNING *`;
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Account updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update user preferences
app.put('/users/:id/preferences', async (req, res) => {
  const { id } = req.params;
  const { 
    push_notifications, 
    email_notifications, 
    sms_notifications, 
    theme 
  } = req.body;
  
  try {
    // Update the actual notification preference columns in the users table
    const result = await client.query(`
      UPDATE users 
      SET 
        push_notifications_enabled = COALESCE($1, push_notifications_enabled),
        email_notifications_enabled = COALESCE($2, email_notifications_enabled),
        sms_notifications_enabled = COALESCE($3, sms_notifications_enabled),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [push_notifications, email_notifications, sms_notifications, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        push_notifications: user.push_notifications_enabled,
        email_notifications: user.email_notifications_enabled,
        sms_notifications: user.sms_notifications_enabled,
        theme: theme || 'light' // Theme is not stored in DB, so we return the requested theme
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get user preferences
app.get('/users/:id/preferences', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        push_notifications_enabled,
        email_notifications_enabled,
        sms_notifications_enabled
      FROM users 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      preferences: {
        push_notifications: user.push_notifications_enabled,
        email_notifications: user.email_notifications_enabled,
        sms_notifications: user.sms_notifications_enabled,
        theme: 'light' // Default theme since it's not stored in DB
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Notification endpoints
// Get all notifications for a user
app.get('/users/:id/notifications', async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    // First, ensure the notifications table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);
    
    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);
    
    const result = await client.query(`
      SELECT 
        n.*,
        u.username as sender_username,
        u.full_name as sender_full_name,
        u.profile_picture_url as sender_profile_picture,
        e.title as event_title
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);
    
    // Group notifications by date
    const groupedNotifications = {};
    result.rows.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      }
      
      if (!groupedNotifications[dateKey]) {
        groupedNotifications[dateKey] = [];
      }
      
      groupedNotifications[dateKey].push({
        id: notification.id,
        sender: notification.sender_username || 'System',
        message: notification.message,
        date: dateKey,
        type: notification.type,
        is_read: notification.is_read,
        event_id: notification.event_id,
        event_title: notification.event_title,
        created_at: notification.created_at
      });
    });
    
    // Sort notifications within each date group by created_at (newest first)
    Object.keys(groupedNotifications).forEach(dateKey => {
      groupedNotifications[dateKey].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    res.json({
      success: true,
      notifications: groupedNotifications,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Mark notification as read
app.put('/users/:id/notifications/:notificationId/read', async (req, res) => {
  const { id, notificationId } = req.params;
  
  try {
    const result = await client.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Mark all notifications as read for a user
app.put('/users/:id/notifications/read-all', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*) as updated_count
    `, [id]);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: parseInt(result.rows[0].updated_count)
    });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete a notification
app.delete('/users/:id/notifications/:notificationId', async (req, res) => {
  const { id, notificationId } = req.params;
  
  try {
    const result = await client.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get unread notification count
app.get('/users/:id/notifications/unread-count', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await client.query(`
      SELECT COUNT(*) as unread_count
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [id]);
    
    res.json({
      success: true,
      unread_count: parseInt(result.rows[0].unread_count)
    });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Helper function to create notifications (can be called from other endpoints)
async function createNotification(userId, senderId, type, message, eventId = null, metadata = {}) {
  try {
    const result = await client.query(`
      INSERT INTO notifications (user_id, sender_id, type, message, event_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, senderId, type, message, eventId, JSON.stringify(metadata)]);
    
    return result.rows[0];
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}



app.get('/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const eventResult = await client.query(`
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.profile_picture_url as creator_profile_picture,
        u.username as creator_username
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE e.id = $1
    `, [id]);
    if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const event = eventResult.rows[0];

    // Get attendee counts from event_attendees table
    const invitedResult = await client.query(
      "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'invited'",
      [id]
    );
    const invited_count = parseInt(invitedResult.rows[0].count);

    const acceptedResult = await client.query(
      "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'accepted'",
      [id]
    );
    const accepted_count = parseInt(acceptedResult.rows[0].count);

    const declinedResult = await client.query(
      "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'declined'",
      [id]
    );
    const declined_count = parseInt(declinedResult.rows[0].count);

    // Get user IDs for each status
    const invitedUsersResult = await client.query(
      "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'invited'",
      [id]
    );
    const invited_ids = invitedUsersResult.rows.map(row => row.user_id);

    const acceptedUsersResult = await client.query(
      "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'accepted'",
      [id]
    );
    const accepted_ids = acceptedUsersResult.rows.map(row => row.user_id);

    const declinedUsersResult = await client.query(
      "SELECT user_id FROM event_attendees WHERE event_id = $1 AND status = 'declined'",
      [id]
    );
    const declined_ids = declinedUsersResult.rows.map(row => row.user_id);

    // Get saved event user IDs
    const savedUsersResult = await client.query(
      "SELECT user_id FROM saved_events WHERE event_id = $1",
      [id]
    );
    const saved_ids = savedUsersResult.rows.map(row => row.user_id);
    const saved_count = saved_ids.length;

    res.json({
      ...event,
      invited_ids,
      invited_count,
      accepted_ids,
      accepted_count,
      declined_ids,
      declined_count,
      saved_ids,
      saved_count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update event (general endpoint)
// Update event (general endpoint)
app.put('/events/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    location, 
    class: classField, 
    date_and_time, 
    tags, 
    capacity,
    virtual_room_link,
    study_room,
    event_format,
    banner_color,
  } = req.body;
  
  console.log('PUT /events/:id request:', { id, body: req.body });
  
  try {
    // Build dynamic query based on provided fields
    let query = 'UPDATE events SET';
    let params = [];
    let paramIndex = 1;
    let hasUpdates = false;
    
    if (title !== undefined) {
      if (hasUpdates) query += ',';
      query += ` title = $${paramIndex}`;
      params.push(title);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (description !== undefined) {
      if (hasUpdates) query += ',';
      query += ` description = $${paramIndex}`;
      params.push(description);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (location !== undefined) {
      if (hasUpdates) query += ',';
      query += ` location = $${paramIndex}`;
      params.push(location);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (classField !== undefined) {
      if (hasUpdates) query += ',';
      query += ` class = $${paramIndex}`;
      params.push(classField);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (date_and_time !== undefined) {
      if (hasUpdates) query += ',';
      query += ` date_and_time = $${paramIndex}`;
      params.push(date_and_time);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (tags !== undefined) {
      if (hasUpdates) query += ',';
      query += ` tags = $${paramIndex}`;
      params.push(tags);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (capacity !== undefined) {
      if (hasUpdates) query += ',';
      query += ` capacity = $${paramIndex}`;
      params.push(capacity);
      paramIndex++;
      hasUpdates = true;
    }
    
    // ADD THESE NEW FIELDS:
    if (virtual_room_link !== undefined) {
      if (hasUpdates) query += ',';
      query += ` virtual_room_link = $${paramIndex}`;
      params.push(virtual_room_link);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (study_room !== undefined) {
      if (hasUpdates) query += ',';
      query += ` study_room = $${paramIndex}`;
      params.push(study_room);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (event_format !== undefined) {
      if (hasUpdates) query += ',';
      query += ` event_format = $${paramIndex}`;
      params.push(event_format);
      paramIndex++;
      hasUpdates = true;
    }

    if (banner_color !== undefined) {
      if (hasUpdates) query += ',';
      query += ` banner_color = $${paramIndex}`;
      params.push(banner_color);
      paramIndex++;
      hasUpdates = true;
    }
    
    if (!hasUpdates) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Event updated successfully',
      event: result.rows[0]
    });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.put('/events/:id/location', async (req, res) => {
  const { id } = req.params;
  const { location } = req.body;
  
  try {
    const result = await client.query(
      'UPDATE events SET location = $1 WHERE id = $2 RETURNING *',
      [location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      event: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete event
app.delete('/events/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Delete event (this will cascade delete event_attendees due to foreign key)
    const result = await client.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Comments endpoints
// Get comments for an event
app.get('/events/:eventId/comments', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        c.*,
        u.username,
        u.full_name,
        u.profile_picture_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.event_id = $1
      ORDER BY c.created_at ASC
    `, [eventId]);
    
    res.json({
      success: true,
      comments: result.rows
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Add a comment to an event
app.post('/events/:eventId/comments', async (req, res) => {
  const { eventId } = req.params;
  const { user_id, content } = req.body;
  
  if (!user_id || !content) {
    return res.status(400).json({ error: 'user_id and content are required' });
  }
  
  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }
  
  try {
    // Check if event exists
    const eventResult = await client.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if user exists
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Insert comment
    const result = await client.query(`
      INSERT INTO comments (event_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [eventId, user_id, content.trim()]);
    
    // Get the comment with user info
    const commentWithUser = await client.query(`
      SELECT 
        c.*,
        u.username,
        u.full_name,
        u.profile_picture_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: commentWithUser.rows[0]
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete a comment
app.delete('/events/:eventId/comments/:commentId', async (req, res) => {
  const { eventId, commentId } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    // Check if comment exists and belongs to user
    const commentResult = await client.query(`
      SELECT * FROM comments 
      WHERE id = $1 AND event_id = $2 AND user_id = $3
    `, [commentId, eventId, user_id]);
    
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }
    
    // Delete comment
    await client.query('DELETE FROM comments WHERE id = $1', [commentId]);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// RSVP endpoints
app.post('/events/:eventId/rsvpd', async (req, res) => {
  const { eventId } = req.params;
  const { user_id, status } = req.body;
  
  if (!user_id || !status) {
    return res.status(400).json({ error: 'user_id and status are required' });
  }
  
  if (!['accepted', 'declined', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be accepted, declined, or pending' });
  }
  
  try {
    console.log('RSVP request details:', { 
      eventId, 
      user_id, 
      status,
      requestBody: req.body,
      requestParams: req.params,
      requestHeaders: req.headers,
      extractedUserId: user_id,
      userIdType: typeof user_id
    });
    
    // Check if event exists
    const eventResult = await client.query('SELECT id, creator_id, rsvped_ids FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = eventResult.rows[0];
    
    // Check if user exists
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Insert or update RSVP in event_attendees table
    const result = await client.query(`
      INSERT INTO event_attendees (event_id, user_id, status, rsvp_date) 
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET status = $3, rsvp_date = NOW()
      RETURNING *
    `, [eventId, user_id, status]);
    
    // Update rsvped_ids array in events table
    let currentRsvpedIds = event.rsvped_ids || [];
    let updatedRsvpedIds;
    
    if (status === 'accepted') {
      // Add user to rsvped_ids if not already there
      if (!currentRsvpedIds.includes(user_id)) {
        updatedRsvpedIds = [...currentRsvpedIds, user_id];
      } else {
        updatedRsvpedIds = currentRsvpedIds;
      }
    } else {
      // Remove user from rsvped_ids for declined/pending
      updatedRsvpedIds = currentRsvpedIds.filter(id => id !== user_id);
    }
    
    // Update the events table with new rsvped_ids
    await client.query(`
      UPDATE events 
      SET rsvped_ids = $1 
      WHERE id = $2
    `, [updatedRsvpedIds, eventId]);
    
    console.log('Updated rsvped_ids:', { eventId, old: currentRsvpedIds, new: updatedRsvpedIds });
    
    // Create notification for event creator when someone RSVPs (only for accepted RSVPs)
    if (status === 'accepted' && event.creator_id !== user_id) {
      try {
        // Get the RSVPing user's username for the notification message
        const rsvpUserResult = await client.query('SELECT username FROM users WHERE id = $1', [user_id]);
        const rsvpUsername = rsvpUserResult.rows[0]?.username || 'Someone';
        
        // Get event title for the notification
        const eventTitleResult = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
        const eventTitle = eventTitleResult.rows[0]?.title || 'your event';
        
        // Create notification for the event creator
        await createNotification(
          event.creator_id, // event creator (recipient)
          user_id,          // RSVPing user (sender)
          'event_rsvp',
          `${rsvpUsername} RSVPed to ${eventTitle}`,
          eventId,
          { event_title: eventTitle, status: 'accepted' }
        );
        
        console.log(`Created RSVP notification for event creator ${event.creator_id}`);
      } catch (notificationError) {
        console.error('Error creating RSVP notification:', notificationError);
        // Don't fail the RSVP if notification creation fails
      }
    }
    
    // Create notification for the RSVPing user (self-notification for confirmation)
    if (status === 'accepted') {
      try {
        // Get event title for the notification
        const eventTitleResult = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
        const eventTitle = eventTitleResult.rows[0]?.title || 'an event';
        
        // Create notification for the RSVPing user
        await createNotification(
          user_id,          // RSVPing user (recipient - self)
          user_id,          // RSVPing user (sender - self)
          'event_rsvp_self',
          `You RSVPed to ${eventTitle}`,
          eventId,
          { event_title: eventTitle, status: 'accepted' }
        );
        
        console.log(`Created self RSVP notification for user ${user_id}`);
      } catch (notificationError) {
        console.error('Error creating self RSVP notification:', notificationError);
        // Don't fail the RSVP if notification creation fails
      }
    }
    
    res.json({
      success: true,
      message: 'RSVP updated successfully',
      rsvp: result.rows[0]
    });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/events/:eventId/rsvpd', async (req, res) => {
  const { eventId } = req.params;
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    const result = await client.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        rsvp: null,
        message: 'No RSVP found for this user and event'
      });
    }
    
    res.json({
      success: true,
      rsvp: result.rows[0]
    });
  } catch (err) {
    console.error('Get RSVP error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/events/:eventId/rsvpd', async (req, res) => {
  const { eventId } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    console.log('Delete RSVP request:', { eventId, user_id });
    
    // First get current rsvped_ids from events table
    const eventResult = await client.query('SELECT rsvped_ids FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const currentRsvpedIds = eventResult.rows[0].rsvped_ids || [];
    
    // Delete from event_attendees table
    const result = await client.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING *',
      [eventId, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RSVP not found' });
    }
    
    // Remove user from rsvped_ids array in events table
    const updatedRsvpedIds = currentRsvpedIds.filter(id => id !== user_id);
    
    await client.query(`
      UPDATE events 
      SET rsvped_ids = $1 
      WHERE id = $2
    `, [updatedRsvpedIds, eventId]);
    
    console.log('Updated rsvped_ids after delete:', { eventId, old: currentRsvpedIds, new: updatedRsvpedIds });
    
    // Create notification for event creator when someone cancels their RSVP
    try {
      // Get event creator ID
      const eventCreatorResult = await client.query('SELECT creator_id, title FROM events WHERE id = $1', [eventId]);
      if (eventCreatorResult.rows.length > 0) {
        const eventCreator = eventCreatorResult.rows[0];
        
        // Only notify if the user was previously accepted and is not the creator
        if (currentRsvpedIds.includes(user_id) && eventCreator.creator_id !== user_id) {
          // Get the cancelling user's username
          const cancelUserResult = await client.query('SELECT username FROM users WHERE id = $1', [user_id]);
          const cancelUsername = cancelUserResult.rows[0]?.username || 'Someone';
          
          // Create notification for the event creator
          await createNotification(
            eventCreator.creator_id, // event creator (recipient)
            user_id,                 // cancelling user (sender)
            'event_rsvp_cancel',
            `${cancelUsername} cancelled their RSVP to ${eventCreator.title || 'your event'}`,
            eventId,
            { event_title: eventCreator.title, status: 'cancelled' }
          );
          
          console.log(`Created RSVP cancellation notification for event creator ${eventCreator.creator_id}`);
        }
      }
    } catch (notificationError) {
      console.error('Error creating RSVP cancellation notification:', notificationError);
      // Don't fail the RSVP deletion if notification creation fails
    }
    
    // Create notification for the cancelling user (self-notification for confirmation)
    try {
      // Get event title for the notification
      const eventTitleResult = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
      const eventTitle = eventTitleResult.rows[0]?.title || 'an event';
      
      // Create notification for the cancelling user
      await createNotification(
        user_id,          // cancelling user (recipient - self)
        user_id,          // cancelling user (sender - self)
        'event_rsvp_cancel_self',
        `You cancelled your RSVP to ${eventTitle}`,
        eventId,
        { event_title: eventTitle, status: 'cancelled' }
      );
      
      console.log(`Created self RSVP cancellation notification for user ${user_id}`);
    } catch (notificationError) {
      console.error('Error creating self RSVP cancellation notification:', notificationError);
      // Don't fail the RSVP deletion if notification creation fails
    }
    
    res.json({
      success: true,
      message: 'RSVP removed successfully'
    });
  } catch (err) {
    console.error('Delete RSVP error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update RSVP status
app.put('/events/:eventId/rsvpd', async (req, res) => {
  const { eventId } = req.params;
  const { user_id, status } = req.body;
  
  if (!user_id || !status) {
    return res.status(400).json({ error: 'user_id and status are required' });
  }
  
  if (!['accepted', 'declined', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be accepted, declined, or pending' });
  }
  
  try {
    console.log('Update RSVP request:', { eventId, user_id, status });
    
    // Check if event exists and get current rsvped_ids
    const eventResult = await client.query('SELECT id, rsvped_ids FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const currentRsvpedIds = eventResult.rows[0].rsvped_ids || [];
    
    // Check if user exists
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if RSVP exists
    const existingRsvp = await client.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, user_id]
    );
    
    if (existingRsvp.rows.length === 0) {
      return res.status(404).json({ error: 'RSVP not found. User must have an existing RSVP to update.' });
    }
    
    // Update RSVP status in event_attendees table
    const result = await client.query(`
      UPDATE event_attendees 
      SET status = $1, rsvp_date = NOW()
      WHERE event_id = $2 AND user_id = $3
      RETURNING *
    `, [status, eventId, user_id]);
    
    // Update rsvped_ids array in events table
    let updatedRsvpedIds;
    
    if (status === 'accepted') {
      // Add user to rsvped_ids if not already there
      if (!currentRsvpedIds.includes(user_id)) {
        updatedRsvpedIds = [...currentRsvpedIds, user_id];
      } else {
        updatedRsvpedIds = currentRsvpedIds;
      }
    } else {
      // Remove user from rsvped_ids for declined/pending
      updatedRsvpedIds = currentRsvpedIds.filter(id => id !== user_id);
    }
    
    // Update the events table with new rsvped_ids
    await client.query(`
      UPDATE events 
      SET rsvped_ids = $1 
      WHERE id = $2
    `, [updatedRsvpedIds, eventId]);
    
    console.log('Updated rsvped_ids after status change:', { eventId, old: currentRsvpedIds, new: updatedRsvpedIds });
    
    // Create notification for event creator when RSVP status changes
    try {
      // Get event creator and title
      const eventCreatorResult = await client.query('SELECT creator_id, title FROM events WHERE id = $1', [eventId]);
      if (eventCreatorResult.rows.length > 0) {
        const eventCreator = eventCreatorResult.rows[0];
        
        // Only notify if the user is not the creator
        if (eventCreator.creator_id !== user_id) {
          // Get the RSVPing user's username
          const rsvpUserResult = await client.query('SELECT username FROM users WHERE id = $1', [user_id]);
          const rsvpUsername = rsvpUserResult.rows[0]?.username || 'Someone';
          
          let notificationMessage;
          let notificationType;
          
          if (status === 'accepted') {
            notificationMessage = `${rsvpUsername} RSVPed to ${eventCreator.title || 'your event'}`;
            notificationType = 'event_rsvp';
          } else if (status === 'declined') {
            notificationMessage = `${rsvpUsername} declined ${eventCreator.title || 'your event'}`;
            notificationType = 'event_rsvp_decline';
          } else if (status === 'pending') {
            notificationMessage = `${rsvpUsername} is pending for ${eventCreator.title || 'your event'}`;
            notificationType = 'event_rsvp_pending';
          }
          
          if (notificationMessage && notificationType) {
            await createNotification(
              eventCreator.creator_id, // event creator (recipient)
              user_id,                 // RSVPing user (sender)
              notificationType,
              notificationMessage,
              eventId,
              { event_title: eventCreator.title, status: status }
            );
            
            console.log(`Created RSVP status change notification for event creator ${eventCreator.creator_id}`);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error creating RSVP status change notification:', notificationError);
      // Don't fail the RSVP update if notification creation fails
    }
    
    // Create notification for the RSVPing user (self-notification for confirmation)
    try {
      // Get event title for the notification
      const eventTitleResult = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
      const eventTitle = eventTitleResult.rows[0]?.title || 'an event';
      
      let selfNotificationMessage;
      let selfNotificationType;
      
      if (status === 'accepted') {
        selfNotificationMessage = `You RSVPed to ${eventTitle}`;
        selfNotificationType = 'event_rsvp_self';
      } else if (status === 'declined') {
        selfNotificationMessage = `You declined ${eventTitle}`;
        selfNotificationType = 'event_rsvp_decline_self';
      } else if (status === 'pending') {
        selfNotificationMessage = `You set your RSVP to pending for ${eventTitle}`;
        selfNotificationType = 'event_rsvp_pending_self';
      }
      
      if (selfNotificationMessage && selfNotificationType) {
        await createNotification(
          user_id,          // RSVPing user (recipient - self)
          user_id,          // RSVPing user (sender - self)
          selfNotificationType,
          selfNotificationMessage,
          eventId,
          { event_title: eventTitle, status: status }
        );
        
        console.log(`Created self RSVP status change notification for user ${user_id}`);
      }
    } catch (notificationError) {
      console.error('Error creating self RSVP status change notification:', notificationError);
      // Don't fail the RSVP update if notification creation fails
    }
    
    res.json({
      success: true,
      message: 'RSVP status updated successfully',
      rsvp: result.rows[0]
    });
  } catch (err) {
    console.error('Update RSVP error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all RSVPs for an event
app.get('/events/:eventId/rsvps', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const result = await client.query(`
      SELECT 
        ea.*,
        u.username,
        u.full_name,
        u.profile_picture_url
      FROM event_attendees ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
      ORDER BY ea.rsvp_date DESC
    `, [eventId]);
    
    res.json({
      success: true,
      rsvps: result.rows
    });
  } catch (err) {
    console.error('Get RSVPs error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Saved events endpoints
app.post('/users/:id/saved-events', async (req, res) => {
  const { id } = req.params;
  const { event_id } = req.body;
  
  if (!event_id) {
    return res.status(400).json({ error: 'event_id is required' });
  }
  
  try {
    console.log('Save event request details:', { 
      userId: id, 
      eventId: event_id,
      requestBody: req.body,
      requestParams: req.params,
      requestHeaders: req.headers,
      extractedUserId: id,
      userIdType: typeof id
    });
    
    // Check if user exists
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if event exists and get current saved_ids
    const eventResult = await client.query('SELECT id, saved_ids FROM events WHERE id = $1', [event_id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const currentSavedIds = eventResult.rows[0].saved_ids || [];
    
    // First, let's create a saved_events table if it doesn't exist
    console.log('Creating saved_events table if it doesn\'t exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_events (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      )
    `);
    console.log('saved_events table ready');
    
    // Insert saved event into saved_events table
    const result = await client.query(`
      INSERT INTO saved_events (user_id, event_id) 
      VALUES ($1, $2)
      ON CONFLICT (user_id, event_id) DO NOTHING
      RETURNING *
    `, [id, event_id]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Event already saved',
        saved: true
      });
    }
    
    // Update saved_ids array in events table
    const updatedSavedIds = [...currentSavedIds, id];
    
    await client.query(`
      UPDATE events 
      SET saved_ids = $1 
      WHERE id = $2
    `, [updatedSavedIds, event_id]);
    
    console.log('Updated saved_ids:', { eventId: event_id, old: currentSavedIds, new: updatedSavedIds });
    
    res.json({
      success: true,
      message: 'Event saved successfully',
      saved_event: result.rows[0]
    });
  } catch (err) {
    console.error('Save event error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/users/:id/saved-events', async (req, res) => {
  const { id } = req.params;
  
  try {
    // First, ensure the saved_events table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_events (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      )
    `);
    
    const result = await client.query(`
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.profile_picture_url as creator_profile_picture,
        u.username as creator_username,
        se.saved_at
      FROM saved_events se
      JOIN events e ON se.event_id = e.id
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE se.user_id = $1
      ORDER BY se.saved_at DESC
    `, [id]);
    
    res.json({
      success: true,
      saved_events: result.rows
    });
  } catch (err) {
    console.error('Get saved events error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/users/:id/saved-events/:eventId', async (req, res) => {
  const { id, eventId } = req.params;

  try {
    console.log('Attempting to delete saved event:', { id, eventId });
    
    // First check if the record exists
    const checkResult = await client.query(
      'SELECT user_id, event_id FROM saved_events WHERE user_id = $1 AND event_id = $2',
      [id, eventId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Saved event not found' });
    }
    
    console.log('Found record to delete:', checkResult.rows[0]);
    
    // Get current saved_ids from events table
    const eventResult = await client.query('SELECT saved_ids FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const currentSavedIds = eventResult.rows[0].saved_ids || [];
    
    // Now delete from saved_events table
    const deleteResult = await client.query(
      'DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2',
      [id, eventId]
    );

    console.log('Delete result:', deleteResult);
    
    // Remove user from saved_ids array in events table
    const updatedSavedIds = currentSavedIds.filter(savedId => savedId !== id);
    
    await client.query(`
      UPDATE events 
      SET saved_ids = $1 
      WHERE id = $2
    `, [updatedSavedIds, eventId]);
    
    console.log('Updated saved_ids after delete:', { eventId, old: currentSavedIds, new: updatedSavedIds });

    res.json({
      success: true,
      message: 'Event removed from saved events'
    });
  } catch (err) {
    console.error('Remove saved event error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/users/:id/saved-events/:eventId', async (req, res) => {
  const { id, eventId } = req.params;
  
  try {
    const result = await client.query(
      'SELECT user_id, event_id, saved_at FROM saved_events WHERE user_id = $1 AND event_id = $2',
      [id, eventId]
    );
    
    res.json({
      success: true,
      is_saved: result.rows.length > 0,
      saved_event: result.rows[0] || null
    });
  } catch (err) {
    console.error('Check saved event error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete old entries endpoint
app.post('/admin/delete-old-entries', async (req, res) => {
  try {
    // Delete old events (older than 30 days)
    const eventsResult = await client.query(
      'DELETE FROM events WHERE date_and_time < NOW() - INTERVAL \'30 days\''
    );
    
    // Delete old event attendees (older than 60 days)
    const attendeesResult = await client.query(
      'DELETE FROM event_attendees WHERE rsvp_date < NOW() - INTERVAL \'60 days\''
    );
    

    
    res.json({
      success: true,
      message: 'Old entries deleted successfully',
      deleted: {
        events: eventsResult.rowCount,
        attendees: attendeesResult.rowCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// TwoFactor Authentication endpoints
app.post('/twofactor/send-code', async (req, res) => {
  const { userEmail, username } = req.body;
  
  if (!userEmail || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }
  
  try {
    // Generate 6-digit OTP
    const secretCode = Math.floor(Math.random() * 900000) + 100000;
    
    // Store OTP with user email as key
    otpStore.set(userEmail, {
      code: secretCode,
      timestamp: Date.now(),
      attempts: 0
    });
    
    // Send email with OTP
    const data = {
      Messages: [
        {
          From: {
            Email: "tylervo.2002@gmail.com",
            Name: "Cramr Team" 
          },
          To: [
            {
              Email: userEmail,
              Name: username
            },
          ],
          Subject: "Your One Time Passcode",
          TextPart: `Hello ${username},\n\nYou have tried to log in and your One Time Passcode is ${secretCode}. If you did not request a One Time Password, please change your password as soon as possible.\n\nThank you,\nThe Cramr Team`
        }
      ]
    };
    
    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request(data);
    
    const { Status } = result.body.Messages[0];
    
    if (Status === 'success') {
      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

app.post('/twofactor/verify-code', async (req, res) => {
  const { userEmail, otp } = req.body;
  
  if (!userEmail || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  
  try {
    const storedData = otpStore.get(userEmail);
    
    if (!storedData) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }
    
    // Check if OTP is expired (15 minutes)
    const now = Date.now();
    const otpAge = now - storedData.timestamp;
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (otpAge > fifteenMinutes) {
      otpStore.delete(userEmail);
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    // Check if too many attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(userEmail);
      return res.status(400).json({ error: 'Too many failed attempts' });
    }
    
    // Verify OTP
    if (storedData.code.toString() === otp.toString()) {
      // Clear OTP after successful verification
      otpStore.delete(userEmail);
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      // Increment attempts
      storedData.attempts += 1;
      otpStore.set(userEmail, storedData);
      
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP', details: err.message });
  }
});

// Profile picture upload endpoint
app.post('/users/:userId/profile-picture', upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile picture file provided' });
    }

    const { userId } = req.params;
    
    // Generate the URL for the uploaded profile picture
    const imageUrl = `http://132.249.242.182/uploads/${req.file.filename}`;
    
    // Update the user's profile_picture_url in the database
    const result = await client.query(
      'UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [imageUrl, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profile_picture_url: imageUrl,
      filename: req.file.filename,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture', details: error.message });
  }
});

// General image upload endpoints
app.post('/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate the URL for the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Get leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    // Get users ranked by number of events they've created
    const result = await client.query(`
      SELECT 
        u.id,
        u.username as name,
        u.profile_picture_url as avatar,
        COUNT(e.id) as events
      FROM users u
      LEFT JOIN events e ON u.id = e.creator_id
      GROUP BY u.id, u.username, u.profile_picture_url
      HAVING COUNT(e.id) > 0
      ORDER BY events DESC, u.username ASC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// FLASHCARD SETS ENDPOINTS
// GET all flashcard sets for a specific user
app.get('/flashcard_sets', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    const result = await client.query(
      'SELECT * FROM flashcard_sets WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new flashcard set for a user
app.post('/flashcard_sets', async (req, res) => {
  const { name, description, user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    const result = await client.query(
      'INSERT INTO flashcard_sets (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, user_id]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific flashcard set
app.get('/flashcard_sets/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    const result = await client.query(
      'SELECT * FROM flashcard_sets WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update specific flashcard set
app.put('/flashcard_sets/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, name, description } = req.body; // Get from body, not query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    const result = await client.query(
      'UPDATE flashcard_sets SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, description, id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE flashcard set
app.delete('/flashcard_sets/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query; // Get user_id from query, not body
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    const result = await client.query(
      'DELETE FROM flashcard_sets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    res.json({ message: 'Flashcard set deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FLASHCARDS ENDPOINTS

// GET all flashcards in a set
app.get('/flashcards/:set_id', async (req, res) => {
  const { set_id } = req.params;
  const { user_id } = req.query; // Get user_id from query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    // First verify the user owns the set
    const setResult = await client.query(
      'SELECT id FROM flashcard_sets WHERE id = $1 AND user_id = $2',
      [set_id, user_id]
    );
    
    if (setResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    
    const result = await client.query(
      'SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position, id',
      [set_id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new flashcard in a set
app.post('/flashcards/:set_id', async (req, res) => {
  const { set_id } = req.params;
  const { front, back, position, user_id } = req.body; // Get user_id from body
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    // First verify the user owns the set
    const setResult = await client.query(
      'SELECT id FROM flashcard_sets WHERE id = $1 AND user_id = $2',
      [set_id, user_id]
    );
    
    if (setResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    
    const result = await client.query(
      'INSERT INTO flashcards (set_id, front, back, position, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [set_id, front, back, position, user_id]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update flashcard
app.put('/flashcards/:id', async (req, res) => {
  const { id } = req.params;
  const { front, back, is_checked, position, user_id } = req.body; // Get user_id from body
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    const result = await client.query(
      'UPDATE flashcards SET front = $1, back = $2, is_checked = $3, position = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
      [front, back, is_checked, position, id, user_id] // Use id, not cardId
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE flashcard
app.delete('/flashcards/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query; // Get user_id from query
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  
  try {
    const result = await client.query(
      'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Error handling for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
    }
    return res.status(400).json({ error: 'File upload error', details: error.message });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }
  
  if (error.message.includes('File type not allowed!')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

// Upload study material
app.post('/events/:eventId/materials', studyMaterialUpload.single('file'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, isPublic = true, userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }

    const maxFileSize = 20 * 1024 * 1024;
    if (req.file.size > maxFileSize) {
      return res.status(400).json({ error: 'File size must be 20MB or less' });
    }

    const eventCheck = await client.query(
      'SELECT creator_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const materialsCountCheck = await client.query(
      'SELECT COUNT(*) as count FROM study_materials WHERE event_id = $1',
      [eventId]
    );
    
    if (parseInt(materialsCountCheck.rows[0].count) >= 10) {
      return res.status(400).json({ error: 'Event already has the maximum of 10 study materials' });
    }

    const attendeeCheck = await client.query(
      'SELECT status FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    if (eventCheck.rows[0].creator_id !== userId && 
        (attendeeCheck.rows.length === 0 || attendeeCheck.rows[0].status !== 'accepted')) {
      return res.status(403).json({ error: 'Not authorized to upload materials to this event' });
    }

    // Generate file URL
    const fileUrl = `http://132.249.242.182/uploads/study-materials/${req.file.filename}`;
    
    // Insert into database
    const result = await client.query(
      `INSERT INTO study_materials (
        event_id, user_id, title, description, file_name, file_url, 
        file_size, file_type, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        eventId, userId, title, description, req.file.originalname, fileUrl,
        req.file.size, req.file.mimetype, isPublic
      ]
    );

    // Update materials count in events table
    await client.query(
      'UPDATE events SET materials_count = materials_count + 1 WHERE id = $1',
      [eventId]
    );

    // Ensure materials_count is accurate by syncing with actual count
    await client.query(
      `UPDATE events 
       SET materials_count = (
         SELECT COUNT(*) FROM study_materials WHERE event_id = $1
       ) 
       WHERE id = $1`,
      [eventId]
    );

    res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully',
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Study material upload error:', error);
    res.status(500).json({ error: 'Failed to upload study material', details: error.message });
  }
});

// Get study materials for an event
app.get('/events/:eventId/materials', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await client.query(
      `SELECT 
        sm.*,
        u.username as uploader_username,
        u.full_name as uploader_full_name
      FROM study_materials sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.event_id = $1
      ORDER BY sm.uploaded_at DESC`,
      [eventId]
    );

    res.json({
      success: true,
      materials: result.rows
    });
  } catch (error) {
    console.error('Get study materials error:', error);
    res.status(500).json({ error: 'Failed to get study materials', details: error.message });
  }
});

// Delete study material
app.delete('/events/:eventId/materials/:materialId', async (req, res) => {
  try {
    const { eventId, materialId } = req.params;
    const { userId } = req.query; // From query parameters
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if user owns the material or is event creator
    const materialCheck = await client.query(
      `SELECT sm.user_id, e.creator_id, sm.file_name
       FROM study_materials sm
       JOIN events e ON sm.event_id = e.id
       WHERE sm.id = $1 AND sm.event_id = $2`,
      [materialId, eventId]
    );
    
    if (materialCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const material = materialCheck.rows[0];
    if (material.user_id !== userId && material.creator_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this material' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, 'uploads', 'study-materials', materialCheck.rows[0].file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await client.query(
      'DELETE FROM study_materials WHERE id = $1',
      [materialId]
    );

    // Update materials count
    await client.query(
      'UPDATE events SET materials_count = GREATEST(materials_count - 1, 0) WHERE id = $1',
      [eventId]
    );

    // Ensure materials_count is accurate by syncing with actual count
    await client.query(
      `UPDATE events 
       SET materials_count = (
         SELECT COUNT(*) FROM study_materials WHERE event_id = $1
       ) 
       WHERE id = $1`,
      [eventId]
    );

    res.json({
      success: true,
      message: 'Study material deleted successfully'
    });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({ error: 'Failed to delete study material', details: error.message });
  }
});

// Update study material (title, description, is_public)
app.put('/events/:eventId/materials/:materialId', async (req, res) => {
  try {
    const { eventId, materialId } = req.params;
    const { title, description, isPublic, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if user owns the material
    const materialCheck = await client.query(
      'SELECT user_id FROM study_materials WHERE id = $1 AND event_id = $2',
      [materialId, eventId]
    );
    
    if (materialCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    if (materialCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this material' });
    }

    // Update the material
    const result = await client.query(
      `UPDATE study_materials 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           is_public = COALESCE($3, is_public)
       WHERE id = $4 AND event_id = $5 
       RETURNING *`,
      [title, description, isPublic, materialId, eventId]
    );

    res.json({
      success: true,
      message: 'Study material updated successfully',
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Update study material error:', error);
    res.status(500).json({ error: 'Failed to update study material', details: error.message });
  }
});

// Get study material by ID
app.get('/events/:eventId/materials/:materialId', async (req, res) => {
  try {
    const { eventId, materialId } = req.params;
    
    const result = await client.query(
      `SELECT 
        sm.*,
        u.username as uploader_username,
        u.full_name as uploader_full_name
      FROM study_materials sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.id = $1 AND sm.event_id = $2`,
      [materialId, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    res.json({
      success: true,
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Get study material error:', error);
    res.status(500).json({ error: 'Failed to get study material', details: error.message });
  }
});

// Message endpoints
// Create a new message
app.post('/messages', async (req, res) => {
  const { sender_id, recipient_id, content } = req.body;
  
  if (!sender_id || !recipient_id || !content) {
    return res.status(400).json({ error: 'sender_id, recipient_id, and content are required' });
  }
  
  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  try {
    // Check if sender exists
    const senderResult = await client.query('SELECT id FROM users WHERE id = $1', [sender_id]);
    if (senderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    
    // Check if recipient exists
    const recipientResult = await client.query('SELECT id FROM users WHERE id = $1', [recipient_id]);
    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Create messages table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
    `);
    
    // Insert message
    const result = await client.query(`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [sender_id, recipient_id, content.trim()]);
    
    // Get the message with sender info
    const messageWithSender = await client.query(`
      SELECT 
        m.*,
        u.username as sender_username,
        u.full_name as sender_full_name,
        u.profile_picture_url as sender_profile_picture
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message: messageWithSender.rows[0]
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get conversation between two users
app.get('/messages/conversation/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    const result = await client.query(`
      SELECT 
        m.*,
        u.username as sender_username,
        u.full_name as sender_full_name,
        u.profile_picture_url as sender_profile_picture
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2) 
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at ASC
      LIMIT $3 OFFSET $4
    `, [userId1, userId2, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      messages: result.rows
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all conversations for a user
app.get('/users/:userId/conversations', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get the latest message from each conversation
    const result = await client.query(`
      WITH latest_messages AS (
        SELECT 
          m.*,
          u.username as other_username,
          u.full_name as other_full_name,
          u.profile_picture_url as other_profile_picture,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN m.sender_id = $1 THEN m.recipient_id 
                ELSE m.sender_id 
              END
            ORDER BY m.created_at DESC
          ) as rn
        FROM messages m
        LEFT JOIN users u ON (
          CASE 
            WHEN m.sender_id = $1 THEN m.recipient_id 
            ELSE m.sender_id 
          END = u.id
        )
        WHERE m.sender_id = $1 OR m.recipient_id = $1
      )
      SELECT * FROM latest_messages WHERE rn = 1
      ORDER BY created_at DESC
    `, [userId]);
    
    // Format the conversations
    const conversations = result.rows.map(row => ({
      conversation_id: row.sender_id === userId ? row.recipient_id : row.sender_id,
      other_user: {
        id: row.sender_id === userId ? row.recipient_id : row.sender_id,
        username: row.other_username,
        full_name: row.other_full_name,
        profile_picture_url: row.other_profile_picture
      },
      last_message: {
        id: row.id,
        content: row.content,
        is_from_me: row.sender_id === userId,
        created_at: row.created_at
      }
    }));
    
    res.json({
      success: true,
      conversations: conversations
    });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Mark messages as read
app.put('/messages/read', async (req, res) => {
  const { user_id, other_user_id } = req.body;
  
  if (!user_id || !other_user_id) {
    return res.status(400).json({ error: 'user_id and other_user_id are required' });
  }
  
  try {
    const result = await client.query(`
      UPDATE messages 
      SET is_read = true 
      WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false
      RETURNING COUNT(*) as updated_count
    `, [user_id, other_user_id]);
    
    res.json({
      success: true,
      message: 'Messages marked as read',
      updated_count: parseInt(result.rows[0].updated_count)
    });
  } catch (err) {
    console.error('Mark messages read error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get unread message count for a user
app.get('/users/:userId/messages/unread-count', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await client.query(`
      SELECT COUNT(*) as unread_count
      FROM messages 
      WHERE recipient_id = $1 AND is_read = false
    `, [userId]);
    
    res.json({
      success: true,
      unread_count: parseInt(result.rows[0].unread_count)
    });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete a message
app.delete('/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  try {
    // Check if message exists and belongs to user
    const messageResult = await client.query(`
      SELECT * FROM messages 
      WHERE id = $1 AND sender_id = $2
    `, [messageId, user_id]);
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }
    
    // Delete message
    await client.query('DELETE FROM messages WHERE id = $1', [messageId]);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Search users by username or email
app.get('/users/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const searchTerm = `%${q.trim()}%`;
    
    const result = await client.query(`
      SELECT id, username, email, full_name, profile_picture_url
      FROM users 
      WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $1 THEN 1
          WHEN full_name ILIKE $1 THEN 2
          WHEN email ILIKE $1 THEN 3
          ELSE 4
        END,
        username ASC
      LIMIT 10
    `, [searchTerm]);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

const PORT = 8080;

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database host:', process.env.NODE_ENV === 'production' ? 'postgres' : process.env.CRAMR_DB_IP_ADDR);
  });
}
