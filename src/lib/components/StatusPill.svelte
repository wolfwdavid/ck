<script lang="ts">
	let { status }: { status: 'checking' | 'live' | 'down' } = $props();
	const label = $derived(status === 'live' ? 'Live' : status === 'down' ? 'Down' : 'checking…');
</script>

<span class="pill pill-{status}" role="status"><span class="pill-dot" aria-hidden="true"></span>{label}</span>
