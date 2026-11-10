export type FlipbookSection = { name: string; count: number; anchor: string };
export type FlipbookSummary = { screenCount: number; coverTitle: string; sections: FlipbookSection[] };

const rec = (v: unknown): Record<string, unknown> =>
	typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

export function summarizeFlipbook(input: unknown): FlipbookSummary | null {
	if (!Array.isArray(input) || !input.length) return null;
	const sections: FlipbookSection[] = [];
	const byName = new Map<string, FlipbookSection>();
	for (const screen of input) {
		const s = rec(screen);
		const name = typeof s.section === 'string' && s.section ? s.section : 'Untitled';
		let entry = byName.get(name);
		if (!entry) {
			entry = { name, count: 0, anchor: 'p' + (Number(s.physicalPage) || sections.length + 1) };
			byName.set(name, entry);
			sections.push(entry);
		}
		entry.count++;
	}
	const cover = rec(rec(input[0]).content);
	return {
		screenCount: input.length,
		coverTitle: typeof cover.title === 'string' ? cover.title : '',
		sections
	};
}

export async function fetchFlipbook(live: string, content: string): Promise<FlipbookSummary> {
	const res = await fetch(new URL(content, live).href, { cache: 'no-store' });
	if (!res.ok) throw new Error(`content ${res.status}`);
	const summary = summarizeFlipbook(await res.json());
	if (!summary) throw new Error('content is not a screen list');
	return summary;
}
