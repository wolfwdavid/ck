<script lang="ts">
	import { base } from '$app/paths';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{base}/favicon.svg" type="image/svg+xml" />
</svelte:head>

<div
	class="app"
	style="--paper-url: url('{base}/images/paper-texture.png'); --citrus-url: url('{base}/images/citrus-texture.jpg')"
>
	{@render children()}
</div>
