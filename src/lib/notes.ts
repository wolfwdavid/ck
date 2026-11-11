import { fetchCached, rec, s } from './github';
import { DASHBOARD_REPO, projects } from './projects';

export type Note = {
	id: number;
	text: string;
	body: string;
	author: string;
	date: string;
	htmlUrl: string;
	slug: string | null;
	working: boolean;
};

export const WORKING = 'working-on';

// Anyone can open an issue on a public repo; only people with repo access get onto the dashboard.
const TRUSTED = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

/** Open issues of the dashboard repo, newest first, as notes. */
export function parseNotes(body: unknown): Note[] {
	if (!Array.isArray(body)) return [];
	const slugs = new Set(projects.map((p) => p.slug));
	const notes: Note[] = [];
	for (const raw of body) {
		const i = rec(raw);
		if (i.pull_request || !TRUSTED.has(s(i.author_association))) continue;
		const labels: string[] = Array.isArray(i.labels) ? i.labels.map((l: unknown) => s(rec(l).name)) : [];
		notes.push({
			id: Number(i.number) || 0,
			text: s(i.title),
			body: s(i.body).trim(),
			author: s(rec(i.user).login),
			date: s(i.created_at),
			htmlUrl: s(i.html_url),
			slug: labels.find((l) => slugs.has(l)) ?? null,
			working: labels.includes(WORKING)
		});
	}
	return notes;
}

/** The project of the newest note flagged working-on. */
export function workingOn(notes: Note[]): string | null {
	return notes.find((n) => n.working && n.slug)?.slug ?? null;
}

export function newNoteUrl(text: string, slug: string, working: boolean): string {
	const q = new URLSearchParams({ title: text });
	const labels = [slug, working && slug ? WORKING : ''].filter(Boolean);
	if (labels.length) q.set('labels', labels.join(','));
	return `https://github.com/${DASHBOARD_REPO}/issues/new?${q}`;
}

export async function fetchNotes(): Promise<Note[]> {
	// shortcut: newest 30 open notes only, page through if the log outgrows that
	const res = await fetchCached(`https://api.github.com/repos/${DASHBOARD_REPO}/issues?state=open&per_page=30`);
	return parseNotes(res.body);
}
