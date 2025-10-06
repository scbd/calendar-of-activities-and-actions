import { describe, it, expect } from 'vitest';
import { 
  getRelatedNotificationsForMeeting, 
  getRelatedNotificationsForActivity,
  convertToNotificationEntries,
} from 'shared/utils/notifications';
import type { CalendarDoc } from 'shared/types/calendar';

describe('Notification Symbol as Key', () => {
  const mockNotification1: CalendarDoc = {
    id: 'notification-123',
    identifier: 'notification-123',
    schema: 'notification',
    type: 'Notification',
    symbol: '2025-001',
    titleEn: 'Test Notification',
  };

  const mockNotification2: CalendarDoc = {
    id: 'notification-456',
    identifier: 'notification-456',
    schema: 'notification',
    type: 'Notification',
    symbol: '2025-002',
    titleEn: 'Another Test Notification',
  };

  const mockMeeting: CalendarDoc = {
    id: 'meeting-1',
    identifier: 'meeting-1',
    schema: 'meeting',
    type: 'Meeting',
    meetingCode: 'TEST-2025',
    titleEn: 'Test Meeting',
    notifications: ['2025-001', '2025-002'], // Uses symbols, not IDs
  };

  const mockActivity: CalendarDoc = {
    id: 'ACT-2025-99',
    identifier: 'ACT-2025-99',
    schema: 'activity',
    type: 'Activity',
    titleEn: 'Test Activity',
    relatedDocuments: '2025-001, 2025-002', // Contains notification symbols
  };

  const allDocs = [mockNotification1, mockNotification2, mockMeeting, mockActivity];

  describe('getRelatedNotificationsForMeeting', () => {
    it('should find notifications using symbol as key', () => {
      const related = getRelatedNotificationsForMeeting(mockMeeting, allDocs);
      
      expect(related).toHaveLength(2);
      expect(related.map(n => n.symbol)).toContain('2025-001');
      expect(related.map(n => n.symbol)).toContain('2025-002');
    });

    it('should only match notifications with correct symbol', () => {
      const meetingWithOneNotif: CalendarDoc = {
        ...mockMeeting,
        id: 'meeting-2',
        notifications: ['2025-001'], // Only one symbol
      };

      const related = getRelatedNotificationsForMeeting(meetingWithOneNotif, allDocs);
      
      expect(related).toHaveLength(1);
      expect(related[0].symbol).toBe('2025-001');
    });

    it('should return empty array if no notifications match', () => {
      const meetingNoMatch: CalendarDoc = {
        ...mockMeeting,
        id: 'meeting-3',
        notifications: ['2025-999'], // Non-existent symbol
      };

      const related = getRelatedNotificationsForMeeting(meetingNoMatch, allDocs);
      
      expect(related).toHaveLength(0);
    });
  });

  describe('getRelatedNotificationsForActivity', () => {
    it('should find notifications using symbol extracted from activity', () => {
      const related = getRelatedNotificationsForActivity(mockActivity, allDocs);
      
      expect(related).toHaveLength(2);
      expect(related.map(n => n.symbol)).toContain('2025-001');
      expect(related.map(n => n.symbol)).toContain('2025-002');
    });
  });

  describe('convertToNotificationEntries', () => {
    it('should use symbol as key in display entries', () => {
      const entries = convertToNotificationEntries([mockNotification1, mockNotification2]);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBe('2025-001');
      expect(entries[1].key).toBe('2025-002');
    });

    it('should filter out notifications without symbol', () => {
      const notifWithoutSymbol: CalendarDoc = {
        id: 'notification-no-symbol',
        identifier: 'notification-no-symbol',
        schema: 'notification',
        type: 'Notification',
        titleEn: 'Notification without symbol',
        // No symbol field
      };

      const entries = convertToNotificationEntries([mockNotification1, notifWithoutSymbol]);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('2025-001');
    });
  });

  describe('Symbol consistency', () => {
    it('should use symbol field, not notificationKey or id', () => {
      // Test that we're strictly using symbol field
      const notifWithMultipleIds: CalendarDoc = {
        id: 'some-long-id',
        identifier: 'some-identifier',
        schema: 'notification',
        type: 'Notification',
        symbol: '2025-003',
        notificationKey: '2025-999', // Different value - should be ignored
        titleEn: 'Notification with multiple IDs',
      };

      const meeting: CalendarDoc = {
        id: 'meeting-test',
        identifier: 'meeting-test',
        schema: 'meeting',
        type: 'Meeting',
        notifications: ['2025-003'], // Matching the symbol, not notificationKey
      };

      const related = getRelatedNotificationsForMeeting(meeting, [notifWithMultipleIds, meeting]);
      
      expect(related).toHaveLength(1);
      expect(related[0].symbol).toBe('2025-003');
    });
  });
});
