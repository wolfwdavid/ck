<script lang="ts">
	import type { CaptureData } from '../manifest';

	let {
		data,
		url,
		qrUrl,
		onQr
	}: { data: CaptureData; url: string; qrUrl: string; onQr: (target: string) => void } = $props();

	const tagUrl = (tag: string) => `${url}?at=${encodeURIComponent(tag)}`;
</script>

<p class="note">
	Delivery configured:
	<span class="pill {data.configured ? 'pill-yes' : 'pill-no'}">{data.configured ? 'yes' : 'no'}</span>
</p>
<a class="btn btn-primary" href={url} target="_blank" rel="noopener">Open capture page</a>
{#if data.eventTags.length}
	<ul class="list" aria-label="Event tags">
		{#each data.eventTags as tag (tag)}
			<li class="tag-row">
				<span class="tag-name">{tag}</span>
				<a class="list-link" href={tagUrl(tag)} target="_blank" rel="noopener">Open ?at={tag}</a>
				<button
					class="btn btn-sm"
					type="button"
					aria-pressed={qrUrl === tagUrl(tag)}
					onclick={() => onQr(qrUrl === tagUrl(tag) ? url : tagUrl(tag))}
				>
					QR
				</button>
			</li>
		{/each}
	</ul>
{/if}
