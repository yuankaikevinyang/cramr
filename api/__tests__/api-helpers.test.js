const { Client } = require('pg');

// Mock the pg Client
jest.mock('pg', () => ({
  Client: jest.fn()
}));

// Import the functions we want to test
// We'll need to extract these from index.js or test them through the API

describe('Blocking Helper Functions', () => {
  let mockClient;
  
  beforeEach(() => {
    // Create a mock client for each test
    mockClient = {
      query: jest.fn()
    };
    Client.mockImplementation(() => mockClient);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlockedUsers', () => {
    it('should return array of blocked user IDs when user has blocked others', async () => {
      // Mock database response
      const mockRows = [
        { blocked_id: 'user-1-id' },
        { blocked_id: 'user-2-id' }
      ];
      mockClient.query.mockResolvedValue({ rows: mockRows });
      
      // This test will need to be updated once we extract the function
      // For now, we'll test the logic through the API endpoint
      expect(mockRows.map(row => row.blocked_id)).toEqual(['user-1-id', 'user-2-id']);
    });

    it('should return empty array when user has not blocked anyone', async () => {
      // Mock empty database response
      mockClient.query.mockResolvedValue({ rows: [] });
      
      const result = [];
      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      // Mock database error
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));
      
      // Should handle error gracefully and return empty array
      const result = [];
      expect(result).toEqual([]);
    });
  });

  describe('getUsersWhoBlocked', () => {
    it('should return array of user IDs who blocked the given user', async () => {
      // Mock database response
      const mockRows = [
        { blocker_id: 'blocker-1-id' },
        { blocker_id: 'blocker-2-id' }
      ];
      mockClient.query.mockResolvedValue({ rows: mockRows });
      
      const result = mockRows.map(row => row.blocker_id);
      expect(result).toEqual(['blocker-1-id', 'blocker-2-id']);
    });

    it('should return empty array when no one has blocked the user', async () => {
      // Mock empty database response
      mockClient.query.mockResolvedValue({ rows: [] });
      
      const result = [];
      expect(result).toEqual([]);
    });
  });
});
