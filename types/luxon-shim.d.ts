declare module 'luxon' {
  interface DateTimeLike {
    isValid: boolean;
    toUTC(): DateTimeLike;
    toISO(): string | null;
    startOf(unit: 'month' | 'day' | 'year'): DateTimeLike;
    hasSame(other: DateTimeLike, unit: 'day' | 'month' | 'year'): boolean;
    toFormat(fmt: string): string;
    year: number;
    month: number;
  }
  export class DateTime implements DateTimeLike {
    isValid: boolean;
    year: number;
    month: number;
    static fromFormat(text: string, fmt: string, opts?: { zone?: string; locale?: string }): DateTime;
    static fromISO(iso: string): DateTime;
    static utc(year?: number, month?: number, day?: number): DateTime;
    toUTC(): DateTime;
    toISO(): string | null;
    startOf(unit: 'month' | 'day' | 'year'): DateTime;
    hasSame(other: DateTime, unit: 'day' | 'month' | 'year'): boolean;
    toFormat(fmt: string): string;
  }
}
