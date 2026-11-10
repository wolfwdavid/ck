<script lang="ts">
	import { browser } from '$app/environment';
	import QRCode from 'qrcode';

	let { url, title }: { url: string; title: string } = $props();

	let svg = $state('');
	let open = $state(false);
	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!browser) return;
		const target = url;
		QRCode.toString(target, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
			.then((out) => {
				if (target === url) svg = out;
			})
			.catch(() => (svg = ''));
	});

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<div class="qr-wrap">
	<button class="qr" type="button" onclick={() => (open = true)} aria-label="Enlarge QR code for {title}">
		{#if svg}
			{@html svg}
		{/if}
	</button>
	<p class="qr-url">{url}</p>
</div>

<dialog class="overlay" bind:this={dialog} onclose={() => (open = false)} aria-label="QR code for {title}">
	{#if open}
		<h2 class="overlay-title">{title}</h2>
		<div class="overlay-qr">
			{#if svg}
				{@html svg}
			{/if}
		</div>
		<p class="overlay-url">{url}</p>
		<button class="btn" type="button" onclick={() => (open = false)}>Close</button>
	{/if}
</dialog>
