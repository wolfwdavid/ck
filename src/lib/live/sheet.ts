import { parseCsv } from '../csv';
import type { SheetCsvData } from '../manifest';

export type SheetSource = 'sheet' | 'published' | 'sample';
export type TopItem = { item: string; quantity: number; unit: string; location: string };
export type BoardSummary = {
	source: SheetSource;
	rows: number;
	available: number;
	locations: number;
	top: TopItem[];
	updated: string;
};

export function sheetCsvUrl(data: SheetCsvData, live: string): { url: string; source: SheetSource } {
	if (data.sheetId) {
		return {
			url: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(data.sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(data.tab)}`,
			source: 'sheet'
		};
	}
	if (data.publishedCsvUrl) return { url: data.publishedCsvUrl, source: 'published' };
	return { url: new URL(data.sample, live).href, source: 'sample' };
}

export function summarizeBoard(csv: string, source: SheetSource): BoardSummary {
	const { rows } = parseCsv(csv);
	const open = rows.filter((r) => (r.status ?? '').toLowerCase() !== 'gone');
	const locations = new Set(open.map((r) => r.location).filter(Boolean));
	const top = open
		.map((r) => ({
			item: r.item ?? '',
			quantity: parseFloat(r.quantity ?? ''),
			unit: r.unit ?? '',
			location: r.location ?? ''
		}))
		.filter((t) => t.item && Number.isFinite(t.quantity) && t.quantity > 0)
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 3);
	let updated = '';
	let updatedMs = -Infinity;
	for (const r of rows) {
		const ms = new Date(r.updated ?? '').getTime();
		if (Number.isFinite(ms) && ms > updatedMs) {
			updatedMs = ms;
			updated = r.updated;
		}
	}
	return { source, rows: rows.length, available: open.length, locations: locations.size, top, updated };
}

export async function fetchBoard(data: SheetCsvData, live: string): Promise<BoardSummary> {
	const { url, source } = sheetCsvUrl(data, live);
	const res = await fetch(url, { cache: 'no-store' });
	if (!res.ok) throw new Error(`csv ${res.status}`);
	return summarizeBoard(await res.text(), source);
}
