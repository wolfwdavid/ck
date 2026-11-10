import { describe, expect, it } from 'vitest';
import { parseManifest } from './manifest';

const base = {
	slug: 'food-rescue',
	name: 'Food Rescue Board',
	version: '1.0.0',
	blurb: 'Live board',
	repo: 'wolfwdavid/ck-food-rescue',
	live: 'https://wolfwdavid.github.io/ck-food-rescue/'
};

describe('parseManifest', () => {
	it('accepts a sheet-csv manifest', () => {
		const m = parseManifest({
			...base,
			data: { kind: 'sheet-csv', sheetId: '', tab: 'Stock', publishedCsvUrl: '', sample: 'data/sample.csv' }
		});
		expect(m?.data).toEqual({
			kind: 'sheet-csv',
			sheetId: '',
			tab: 'Stock',
			publishedCsvUrl: '',
			sample: 'data/sample.csv'
		});
	});

	it('accepts a flipbook manifest', () => {
		const m = parseManifest({ ...base, data: { kind: 'flipbook', content: 'data/content.json' } });
		expect(m?.data.kind).toBe('flipbook');
	});

	it('accepts a capture manifest and keeps tags', () => {
		const m = parseManifest({
			...base,
			data: { kind: 'capture', configured: false, eventTags: ['show', 'sauna'] }
		});
		expect(m?.data).toEqual({ kind: 'capture', configured: false, eventTags: ['show', 'sauna'] });
	});

	it('defaults optional strings', () => {
		const m = parseManifest({ slug: 'x', name: 'X', repo: 'a/b', live: 'https://a.b/', data: { kind: 'flipbook', content: 'c.json' } });
		expect(m?.version).toBe('');
		expect(m?.blurb).toBe('');
	});

	it('rejects non-objects and missing fields', () => {
		expect(parseManifest(null)).toBeNull();
		expect(parseManifest('nope')).toBeNull();
		expect(parseManifest([])).toBeNull();
		expect(parseManifest({ ...base })).toBeNull();
		expect(parseManifest({ ...base, slug: '', data: { kind: 'flipbook', content: 'c' } })).toBeNull();
	});

	it('rejects bad repo and live values', () => {
		const data = { kind: 'flipbook', content: 'c.json' };
		expect(parseManifest({ ...base, repo: 'not a repo', data })).toBeNull();
		expect(parseManifest({ ...base, live: 'javascript:alert(1)', data })).toBeNull();
	});

	it('rejects unknown or malformed data kinds', () => {
		expect(parseManifest({ ...base, data: { kind: 'other' } })).toBeNull();
		expect(parseManifest({ ...base, data: { kind: 'flipbook' } })).toBeNull();
		expect(parseManifest({ ...base, data: { kind: 'capture', configured: 'yes', eventTags: [] } })).toBeNull();
		expect(parseManifest({ ...base, data: { kind: 'capture', configured: true, eventTags: [1] } })).toBeNull();
		expect(parseManifest({ ...base, data: { kind: 'sheet-csv' } })).toBeNull();
	});
});
