<script lang="ts">
	import type { FlipbookSummary } from '../live/flipbook';

	let { summary, url }: { summary: FlipbookSummary; url: string } = $props();
</script>

{#if summary.coverTitle}
	<p class="note"><em>{summary.coverTitle}</em></p>
{/if}
<ul class="stats">
	<li class="stat"><span class="stat-value">{summary.screenCount}</span><span class="stat-label">screens</span></li>
	<li class="stat"><span class="stat-value">{summary.sections.length}</span><span class="stat-label">sections</span></li>
</ul>
<ul class="list">
	{#each summary.sections as section (section.anchor)}
		<li class="list-row">
			<span class="list-main">{section.name}</span>
			<span class="list-count">{section.count} {section.count === 1 ? 'screen' : 'screens'}</span>
			<a class="list-link" href="{url}#{section.anchor}" target="_blank" rel="noopener">Open at {section.anchor}</a>
		</li>
	{/each}
</ul>
