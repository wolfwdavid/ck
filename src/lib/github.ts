export type RepoInfo = {
	htmlUrl: string;
	description: string;
	defaultBranch: string;
	pushedAt: string;
	openIssues: number;
};

export type CommitInfo = {
	message: string;
	author: string;
	date: string;
	sha: string;
	htmlUrl: string;
	total: number;
};

export type RunInfo = {
	name: string;
	result: string;
	htmlUrl: string;
	updatedAt: string;
};

export type GithubStatus =
	| { state: 'ok'; repo: RepoInfo; commit: CommitInfo | null; run: RunInfo | null; rateLimited: boolean; cachedAt: string | null }
	| { state: 'not-found' }
	| { state: 'rate-limited'; cachedAt: string | null }
	| { state: 'error'; message: string };

type CacheEntry = { etag: string | null; link: string | null; body: unknown; at: string };
type Fetched = { body: unknown; link: string | null; cachedAt: string | null; rateLimited: boolean };

const API = 'https://api.github.com';
const KEY = 'ck:gh:';

export class GithubError extends Error {
	constructor(public code: 'not-found' | 'rate-limited' | 'http', message: string) {
		super(message);
	}
}

function readCache(url: string): CacheEntry | null {
	try {
		const raw = localStorage.getItem(KEY + url);
		return raw ? (JSON.parse(raw) as CacheEntry) : null;
	} catch {
		return null;
	}
}

function writeCache(url: string, entry: CacheEntry) {
	try {
		localStorage.setItem(KEY + url, JSON.stringify(entry));
	} catch {
		/* storage full or unavailable: live data still renders */
	}
}

async function fetchCached(url: string): Promise<Fetched> {
	const cached = readCache(url);
	const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
	if (cached?.etag) headers['If-None-Match'] = cached.etag;

	const res = await fetch(url, { headers });

	if (res.status === 304 && cached) {
		return { body: cached.body, link: cached.link, cachedAt: cached.at, rateLimited: false };
	}
	if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
		if (cached) return { body: cached.body, link: cached.link, cachedAt: cached.at, rateLimited: true };
		throw new GithubError('rate-limited', 'GitHub rate-limited');
	}
	if (res.status === 404) throw new GithubError('not-found', 'Repo not found yet');
	if (!res.ok) throw new GithubError('http', `GitHub ${res.status}`);

	const body: unknown = await res.json();
	const entry: CacheEntry = {
		etag: res.headers.get('etag'),
		link: res.headers.get('link'),
		body,
		at: new Date().toISOString()
	};
	writeCache(url, entry);
	return { body, link: entry.link, cachedAt: null, rateLimited: false };
}

export function parseLinkLastPage(header: string | null): number | null {
	if (!header) return null;
	for (const part of header.split(',')) {
		const m = /<([^>]+)>\s*;\s*rel="last"/.exec(part);
		if (!m) continue;
		const page = /[?&]page=(\d+)/.exec(m[1]);
		if (page) return Number(page[1]);
	}
	return null;
}

export function relativeTime(iso: string, now: Date = new Date()): string {
	const then = new Date(iso);
	if (Number.isNaN(then.getTime())) return '';
	const sec = Math.round((now.getTime() - then.getTime()) / 1000);
	if (sec < 60) return 'just now';
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min} min ago`;
	const h = Math.floor(min / 60);
	if (h < 24) return `${h} h ago`;
	const days = Math.floor(h / 24);
	if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;
	const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
	if (then.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
	return then.toLocaleDateString('en-US', opts);
}

const rec = (v: unknown): Record<string, any> => (typeof v === 'object' && v !== null ? (v as Record<string, any>) : {});
const s = (v: unknown): string => (typeof v === 'string' ? v : '');

export async function fetchGithub(repo: string): Promise<GithubStatus> {
	try {
		const [r, c, a] = await Promise.all([
			fetchCached(`${API}/repos/${repo}`),
			fetchCached(`${API}/repos/${repo}/commits?per_page=1`),
			fetchCached(`${API}/repos/${repo}/actions/runs?per_page=1`)
		]);

		const rb = rec(r.body);
		const repoInfo: RepoInfo = {
			htmlUrl: s(rb.html_url) || `https://github.com/${repo}`,
			description: s(rb.description),
			defaultBranch: s(rb.default_branch),
			pushedAt: s(rb.pushed_at),
			openIssues: Number(rb.open_issues_count) || 0
		};

		let commit: CommitInfo | null = null;
		const first = Array.isArray(c.body) ? rec(c.body[0]) : null;
		if (first) {
			const inner = rec(first.commit);
			commit = {
				message: s(inner.message).split('\n')[0],
				author: s(rec(first.author).login) || s(rec(inner.author).name),
				date: s(rec(inner.author).date) || s(rec(inner.committer).date),
				sha: s(first.sha),
				htmlUrl: s(first.html_url),
				total: parseLinkLastPage(c.link) ?? 1
			};
		}

		let run: RunInfo | null = null;
		const runs = rec(a.body).workflow_runs;
		if (Array.isArray(runs) && runs.length) {
			const w = rec(runs[0]);
			run = {
				name: s(w.name),
				result: s(w.conclusion) || s(w.status),
				htmlUrl: s(w.html_url),
				updatedAt: s(w.updated_at)
			};
		}

		const parts = [r, c, a];
		const rateLimited = parts.some((p) => p.rateLimited);
		const cachedAt = parts.map((p) => p.cachedAt).filter(Boolean).sort()[0] ?? null;
		return { state: 'ok', repo: repoInfo, commit, run, rateLimited, cachedAt };
	} catch (e) {
		if (e instanceof GithubError) {
			if (e.code === 'not-found') return { state: 'not-found' };
			if (e.code === 'rate-limited') return { state: 'rate-limited', cachedAt: readCache(`${API}/repos/${repo}`)?.at ?? null };
		}
		return { state: 'error', message: e instanceof Error ? e.message : String(e) };
	}
}
