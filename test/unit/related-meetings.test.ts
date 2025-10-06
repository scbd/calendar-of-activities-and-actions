import { describe, it, expect } from 'vitest';
import { getRelatedMeetingsForActivity, getRelatedActivitiesForMeeting } from 'shared/utils/notifications';
import type { CalendarDoc } from 'shared/types/calendar';

describe('Related Meetings and Activities', () => {
  const mockMeeting: CalendarDoc = {
    id: '52000000cbd00500000019a1',
    identifier: '52000000cbd00500000019a1',
    schema: 'meeting',
    type: 'Meeting',
    meetingCode: 'CP-RA-OM-2025-2',
    titleEn: 'Open-ended Online Forum on Risk Assessment',
    activities: ['ACT-2025-11', 'ACT-2025-27'],
  };

  const mockActivity1: CalendarDoc = {
    id: 'ACT-2025-11',
    identifier: 'ACT-2025-11',
    schema: 'activity',
    type: 'Activity',
    titleEn: 'Activity linked to meeting by code',
    meetings: ['CP-RA-OM-2025-2'],
  };

  const mockActivity2: CalendarDoc = {
    id: 'ACT-2025-27',
    identifier: 'ACT-2025-27',
    schema: 'activity',
    type: 'Activity',
    titleEn: 'Another activity linked to meeting',
    meetings: ['CP-RA-OM-2025-2'],
  };

  const mockActivityNoMeeting: CalendarDoc = {
    id: 'ACT-2025-99',
    identifier: 'ACT-2025-99',
    schema: 'activity',
    type: 'Activity',
    titleEn: 'Activity with no meetings',
    meetings: [],
  };

  const allDocs = [mockMeeting, mockActivity1, mockActivity2, mockActivityNoMeeting];

  describe('getRelatedMeetingsForActivity', () => {
    it('should find meetings by meetingCode', () => {
      const related = getRelatedMeetingsForActivity(mockActivity1, allDocs);
      
      expect(related).toHaveLength(1);
      expect(related[0].id).toBe(mockMeeting.id);
      expect(related[0].meetingCode).toBe('CP-RA-OM-2025-2');
    });

    it('should return empty array for activity with no meetings', () => {
      const related = getRelatedMeetingsForActivity(mockActivityNoMeeting, allDocs);
      
      expect(related).toHaveLength(0);
    });

    it('should handle multiple activities linking to same meeting', () => {
      const related1 = getRelatedMeetingsForActivity(mockActivity1, allDocs);
      const related2 = getRelatedMeetingsForActivity(mockActivity2, allDocs);
      
      expect(related1).toHaveLength(1);
      expect(related2).toHaveLength(1);
      expect(related1[0].id).toBe(related2[0].id);
    });
  });

  describe('getRelatedActivitiesForMeeting', () => {
    it('should find activities by identifier', () => {
      const related = getRelatedActivitiesForMeeting(mockMeeting, allDocs);
      
      expect(related).toHaveLength(2);
      expect(related.map(a => a.id)).toContain('ACT-2025-11');
      expect(related.map(a => a.id)).toContain('ACT-2025-27');
    });

    it('should only return activity documents (not meetings or notifications)', () => {
      const related = getRelatedActivitiesForMeeting(mockMeeting, allDocs);
      
      related.forEach(doc => {
        expect(doc.schema).not.toBe('meeting');
        expect(doc.schema).not.toBe('notification');
      });
    });

    it('should return empty array for meeting with no activities', () => {
      const meetingNoActivities: CalendarDoc = {
        ...mockMeeting,
        id: 'meeting-2',
        activities: [],
      };
      
      const related = getRelatedActivitiesForMeeting(meetingNoActivities, allDocs);
      
      expect(related).toHaveLength(0);
    });
  });
});
