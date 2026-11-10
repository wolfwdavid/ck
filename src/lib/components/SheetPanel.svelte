<script lang="ts">
	import { relativeTime } from '../github';
	import type { BoardSummary } from '../live/sheet';

	let { board, url, now }: { board: BoardSummary; url: string; now: Date } = $props();

	const sourceLabel = $derived(
		board.source === 'sheet' ? 'Google Sheet' : board.source === 'published' ? 'published CSV' : 'sample data'
	);
	const updated = $derived(board.updated ? relativeTime(board.updated, now) || board.updated : '—');
</script>

<ul class="stats">
	<li class="stat"><span class="stat-value">{board.available}</span><span class="stat-label">items available</span></li>
	<li class="stat"><span class="stat-value">{board.locations}</span><span class="stat-label">locations</span></li>
	<li class="stat"><span class="stat-value">{updated}</span><span class="stat-label">last update</span></li>
</ul>
{#if board.top.length}
	<ul class="list" aria-label="Top items by quantity">
		{#each board.top as t (t.item + t.location)}
			<li class="list-row">
				<span class="list-main">{t.item} <span class="note">· {t.location}</span></span>
				<span class="list-count">{t.quantity} {t.unit}</span>
			</li>
		{/each}
	</ul>
{:else}
	<p class="note">Nothing on the board right now.</p>
{/if}
<p class="note">Source: {sourceLabel} · {board.rows} {board.rows === 1 ? 'row' : 'rows'}</p>
<a class="btn btn-primary" href={url} target="_blank" rel="noopener">Open board</a>
