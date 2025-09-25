import { readCalendarMarkdown } from 'shared/data/calendar-markdown';

export default defineEventHandler(async () => {
  try {
    const markdown = await readCalendarMarkdown();

    return markdown;
  } catch (error) {
    console.error('Failed to read calendar markdown file', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load calendar markdown data',
    });
  }
});
