export const CBD_GREEN = '#009b48';

export type CalendarTypeKey =
  | 'cop'
  | 'sbstta'
  | 'sbi'
  | 'meeting'
  | 'notification'
  | 'nominations'
  | 'submission'
  | 'peerReview'
  | 'report'
  | 'forum'
  | 'activity'
  | 'calendarActivity'
  | 'webinar'
  | 'workshop'
  | 'training'
  | 'consultation'
  | 'campaign'
  | 'other';

export interface CalendarTypeColor {
  background: string;
  text: string;
}

const TYPE_COLOR_MAP: Record<CalendarTypeKey, CalendarTypeColor> = {
  cop: { background: CBD_GREEN, text: '#ffffff' },
  sbstta: { background: CBD_GREEN, text: '#ffffff' },
  sbi: { background: CBD_GREEN, text: '#ffffff' },
  meeting: { background: '#00558C', text: '#ffffff' },
  notification: { background: '#0F7ABD', text: '#ffffff' },
  nominations: { background: '#6F1A6B', text: '#ffffff' },
  submission: { background: '#34a59e', text: '#ffffff' },
  peerReview: { background: '#84807F', text: '#ffffff' },
  report: { background: '#3483a5', text: '#ffffff' },
  forum: { background: '#E08475', text: '#ffffff' },
  activity: { background: '#5B2C83', text: '#ffffff' },
  calendarActivity: { background: '#5B2C83', text: '#ffffff' },
  webinar: { background: '#EFA52D', text: '#ffffff' },
  workshop: { background: '#A04B0B', text: '#ffffff' },
  training: { background: '#3F4C72', text: '#ffffff' },
  consultation: { background: '#7C2E4D', text: '#ffffff' },
  campaign: { background: '#345920', text: '#ffffff' },
  other: { background: '#4D4D4D', text: '#ffffff' }
};

const TYPE_PATTERNS: Array<{ key: CalendarTypeKey; patterns: RegExp[] }> = [
  { key: 'cop', patterns: [/\bcop\b/i, /conference of the parties/i] },
  { key: 'sbstta', patterns: [/\bsbstta\b/i, /subsidiary body on scientific/i] },
  { key: 'sbi', patterns: [/\bsbi\b/i, /subsidiary body on implementation/i] },
  { key: 'nominations', patterns: [/\bnomination(s)?\b/i] },
  { key: 'submission', patterns: [/\bsubmission(s)?\b/i, /\bsubmit\b/i] },
  { key: 'peerReview', patterns: [/peer[-\s]?review/i] },
  { key: 'report', patterns: [/\breport(s)?\b/i] },
  { key: 'forum', patterns: [/\bforum(s)?\b/i] },
  { key: 'webinar', patterns: [/\bwebinar\b/i] },
  { key: 'workshop', patterns: [/\bworkshop\b/i, /\bcolloquium\b/i, /\bseminar\b/i] },
  { key: 'training', patterns: [/\btraining\b/i, /capacity[-\s]?building/i] },
  { key: 'consultation', patterns: [/\bconsultation\b/i, /\bdialogue\b/i, /\bforum\b/i] },
  { key: 'campaign', patterns: [/\bcampaign\b/i, /\bawareness\b/i, /\boutreach\b/i] },
  { key: 'calendarActivity', patterns: [/\bcalendarActivity\b/i] },
  { key: 'activity', patterns: [/\bactivity\b/i, /\baction\b/i, /\binitiative\b/i, /\bprogramme\b/i] },
  { key: 'meeting', patterns: [/\bmeeting\b/i, /\bsession\b/i, /\bconference\b/i, /\bplenary\b/i] },
  { key: 'notification', patterns: [/\bnotification\b/i] },
];

export function normalizeTypeKey(value: string | null | undefined): CalendarTypeKey {
  if (!value) {
    return 'other';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return 'other';
  }

  for (const { key, patterns } of TYPE_PATTERNS) {
    if (patterns.some(pattern => pattern.test(trimmed))) {
      return key;
    }
  }

  return 'other';
}

export function getTypeColor(type: CalendarTypeKey | string | null | undefined): CalendarTypeColor {
  const normalized = typeof type === 'string' ? normalizeTypeKey(type) : type ?? 'other';

  return TYPE_COLOR_MAP[normalized] ?? TYPE_COLOR_MAP.other;
}

function isCalendarTypeColor(value: unknown): value is CalendarTypeColor {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.background === 'string' && typeof record.text === 'string';
}

export function getTypeForegroundColor(
  typeOrColor: CalendarTypeKey | string | CalendarTypeColor | null | undefined,
): string {
  if (isCalendarTypeColor(typeOrColor)) {
    return typeOrColor.text;
  }

  const color = getTypeColor(typeOrColor as CalendarTypeKey | string | null | undefined);

  return color.text;
}

