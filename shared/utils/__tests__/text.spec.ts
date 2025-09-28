import { describe, it, expect } from 'vitest';
import {
  decodeEntities,
  htmlToText,
  humanizeIdentifier,
  normalizeWhitespace,
  slugify,
  splitValues,
} from '../text';

describe('text utilities', () => {
  it('normalizes whitespace', () => {
    expect(normalizeWhitespace('  Hello\nworld \t ')).toBe('Hello world');
  });

  it('converts html to text', () => {
    const html = '<p>Hello</p><br><li>World</li>';
    expect(htmlToText(html)).toBe('Hello; World');
  });

  it('decodes entities', () => {
    expect(decodeEntities('Fish &amp; Chips &mdash; Today')).toBe('Fish & Chips -- Today');
  });

  it('slugifies text', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('')).toBe('item');
  });

  it('humanizes identifiers', () => {
    expect(humanizeIdentifier('hello_world')).toBe('Hello World');
    expect(humanizeIdentifier('mixedCaseValue')).toBe('mixedCaseValue');
  });

  it('splits values', () => {
    expect(splitValues('one, two ,three')).toEqual(['one', 'two', 'three']);
    expect(splitValues(['one', ' two '])).toEqual(['one', 'two']);
    expect(splitValues(undefined)).toEqual([]);
  });
});
