import { describe, expect, it } from 'vitest';
import { parseLinkLastPage, relativeTime } from './github';

describe('parseLinkLastPage', () => {
	it('reads the rel="last" page number', () => {
		const h =
			'<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/commits?per_page=1&page=57>; rel="last"';
		expect(parseLinkLastPage(h)).toBe(57);
	});

	it('handles page before per_page', () => {
		expect(parseLinkLastPage('<https://x/y?page=12&per_page=1>; rel="last"')).toBe(12);
	});

	it('returns null without a last link', () => {
		expect(parseLinkLastPage(null)).toBeNull();
		expect(parseLinkLastPage('')).toBeNull();
		expect(parseLinkLastPage('<https://x/y?page=3>; rel="prev"')).toBeNull();
	});
});

describe('relativeTime', () => {
	const now = new Date('2026-11-10T12:00:00Z');
	const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

	it('formats recent times', () => {
		expect(relativeTime(ago(10_000), now)).toBe('just now');
		expect(relativeTime(ago(4 * 60_000), now)).toBe('4 min ago');
		expect(relativeTime(ago(3 * 3_600_000), now)).toBe('3 h ago');
		expect(relativeTime(ago(26 * 3_600_000), now)).toBe('1 day ago');
		expect(relativeTime(ago(2 * 86_400_000), now)).toBe('2 days ago');
	});

	it('falls back to a short date after a week', () => {
		expect(relativeTime('2026-11-03T09:00:00Z', now)).toBe('Nov 3');
		expect(relativeTime('2025-02-14T09:00:00Z', now)).toBe('Feb 14, 2025');
	});

	it('returns empty for garbage', () => {
		expect(relativeTime('not a date', now)).toBe('');
	});
});
