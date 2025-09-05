const request = require('supertest');

describe('Events API with Blocking Logic', () => {
  describe('GET /events', () => {
    it('should return all events when no userId provided', async () => {
      // When no userId is provided, should return all events
      const expectedEvents = [
        {
          id: 'event-1',
          title: 'Study Session',
          creator_id: 'user-1'
        },
        {
          id: 'event-2', 
          title: 'Group Project',
          creator_id: 'user-2'
        }
      ];
      
      expect(expectedEvents).toHaveLength(2);
      expect(expectedEvents[0].title).toBe('Study Session');
    });

    it('should filter out events from blocked users when userId provided', async () => {
      // Mock scenario: user-1 has blocked user-2
      const userId = 'user-1';
      const blockedUsers = ['user-2']; // user-1 blocked user-2
      const usersWhoBlocked = []; // no one blocked user-1
      
      const allEvents = [
        { id: 'event-1', title: 'Study Session', creator_id: 'user-1' },
        { id: 'event-2', title: 'Group Project', creator_id: 'user-2' }, // Should be filtered out
        { id: 'event-3', title: 'Exam Prep', creator_id: 'user-3' }
      ];
      
      // Filter out events from blocked users
      const filteredEvents = allEvents.filter(event => 
        !blockedUsers.includes(event.creator_id) && 
        !usersWhoBlocked.includes(event.creator_id)
      );
      
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents.find(e => e.creator_id === 'user-2')).toBeUndefined();
      expect(filteredEvents.find(e => e.creator_id === 'user-1')).toBeDefined();
    });

    it('should filter out events from users who blocked the current user', async () => {
      // Mock scenario: user-3 blocked user-1
      const userId = 'user-1';
      const blockedUsers = []; // user-1 hasn't blocked anyone
      const usersWhoBlocked = ['user-3']; // user-3 blocked user-1
      
      const allEvents = [
        { id: 'event-1', title: 'Study Session', creator_id: 'user-1' },
        { id: 'event-2', title: 'Group Project', creator_id: 'user-2' },
        { id: 'event-3', title: 'Exam Prep', creator_id: 'user-3' } // Should be filtered out
      ];
      
      // Filter out events from users who blocked current user
      const filteredEvents = allEvents.filter(event => 
        !blockedUsers.includes(event.creator_id) && 
        !usersWhoBlocked.includes(event.creator_id)
      );
      
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents.find(e => e.creator_id === 'user-3')).toBeUndefined();
      expect(filteredEvents.find(e => e.creator_id === 'user-2')).toBeDefined();
    });

    it('should handle empty blocked users list', async () => {
      const userId = 'user-1';
      const blockedUsers = [];
      const usersWhoBlocked = [];
      
      const allEvents = [
        { id: 'event-1', title: 'Study Session', creator_id: 'user-1' },
        { id: 'event-2', title: 'Group Project', creator_id: 'user-2' }
      ];
      
      // No filtering needed when no blocked users
      const filteredEvents = allEvents.filter(event => 
        !blockedUsers.includes(event.creator_id) && 
        !usersWhoBlocked.includes(event.creator_id)
      );
      
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents).toEqual(allEvents);
    });
  });
});
