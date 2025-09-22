import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';
import * as solr from '../../shared/services/solr';
import type { SolrResponse } from '../../shared/services/solr';

describe('CalendarActivitiesActions Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should mount successfully', async () => {
    const mock: SolrResponse = {
      responseHeader: { status: 0, QTime: 0, params: {} as Record<string, string> },
      response: { numFound: 1, start: 0, docs: [] },
    };
    vi.spyOn(solr, 'fetchMeetingsUpdatedSince').mockResolvedValue(mock);
    const component = await mountSuspended(CalendarActivitiesActions, {
      // no props required for static scaffold
    });

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const mock: SolrResponse = {
      responseHeader: { status: 0, QTime: 0, params: {} as Record<string, string> },
      response: { numFound: 1, start: 0, docs: [] },
    };
    vi.spyOn(solr, 'fetchMeetingsUpdatedSince').mockResolvedValue(mock);
    const component = await mountSuspended(CalendarActivitiesActions);

    const title = component.find('h2');
    expect(title.text()).toBe('Activities & Actions Explorer');
  });

  it('should render grouped results when data exists', async () => {
    const mock: SolrResponse<Record<string, unknown>> = {
      responseHeader: { status: 0, QTime: 0, params: {} as Record<string, string> },
      response: {
        numFound: 2,
        start: 0,
        docs: [
          {
            _id: '1',
            title_EN_t: 'Test Meeting A',
            startDate_dt: '2025-10-07T00:00:00.000Z',
            endDate_dt: '2025-10-09T00:00:00.000Z',
            city_EN_s: 'Bangkok',
            country_EN_s: 'Thailand',
            status_s: 'Confirmed',
            meetingCode_s: 'IMP-WS-2025-01',
          },
          {
            _id: '2',
            title_EN_t: 'Test Meeting B',
            startDate_dt: '2025-10-09T00:00:00.000Z',
            endDate_dt: '2025-10-10T00:00:00.000Z',
            city_EN_s: 'Bangkok',
            country_EN_s: 'Thailand',
            status_s: 'Confirmed',
            meetingCode_s: 'NBSAP-OM-2025-04',
          },
        ],
      },
    };
    vi.spyOn(solr, 'fetchMeetingsUpdatedSince').mockResolvedValue(mock);

    const component = await mountSuspended(CalendarActivitiesActions);
    expect(component.text()).toContain('October 2025');
    expect(component.text()).toContain('Bangkok, Thailand');
    expect(component.text()).toContain('Confirmed');
    expect(component.findAll('.links button').length).toBeGreaterThan(0);
  });

  it('should render simple pagination controls', async () => {
    const mock: SolrResponse = {
      responseHeader: { status: 0, QTime: 0, params: {} as Record<string, string> },
      response: { numFound: 0, start: 0, docs: [] },
    };
    vi.spyOn(solr, 'fetchMeetingsUpdatedSince').mockResolvedValue(mock);
    const component = await mountSuspended(CalendarActivitiesActions);
    const buttons = component.findAll('button').map((b) => b.text());
    expect(buttons).toContain('Reload');
    expect(component.text()).toContain('Page 1 / 1');
  });
});