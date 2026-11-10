import { describe, expect, it } from 'vitest';
import { summarizeFlipbook } from './flipbook';
import { sheetCsvUrl, summarizeBoard } from './sheet';

describe('summarizeFlipbook', () => {
	const screens = [
		{ physicalPage: 1, section: 'Front Matter', type: 'cover', content: { title: 'THE GUIDEBOOK' } },
		{ physicalPage: 2, section: 'Front Matter', type: 'essay', content: {} },
		{ physicalPage: 3, section: 'Layer One', type: 'essay', content: {} },
		{ physicalPage: 4, section: 'Layer One', type: 'essay', content: {} },
		{ physicalPage: 5, section: 'Layer Two', type: 'table', content: {} }
	];

	it('counts screens and sections in order with first-page anchors', () => {
		const s = summarizeFlipbook(screens);
		expect(s?.screenCount).toBe(5);
		expect(s?.coverTitle).toBe('THE GUIDEBOOK');
		expect(s?.sections).toEqual([
			{ name: 'Front Matter', count: 2, anchor: 'p1' },
			{ name: 'Layer One', count: 2, anchor: 'p3' },
			{ name: 'Layer Two', count: 1, anchor: 'p5' }
		]);
	});

	it('rejects non-arrays and empty lists', () => {
		expect(summarizeFlipbook({})).toBeNull();
		expect(summarizeFlipbook([])).toBeNull();
	});
});

describe('sheetCsvUrl', () => {
	const live = 'https://wolfwdavid.github.io/ck-food-rescue/';
	it('prefers the sheet id, then the published url, then the sample', () => {
		expect(sheetCsvUrl({ kind: 'sheet-csv', sheetId: 'ABC', tab: 'Stock 2', publishedCsvUrl: 'x', sample: 'y' }, live)).toEqual({
			url: 'https://docs.google.com/spreadsheets/d/ABC/gviz/tq?tqx=out:csv&sheet=Stock%202',
			source: 'sheet'
		});
		expect(sheetCsvUrl({ kind: 'sheet-csv', sheetId: '', tab: '', publishedCsvUrl: 'https://p/x.csv', sample: 'y' }, live)).toEqual({
			url: 'https://p/x.csv',
			source: 'published'
		});
		expect(sheetCsvUrl({ kind: 'sheet-csv', sheetId: '', tab: '', publishedCsvUrl: '', sample: 'data/sample.csv' }, live)).toEqual({
			url: 'https://wolfwdavid.github.io/ck-food-rescue/data/sample.csv',
			source: 'sample'
		});
	});
});

describe('summarizeBoard', () => {
	const csv = [
		'location,address,item,quantity,unit,status,updated,notes',
		'A,"A st, Brooklyn",Cabbage,12,heads,available,2026-11-10T14:30:00-05:00,"Big ones, take two"',
		'A,"A st, Brooklyn",Carrots,3,bunches,low,2026-11-10T14:45:00-05:00,',
		'A,"A st, Brooklyn",Squash,0,,gone,2026-11-10T15:10:00-05:00,All taken',
		'B,"B ave",Sweet potatoes,20,lb,available,2026-11-10T13:50:00-05:00,"line one\nline two"',
		'C,"C pl",Acorn squash,0,,gone,2026-11-10T12:05:00-05:00,'
	].join('\n');

	it('summarises availability, locations, top items and freshness', () => {
		const b = summarizeBoard(csv, 'sample');
		expect(b.rows).toBe(5);
		expect(b.available).toBe(3);
		expect(b.locations).toBe(2);
		expect(b.top.map((t) => t.item)).toEqual(['Sweet potatoes', 'Cabbage', 'Carrots']);
		expect(b.top[0]).toEqual({ item: 'Sweet potatoes', quantity: 20, unit: 'lb', location: 'B' });
		expect(b.updated).toBe('2026-11-10T15:10:00-05:00');
		expect(b.source).toBe('sample');
	});

	it('copes with an empty sheet', () => {
		const b = summarizeBoard('location,item\n', 'sheet');
		expect(b).toEqual({ source: 'sheet', rows: 0, available: 0, locations: 0, top: [], updated: '' });
	});
});
