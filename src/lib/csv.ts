export type CsvTable = { headers: string[]; rows: Record<string, string>[] };

export function parseCsvRows(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	let i = 0;

	const endField = () => {
		row.push(field);
		field = '';
	};
	const endRow = () => {
		endField();
		rows.push(row);
		row = [];
	};

	while (i < text.length) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				quoted = false;
				i++;
				continue;
			}
			field += ch;
			i++;
			continue;
		}
		if (ch === '"') {
			quoted = true;
		} else if (ch === ',') {
			endField();
		} else if (ch === '\r') {
			if (text[i + 1] === '\n') i++;
			endRow();
		} else if (ch === '\n') {
			endRow();
		} else {
			field += ch;
		}
		i++;
	}
	if (field !== '' || row.length) endRow();
	return rows;
}

export function parseCsv(text: string): CsvTable {
	const raw = parseCsvRows(text.replace(/^﻿/, ''));
	if (!raw.length) return { headers: [], rows: [] };
	const headers = raw[0].map((h) => h.trim().toLowerCase());
	const rows = raw
		.slice(1)
		.filter((r) => r.some((c) => c.trim() !== ''))
		.map((r) => Object.fromEntries(headers.map((h, idx) => [h, (r[idx] ?? '').trim()])));
	return { headers, rows };
}
