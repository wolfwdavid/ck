import { browser } from '$app/environment';
import { fetchGithub, type GithubStatus } from './github';
import { fetchFlipbook, type FlipbookSummary } from './live/flipbook';
import { fetchBoard, type BoardSummary } from './live/sheet';
import { parseManifest, type Manifest } from './manifest';
import { liveUrl, projects, type Project } from './projects';

export type LivePanel =
	| { kind: 'flipbook'; summary: FlipbookSummary }
	| { kind: 'capture' }
	| { kind: 'sheet-csv'; board: BoardSummary };

export type ProjectState = {
	project: Project;
	url: string;
	status: 'checking' | 'live' | 'down';
	error: string;
	manifest: Manifest | null;
	live: LivePanel | null;
	liveError: string;
	github: GithubStatus | null;
};

export const REFRESH_MS = 5 * 60_000;

function initial(project: Project): ProjectState {
	return {
		project,
		url: liveUrl(project),
		status: 'checking',
		error: '',
		manifest: null,
		live: null,
		liveError: '',
		github: null
	};
}

async function loadManifest(url: string): Promise<Manifest> {
	const res = await fetch(new URL('ck.json', url).href, { cache: 'no-store' });
	if (!res.ok) throw new Error(`ck.json ${res.status}`);
	const manifest = parseManifest(await res.json());
	if (!manifest) throw new Error('ck.json is not a valid manifest');
	return manifest;
}

async function loadLive(manifest: Manifest, url: string): Promise<LivePanel> {
	const d = manifest.data;
	if (d.kind === 'flipbook') return { kind: 'flipbook', summary: await fetchFlipbook(url, d.content) };
	if (d.kind === 'sheet-csv') return { kind: 'sheet-csv', board: await fetchBoard(d, url) };
	return { kind: 'capture' };
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

class Dashboard {
	items = $state<ProjectState[]>(projects.map(initial));
	refreshedAt = $state<Date | null>(null);
	loading = $state(false);

	async refresh() {
		if (!browser || this.loading) return;
		this.loading = true;
		await Promise.all(this.items.map((item) => this.loadOne(item)));
		this.refreshedAt = new Date();
		this.loading = false;
	}

	private async loadOne(item: ProjectState) {
		item.status = 'checking';
		item.error = '';
		const site = (async () => {
			try {
				item.manifest = await loadManifest(item.url);
				item.status = 'live';
				try {
					item.live = await loadLive(item.manifest, item.url);
					item.liveError = '';
				} catch (e) {
					item.live = null;
					item.liveError = message(e);
				}
			} catch (e) {
				item.status = 'down';
				item.error = message(e);
				item.live = null;
			}
		})();
		const gh = fetchGithub(item.project.repo).then((g) => (item.github = g));
		await Promise.all([site, gh]);
	}

	start(): () => void {
		if (!browser) return () => {};
		void this.refresh();
		const tick = () => {
			if (document.hidden) return;
			const age = this.refreshedAt ? Date.now() - this.refreshedAt.getTime() : Infinity;
			if (age >= REFRESH_MS) void this.refresh();
		};
		const timer = setInterval(tick, 30_000);
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', tick);
		};
	}
}

export const dashboard = new Dashboard();
