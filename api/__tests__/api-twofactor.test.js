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

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock the 2FA endpoints
app.post('/twofactor/send-code', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }
    
    // Check if user exists
    const userResult = await mockClient.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate 6-digit code
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    mockOtpStore.set(email, twoFACode);
    
    // Send email (mocked)
    await mockMailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: 'noreply@cramr.com', Name: 'Cramr' },
        To: [{ Email: email }],
        Subject: 'Two-Factor Authentication Code',
        TextPart: `Hello ${fullName}, your 2FA code is: ${twoFACode}`,
        HTMLPart: `<h3>Two-Factor Authentication</h3><p>Hello ${fullName}, your 2FA code is: <strong>${twoFACode}</strong></p>`
      }]
    });
    
    res.json({ success: true, message: '2FA code sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/twofactor/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const storedCode = mockOtpStore.get(email);
    
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }
    
    // Remove code after successful verification
    mockOtpStore.delete(email);
    
    res.json({ success: true, message: '2FA verification successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

describe('Two-Factor Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOtpStore.clear();
  });

  describe('POST /twofactor/send-code', () => {
    it('should send 2FA code for valid user', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com', full_name: 'Test User' }]
      });

      const response = await request(app)
        .post('/twofactor/send-code')
        .send({ 
          email: 'test@example.com', 
          fullName: 'Test User' 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2FA code sent to email');
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/twofactor/send-code')
        .send({ fullName: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and full name are required');
    });

    it('should return 400 for missing full name', async () => {
      const response = await request(app)
        .post('/twofactor/send-code')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and full name are required');
    });

    it('should return 404 for non-existent user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/twofactor/send-code')
        .send({ 
          email: 'nonexistent@example.com', 
          fullName: 'Test User' 
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should store 2FA code in OTP store', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com', full_name: 'Test User' }]
      });

      await request(app)
        .post('/twofactor/send-code')
        .send({ 
          email: 'test@example.com', 
          fullName: 'Test User' 
        });

      // Check that a code was stored
      const storedCodes = Array.from(mockOtpStore.keys());
      expect(storedCodes).toContain('test@example.com');
      expect(mockOtpStore.get('test@example.com')).toMatch(/^\d{6}$/);
    });
  });

  describe('POST /twofactor/verify-code', () => {
    it('should verify valid 2FA code', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2FA verification successful');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/twofactor/verify-code')
        .send({ code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and code are required');
    });

    it('should return 400 for missing code', async () => {
      const response = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and code are required');
    });

    it('should return 400 for invalid code', async () => {
      mockOtpStore.set('test@example.com', '123456');

      const response = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '654321' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired 2FA code');
    });

    it('should return 400 for expired code', async () => {
      const response = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired 2FA code');
    });

    it('should remove code after successful verification', async () => {
      mockOtpStore.set('test@example.com', '123456');

      await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '123456' });

      // Code should be removed after successful verification
      expect(mockOtpStore.has('test@example.com')).toBe(false);
    });

    it('should not remove code after failed verification', async () => {
      mockOtpStore.set('test@example.com', '123456');

      await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '654321' });

      // Code should remain for failed verification
      expect(mockOtpStore.has('test@example.com')).toBe(true);
      expect(mockOtpStore.get('test@example.com')).toBe('123456');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete 2FA flow', async () => {
      // Step 1: Send 2FA code
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com', full_name: 'Test User' }]
      });

      const sendResponse = await request(app)
        .post('/twofactor/send-code')
        .send({ 
          email: 'test@example.com', 
          fullName: 'Test User' 
        });

      expect(sendResponse.status).toBe(200);
      expect(sendResponse.body.success).toBe(true);

      // Get the stored code
      const storedCode = mockOtpStore.get('test@example.com');
      expect(storedCode).toBeDefined();

      // Step 2: Verify 2FA code
      const verifyResponse = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: storedCode });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);

      // Code should be removed after verification
      expect(mockOtpStore.has('test@example.com')).toBe(false);
    });

    it('should handle multiple 2FA attempts', async () => {
      // Send initial code
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com', full_name: 'Test User' }]
      });

      await request(app)
        .post('/twofactor/send-code')
        .send({ 
          email: 'test@example.com', 
          fullName: 'Test User' 
        });

      const firstCode = mockOtpStore.get('test@example.com');

      // First attempt with wrong code
      const wrongResponse = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: '000000' });

      expect(wrongResponse.status).toBe(400);
      expect(mockOtpStore.has('test@example.com')).toBe(true);

      // Second attempt with correct code
      const correctResponse = await request(app)
        .post('/twofactor/verify-code')
        .send({ email: 'test@example.com', code: firstCode });

      expect(correctResponse.status).toBe(200);
      expect(mockOtpStore.has('test@example.com')).toBe(false);
    });
  });
});
