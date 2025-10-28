declare module 'luxon' {
  interface DateTimeLike {
    isValid: boolean;
    toUTC(): DateTimeLike;
    toISO(): string | null;
    toISODate(): string | null;
    toMillis(): number;
    startOf(unit: 'month' | 'day' | 'year'): DateTimeLike;
    endOf(unit: 'month' | 'day' | 'year'): DateTimeLike;
    plus(duration: { days?: number; months?: number; years?: number }): DateTimeLike;
    hasSame(other: DateTimeLike, unit: 'day' | 'month' | 'year'): boolean;
    toFormat(fmt: string): string;
    year: number;
    month: number;
  }
  export class DateTime implements DateTimeLike {
    isValid: boolean;
    year: number;
    month: number;
    static now(): DateTime;
    static fromFormat(text: string, fmt: string, opts?: { zone?: string; locale?: string }): DateTime;
    static fromISO(iso: string, opts?: { zone?: string }): DateTime;
    static utc(year?: number, month?: number, day?: number): DateTime;
    toUTC(): DateTime;
    toISO(): string | null;
    toISODate(): string | null;
    toMillis(): number;
    startOf(unit: 'month' | 'day' | 'year'): DateTime;
    endOf(unit: 'month' | 'day' | 'year'): DateTime;
    plus(duration: { days?: number; months?: number; years?: number }): DateTime;
    hasSame(other: DateTime, unit: 'day' | 'month' | 'year'): boolean;
    toFormat(fmt: string): string;
  }
}
