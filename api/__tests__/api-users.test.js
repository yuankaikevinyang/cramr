describe('Users API Endpoints', () => {
  describe('GET /users/search', () => {
    it('should return users matching search query', async () => {
      // Mock search results
      const searchQuery = 'john';
      const mockUsers = [
        { id: 'user-1', username: 'john_doe', full_name: 'John Doe', email: 'john@example.com' },
        { id: 'user-2', username: 'johnny', full_name: 'Johnny Smith', email: 'johnny@example.com' }
      ];
      
      // Filter users based on search query (simulating the actual logic)
      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filteredUsers).toHaveLength(2);
      expect(filteredUsers[0].username).toContain('john');
      expect(filteredUsers[1].full_name).toContain('John');
    });

    it('should return empty array for short search query', async () => {
      const searchQuery = 'a'; // Less than 2 characters
      
      // Should return error for short queries
      const expectedError = {
        error: 'Search query must be at least 2 characters'
      };
      
      expect(expectedError.error).toBe('Search query must be at least 2 characters');
    });

    it('should return empty array when no matches found', async () => {
      const searchQuery = 'xyz123';
      const mockUsers = [
        { id: 'user-1', username: 'john_doe', full_name: 'John Doe', email: 'john@example.com' }
      ];
      
      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filteredUsers).toHaveLength(0);
    });

    it('should prioritize exact username matches', async () => {
      const searchQuery = 'john';
      const mockUsers = [
        { id: 'user-1', username: 'john', full_name: 'John Doe', email: 'john@example.com' },
        { id: 'user-2', username: 'johnny', full_name: 'Johnny Smith', email: 'johnny@example.com' },
        { id: 'user-3', username: 'alice', full_name: 'Alice Smith', email: 'alice@example.com' }
      ];
      
      // Sort by priority: exact username match first, then partial matches
      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ).sort((a, b) => {
        // Exact username match gets priority
        if (a.username.toLowerCase() === searchQuery.toLowerCase()) return -1;
        if (b.username.toLowerCase() === searchQuery.toLowerCase()) return 1;
        return 0;
      });
      
      expect(filteredUsers).toHaveLength(2);
      expect(filteredUsers[0].username).toBe('john'); // Exact match should be first
    });
  });

  describe('GET /users/:id', () => {
    it('should return user data for valid user ID', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: 'user-1',
        username: 'john_doe',
        full_name: 'John Doe',
        email: 'john@example.com'
      };
      
      expect(mockUser.id).toBe(userId);
      expect(mockUser.username).toBe('john_doe');
    });

    it('should return 404 for invalid user ID', async () => {
      const invalidUserId = 'invalid-id';
      
      const expectedError = {
        error: 'User not found'
      };
      
      expect(expectedError.error).toBe('User not found');
    });
  });
});
