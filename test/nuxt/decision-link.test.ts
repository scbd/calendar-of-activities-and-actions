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
    expect(anchor.attributes('href')).toBe('/decisions/cop/16');
    expect(anchor.attributes('target')).toBeUndefined();
  });

  it('renders plain text when no href provided', async () => {
    const wrapper = await mountSuspended(DecisionLink, {
      props: {
        label: 'Decision 16/5'
      },
    });

    expect(wrapper.text()).toBe('Decision 16/5');
    expect(wrapper.find('a').exists()).toBe(false);
  });
});
