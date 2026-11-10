<script lang="ts">
	import type { ProjectState } from '../dashboard.svelte';
	import CapturePanel from './CapturePanel.svelte';
	import FlipbookPanel from './FlipbookPanel.svelte';
	import GithubBlock from './GithubBlock.svelte';
	import QrCode from './QrCode.svelte';
	import SheetPanel from './SheetPanel.svelte';
	import StatusPill from './StatusPill.svelte';

	let { item, now }: { item: ProjectState; now: Date } = $props();

	let qrOverride = $state<string | null>(null);
	let toast = $state('');
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	const name = $derived(item.manifest?.name ?? item.project.slug);
	const qrUrl = $derived(qrOverride ?? item.url);
	const repoUrl = $derived(`https://github.com/${item.project.repo}`);

	function showToast(text: string) {
		toast = text;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 2200);
	}

	async function share() {
		const payload = { title: name, text: item.manifest?.blurb || `${name} — a Cosmic Kitty project`, url: qrUrl };
		if (navigator.share) {
			try {
				await navigator.share(payload);
				return;
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') return;
			}
		}
		try {
			await navigator.clipboard.writeText(qrUrl);
			showToast('Link copied');
		} catch {
			showToast('Could not share');
		}
	}
</script>

<article class="card" style="--accent: {item.project.accent}" aria-labelledby="title-{item.project.slug}">
	<header class="card-head">
		<h2 class="card-title" id="title-{item.project.slug}">{name}</h2>
		{#if item.manifest?.version}
			<span class="pill pill-version">v{item.manifest.version}</span>
		{/if}
		<StatusPill status={item.status} />
	</header>

	{#if item.manifest?.blurb}
		<p class="blurb">{item.manifest.blurb}</p>
	{/if}
	{#if item.status === 'down'}
		<p class="note note-error">Could not reach the site: {item.error}</p>
	{/if}

	<GithubBlock status={item.github} repo={item.project.repo} {now} />

	<section class="block" aria-label="Live data">
		<h3 class="block-title">Live data</h3>
		{#if item.live?.kind === 'flipbook'}
			<FlipbookPanel summary={item.live.summary} url={item.url} />
		{:else if item.live?.kind === 'capture' && item.manifest?.data.kind === 'capture'}
			<CapturePanel data={item.manifest.data} url={item.url} {qrUrl} onQr={(t) => (qrOverride = t === item.url ? null : t)} />
		{:else if item.live?.kind === 'sheet-csv'}
			<SheetPanel board={item.live.board} url={item.url} {now} />
		{:else if item.liveError}
			<p class="note note-error">Live data unavailable: {item.liveError}</p>
		{:else if item.status === 'live'}
			<p class="note">Loading…</p>
		{:else if item.status === 'down'}
			<p class="note">No data while the site is down.</p>
		{:else}
			<p class="note">Checking…</p>
		{/if}
	</section>

	<section class="block" aria-label="Share">
		<QrCode url={qrUrl} title={name} />
		<div class="actions">
			<button class="btn" type="button" onclick={share}>Share</button>
			<a class="btn btn-primary" href={item.url} target="_blank" rel="noopener">Open</a>
			<a class="btn btn-wide" href={repoUrl} target="_blank" rel="noopener">Repo</a>
		</div>
	</section>

	{#if toast}
		<div class="toast" role="status">{toast}</div>
	{/if}
</article>
