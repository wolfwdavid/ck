import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvRows } from './csv';

describe('parseCsvRows', () => {
	it('splits plain fields and rows', () => {
		expect(parseCsvRows('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
	});

	it('handles quoted fields with commas, escaped quotes and newlines', () => {
		const text = 'item,notes\nOnions,"Crates on the stoop.\nLeave the crates, please."\nKale,"She said ""hi"""';
		expect(parseCsvRows(text)).toEqual([
			['item', 'notes'],
			['Onions', 'Crates on the stoop.\nLeave the crates, please.'],
			['Kale', 'She said "hi"']
		]);
	});

	it('handles CRLF and a trailing newline', () => {
		expect(parseCsvRows('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
	});

	it('keeps empty fields', () => {
		expect(parseCsvRows('a,,c\n,,')).toEqual([['a', '', 'c'], ['', '', '']]);
	});
});

describe('parseCsv', () => {
	it('maps columns by lower-cased header name and drops blank rows', () => {
		const t = parseCsv('﻿Location,Item,Quantity\nLibrary,Kale,6\n,,\nPark,Apples,1');
		expect(t.headers).toEqual(['location', 'item', 'quantity']);
		expect(t.rows).toEqual([
			{ location: 'Library', item: 'Kale', quantity: '6' },
			{ location: 'Park', item: 'Apples', quantity: '1' }
		]);
	});

	it('fills missing trailing cells with empty strings', () => {
		expect(parseCsv('a,b,c\n1').rows).toEqual([{ a: '1', b: '', c: '' }]);
	});

	it('returns empty for empty input', () => {
		expect(parseCsv('')).toEqual({ headers: [], rows: [] });
	});
});
