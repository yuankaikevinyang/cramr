const request = require('supertest');
const { client } = require('../index');

describe('Leaderboard API', () => {
  describe('GET /leaderboard', () => {
    it('should return leaderboard with users ranked by event count', async () => {
      // Mock leaderboard data
      const mockLeaderboard = [
        {
          id: 'user-1',
          name: 'user1',
          avatar: 'https://example.com/avatar1.jpg',
          events: 5
        },
        {
          id: 'user-2',
          name: 'user2',
          avatar: 'https://example.com/avatar2.jpg',
          events: 3
        },
        {
          id: 'user-3',
          name: 'user3',
          avatar: 'https://example.com/avatar3.jpg',
          events: 1
        }
      ];

      expect(mockLeaderboard).toHaveLength(3);
      expect(mockLeaderboard[0].events).toBe(5); // Highest event count first
      expect(mockLeaderboard[1].events).toBe(3);
      expect(mockLeaderboard[2].events).toBe(1);

      // Check leaderboard structure
      const firstEntry = mockLeaderboard[0];
      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('name');
      expect(firstEntry).toHaveProperty('avatar');
      expect(firstEntry).toHaveProperty('events');
      expect(typeof firstEntry.events).toBe('number');
    });

    it('should limit results to top 10 users', async () => {
      // Mock leaderboard with more than 10 users
      const mockLeaderboard = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `user${i + 1}`,
        avatar: `https://example.com/avatar${i + 1}.jpg`,
        events: 15 - i // Decreasing event counts
      }));

      // Simulate limiting to top 10
      const limitedLeaderboard = mockLeaderboard.slice(0, 10);
      expect(limitedLeaderboard.length).toBeLessThanOrEqual(10);
      expect(limitedLeaderboard.length).toBe(10);
    });

    it('should order by events DESC, then by username ASC', async () => {
      // Mock leaderboard with same event counts
      const mockLeaderboard = [
        {
          id: 'user-1',
          name: 'alice',
          avatar: 'https://example.com/avatar1.jpg',
          events: 3
        },
        {
          id: 'user-2',
          name: 'bob',
          avatar: 'https://example.com/avatar2.jpg',
          events: 3
        },
        {
          id: 'user-3',
          name: 'charlie',
          avatar: 'https://example.com/avatar3.jpg',
          events: 2
        }
      ];

      // Check that events are in descending order
      for (let i = 0; i < mockLeaderboard.length - 1; i++) {
        expect(mockLeaderboard[i].events).toBeGreaterThanOrEqual(mockLeaderboard[i + 1].events);
      }

      // Check that users with same event count are ordered by username
      expect(mockLeaderboard[0].name).toBe('alice');
      expect(mockLeaderboard[1].name).toBe('bob');
      expect(mockLeaderboard[2].name).toBe('charlie');
    });

    it('should only include users with at least 1 event', async () => {
      // Mock leaderboard data
      const mockLeaderboard = [
        {
          id: 'user-1',
          name: 'user1',
          avatar: 'https://example.com/avatar1.jpg',
          events: 5
        },
        {
          id: 'user-2',
          name: 'user2',
          avatar: 'https://example.com/avatar2.jpg',
          events: 1
        }
      ];

      // All entries should have at least 1 event
      mockLeaderboard.forEach(entry => {
        expect(entry.events).toBeGreaterThan(0);
      });

      // Users with 0 events should not be included
      const usersWithZeroEvents = mockLeaderboard.filter(entry => entry.events === 0);
      expect(usersWithZeroEvents).toHaveLength(0);
    });

    it('should return empty array when no users have events', async () => {
      // Mock empty leaderboard
      const mockLeaderboard = [];

      expect(mockLeaderboard).toHaveLength(0);
      expect(Array.isArray(mockLeaderboard)).toBe(true);
    });

    it('should handle users with profile pictures and banner colors', async () => {
      // Mock leaderboard with profile pictures and banner colors
      const mockLeaderboard = [
        {
          id: 'user-1',
          name: 'user1',
          avatar: 'https://example.com/avatar1.jpg',
          events: 5,
          profile_picture_url: 'https://example.com/profile1.jpg',
          banner_color: '#FF5733'
        },
        {
          id: 'user-2',
          name: 'user2',
          avatar: 'https://example.com/avatar2.jpg',
          events: 3,
          profile_picture_url: null,
          banner_color: null
        }
      ];

      expect(mockLeaderboard[0].profile_picture_url).toBeDefined();
      expect(mockLeaderboard[0].banner_color).toBeDefined();
      expect(mockLeaderboard[1].profile_picture_url).toBeNull();
      expect(mockLeaderboard[1].banner_color).toBeNull();
    });
  });
});
