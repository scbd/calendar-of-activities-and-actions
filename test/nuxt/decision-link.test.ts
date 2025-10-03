import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import DecisionLink from '../../app/components/decision-link.vue';

describe('DecisionLink component', () => {
  it('renders external links with target and rel', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        href: 'https://www.cbd.int/decisions/cop/16',
        label: 'COP 16 decision'
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('target')).toBe('_blank');
    expect(anchor.attributes('rel')).toBe('noopener noreferrer');
  });

  it('renders internal links using NuxtLink', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        href: '/decisions/cop/16',
        label: 'COP 16 decision'
      },
    });

    const anchor = wrapper.get('a');

    // NuxtLink includes the baseURL from nuxt.config.ts
    expect(anchor.attributes('href')).toBe('/calendar-of-activities-and-actions/decisions/cop/16');
    expect(anchor.attributes('target')).toBeUndefined();
  });

  it('renders plain text when no href provided', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        label: 'Conference overview'
      },
    });

    expect(wrapper.text()).toBe('Conference overview');
    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('auto generates COP decision links with padded numbers', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        label: 'COP 16/1',
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('href')).toBe('https://www.cbd.int/decisions/cop/16/01');
    expect(anchor.attributes('target')).toBe('_blank');
    expect(anchor.text()).toBe('COP 16/1');
  });

  it('auto generates CP decision links with padded numbers', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        label: 'CP-11/3',
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('href')).toBe('https://www.cbd.int/decisions/mop?m=cp-mop-11-03');
    expect(anchor.attributes('target')).toBe('_blank');
  });

  it('auto generates NP decision links with padded numbers', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        label: 'NP-5/8',
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('href')).toBe('https://www.cbd.int/decisions/np-mop?m=np-mop-05-08');
    expect(anchor.attributes('target')).toBe('_blank');
  });

  it('adds missing query parameters for NP decisions when explicit href lacks them', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        href: 'https://www.cbd.int/decisions/np-mop',
        label: 'NP-4/3',
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('href')).toBe('https://www.cbd.int/decisions/np-mop?m=np-mop-04-03');
    expect(anchor.attributes('target')).toBe('_blank');
  });

  it('replaces incorrect CP decision query parameters with the expected value', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        href: 'https://www.cbd.int/decisions/mop?m=mop-11-03',
        label: 'CP-11/3',
      },
    });

    const anchor = wrapper.get('a');

    expect(anchor.attributes('href')).toBe('https://www.cbd.int/decisions/mop?m=cp-mop-11-03');
  });
});
