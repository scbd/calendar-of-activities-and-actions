import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

let cachedMarkdown: string | null = null;

export const readCalendarMarkdown = async (): Promise<string> => {
	if (cachedMarkdown !== null) {
		return cachedMarkdown;
	}

	const filePath = fileURLToPath(new URL('./2024-12-01.md', import.meta.url));

	cachedMarkdown = await readFile(filePath, 'utf-8');

	return cachedMarkdown;
};
