/**
 * Tests that calendar items spanning multiple months appear in both
 * their start-date and end-date month groups, and that groups before
 * the filter start date are excluded from the view.
 */
import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import type { CalendarDoc } from 'shared/types/calendar';

// ---------------------------------------------------------------------------
// Reproduce the grouping logic from use-calendar-data.ts so we can unit-test
// it in isolation (the composable requires Nuxt runtime context).
// ---------------------------------------------------------------------------

interface GroupedItem {
  key: string;
  label: string;
  items: CalendarDoc[];
}

function groupDocs(docs: CalendarDoc[], filterStartDate?: string): GroupedItem[] {
  const buckets = new Map<string, { label: string; items: CalendarDoc[] }>();

  const addToBucket = (dt: DateTime | null, doc: CalendarDoc): void => {
    const key = dt?.isValid ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt?.isValid ? dt.toFormat('LLLL yyyy') : 'Unknown date';

    if (!buckets.has(key)) {
      buckets.set(key, { label, items: [] });
    }
    buckets.get(key)!.items.push(doc);
  };

  for (const d of docs) {
    const startIso = d.startDate || d.endDate;
    const startDt = startIso ? DateTime.fromISO(String(startIso)) : null;

    addToBucket(startDt, d);

    if (d.endDate && d.startDate) {
      const endDt = DateTime.fromISO(String(d.endDate));

      if (
        endDt.isValid &&
        startDt?.isValid &&
        (endDt.year !== startDt.year || endDt.month !== startDt.month)
      ) {
        addToBucket(endDt, d);
      }
    }
  }

  const minKey = filterStartDate
    ? DateTime.fromISO(filterStartDate).toFormat('yyyy-LL')
    : null;

  return Array.from(buckets.entries())
    .filter(([key]) => key === 'unknown' || !minKey || key >= minKey)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
}

function visibleDocCount(groups: GroupedItem[]): number {
  const ids = new Set<string>();

  for (const group of groups) {
    for (const doc of group.items) {
      ids.add(doc.id);
    }
  }

  return ids.size;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<CalendarDoc> & { id: string }): CalendarDoc {
  return {
    schema: 'meeting',
    identifier: overrides.id,
    ...overrides,
  } as CalendarDoc;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('groupedItems – end-date cross-month duplication', () => {
  it('does NOT duplicate when start and end are in the same month', () => {
    const doc = makeDoc({
      id: 'same-month',
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    });

    const groups = groupDocs([doc]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('2026-03');
    expect(groups[0].items).toHaveLength(1);
  });

  it('duplicates into the end-date month when months differ', () => {
    const doc = makeDoc({
      id: 'cross-month',
      startDate: '2026-03-20',
      endDate: '2026-04-05',
    });

    const groups = groupDocs([doc]);

    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe('2026-03');
    expect(groups[1].key).toBe('2026-04');
    expect(groups[0].items[0].id).toBe('cross-month');
    expect(groups[1].items[0].id).toBe('cross-month');
  });

  it('duplicates into the end-date month when years differ', () => {
    const doc = makeDoc({
      id: 'cross-year',
      startDate: '2025-12-15',
      endDate: '2026-01-10',
    });

    const groups = groupDocs([doc]);

    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe('2025-12');
    expect(groups[1].key).toBe('2026-01');
  });

  it('does NOT duplicate when endDate is missing', () => {
    const doc = makeDoc({
      id: 'no-end',
      startDate: '2026-05-01',
    });

    const groups = groupDocs([doc]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('2026-05');
  });

  it('mixes duplicated and non-duplicated docs correctly', () => {
    const docA = makeDoc({ id: 'a', startDate: '2026-03-01', endDate: '2026-03-10' });
    const docB = makeDoc({ id: 'b', startDate: '2026-03-25', endDate: '2026-04-02' });
    const docC = makeDoc({ id: 'c', startDate: '2026-04-10', endDate: '2026-04-20' });

    const groups = groupDocs([docA, docB, docC]);

    // March should have docA + docB, April should have docB + docC
    const march = groups.find((g) => g.key === '2026-03');
    const april = groups.find((g) => g.key === '2026-04');

    expect(march).toBeDefined();
    expect(april).toBeDefined();
    expect(march!.items.map((d) => d.id)).toEqual(['a', 'b']);
    expect(april!.items.map((d) => d.id)).toEqual(['b', 'c']);
  });
});

describe('groupedItems – filter start-date month exclusion', () => {
  it('excludes groups before the filter start date month', () => {
    // Item started Dec 2025, ends Mar 2026
    const doc = makeDoc({
      id: 'cross-spanning',
      startDate: '2025-12-01',
      endDate: '2026-03-15',
    });

    // Without filter → both Dec 2025 and Mar 2026 groups
    const allGroups = groupDocs([doc]);

    expect(allGroups).toHaveLength(2);
    expect(allGroups[0].key).toBe('2025-12');
    expect(allGroups[1].key).toBe('2026-03');

    // With filter start date in March → only Mar 2026 group
    const filtered = groupDocs([doc], '2026-03-02');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].key).toBe('2026-03');
    expect(filtered[0].items[0].id).toBe('cross-spanning');
  });

  it('visibleDocCount counts unique docs across visible groups only', () => {
    const docA = makeDoc({ id: 'a', startDate: '2025-11-01', endDate: '2026-04-01' });
    const docB = makeDoc({ id: 'b', startDate: '2026-03-01', endDate: '2026-03-10' });

    // Filter to March 2026 — docA appears in Apr group, docB in Mar group
    const groups = groupDocs([docA, docB], '2026-03-01');

    // Mar: docB, Apr: docA — only future groups
    expect(groups.map((g) => g.key)).toEqual(['2026-03', '2026-04']);
    expect(visibleDocCount(groups)).toBe(2);
  });

  it('does not count docs only in excluded groups', () => {
    const docOld = makeDoc({ id: 'old', startDate: '2025-06-01', endDate: '2025-06-30' });
    const docNew = makeDoc({ id: 'new', startDate: '2026-03-01', endDate: '2026-03-15' });

    const groups = groupDocs([docOld, docNew], '2026-03-01');

    // Only March 2026 should be visible with the new doc
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('2026-03');
    expect(visibleDocCount(groups)).toBe(1);
  });

  it('keeps "unknown" groups regardless of filter', () => {
    const doc = makeDoc({ id: 'no-date' });

    const groups = groupDocs([doc], '2026-03-01');

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('unknown');
  });
});
