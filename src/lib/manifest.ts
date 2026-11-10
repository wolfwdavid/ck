export type FlipbookData = { kind: 'flipbook'; content: string };
export type CaptureData = { kind: 'capture'; configured: boolean; eventTags: string[] };
export type SheetCsvData = {
	kind: 'sheet-csv';
	sheetId: string;
	tab: string;
	publishedCsvUrl: string;
	sample: string;
};
export type ManifestData = FlipbookData | CaptureData | SheetCsvData;

export type Manifest = {
	slug: string;
	name: string;
	version: string;
	blurb: string;
	repo: string;
	live: string;
	data: ManifestData;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';

function parseData(v: unknown): ManifestData | null {
	if (!isRecord(v)) return null;
	switch (v.kind) {
		case 'flipbook':
			return str(v.content) && v.content ? { kind: 'flipbook', content: v.content } : null;
		case 'capture': {
			if (typeof v.configured !== 'boolean') return null;
			if (!Array.isArray(v.eventTags) || !v.eventTags.every(str)) return null;
			return { kind: 'capture', configured: v.configured, eventTags: v.eventTags };
		}
		case 'sheet-csv': {
			const sheetId = str(v.sheetId) ? v.sheetId : '';
			const tab = str(v.tab) ? v.tab : '';
			const publishedCsvUrl = str(v.publishedCsvUrl) ? v.publishedCsvUrl : '';
			const sample = str(v.sample) ? v.sample : '';
			if (!sheetId && !publishedCsvUrl && !sample) return null;
			return { kind: 'sheet-csv', sheetId, tab, publishedCsvUrl, sample };
		}
		default:
			return null;
	}
}

export function parseManifest(input: unknown): Manifest | null {
	if (!isRecord(input)) return null;
	const { slug, name, version, blurb, repo, live } = input;
	if (!str(slug) || !slug || !str(name) || !name) return null;
	if (!str(repo) || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
	if (!str(live) || !/^https?:\/\//.test(live)) return null;
	const data = parseData(input.data);
	if (!data) return null;
	return {
		slug,
		name,
		version: str(version) ? version : '',
		blurb: str(blurb) ? blurb : '',
		repo,
		live,
		data
	};
}
