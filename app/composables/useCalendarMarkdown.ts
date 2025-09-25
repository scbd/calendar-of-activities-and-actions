import { useFetch } from '#imports';

// Rely on Nuxt auto-imports for refs
let cachedMarkdown: string | null = null;
let inflightRequest: Promise<string> | null = null;

export const useCalendarMarkdown = async (): Promise<string> => {
  if (cachedMarkdown !== null) {
    return cachedMarkdown;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const { data, error } = await useFetch<string>('/api/calendar-markdown');

    if (error.value) {
      inflightRequest = null;

      const message = error.value.message || 'Failed to load calendar markdown data';

      throw new Error(message);
    }

    const markdown = data.value ?? '';

    cachedMarkdown = markdown;
    inflightRequest = null;

    return markdown;
  })();

  return inflightRequest;
};
