const request = require('supertest');
const express = require('express');

// Mock the database client
const mockClient = {
  query: jest.fn(),
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

app.post('/send-2fa', async (req, res) => {
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

    // Send email (mocked)
    await mockMailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: 'noreply@cramr.com', Name: 'Cramr' },
        To: [{ Email: email }],
        Subject: 'Two-Factor Authentication Code',
        TextPart: `Hello ${fullName}, your 2FA code is: <CodeHere>`,
        HTMLPart: `<h3>Two-Factor Authentication</h3><p>Hello ${fullName}, your 2FA code is: <strong><CodeHere></strong></p>`
      }]
    });

    res.json({ success: true, message: '2FA code sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

describe('Two-Factor Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /send-2fa', () => {
    it('should send 2FA code for valid user', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'test@example.com', full_name: 'Test User' }]
      });

      const response = await request(app)
        .post('/send-2fa')
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

      // Check that the Mailjet API was called with the correct parameters
      expect(mockMailjet.post).toHaveBeenCalledWith(
        'send', 
        { version: 'v3.1' }
      );
      expect(mockMailjet.post().request).toHaveBeenCalledWith({
        Messages: [{
          From: { Email: 'noreply@cramr.com', Name: 'Cramr' },
          To: [{ Email: 'test@example.com' }],
          Subject: 'Two-Factor Authentication Code',
          TextPart: 'Hello Test User, your 2FA code is: <CodeHere>',
          HTMLPart: '<h3>Two-Factor Authentication</h3><p>Hello Test User, your 2FA code is: <strong><CodeHere></strong></p>'
        }]
      });
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/send-2fa')
        .send({ fullName: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and full name are required');
    });

    it('should return 400 for missing full name', async () => {
      const response = await request(app)
        .post('/send-2fa')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and full name are required');
    });

    it('should return 404 for non-existent user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/send-2fa')
        .send({ 
          email: 'nonexistent@example.com', 
          fullName: 'Test User' 
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });
});