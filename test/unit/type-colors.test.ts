import { describe, it, expect } from 'vitest';
import {
  CBD_GREEN,
  getTypeColor,
  getTypeForegroundColor,
  normalizeTypeKey,
} from '../../shared/utils/type-colors';

describe('calendar type color helpers', () => {
  it('uses CBD green for COP, SBSTTA and SBI variants', () => {
    const specialTypes = ['cop', 'COP-16', 'SBSTTA-27', 'Subsidiary Body on Implementation'];

    specialTypes.forEach(type => {
      const color = getTypeColor(type);

      expect(color.background).toBe(CBD_GREEN);
    });
  });

  it('keeps non-reserved types on non-green palette entries', () => {
    const otherTypes = [
      'Meeting',
      'Nominations',
      'Submission of Information',
      'Peer-Review',
      'Report',
      'Forum',
      'Activity',
      'Webinar',
      'Workshop',
      'Campaign'
    ];

    otherTypes.forEach(type => {
      const color = getTypeColor(type);

      expect(color.background).not.toBe(CBD_GREEN);
    });
  });

  it('normalizes descriptive labels to semantic keys', () => {
    expect(normalizeTypeKey('Conference of the Parties')).toBe('cop');
    expect(normalizeTypeKey('Capacity-building training')).toBe('training');
    expect(normalizeTypeKey('Global awareness campaign')).toBe('campaign');
    expect(normalizeTypeKey('Submission of Information')).toBe('submission');
    expect(normalizeTypeKey('Nomination of experts')).toBe('nominations');
    expect(normalizeTypeKey('Peer review process')).toBe('peerReview');
    expect(normalizeTypeKey('Unmapped category')).toBe('other');
  });

  it('derives text color from either type keys or palettes', () => {
    const palette = getTypeColor('meeting');

    expect(getTypeForegroundColor('meeting')).toBe(palette.text);
    expect(getTypeForegroundColor(palette)).toBe(palette.text);
  });
});
