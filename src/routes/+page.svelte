<script lang="ts">
	import { onMount } from 'svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import { dashboard } from '$lib/dashboard.svelte';
	import { relativeTime } from '$lib/github';
	import { DASHBOARD_REPO, projects } from '$lib/projects';

	let now = $state(new Date());

	onMount(() => {
		const stop = dashboard.start();
		const clock = setInterval(() => (now = new Date()), 30_000);
		return () => {
			stop();
			clearInterval(clock);
		};
	});

	const refreshed = $derived(
		dashboard.loading ? 'Refreshing…' : dashboard.refreshedAt ? `Refreshed ${relativeTime(dashboard.refreshedAt.toISOString(), now)}` : 'Not refreshed yet'
	);
	const repos = [DASHBOARD_REPO, ...projects.map((p) => p.repo)];
</script>

<svelte:head>
	<title>CK dashboard</title>
</svelte:head>

<div class="citrus-band" aria-hidden="true"></div>

<header class="site-header">
	<h1 class="wordmark">CK</h1>
	<p class="tagline">Cosmic Kitty — projects</p>
	<div class="refresh-ctl">
		<span aria-live="polite">{refreshed}</span>
		<span aria-hidden="true">·</span>
		<button class="btn-link" type="button" disabled={dashboard.loading} onclick={() => dashboard.refresh()}>refresh</button>
	</div>
</header>

<main class="cards">
	{#each dashboard.items as item (item.project.slug)}
		<ProjectCard {item} {now} />
	{/each}
</main>

<footer class="site-footer">
	<span>Repos:</span>
	{#each repos as repo (repo)}
		<a href="https://github.com/{repo}" target="_blank" rel="noopener">{repo}</a>
	{/each}
</footer>
