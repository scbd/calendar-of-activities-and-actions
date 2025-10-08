// Auto-generated set of all subjects used across activities, meetings, and notifications
import activities from './25-26-activities.js';
import { meetings } from './meetings.js';
import notifications from './notifications.js';

/**
 * Combines all subjects from:
 * - activities (subject field - comma-separated string)
 * - meetings (subjects field - array)
 * - notifications (themes field - array)
 * 
 * @returns {Set<string>} A set of all unique subject identifiers
 */
function getAllSubjects() {
  const subjectsSet = new Set();

  // Extract from activities - subject is a comma-separated string
  activities.forEach(activity => {
    if (activity.subject) {
      const subjects = activity.subject.split(',').map(s => s.trim()).filter(Boolean);

      subjects.forEach(subject => subjectsSet.add(subject));
    }
  });

  // Extract from meetings - subjects is an array
  meetings.forEach(meeting => {
    if (meeting.subjects && Array.isArray(meeting.subjects)) {
      meeting.subjects.forEach(subject => subjectsSet.add(subject));
    }
  });

  // Extract from notifications - themes is an array
  notifications.forEach(notification => {
    if (notification.themes && Array.isArray(notification.themes)) {
      notification.themes.forEach(theme => subjectsSet.add(theme));
    }
  });

  return subjectsSet;
}

export const subjectsUsed = getAllSubjects();

export default subjectsUsed;
