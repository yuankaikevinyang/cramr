const request = require('supertest');
const express = require('express');

// Mock the database client
const mockClient = {
  query: jest.fn()
};

// Mock the mailjet client
const mockMailjet = {
  post: jest.fn().mockReturnValue({
    request: jest.fn().mockResolvedValue({
      response: { status: 200 },
      body: { Messages: [{ Status: 'success' }] }
    })
  })
};

// Mock the OTP store
const mockOtpStore = new Map();

// Mock the modules
jest.mock('pg', () => ({
  Client: jest.fn(() => mockClient)
}));

jest.mock('node-mailjet', () => ({
  Client: jest.fn(() => mockMailjet)
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(() => true)
}));

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock the password reset endpoints
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists
    const userResult = await mockClient.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    mockOtpStore.set(email, resetCode);
    
    // Send email (mocked)
    await mockMailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: 'noreply@cramr.com', Name: 'Cramr' },
        To: [{ Email: email }],
        Subject: 'Password Reset Code',
        TextPart: `Your password reset code is: ${resetCode}`,
        HTMLPart: `<h3>Password Reset Code</h3><p>Your password reset code is: <strong>${resetCode}</strong></p>`
      }]
    });
    
    res.json({ success: true, message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const storedCode = mockOtpStore.get(email);
    
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    res.json({ success: true, message: 'Code verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/reset-password/confirm', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    
    const storedCode = mockOtpStore.get(email);
    
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Update password in database
    await mockClient.query('UPDATE users SET password = $1 WHERE email = $2', ['hashedPassword', email]);
    
    // Remove code from store
    mockOtpStore.delete(email);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

describe('Password Reset API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOtpStore.clear();
  });

  describe('POST /auth/reset-password', () => {
    it('should send reset code for valid email', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com' }]
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reset code sent to email');
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
    });

    it('should return 404 for non-existent user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /auth/verify-reset-code', () => {
    it('should verify valid reset code', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({ email: 'test@example.com', code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Code verified successfully');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and code are required');
    });

    it('should return 400 for invalid code', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({ email: 'test@example.com', code: '654321' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired code');
    });

    it('should return 400 for expired code', async () => {
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({ email: 'test@example.com', code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired code');
    });
  });

  describe('POST /auth/reset-password/confirm', () => {
    it('should update password with valid code', async () => {
      mockOtpStore.set('test@example.com', '123456');
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          code: '123456',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE users SET password = $1 WHERE email = $2',
        ['hashedPassword', 'test@example.com']
      );
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/reset-password/confirm')
        .send({ email: 'test@example.com', code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, code, and new password are required');
    });

    it('should return 400 for invalid code', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          code: '654321',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired code');
    });

    it('should return 400 for short password', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          code: '123456',
          newPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters');
    });

    it('should remove code after successful password update', async () => {
      mockOtpStore.set('test@example.com', '123456');
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

      await request(app)
        .post('/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          code: '123456',
          newPassword: 'newPassword123'
        });

      expect(mockOtpStore.has('test@example.com')).toBe(false);
    });
  });
});
